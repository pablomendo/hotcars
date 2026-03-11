'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Search, Send, Loader2, Zap, Globe, ArrowLeft,
    MessageSquare, Check, CheckCheck, Car, Trash2, X, CheckSquare
} from 'lucide-react';

type Message = {
    id: string;
    sender_user_id: string | null;
    receiver_user_id: string;
    sender_name: string | null;
    sender_phone: string | null;
    content: string;
    related_auto_id: string | null;
    type: 'flip' | 'marketplace' | 'direct';
    is_read: boolean;
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
    type: 'flip' | 'marketplace' | 'direct';
    last_message: string;
    last_at: string;
    unread: number;
    messages: Message[];
};

function MensajesContent() {
    const searchParams = useSearchParams();
    const autoParam = searchParams.get('auto');

    const [userId, setUserId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [threadSearch, setThreadSearch] = useState('');
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const [reply, setReply] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [showMobileThread, setShowMobileThread] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const autoSelectDone = useRef(false);

    // Selección de conversaciones
    const [selectMode, setSelectMode] = useState(false);
    const [selectedConvKeys, setSelectedConvKeys] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Selección de mensajes individuales
    const [selectMsgMode, setSelectMsgMode] = useState(false);
    const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set());
    const [showDeleteMsgConfirm, setShowDeleteMsgConfirm] = useState(false);

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
            .select('id, sender_user_id, receiver_user_id, sender_name, sender_phone, content, related_auto_id, type, is_read, created_at')
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
            auto_brand: m.related_auto_id ? autosMap[m.related_auto_id]?.marca || null : null,
            auto_model: m.related_auto_id ? autosMap[m.related_auto_id]?.modelo || null : null,
            auto_foto:  m.related_auto_id ? autosMap[m.related_auto_id]?.fotos?.[0] || null : null,
        }));

        setMessages(mapped);
    };

    const markRead = async (msgs: Message[], uid: string) => {
        const unreadMsgs = msgs.filter(m => m.receiver_user_id === uid && !m.is_read);
        const unreadIds = unreadMsgs.map(m => m.id);
        if (!unreadIds.length) return;

        await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
        setMessages(prev => prev.map(m => unreadIds.includes(m.id) ? { ...m, is_read: true } : m));

        const autoIds = [...new Set(unreadMsgs.map(m => m.related_auto_id).filter(Boolean))] as string[];
        if (autoIds.length) {
            await supabase
                .from('notifications')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('user_id', uid)
                .eq('category', 'message')
                .in('related_entity_id', autoIds);
        }
    };

    const handleDeleteConversations = async () => {
        if (!userId || selectedConvKeys.size === 0) return;
        setIsDeleting(true);
        try {
            const toDelete = conversations.filter(c => selectedConvKeys.has(c.key));
            const allMsgIds = toDelete.flatMap(c => c.messages.map(m => m.id));
            if (allMsgIds.length) {
                await supabase.from('messages').delete().in('id', allMsgIds);
            }
            setMessages(prev => prev.filter(m => !allMsgIds.includes(m.id)));
            setSelectedConvKeys(new Set());
            setSelectMode(false);
            setShowDeleteConfirm(false);
            if (toDelete.some(c => c.key === activeKey)) {
                setActiveKey(null);
                setShowMobileThread(false);
            }
        } finally {
            setIsDeleting(false);
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

    const toggleSelectConv = (key: string) => {
        setSelectedConvKeys(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const toggleSelectMsg = (id: string) => {
        setSelectedMsgIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const exitSelectMode = () => { setSelectMode(false); setSelectedConvKeys(new Set()); };
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
                    messages: [],
                });
            }

            const conv = map.get(key)!;
            conv.messages.push(m);
            conv.last_message = m.content;
            conv.last_at = m.created_at;
            if (m.receiver_user_id === userId && !m.is_read) conv.unread++;
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

    const filtered = useMemo(() => {
        if (!search) return conversations;
        const q = search.toLowerCase();
        return conversations.filter(c =>
            c.contact_name.toLowerCase().includes(q) ||
            c.auto_label?.toLowerCase().includes(q) ||
            c.last_message.toLowerCase().includes(q)
        );
    }, [conversations, search]);

    const activeConv = conversations.find(c => c.key === activeKey) || null;

    const filteredThreadMessages = useMemo(() => {
        if (!activeConv) return [];
        if (!threadSearch.trim()) return activeConv.messages;
        const q = threadSearch.toLowerCase();
        return activeConv.messages.filter(m => m.content.toLowerCase().includes(q));
    }, [activeConv, threadSearch]);

    const handleSelectConv = (conv: Conversation) => {
        if (selectMode) { toggleSelectConv(conv.key); return; }
        setActiveKey(conv.key);
        setShowMobileThread(true);
        setThreadSearch('');
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

    const typeConfig = {
        flip:        { label: 'Flip',    bg: 'bg-[#2596be]/20', text: 'text-[#2596be]', border: 'border-[#2596be]/30', icon: <Zap size={9} fill="currentColor"/> },
        marketplace: { label: 'Web',     bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', icon: <Globe size={9}/> },
        direct:      { label: 'Directo', bg: 'bg-slate-500/20',  text: 'text-slate-400',  border: 'border-slate-500/30',  icon: <MessageSquare size={9}/> },
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        return isToday
            ? d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
            : d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    };

    if (isLoading) return (
        <div className="flex h-screen w-full items-center justify-center bg-[#0b1114]">
            <Loader2 className="h-10 w-10 animate-spin text-[#22c55e]" />
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
                <span className="text-[10px] font-black text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded uppercase tracking-widest">
                    {conversations.reduce((acc, c) => acc + c.unread, 0)} sin leer
                </span>
            </div>

            {/* Modal borrar conversaciones */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-6">
                    <div className="bg-[#1a2e38] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">Borrar conversaciones</h3>
                        <p className="text-xs text-slate-400 mb-6">
                            Vas a eliminar <span className="text-white font-bold">{selectedConvKeys.size}</span> conversación{selectedConvKeys.size > 1 ? 'es' : ''} y todos sus mensajes. Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-400 hover:text-white transition-all">Cancelar</button>
                            <button onClick={handleDeleteConversations} disabled={isDeleting} className="flex-1 py-2.5 rounded-xl bg-red-500 text-xs font-black text-white hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

            <div className="flex flex-1 pt-[144px] lg:pt-[120px] h-[100vh] overflow-hidden">

                {/* LISTA */}
                <div className={`w-full lg:w-[340px] flex-shrink-0 border-r border-white/5 flex flex-col bg-[#0d1518] ${showMobileThread ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-3 border-b border-white/5 flex gap-2 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar conversación..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 w-full outline-none focus:border-[#22c55e]/50 transition-all"
                                style={{ fontSize: '16px' }}
                            />
                        </div>
                        {!selectMode ? (
                            <button onClick={() => setSelectMode(true)} className="flex-shrink-0 p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all" title="Seleccionar">
                                <CheckSquare size={15} />
                            </button>
                        ) : (
                            <div className="flex gap-1.5 flex-shrink-0">
                                {selectedConvKeys.size > 0 && (
                                    <button onClick={() => setShowDeleteConfirm(true)} className="p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all">
                                        <Trash2 size={15} />
                                    </button>
                                )}
                                <button onClick={exitSelectMode} className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
                                    <X size={15} />
                                </button>
                            </div>
                        )}
                    </div>

                    {selectMode && (
                        <div className="px-4 py-2 bg-white/[0.02] border-b border-white/5">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {selectedConvKeys.size > 0 ? `${selectedConvKeys.size} seleccionada${selectedConvKeys.size > 1 ? 's' : ''}` : 'Tocá para seleccionar'}
                            </span>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full opacity-30 gap-3">
                                <MessageSquare size={32} className="text-slate-500" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Sin mensajes</span>
                            </div>
                        ) : (
                            filtered.map((conv) => {
                                const tc = typeConfig[conv.type];
                                const isActive = activeKey === conv.key;
                                const isSelected = selectedConvKeys.has(conv.key);
                                return (
                                    <button
                                        key={conv.key}
                                        onClick={() => handleSelectConv(conv)}
                                        className={`w-full text-left px-4 py-3.5 border-b border-white/5 flex gap-3 transition-all hover:bg-white/[0.03] ${isActive && !selectMode ? 'bg-[#134e4d]/30 border-l-2 border-l-[#22c55e]' : ''} ${isSelected ? 'bg-red-500/10 border-l-2 border-l-red-500' : ''}`}
                                    >
                                        {selectMode && (
                                            <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center self-center transition-all ${isSelected ? 'bg-red-500 border-red-500' : 'border-slate-600'}`}>
                                                {isSelected && <Check size={11} className="text-white" />}
                                            </div>
                                        )}
                                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800 flex items-center justify-center">
                                            {conv.auto_foto ? <img src={conv.auto_foto} alt="" className="w-full h-full object-cover" /> : <Car size={16} className="text-slate-600" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-[11px] font-black text-white uppercase tracking-tight truncate">{conv.contact_name}</span>
                                                <span className="text-[9px] text-slate-500 flex-shrink-0 ml-2">{formatTime(conv.last_at)}</span>
                                            </div>
                                            {conv.auto_label && (
                                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter block truncate mb-0.5">{conv.auto_label}</span>
                                            )}
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[10px] text-slate-400 truncate leading-tight">{conv.last_message}</span>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border ${tc.bg} ${tc.text} ${tc.border} flex items-center gap-1`}>
                                                        {tc.icon}{tc.label}
                                                    </span>
                                                    {conv.unread > 0 && (
                                                        <span className="w-4 h-4 rounded-full bg-[#22c55e] text-[8px] font-black text-white flex items-center justify-center">
                                                            {conv.unread}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* HILO */}
                <div className={`flex-1 flex flex-col bg-[#0b1114] ${!showMobileThread ? 'hidden lg:flex' : 'flex'}`}>
                    {!activeConv ? (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-4">
                            <MessageSquare size={48} className="text-slate-500" />
                            <span className="text-[12px] font-black uppercase tracking-widest text-slate-500">Seleccioná una conversación</span>
                        </div>
                    ) : (
                        <>
                            {/* Header hilo */}
                            <div className="px-5 py-3.5 border-b border-white/5 bg-[#0d1518] flex items-center gap-3">
                                <button onClick={() => { setShowMobileThread(false); exitSelectMsgMode(); setThreadSearch(''); }} className="lg:hidden text-slate-400 hover:text-white">
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 flex items-center justify-center">
                                    {activeConv.auto_foto ? <img src={activeConv.auto_foto} alt="" className="w-full h-full object-cover" /> : <Car size={14} className="text-slate-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[12px] font-black text-white uppercase tracking-tight">{activeConv.contact_name}</span>
                                        <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 ${typeConfig[activeConv.type].bg} ${typeConfig[activeConv.type].text} ${typeConfig[activeConv.type].border}`}>
                                            {typeConfig[activeConv.type].icon}{typeConfig[activeConv.type].label}
                                        </span>
                                    </div>
                                    {activeConv.auto_label && <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{activeConv.auto_label}</span>}
                                    {activeConv.contact_phone && (
                                        <a href={`https://wa.me/${activeConv.contact_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[9px] text-[#22c55e] font-bold hover:underline block">
                                            WhatsApp: {activeConv.contact_phone}
                                        </a>
                                    )}
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    {!selectMsgMode ? (
                                        <button onClick={() => setSelectMsgMode(true)} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all" title="Seleccionar mensajes">
                                            <CheckSquare size={14} />
                                        </button>
                                    ) : (
                                        <>
                                            {selectedMsgIds.size > 0 && (
                                                <button onClick={() => setShowDeleteMsgConfirm(true)} className="p-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all flex items-center gap-1">
                                                    <Trash2 size={13} />
                                                    <span className="text-[10px] font-black">{selectedMsgIds.size}</span>
                                                </button>
                                            )}
                                            <button onClick={exitSelectMsgMode} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
                                                <X size={14} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Buscador del hilo */}
                            <div className="px-4 py-2 border-b border-white/5 bg-[#0d1518]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Buscar en esta conversación..."
                                        value={threadSearch}
                                        onChange={(e) => setThreadSearch(e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-1.5 w-full outline-none focus:border-[#22c55e]/50 transition-all"
                                        style={{ fontSize: '16px' }}
                                    />
                                    {threadSearch && (
                                        <button onClick={() => setThreadSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                            <X size={11} />
                                        </button>
                                    )}
                                </div>
                                {threadSearch && (
                                    <p className="text-[9px] text-slate-500 mt-1 px-1">
                                        {filteredThreadMessages.length} resultado{filteredThreadMessages.length !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>

                            {/* Mensajes */}
                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 pb-36 lg:pb-4">
                                {filteredThreadMessages.map((m) => {
                                    const isMine = m.sender_user_id === userId;
                                    const isMsgSelected = selectedMsgIds.has(m.id);
                                    const isTemp = m.id.startsWith('temp_');
                                    return (
                                        <div
                                            key={m.id}
                                            className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'} ${selectMsgMode ? 'cursor-pointer' : ''}`}
                                            onClick={() => selectMsgMode && !isTemp && toggleSelectMsg(m.id)}
                                        >
                                            {selectMsgMode && !isTemp && (
                                                <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center mb-1 transition-all ${isMsgSelected ? 'bg-red-500 border-red-500' : 'border-slate-600'}`}>
                                                    {isMsgSelected && <Check size={9} className="text-white" />}
                                                </div>
                                            )}
                                            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 transition-all ${isMine ? 'bg-[#22c55e] text-white rounded-br-sm' : 'bg-[#1c2e38] text-slate-200 rounded-bl-sm'} ${isMsgSelected ? 'opacity-60 ring-2 ring-red-500' : ''} ${isTemp ? 'opacity-60' : ''}`}>
                                                {!isMine && m.sender_name && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60 block mb-1">{m.sender_name}</span>
                                                )}
                                                <p className="text-[12px] leading-relaxed">{m.content}</p>
                                                <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                    <span className={`text-[9px] ${isMine ? 'text-white/60' : 'text-slate-500'}`}>{formatTime(m.created_at)}</span>
                                                    {isMine && (
                                                        isTemp
                                                            ? <Loader2 size={10} className="animate-spin text-white/40" />
                                                            : m.is_read ? <CheckCheck size={11} className="text-white/60" /> : <Check size={11} className="text-white/40" />
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
                                <div className="fixed bottom-16 left-0 right-0 lg:static lg:bottom-auto px-4 py-3 border-t border-white/5 bg-[#0d1518] flex items-end gap-3 z-30">
                                    <textarea
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                        placeholder="Escribí tu respuesta..."
                                        rows={1}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-[#22c55e]/50 transition-all resize-none max-h-32"
                                        style={{ fontSize: '16px' }}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={isSending || !reply.trim()}
                                        className="w-10 h-10 rounded-xl bg-[#22c55e] flex items-center justify-center flex-shrink-0 hover:bg-[#16a34a] transition-all disabled:opacity-40 disabled:pointer-events-none"
                                    >
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
                <Loader2 className="h-10 w-10 animate-spin text-[#22c55e]" />
            </div>
        }>
            <MensajesContent />
        </Suspense>
    );
}