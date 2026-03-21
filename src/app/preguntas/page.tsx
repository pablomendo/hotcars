'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Loader2, MessageSquare, Car, ChevronRight,
    ChevronDown, ChevronUp, Check, Clock, Search, X, CornerDownLeft
} from 'lucide-react';

type Question = {
    id: string;
    auto_id: string;
    user_id: string;
    owner_id: string;
    pregunta: string;
    respuesta: string | null;
    answered_at: string | null;
    created_at: string;
    auto?: {
        id: string;
        marca: string;
        modelo: string;
        anio: number;
        fotos: string[];
        pv?: number;
        moneda?: string;
        ganancia_dueno?: number;
    };
};

type GroupedByAuto = {
    auto_id: string;
    auto: Question['auto'];
    questions: Question[];
};

function PreguntasContent() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [tab, setTab] = useState<'recibidas' | 'enviadas'>('recibidas');
    const [recibidas, setRecibidas] = useState<Question[]>([]);
    const [enviadas, setEnviadas] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [replyText, setReplyText] = useState<Record<string, string>>({});
    const [sendingReply, setSendingReply] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const fetchQuestions = useCallback(async (uid: string) => {
        setIsLoading(true);
        try {
            const { data: recv } = await supabase
                .from('consultas_publicaciones')
                .select('id, auto_id, user_id, owner_id, pregunta, respuesta, answered_at, created_at')
                .eq('owner_id', uid)
                .order('created_at', { ascending: false });

            const { data: sent } = await supabase
                .from('consultas_publicaciones')
                .select('id, auto_id, user_id, owner_id, pregunta, respuesta, answered_at, created_at')
                .eq('user_id', uid)
                .order('created_at', { ascending: false });

            const allAutoIds = [...new Set([
                ...(recv || []).map((q: any) => q.auto_id),
                ...(sent || []).map((q: any) => q.auto_id),
            ])];

            let autosMap: Record<string, any> = {};
            if (allAutoIds.length > 0) {
                const { data: autos } = await supabase
                    .from('inventario')
                    .select('id, marca, modelo, anio, fotos, pv, moneda, ganancia_dueno')
                    .in('id', allAutoIds);
                for (const a of autos || []) autosMap[a.id] = a;
            }

            const attach = (list: any[]) =>
                (list || []).map((q: any) => ({ ...q, auto: autosMap[q.auto_id] || null }));

            const recvData = attach(recv || []);
            const sentData = attach(sent || []);

            setRecibidas(recvData);
            setEnviadas(sentData);

            const unansweredIds = new Set(recvData.filter((q: Question) => !q.respuesta).map((q: Question) => q.id));
            setExpandedIds(unansweredIds);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }
            setUserId(user.id);
            fetchQuestions(user.id);
        };
        init();
    }, [fetchQuestions, router]);

    const handleReply = async (qId: string) => {
        const text = replyText[qId]?.trim();
        if (!text || sendingReply) return;
        setSendingReply(qId);
        try {
            const { error } = await supabase
                .from('consultas_publicaciones')
                .update({ respuesta: text, answered_at: new Date().toISOString() })
                .eq('id', qId);
            if (error) throw error;
            setRecibidas(prev => prev.map(q =>
                q.id === qId ? { ...q, respuesta: text, answered_at: new Date().toISOString() } : q
            ));
            setReplyText(prev => ({ ...prev, [qId]: '' }));
            setExpandedIds(prev => { const n = new Set(prev); n.delete(qId); return n; });
        } catch { alert('Error al responder'); }
        finally { setSendingReply(null); }
    };

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };

    const getSlug = (auto: any) =>
        `${auto.marca}-${auto.modelo}-${auto.anio}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + `-${auto.id}`;

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
        if (diffDays === 0) return `· Hoy ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
        if (diffDays === 1) return '· Ayer';
        if (diffDays < 7) return `· Hace ${diffDays} días`;
        return `· ${d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}`;
    };

    const activeList = tab === 'recibidas' ? recibidas : enviadas;
    const unansweredCount = recibidas.filter(q => !q.respuesta).length;

    const grouped: GroupedByAuto[] = activeList.reduce((acc: GroupedByAuto[], q) => {
        const existing = acc.find(g => g.auto_id === q.auto_id);
        if (existing) { existing.questions.push(q); }
        else { acc.push({ auto_id: q.auto_id, auto: q.auto, questions: [q] }); }
        return acc;
    }, []);

    const filteredGroups = grouped.filter(g => {
        if (!search.trim()) return true;
        const s = search.toLowerCase();
        return (
            g.auto?.marca.toLowerCase().includes(s) ||
            g.auto?.modelo.toLowerCase().includes(s) ||
            g.questions.some(q => q.pregunta.toLowerCase().includes(s) || q.respuesta?.toLowerCase().includes(s))
        );
    });

    return (
        <div className="bg-[#f5f5f5] min-h-screen w-full text-[#333] font-sans flex flex-col">

            <style>{`@font-face { font-family: 'Genos'; src: url('/fonts/genos/Genos-VariableFont_wght.ttf') format('truetype'); }`}</style>

            {/* Subheader */}
            <div className="fixed top-[88px] lg:top-20 left-0 right-0 z-[40] bg-[#1c2e38] border-b border-white/5">

                {/* Pestañas — arriba */}
                <div className="flex items-center justify-center gap-1.5 mx-6 mt-3 mb-2">
                    <div className="flex items-center gap-1.5 bg-black/30 rounded-xl px-2 py-1.5 border border-white/5">
                        <button
                            onClick={() => setTab('recibidas')}
                            className={`relative text-[12px] font-bold px-[21px] py-1.5 rounded-lg transition-all duration-200 inline-flex items-center gap-1.5 ${tab === 'recibidas' ? 'bg-[#134e4d] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Recibidas
                            {unansweredCount > 0 && (
                                <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-[3px] rounded-full text-[8px] font-black bg-[#00984a] text-white">
                                    {unansweredCount > 9 ? '+9' : unansweredCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setTab('enviadas')}
                            className={`relative text-[12px] font-bold px-[21px] py-1.5 rounded-lg transition-all duration-200 inline-flex items-center gap-1.5 ${tab === 'enviadas' ? 'bg-[#134e4d] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Enviadas
                        </button>
                    </div>
                </div>

                {/* Título PREGUNTAS — abajo de los botones */}
                <div className="flex items-center justify-center gap-3 pb-3">
                    <span
                        style={{ fontFamily: 'Genos', fontWeight: 300, letterSpacing: '4px', fontSize: '14px' }}
                        className="text-white uppercase opacity-40"
                    >
                        Preguntas
                    </span>
                    {unansweredCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black bg-[#00984a] text-white lg:hidden">
                            {unansweredCount}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex-1 pt-[209px] pb-[calc(6rem+30px)] lg:pb-[38px] max-w-3xl mx-auto w-full px-4">

                {/* Buscador */}
                <div className="relative mb-3 mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar pregunta o vehículo..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 w-full outline-none focus:border-[#3483fa] transition-all text-[#333] shadow-sm"
                        style={{ fontSize: '16px' }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X size={13} />
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-[#288b55] w-8 h-8" />
                    </div>
                ) : filteredGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30 gap-3">
                        <MessageSquare size={40} className="text-gray-400" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                            {search ? 'Sin resultados' : tab === 'recibidas' ? 'No recibiste preguntas' : 'No enviaste preguntas'}
                        </span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filteredGroups.map(group => (
                            <div key={group.auto_id} className="bg-white border border-gray-200 rounded-[6px] overflow-hidden shadow-sm">

                                {/* Header del grupo — auto */}
                                {group.auto && (
                                    <button
                                        onClick={() => router.push(`/vehiculos/${getSlug(group.auto!)}`)}
                                        className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-all cursor-pointer"
                                    >
                                        <div className="w-10 h-10 rounded-[6px] overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                                            {group.auto.fotos?.[0]
                                                ? <img src={group.auto.fotos[0]} alt="" className="w-full h-full object-cover" />
                                                : <Car size={14} className="text-gray-400" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[12px] font-black text-[#1e293b] uppercase tracking-tight">
                                                    {group.auto.marca} {group.auto.modelo} {group.auto.anio}
                                                </span>
                                                {group.auto.pv && (
                                                    <span className="text-[11px] text-[#1e293b] font-semibold whitespace-nowrap">
                                                        {group.auto.moneda === 'USD' ? 'U$S' : '$'} {Number(group.auto.pv).toLocaleString('de-DE')}
                                                        {group.auto.ganancia_dueno && (
                                                            <span className="text-[#288b55]"> — Tu ganancia ${Number(group.auto.ganancia_dueno).toLocaleString('de-DE')}</span>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[11px] text-[#3483fa] font-medium">Ir a la publicación</span>
                                        </div>
                                        <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                                    </button>
                                )}

                                {/* Preguntas del grupo */}
                                <div className="divide-y divide-gray-100">
                                    {group.questions.map(q => {
                                        const isExpanded = expandedIds.has(q.id);
                                        const hasReply = !!q.respuesta;
                                        return (
                                            <div key={q.id}>
                                                <button
                                                    onClick={() => toggleExpand(q.id)}
                                                    className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-all text-left"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[14px] text-[#333] leading-snug">
                                                            {q.pregunta}
                                                            <span className="text-[12px] text-gray-400 font-normal ml-1">{formatDate(q.created_at)}</span>
                                                        </p>
                                                        {hasReply && !isExpanded && (
                                                            <p className="text-[13px] text-gray-500 mt-1 leading-snug truncate">
                                                                <span className="mr-1 text-gray-400">└</span>{q.respuesta}
                                                                <span className="text-[11px] text-gray-400 ml-1">{formatDate(q.answered_at!)}</span>
                                                            </p>
                                                        )}
                                                        {!hasReply && (
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <Clock size={10} className="text-amber-500" />
                                                                <span className="text-[11px] text-amber-500">
                                                                    {tab === 'recibidas' ? 'Sin responder' : 'Esperando respuesta'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {isExpanded
                                                            ? <ChevronUp size={15} className="text-gray-400" />
                                                            : <ChevronDown size={15} className="text-gray-400" />
                                                        }
                                                    </div>
                                                </button>

                                                {isExpanded && (
                                                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                                                        {hasReply ? (
                                                            <div className="flex gap-2 pt-3">
                                                                <span className="text-[16px] text-gray-400 leading-none mt-0.5">└</span>
                                                                <div>
                                                                    <p className="text-[14px] text-gray-600 leading-snug">{q.respuesta}</p>
                                                                    {q.answered_at && (
                                                                        <span className="text-[11px] text-gray-400 mt-0.5 block">{formatDate(q.answered_at)}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : tab === 'recibidas' ? (
                                                            <div className="flex gap-2 mt-3">
                                                                <input
                                                                    type="text"
                                                                    value={replyText[q.id] || ''}
                                                                    onChange={e => setReplyText(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                                    onKeyDown={e => e.key === 'Enter' && handleReply(q.id)}
                                                                    placeholder="Respondé esta pregunta..."
                                                                    className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#3483fa] transition-all text-[#333]"
                                                                    style={{ fontSize: '14px' }}
                                                                />
                                                                <button
                                                                    onClick={() => handleReply(q.id)}
                                                                    disabled={!replyText[q.id]?.trim() || sendingReply === q.id}
                                                                    className="px-4 py-2 bg-[#3483fa] hover:bg-[#2a6fd1] text-white font-medium text-[13px] rounded-lg disabled:opacity-40 active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
                                                                >
                                                                    {sendingReply === q.id ? <Loader2 size={13} className="animate-spin" /> : null}
                                                                    Responder
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <p className="text-[13px] text-gray-400 italic pt-3">El vendedor no respondió todavía.</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PreguntasPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-[#f5f5f5]">
                <Loader2 className="h-10 w-10 animate-spin text-[#288b55]" />
            </div>
        }>
            <PreguntasContent />
        </Suspense>
    );
}