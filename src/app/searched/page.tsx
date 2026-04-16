'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Bell, Check, X, Send, Search, Plus, Car, MapPin } from 'lucide-react';

// ── Modal Nuevo Ticket ────────────────────────────────────────────────────────
function NuevoTicketModal({ userId, userName, onCreated, onClose }: { userId: string; userName: string; onCreated: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    marca: '', modelo: '', version: '', anio: '',
    presupuesto: '', moneda: 'USD',
    notas: '',
    acepta_inhibido: false, acepta_prendado: false, acepta_chocado: false,
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!form.marca.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from('tickets_busqueda').insert({
        user_id: userId,
        marca: form.marca.trim().toUpperCase(),
        modelo: form.modelo.trim().toUpperCase() || null,
        version: form.version.trim().toUpperCase() || null,
        anio: form.anio ? Number(form.anio) : null,
        presupuesto: form.presupuesto ? Number(form.presupuesto.replace(/\D/g, '')) : null,
        moneda: form.moneda,
        notas: form.notas.trim() || null,
        contacto_nombre: userName || null,
        acepta_inhibido: form.acepta_inhibido,
        acepta_prendado: form.acepta_prendado,
        acepta_chocado: form.acepta_chocado,
        status: 'activo',
      });
      if (error) throw error;
      setSent(true);
      setTimeout(() => { onCreated(); onClose(); }, 1200);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-[11px] font-bold uppercase outline-none focus:border-[#288b55] transition-colors text-white placeholder:text-white/40";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#1a2a34] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Bell size={15} className="text-[#288b55]" />
            <span className="text-[11px] font-black uppercase tracking-widest text-white">Nueva búsqueda</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <input className={inputCls} placeholder="Marca *" value={form.marca} onChange={e => setForm(p => ({ ...p, marca: e.target.value }))} />
            <input className={inputCls} placeholder="Modelo" value={form.modelo} onChange={e => setForm(p => ({ ...p, modelo: e.target.value }))} />
            <input className={inputCls} placeholder="Versión" value={form.version} onChange={e => setForm(p => ({ ...p, version: e.target.value }))} />
          </div>
          <div className="flex gap-2 items-center">
            <input className={inputCls} placeholder="Año" value={form.anio}
              onChange={e => setForm(p => ({ ...p, anio: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              style={{ width: '72px', flexShrink: 0 }} />
            <div className="flex bg-white/10 rounded-lg p-0.5 flex-shrink-0">
              {['USD', 'ARS'].map(m => (
                <button key={m} onClick={() => setForm(p => ({ ...p, moneda: m }))}
                  className={`px-3 py-1.5 rounded-md text-[9px] font-black transition-all ${form.moneda === m ? 'bg-[#288b55] text-white' : 'text-slate-400'}`}>
                  {m}
                </button>
              ))}
            </div>
            <input className={`${inputCls} flex-1`} placeholder="Presupuesto"
              value={form.presupuesto}
              onChange={e => setForm(p => ({ ...p, presupuesto: e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.') }))} />
          </div>
          <div className="flex gap-2">
            {([
              { key: 'acepta_inhibido', label: 'Inhibido' },
              { key: 'acepta_prendado', label: 'Prendado' },
              { key: 'acepta_chocado', label: 'Chocado' },
            ] as { key: keyof typeof form; label: string }[]).map(({ key, label }) => (
              <button key={key} onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${
                  form[key] ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}>
                {form[key] && <Check size={9} />}{label}
              </button>
            ))}
          </div>
          <textarea
            value={form.notas}
            onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
            placeholder="Aclaraciones: ideal GNC, preferentemente 4x4, solo manual, etc."
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[11px] outline-none focus:border-[#288b55] transition-colors text-white placeholder:text-white/30 resize-none"
          />
        </div>
        <div className="px-5 pb-5">
          <button onClick={handleSubmit} disabled={sending || !form.marca.trim()}
            className={`w-full py-3 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              sent ? 'bg-[#22c55e] text-white' : 'bg-[#288b55] text-white hover:bg-[#1e6e42] disabled:opacity-40'
            }`}>
            {sending ? <Loader2 size={13} className="animate-spin" /> : sent ? <><Check size={13} /> Ticket enviado</> : <><Send size={13} /> Activar ticket</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Tengo Este Auto — selección múltiple ────────────────────────────────
function TengoEsteAutoModal({
  ticket, userId, userName, onClose,
}: {
  ticket: any; userId: string; userName: string; onClose: () => void;
}) {
  const [myInventory, setMyInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAutos, setSelectedAutos] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const fetchInv = async () => {
      const { data } = await supabase
        .from('inventario')
        .select('id, marca, modelo, version, anio, pv, moneda, fotos, localidad')
        .eq('owner_user_id', userId)
        .eq('inventory_status', 'activo')
        .order('created_at', { ascending: false });
      setMyInventory(data || []);
      setLoading(false);
    };
    fetchInv();
  }, [userId]);

  const getSlug = (v: any) =>
    `${v.marca}-${v.modelo}-${v.anio}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + `-${v.id}`;

  const toggleSelection = (auto: any) => {
    setSelectedAutos(prev => 
      prev.find(a => a.id === auto.id) 
        ? prev.filter(a => a.id !== auto.id) 
        : [...prev, auto]
    );
  };

  const handleSend = async () => {
    if (selectedAutos.length === 0) return;
    setSending(true);
    try {
      const vehiclesList = selectedAutos.map(a => 
        `- ${a.marca} ${a.modelo || ''} (${a.anio}): ${window.location.origin}/vehiculos/${getSlug(a)}`
      ).join('\n');

      const msg = `Hola, tengo opciones para tu búsqueda de ${ticket.marca}${ticket.modelo ? ' ' + ticket.modelo : ''}:\n\n${vehiclesList}\n\n¿Te interesa alguno?`;

      const { error } = await supabase.from('messages').insert({
        sender_user_id: userId,
        receiver_user_id: ticket.user_id,
        sender_name: userName,
        content: msg,
        related_auto_id: selectedAutos[0].id, // Referenciamos el primero como principal
        type: 'ticket_busqueda',
      });
      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: ticket.user_id,
        type: 'respuesta_ticket',
        category: 'inventory',
        title: 'Tenemos opciones para tu búsqueda',
        body: `Un vendedor te envió ${selectedAutos.length} vehículos para tu búsqueda de ${ticket.marca}.`,
        related_entity_type: 'tickets_busqueda',
        related_entity_id: ticket.id,
        action_url: '/mensajes',
        is_read: false,
      });

      setSent(true);
      setTimeout(onClose, 1200);
    } catch (e: any) {
      alert('Error: ' + e.message);
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget && !sending) onClose(); }}>
      <div className="bg-[#1a2a34] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-white block">Enviar propuestas</span>
            <span className="text-[9px] text-slate-400 uppercase">
              Seleccioná uno o más vehículos de tu inventario para enviar
            </span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#288b55]" size={24} /></div>
          ) : myInventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 opacity-40 gap-2">
              <Car size={28} className="text-slate-500" />
              <span className="text-[10px] font-black uppercase text-slate-500">Sin vehículos activos</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {myInventory.map(v => {
                const isSelected = selectedAutos.find(a => a.id === v.id);
                return (
                  <button key={v.id} onClick={() => toggleSelection(v)}
                    className={`text-left rounded-lg overflow-hidden border transition-all active:scale-95 ${
                      isSelected ? 'border-[#288b55] ring-1 ring-[#288b55] bg-[#288b55]/10' : 'border-white/10 hover:border-white/20'
                    }`}>
                    <div className="relative w-full aspect-[16/9] bg-slate-800">
                      {v.fotos?.[0]
                        ? <img src={v.fotos[0]} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Car size={20} className="text-slate-600" /></div>
                      }
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#288b55] rounded-full flex items-center justify-center">
                          <Check size={11} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-[10px] font-black text-white uppercase truncate">{v.marca} {v.modelo}</p>
                      <p className="text-[9px] text-slate-400 font-bold">{v.anio} · {v.moneda === 'USD' ? 'U$S' : '$'} {Number(v.pv).toLocaleString('de-DE')}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 pb-4 pt-3 border-t border-white/5 flex-shrink-0 space-y-2">
          <p className="text-[9px] text-center font-bold uppercase tracking-tight">
            {selectedAutos.length > 0 
              ? <span className="text-[#288b55]">Seleccionados: {selectedAutos.length} vehículos</span>
              : <span className="text-amber-500/70">Debes seleccionar al menos un auto</span>
            }
          </p>
          <button onClick={handleSend} disabled={sending || selectedAutos.length === 0 || sent}
            className={`w-full py-3 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              sent ? 'bg-[#22c55e] text-white' : 'bg-[#288b55] text-white hover:bg-[#1e6e42] disabled:opacity-40 disabled:cursor-not-allowed'
            }`}>
            {sending ? <Loader2 size={13} className="animate-spin" /> : sent ? <><Check size={13} /> Enviados con éxito</> : <><Send size={13} /> Enviar propuestas ({selectedAutos.length})</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    activo:    'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20',
    resuelto:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
    cancelado: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  return <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${map[status] || map.activo}`}>{status}</span>;
}

// ── Ticket row ────────────────────────────────────────────────────────────────
function TicketRow({
  ticket, onCancel, isMine, userId, userName,
}: {
  ticket: any; onCancel?: (id: string) => void; isMine?: boolean; userId?: string; userName?: string;
}) {
  const condiciones = [
    ticket.acepta_inhibido && 'Inhibido',
    ticket.acepta_prendado && 'Prendado',
    ticket.acepta_chocado && 'Chocado',
  ].filter(Boolean);

  const [showAutoModal, setShowAutoModal] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <>
      {showAutoModal && userId && userName && (
        <TengoEsteAutoModal
          ticket={ticket}
          userId={userId}
          userName={userName}
          onClose={() => { setShowAutoModal(false); setSent(true); }}
        />
      )}

      <div className="bg-white/5 border border-white/10 rounded-md px-4 py-3 flex items-center gap-3 w-full">
        <Bell size={14} className="text-[#288b55] flex-shrink-0" />
        <div className="flex flex-1 items-center gap-3 min-w-0 flex-wrap">
          <span className="text-[12px] font-black text-white uppercase">{ticket.marca}</span>
          {ticket.modelo && <span className="text-[11px] font-bold text-slate-400 uppercase">{ticket.modelo}</span>}
          {ticket.version && <span className="text-[10px] text-[#3483fa] font-bold uppercase truncate max-w-[120px]">{ticket.version}</span>}
          {ticket.anio && <span className="text-[10px] text-slate-400 font-bold">{ticket.anio}</span>}
          <StatusBadge status={ticket.status} />
          {ticket.presupuesto && (
            <span className="text-[11px] font-bold text-slate-300">
              {ticket.moneda === 'USD' ? 'U$S' : '$'} {Number(ticket.presupuesto).toLocaleString('de-DE')}
            </span>
          )}
          {ticket.notas && (
            <span className="text-[10px] text-slate-400 italic truncate max-w-[200px]">💬 {ticket.notas}</span>
          )}
          {condiciones.map(c => (
            <span key={c} className="text-[8px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded">{c}</span>
          ))}
          {ticket.contacto_nombre && (
            <span className="text-[9px] font-black text-[#288b55] uppercase tracking-wide whitespace-nowrap">
              👤 {ticket.contacto_nombre}
            </span>
          )}
          <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap ml-auto">
            {new Date(ticket.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
          </span>
        </div>
        {!isMine && userId && (
          sent ? (
            <span className="flex items-center gap-1 text-[#22c55e] text-[9px] font-black uppercase flex-shrink-0 whitespace-nowrap">
              <Check size={11} /> Enviado
            </span>
          ) : (
            <button onClick={() => setShowAutoModal(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#288b55] hover:bg-[#1e6e42] text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap">
              <Send size={10} /> Tengo este auto
            </button>
          )
        )}
        {isMine && ticket.status === 'activo' && onCancel && (
          <button onClick={() => onCancel(ticket.id)}
            className="flex-shrink-0 p-1 rounded text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all">
            <X size={14} />
          </button>
        )}
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VehiculosBuscadosPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [tab, setTab] = useState<'red' | 'mis'>('red');
  const [redTickets, setRedTickets] = useState<any[]>([]);
  const [misTickets, setMisTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchTickets = useCallback(async (uid: string) => {
    setIsLoading(true);
    try {
      const [redRes, misRes] = await Promise.all([
        supabase.from('tickets_busqueda').select('*').eq('status', 'activo').order('created_at', { ascending: false }),
        supabase.from('tickets_busqueda').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      ]);
      setRedTickets(redRes.data || []);
      setMisTickets(misRes.data || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      const { data: profile } = await supabase.from('usuarios').select('nombre').eq('auth_id', user.id).maybeSingle();
      setUserName(profile?.nombre || '');
      fetchTickets(user.id);
    };
    init();
  }, [fetchTickets, router]);

  const handleCancel = async (id: string) => {
    await supabase.from('tickets_busqueda').update({ status: 'cancelado' }).eq('id', id);
    if (userId) fetchTickets(userId);
  };

  const redFiltered = redTickets.filter(t => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return t.marca?.toLowerCase().includes(s) || t.modelo?.toLowerCase().includes(s) || t.version?.toLowerCase().includes(s);
  });

  const misCount = misTickets.filter(t => t.status === 'activo').length;
  const redCount = redTickets.length;

  if (isLoading) return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0b1114]">
      <Loader2 className="animate-spin text-[#288b55] w-8 h-8" />
    </div>
  );

  return (
    <div className="bg-[#0b1114] min-h-screen w-full text-slate-300 font-sans text-left">
      <style>{`@font-face { font-family: 'Genos'; src: url('/fonts/genos/Genos-VariableFont_wght.ttf') format('truetype'); }`}</style>
      {showModal && userId && (
        <NuevoTicketModal userId={userId} userName={userName} onCreated={() => fetchTickets(userId)} onClose={() => setShowModal(false)} />
      )}
      <div className="fixed top-[90px] lg:top-[80px] left-0 right-0 z-[40] bg-[#1c2e38] backdrop-blur-md border-b border-white/5 flex flex-col items-center justify-center px-3 py-5 lg:h-[87px] lg:pt-[15px]">
        <div className="max-w-[1600px] mx-auto w-full flex flex-col items-center gap-2">
          <div className="grid grid-cols-2 lg:flex items-center gap-1 p-1 bg-black/20 rounded-xl border border-white/5 w-full lg:w-fit">
            <button onClick={() => setTab('red')}
              className={`px-3 py-1.5 rounded-lg text-[10px] lg:text-[11px] font-bold transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap ${tab === 'red' ? 'bg-[#134e4d] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              Búsquedas de la red
              <span className={`text-[9px] font-mono font-black ${tab === 'red' ? 'opacity-70' : 'text-[#00984a]'}`}>{redCount}</span>
            </button>
            <button onClick={() => setTab('mis')}
              className={`px-3 py-1.5 rounded-lg text-[10px] lg:text-[11px] font-bold transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap ${tab === 'mis' ? 'bg-[#134e4d] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              Mis búsquedas
              {misCount > 0 && <span className={`text-[9px] font-mono font-black ${tab === 'mis' ? 'opacity-70' : 'text-[#00984a]'}`}>{misCount}</span>}
            </button>
          </div>
          <span style={{ fontFamily: 'Genos', fontWeight: 300, letterSpacing: '4px', fontSize: '14px' }} className="text-white uppercase opacity-40">
            Vehículos Buscados
          </span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 pt-[200px] lg:pt-[183px] pb-20 space-y-4">
        <div className="flex flex-col items-center w-full gap-4">
          <div className="flex items-center gap-3 w-full max-w-2xl">
            <button onClick={() => setShowModal(true)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#288b55] hover:bg-[#1e6e42] text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-[#288b55]/10">
              <Plus size={14} /> Nueva búsqueda
            </button>
            
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Buscar por marca, modelo o versión..." value={search} onChange={e => setSearch(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-md pl-10 pr-4 py-2.5 text-sm w-full outline-none focus:border-[#288b55]/50 transition-all text-white" />
            </div>
          </div>

          {tab === 'red' && (
            redFiltered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-30 gap-3">
                <Bell size={40} className="text-slate-500" />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Sin búsquedas activas en la red</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                {redFiltered.map(ticket => (
                  <TicketRow key={ticket.id} ticket={ticket} isMine={ticket.user_id === userId} onCancel={handleCancel} userId={userId || undefined} userName={userName} />
                ))}
              </div>
            )
          )}

          {tab === 'mis' && (
            misTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 opacity-30 gap-3">
                <Bell size={36} className="text-slate-500" />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">No creaste ninguna búsqueda todavía</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                {misTickets.map(ticket => (
                  <TicketRow key={ticket.id} ticket={ticket} isMine onCancel={handleCancel} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}