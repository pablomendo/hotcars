'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Search, Send, Loader2, Zap, Globe, ArrowLeft,
    MessageSquare, Check, CheckCheck, Car, Trash2, X, Star
} from 'lucide-react';

type Message = {
    id: string;
    sender_user_id: string | null;
    receiver_user_id: string;
    sender_name: string | null;
    sender_phone: string | null;
    content: string;
    related_auto_id: string | null;
    type: 'flip' | 'marketplace' | 'direct' | 'ticket_busqueda';
    is_read: boolean;
    is_starred: boolean;
    created_at: string;
    auto_brand?: string;
    auto_model?: string;
    auto_foto?: string;
};

type Conversation = {
    key: string;
    contact_id: string | null;
    contact_name: string;
    contact_phone: string | null;
    auto_id: string | null;
    auto_label: string | null;
    auto_foto: string | null;
    type: 'flip' | 'marketplace' | 'direct' | 'ticket_busqueda';
    last_message: string;
    last_at: string;
    unread: number;
    is_starred: boolean;
    messages: Message[];
};

type ConvTab = 'todas' | 'no_leidas' | 'favoritas';

function MensajesContent() {
    const searchParams = useSearchParams();
    const autoParam = searchParams.get('auto');

    const [userId, setUserId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [convTab, setConvTab] = useState<ConvTab>('todas');
    const [threadSearch, setThreadSearch] = useState('');
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const [reply, setReply] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [showMobileThread, setShowMobileThread] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const autoSelectDone = useRef(false);

    // Selección de mensajes para borrar
    const [selectMsgMode, setSelectMsgMode] = useState(false);
    const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteMsgConfirm, setShowDeleteMsgConfirm] = useState(false);

    // Conversaciones estrelladas (local por ahora, persistido en el primer mensaje de la conv)
    const [starredKeys, setStarredKeys] = useState<Set<string>>(new Set());

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);
            await fetchMessages(user.id);
            setIsLoading(false);

            const channel = supabase
                .channel('messages-realtime')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
                    fetchMessages(user.id);
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        };
        init();
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeKey, messages]);

    const fetchMessages = async (uid: string) => {
        const { data, error } = await supabase
            .from('messages')
            .select('id, sender_user_id, receiver_user_id, sender_name, sender_phone, content, related_auto_id, type, is_read, is_starred, created_at')
            .or(`receiver_user_id.eq.${uid},sender_user_id.eq.${uid}`)
            .order('created_at', { ascending: true });

        if (error) { console.error(error); return; }

        const msgs = data || [];
        const autoIds = [...new Set(msgs.map((m: any) => m.related_auto_id).filter(Boolean))];
        let autosMap: Record<string, any> = {};

        if (autoIds.length > 0) {
            const { data: autos } = await supabase
                .from('inventario')
                .select('id, marca, modelo, fotos')
                .in('id', autoIds);
            for (const a of autos || []) { autosMap[a.id] = a; }
        }

        const mapped = msgs.map((m: any) => ({
            ...m,
            is_starred: m.is_starred ?? false,
            auto_brand: m.related_auto_id ? autosMap[m.related_auto_id]?.marca || null : null,
            auto_model: m.related_auto_id ? autosMap[m.related_auto_id]?.modelo || null : null,
            auto_foto:  m.related_auto_id ? autosMap[m.related_auto_id]?.fotos?.[0] || null : null,
        }));

        setMessages(mapped);

        // Rebuild starred keys from messages
        const starred = new Set<string>();
        mapped.forEach((m: any) => {
            if (m.is_starred) {
                const isReceived = m.receiver_user_id === uid;
                const contactId = isReceived ? m.sender_user_id : m.receiver_user_id;
                const key = `${contactId ?? m.sender_name ?? 'anon'}_${m.related_auto_id ?? 'none'}_${m.type}`;
                starred.add(key);
            }
        });
        setStarredKeys(starred);
    };

    const markRead = async (msgs: Message[], uid: string) => {
        const unreadMsgs = msgs.filter(m => m.receiver_user_id === uid && !m.is_read);
        const unreadIds = unreadMsgs.map(m => m.id);
        if (!unreadIds.length) return;
        await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
        setMessages(prev => prev.map(m => unreadIds.includes(m.id) ? { ...m, is_read: true } : m));
        const autoIds = [...new Set(unreadMsgs.map(m => m.related_auto_id).filter(Boolean))] as string[];
        if (autoIds.length) {
            await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() })
                .eq('user_id', uid).eq('category', 'message').in('related_entity_id', autoIds);
        }
    };

    const handleToggleStar = async (convKey: string, convMessages: Message[]) => {
        const isStarred = starredKeys.has(convKey);
        const newVal = !isStarred;
        setStarredKeys(prev => {
            const next = new Set(prev);
            newVal ? next.add(convKey) : next.delete(convKey);
            return next;
        });
        // Mark all messages in conversation as starred/unstarred
        const ids = convMessages.map(m => m.id);
        if (ids.length) {
            await supabase.from('messages').update({ is_starred: newVal }).in('id', ids);
        }
    };

    const handleDeleteMessages = async () => {
        if (!userId || selectedMsgIds.size === 0) return;
        setIsDeleting(true);
        try {
            const ids = Array.from(selectedMsgIds);
            await supabase.from('messages').delete().in('id', ids);
            setMessages(prev => prev.filter(m => !ids.includes(m.id)));
            setSelectedMsgIds(new Set());
            setSelectMsgMode(false);
            setShowDeleteMsgConfirm(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleSelectMsg = (id: string) => {
        setSelectedMsgIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const exitSelectMsgMode = () => { setSelectMsgMode(false); setSelectedMsgIds(new Set()); };

    const conversations = useMemo((): Conversation[] => {
        if (!userId) return [];
        const map = new Map<string, Conversation>();

        for (const m of messages) {
            const isReceived = m.receiver_user_id === userId;
            const contactId = isReceived ? m.sender_user_id : m.receiver_user_id;
            const key = `${contactId ?? m.sender_name ?? 'anon'}_${m.related_auto_id ?? 'none'}_${m.type}`;

            if (!map.has(key)) {
                map.set(key, {
                    key,
                    contact_id: contactId,
                    contact_name: m.sender_name || (isReceived ? 'Usuario' : 'Vos'),
                    contact_phone: m.sender_phone || null,
                    auto_id: m.related_auto_id,
                    auto_label: m.auto_brand && m.auto_model ? `${m.auto_brand} ${m.auto_model}` : null,
                    auto_foto: m.auto_foto || null,
                    type: m.type,
                    last_message: m.content,
                    last_at: m.created_at,
                    unread: 0,
                    is_starred: false,
                    messages: [],
                });
            }

            const conv = map.get(key)!;
            conv.messages.push(m);
            conv.last_message = m.content;
            conv.last_at = m.created_at;
            if (m.receiver_user_id === userId && !m.is_read) conv.unread++;
            if (m.is_starred) conv.is_starred = true;
        }

        return Array.from(map.values()).sort(
            (a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime()
        );
    }, [messages, userId]);

    useEffect(() => {
        if (!autoParam || autoSelectDone.current || conversations.length === 0 || !userId) return;
        const match = conversations.find(c => c.auto_id === autoParam);
        if (match) {
            autoSelectDone.current = true;
            setActiveKey(match.key);
            setShowMobileThread(true);
            markRead(match.messages, userId);
        }
    }, [autoParam, conversations, userId]);

    const filteredConversations = useMemo(() => {
        let list = conversations;
        if (convTab === 'no_leidas') list = list.filter(c => c.unread > 0);
        if (convTab === 'favoritas') list = list.filter(c => starredKeys.has(c.key));
        if (!search) return list;
        const q = search.toLowerCase();
        return list.filter(c =>
            c.contact_name.toLowerCase().includes(q) ||
            c.auto_label?.toLowerCase().includes(q) ||
            c.last_message.toLowerCase().includes(q)
        );
    }, [conversations, convTab, search, starredKeys]);

    const activeConv = conversations.find(c => c.key === activeKey) || null;

    const filteredThreadMessages = useMemo(() => {
        if (!activeConv) return [];
        if (!threadSearch.trim()) return activeConv.messages;
        const q = threadSearch.toLowerCase();
        return activeConv.messages.filter(m => m.content.toLowerCase().includes(q));
    }, [activeConv, threadSearch]);

    const handleSelectConv = (conv: Conversation) => {
        setActiveKey(conv.key);
        setShowMobileThread(true);
        setThreadSearch('');
        exitSelectMsgMode();
        if (userId) markRead(conv.messages, userId);
    };

    const handleSend = async () => {
        if (!reply.trim() || !activeConv || !userId) return;
        setIsSending(true);
        const content = reply.trim();
        setReply('');

        const tempId = `temp_${Date.now()}`;
        const optimisticMsg: Message = {
            id: tempId,
            sender_user_id: userId,
            receiver_user_id: activeConv.contact_id ?? userId,
            sender_name: null,
            sender_phone: null,
            content,
            related_auto_id: activeConv.auto_id,
            type: activeConv.type,
            is_read: false,
            is_starred: false,
            created_at: new Date().toISOString(),
            auto_brand: undefined,
            auto_model: undefined,
            auto_foto: activeConv.auto_foto ?? undefined,
        };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            const { error } = await supabase.from('messages').insert({
                sender_user_id: userId,
                receiver_user_id: activeConv.contact_id ?? userId,
                content,
                related_auto_id: activeConv.auto_id,
                type: activeConv.type,
                is_read: false,
            });
            if (error) throw error;
            fetchMessages(userId);
        } catch (err: any) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setReply(content);
            alert(err.message);
        } finally {
            setIsSending(false);
        }
    };

    const typeConfig: Record<string, { label: string; color: string }> = {
        flip:            { label: 'Flip',    color: '#2596be' },
        marketplace:     { label: 'Web',     color: '#a855f7' },
        direct:          { label: 'Directo', color: '#64748b' },
        ticket_busqueda: { label: 'Ticket',  color: '#f59e0b' },
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
        if (isToday) return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    };

    const totalUnread = conversations.reduce((a, c) => a + c.unread, 0);
    const totalUnreadConvs = conversations.filter(c => c.unread > 0).length;

    if (isLoading) return (
        <div className="flex h-screen w-full items-center justify-center bg-[#0b1114]">
            <Loader2 className="h-10 w-10 animate-spin text-[#288b55]" />
        </div>
    );

    return (
        <div className="bg-[#0b1114] min-h-screen w-full text-slate-300 font-sans flex flex-col">
            <style jsx global>{`
                @font-face { font-family: 'Genos'; src: url('/fonts/genos/Genos-VariableFont_wght.ttf') format('truetype'); }
            `}</style>

            {/* Subheader */}
            <div className="fixed top-[88px] lg:top-20 left-0 right-0 z-[40] bg-[#1c2e38] border-b border-white/5 px-6 py-3 flex items-center justify-center gap-3">
                <span style={{ fontFamily: 'Genos' }} className="text-white text-[14px] font-light tracking-[4px] uppercase opacity-40">Mensajes</span>
                {totalUnread > 0 && (
                    <span className="text-[10px] font-black text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded uppercase tracking-widest">
                        {totalUnread} sin leer
                    </span>
                )}
            </div>

            {/* Modal borrar mensajes */}
            {showDeleteMsgConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-6">
                    <div className="bg-[#1a2e38] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">Borrar mensajes</h3>
                        <p className="text-xs text-slate-400 mb-6">
                            Vas a eliminar <span className="text-white font-bold">{selectedMsgIds.size}</span> mensaje{selectedMsgIds.size > 1 ? 's' : ''}. Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteMsgConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-400 hover:text-white transition-all">Cancelar</button>
                            <button onClick={handleDeleteMessages} disabled={isDeleting} className="flex-1 py-2.5 rounded-xl bg-red-500 text-xs font-black text-white hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-1 pt-[140px] lg:pt-[127px] h-[100vh] overflow-hidden">

                {/* ── LISTA ── */}
                <div className={`w-full lg:w-[560px] flex-shrink-0 border-r border-white/5 flex flex-col bg-[#111b21] ${showMobileThread ? 'hidden lg:flex' : 'flex'}`}>

                    {/* Pestañas */}
                    <div className="flex border-b border-white/5">
                        {([
                            { id: 'todas',     label: 'Todas',      badge: 0 },
                            { id: 'no_leidas', label: 'No leídas',  badge: totalUnreadConvs },
                            { id: 'favoritas', label: 'Favoritas',  badge: starredKeys.size },
                        ] as { id: ConvTab; label: string; badge: number }[]).map(t => (
                            <button key={t.id} onClick={() => setConvTab(t.id)}
                                className={`flex-1 py-3 text-[11px] font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                                    convTab === t.id
                                        ? 'border-[#288b55] text-[#288b55]'
                                        : 'border-transparent text-slate-500 hover:text-slate-300'
                                }`}>
                                {t.label}
                                {t.badge > 0 && (
                                    <span className={`min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center ${convTab === t.id ? 'bg-[#288b55] text-white' : 'bg-white/10 text-slate-400'}`}>
                                        {t.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Buscador */}
                    <div className="px-3 py-2 border-b border-white/5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                            <input type="text" placeholder="Buscar o empezar un chat..."
                                value={search} onChange={e => setSearch(e.target.value)}
                                className="bg-[#202c33] rounded-lg pl-9 pr-4 py-2 w-full outline-none text-slate-200 placeholder:text-slate-500 text-[13px]"
                                style={{ fontSize: '16px' }}
                            />
                            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={13} /></button>}
                        </div>
                    </div>

                    {/* Lista conversaciones */}
                    <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
                        {filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full opacity-30 gap-3">
                                <MessageSquare size={32} className="text-slate-500" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                                    {convTab === 'no_leidas' ? 'Sin mensajes no leídos' : convTab === 'favoritas' ? 'Sin favoritas' : 'Sin mensajes'}
                                </span>
                            </div>
                        ) : filteredConversations.map(conv => {
                            const isActive = activeKey === conv.key;
                            const isStarred = starredKeys.has(conv.key);
                            const tc = typeConfig[conv.type] || typeConfig.direct;
                            return (
                                <button key={conv.key} onClick={() => handleSelectConv(conv)}
                                    className={`w-full text-left flex items-center gap-3 px-3 py-3 border-b border-white/[0.04] transition-all hover:bg-white/[0.03] ${isActive ? 'bg-[#2a3942]' : ''}`}>

                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-[#2a3942] flex items-center justify-center">
                                        {conv.auto_foto
                                            ? <img src={conv.auto_foto} alt="" className="w-full h-full object-cover" />
                                            : <Car size={18} className="text-slate-500" />
                                        }
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className={`text-[14px] font-semibold truncate ${isStarred ? 'text-amber-400' : 'text-[#e9edef]'}`}>
                                                {conv.contact_name}
                                            </span>
                                            <span className={`text-[11px] flex-shrink-0 ml-2 ${conv.unread > 0 ? 'text-[#288b55]' : 'text-slate-500'}`}>
                                                {formatTime(conv.last_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex flex-col min-w-0">
                                                {conv.auto_label && (
                                                    <span className="text-[11px] text-slate-500 truncate leading-tight" style={{ color: tc.color }}>
                                                        {conv.auto_label}
                                                    </span>
                                                )}
                                                <span className="text-[12px] text-slate-400 truncate leading-snug">{conv.last_message}</span>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                {conv.unread > 0 && (
                                                    <span className="min-w-[20px] h-5 px-1 rounded-full bg-[#288b55] text-[11px] font-black text-white flex items-center justify-center">
                                                        {conv.unread}
                                                    </span>
                                                )}
                                                {isStarred && <Star size={11} className="text-amber-400 fill-amber-400" />}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── HILO ── */}
                <div className={`flex-1 flex flex-col bg-[#0b1114] ${!showMobileThread ? 'hidden lg:flex' : 'flex'}`}
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                    {!activeConv ? (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-4">
                            <MessageSquare size={48} className="text-slate-500" />
                            <span className="text-[12px] font-black uppercase tracking-widest text-slate-500">Seleccioná una conversación</span>
                        </div>
                    ) : (
                        <>
                            {/* Header hilo */}
                            <div className="px-4 py-3 border-b border-white/5 bg-[#202c33] flex items-center gap-3">
                                <button onClick={() => { setShowMobileThread(false); exitSelectMsgMode(); setThreadSearch(''); }} className="lg:hidden text-slate-400 hover:text-white">
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#2a3942] flex-shrink-0 flex items-center justify-center">
                                    {activeConv.auto_foto ? <img src={activeConv.auto_foto} alt="" className="w-full h-full object-cover" /> : <Car size={14} className="text-slate-500" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-semibold text-[#e9edef] truncate">{activeConv.contact_name}</p>
                                    {activeConv.auto_label && (
                                        <p className="text-[11px] truncate" style={{ color: (typeConfig[activeConv.type] || typeConfig.direct).color }}>
                                            {activeConv.auto_label} · {(typeConfig[activeConv.type] || typeConfig.direct).label}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-1.5 flex-shrink-0">
                                    {/* Estrella */}
                                    <button onClick={() => handleToggleStar(activeConv.key, activeConv.messages)}
                                        className={`p-2 rounded-lg transition-all ${starredKeys.has(activeConv.key) ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-amber-400 hover:bg-white/5'}`}>
                                        <Star size={16} className={starredKeys.has(activeConv.key) ? 'fill-amber-400' : ''} />
                                    </button>
                                    {/* Tachito — abre modo selección */}
                                    {!selectMsgMode ? (
                                        <button onClick={() => setSelectMsgMode(true)}
                                            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            {selectedMsgIds.size > 0 && (
                                                <button onClick={() => setShowDeleteMsgConfirm(true)}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-black uppercase hover:bg-red-500/30 transition-all">
                                                    <Trash2 size={12} />{selectedMsgIds.size}
                                                </button>
                                            )}
                                            <button onClick={exitSelectMsgMode}
                                                className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Buscador del hilo */}
                            <div className="px-4 py-2 border-b border-white/5 bg-[#202c33]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                                    <input type="text" placeholder="Buscar en esta conversación..."
                                        value={threadSearch} onChange={e => setThreadSearch(e.target.value)}
                                        className="bg-[#2a3942] rounded-lg pl-8 pr-4 py-1.5 w-full outline-none text-slate-300 placeholder:text-slate-500 text-[12px]"
                                        style={{ fontSize: '16px' }}
                                    />
                                    {threadSearch && <button onClick={() => setThreadSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={11} /></button>}
                                </div>
                                {threadSearch && <p className="text-[9px] text-slate-500 mt-1 px-1">{filteredThreadMessages.length} resultado{filteredThreadMessages.length !== 1 ? 's' : ''}</p>}
                            </div>

                            {/* Mensajes */}
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 pb-36 lg:pb-4">
                                {filteredThreadMessages.map((m, idx) => {
                                    const isMine = m.sender_user_id === userId;
                                    const isMsgSelected = selectedMsgIds.has(m.id);
                                    const isTemp = m.id.startsWith('temp_');
                                    const prevMsg = idx > 0 ? filteredThreadMessages[idx - 1] : null;
                                    const sameAsPrev = prevMsg && prevMsg.sender_user_id === m.sender_user_id;

                                    return (
                                        <div key={m.id}
                                            className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'} ${sameAsPrev ? 'mt-0.5' : 'mt-3'} ${selectMsgMode ? 'cursor-pointer' : ''}`}
                                            onClick={() => selectMsgMode && !isTemp && toggleSelectMsg(m.id)}>

                                            {selectMsgMode && !isTemp && (
                                                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mb-1 transition-all ${isMsgSelected ? 'bg-[#288b55] border-[#288b55]' : 'border-slate-500'}`}>
                                                    {isMsgSelected && <Check size={10} className="text-white" />}
                                                </div>
                                            )}

                                            <div className={`max-w-[65%] rounded-[8px] px-3 py-2 transition-all shadow-sm ${
                                                isMine
                                                    ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-sm'
                                                    : 'bg-[#202c33] text-[#e9edef] rounded-tl-sm'
                                                } ${isMsgSelected ? 'opacity-60 ring-2 ring-[#288b55]' : ''} ${isTemp ? 'opacity-60' : ''}`}>

                                                {!isMine && m.sender_name && !sameAsPrev && (
                                                    <span className="text-[11px] font-bold block mb-1" style={{ color: (typeConfig[m.type] || typeConfig.direct).color }}>
                                                        {m.sender_name}
                                                    </span>
                                                )}
                                                <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{m.content}</p>

                                                {/* Preview card auto adjunto */}
                                                {m.type === 'ticket_busqueda' && m.related_auto_id && m.auto_brand && (
                                                    <a href={`/vehiculos/${m.related_auto_id}`} onClick={e => e.stopPropagation()}
                                                        className="mt-2 flex items-center gap-0 rounded-lg overflow-hidden border border-white/10 bg-black/20 transition-all hover:opacity-90">
                                                        {m.auto_foto && <img src={m.auto_foto} alt="" className="w-16 h-12 object-cover flex-shrink-0" />}
                                                        <div className="flex-1 min-w-0 px-3 py-2">
                                                            <p className="text-[10px] font-black uppercase truncate text-white leading-tight">{m.auto_brand} {m.auto_model}</p>
                                                            <p className="text-[9px] font-bold mt-0.5 text-[#288b55]">Ver publicación →</p>
                                                        </div>
                                                    </a>
                                                )}

                                                <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                    <span className="text-[10px] text-white/40">{formatTime(m.created_at)}</span>
                                                    {isMine && (isTemp
                                                        ? <Loader2 size={10} className="animate-spin text-white/40" />
                                                        : m.is_read
                                                            ? <CheckCheck size={12} className="text-[#53bdeb]" />
                                                            : <Check size={12} className="text-white/40" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={bottomRef} />
                            </div>

                            {/* Input */}
                            {!selectMsgMode && (
                                <div className="fixed bottom-16 left-0 right-0 lg:static lg:bottom-auto px-3 py-3 bg-[#202c33] flex items-end gap-2 z-30">
                                    <textarea
                                        value={reply}
                                        onChange={e => setReply(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                        placeholder="Escribí un mensaje..."
                                        rows={1}
                                        className="flex-1 bg-[#2a3942] rounded-xl px-4 py-2.5 outline-none text-[#e9edef] placeholder:text-slate-500 resize-none max-h-32 text-[13px]"
                                        style={{ fontSize: '16px' }}
                                    />
                                    <button onClick={handleSend} disabled={isSending || !reply.trim()}
                                        className="w-10 h-10 rounded-full bg-[#288b55] flex items-center justify-center flex-shrink-0 hover:bg-[#1e6e42] transition-all disabled:opacity-40 disabled:pointer-events-none">
                                        {isSending ? <Loader2 size={14} className="animate-spin text-white" /> : <Send size={14} className="text-white" />}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MensajesPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-[#0b1114]">
                <Loader2 className="h-10 w-10 animate-spin text-[#288b55]" />
            </div>
        }>
            <MensajesContent />
        </Suspense>
    );
}