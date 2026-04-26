'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  MessageCircle, 
  ExternalLink, 
  Calendar, 
  DollarSign, 
  X, 
  UserCheck, 
  HandshakeIcon, 
  Loader2,
  Trash2,
  CheckSquare,
  Square,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  Check
} from 'lucide-react';

interface ClienteUnificado {
  id: string;
  nombre: string;
  contacto: string;
  rol: 'Comprador' | 'Consignatario' | 'Interesado';
  unidadAsociada: string;
  estadoGestion: string;
  ultimaAccion: string;
  notas: string;
  fecha_hitos: any[];
  contraparte?: string | null;
  proxima_llamada?: string | null;
  vendedor?: string | null;
}

// ── Modal Nuevo Cliente ──────────────────────────────────────────────────────
function NuevoClienteModal({ onCreated, onClose }: { onCreated: () => void; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    contacto: '',
    rol: 'Comprador' as 'Comprador' | 'Consignatario' | 'Interesado',
    notas: '',
    dominio: '',
    vendedor: ''
  });

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.contacto.trim()) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let tabla = '';
      if (form.rol === 'Comprador') tabla = 'cliente_comprador';
      else if (form.rol === 'Consignatario') tabla = 'cliente_consignatario';
      else tabla = 'cliente_interesado';
      
      const payload: any = { 
        user_id: user.id, 
        nombre: form.nombre, 
        notas: form.notas,
        dominio: form.dominio.toUpperCase(),
        vendedor: form.vendedor.trim() || null
      };

      if (form.rol === 'Comprador') {
        payload.contacto = form.contacto;
      } else {
        payload.telefono = form.contacto;
      }

      const { error } = await supabase.from(tabla).insert(payload);
      if (error) throw error;
      
      onCreated();
      onClose();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-[11px] font-bold uppercase outline-none focus:border-[#288b55] transition-colors text-white placeholder:text-white/40";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#1a2a34] border border-white/10 rounded-lg w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Plus size={15} className="text-[#288b55]" />
            <span className="text-[11px] font-black uppercase tracking-widest text-white">Nuevo Cliente</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/5 overflow-x-auto">
            {['Comprador', 'Consignatario', 'Interesado'].map(r => (
              <button key={r} onClick={() => setForm(p => ({ ...p, rol: r as any }))}
                className={`flex-1 py-2 px-2 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap ${form.rol === r ? 'bg-[#288b55] text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                {r}
              </button>
            ))}
          </div>
          <input className={inputCls} placeholder="Nombre completo *" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
          
          <div className="grid grid-cols-2 gap-3">
            <input className={inputCls} placeholder="Teléfono / Contacto *" value={form.contacto} onChange={e => setForm(p => ({ ...p, contacto: e.target.value }))} />
            <input className={inputCls} placeholder="Dominio (Patente)" value={form.dominio} onChange={e => setForm(p => ({ ...p, dominio: e.target.value.toUpperCase() }))} />
          </div>

          <input className={inputCls} placeholder="Vendedor a cargo (Ej. Ezequiel) - Opcional" value={form.vendedor} onChange={e => setForm(p => ({ ...p, vendedor: e.target.value }))} />
          
          <textarea className={inputCls + " resize-none"} placeholder="Notas adicionales..." rows={3} value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} />
          <button onClick={handleSubmit} disabled={loading || !form.nombre.trim()}
            className="w-full py-3 bg-[#288b55] hover:bg-[#1e6e42] text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40">
            {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Guardar Cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}

const ClientesPage = () => {
  const [selectedCliente, setSelectedCliente] = useState<ClienteUnificado | null>(null);
  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [clientes, setClientes] = useState<ClienteUnificado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLegajo, setShowLegajo] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Ahora el estado guarda los objetos completos para poder listar los nombres
  const [pendientesLlamada, setPendientesLlamada] = useState<ClienteUnificado[]>([]);

  const fetchClientesReal = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [resConsignatarios, resCompradores, resInteresados, resVentas, resInventario] = await Promise.all([
        supabase.from('cliente_consignatario').select('*').eq('user_id', user.id),
        supabase.from('cliente_comprador').select('*').eq('user_id', user.id),
        supabase.from('cliente_interesado').select('*').eq('user_id', user.id),
        supabase.from('ventas').select('*').eq('owner_user_id', user.id),
        supabase.from('inventario').select('id, marca, modelo, version, anio, dominio')
      ]);

      const inventarioMap = new Map();
      const inventarioPorDominio = new Map();
      
      if (resInventario.data) {
        resInventario.data.forEach(i => {
          const identificacion = `${i.marca || ''} ${i.modelo || ''} ${i.version || ''} ${i.anio || ''} ${i.dominio ? `(${i.dominio})` : '(Sin Patente)'}`.replace(/\s+/g, ' ').trim();
          inventarioMap.set(i.id, identificacion);
          if (i.dominio) inventarioPorDominio.set(i.dominio.toUpperCase(), identificacion);
        });
      }

      const consigPorDominio = new Map();
      const consigPorAutoId = new Map();
      (resConsignatarios.data || []).forEach(c => {
        if (c.dominio) consigPorDominio.set(c.dominio.toUpperCase(), c.nombre);
        if (c.auto_id) consigPorAutoId.set(c.auto_id, c.nombre);
      });

      const compPorDominio = new Map();
      const compPorAutoId = new Map();
      (resCompradores.data || []).forEach(c => {
        if (c.dominio) compPorDominio.set(c.dominio.toUpperCase(), c.nombre);
        if (c.auto_id) compPorAutoId.set(c.auto_id, c.nombre);
      });

      const listaConsignatarios = (resConsignatarios.data || []).map((c: any) => ({
        id: c.id,
        nombre: c.nombre || 'Sin nombre',
        contacto: c.telefono || 'Sin contacto',
        rol: 'Consignatario' as const,
        unidadAsociada: inventarioMap.get(c.auto_id) || (c.dominio ? inventarioPorDominio.get(c.dominio.toUpperCase()) || `Unidad Dominio: ${c.dominio}` : 'Unidad Consignada'),
        estadoGestion: 'En Venta',
        ultimaAccion: `Consignó: ${c.moneda || 'ARS'} ${Number(c.precio_minimo || 0).toLocaleString()}`,
        notas: c.notas || `DNI: ${c.dni || 'N/A'}`,
        fecha_hitos: [{
          fecha: c.created_at,
          evento: 'Consignación Recibida',
          detalle: `Precio mínimo: ${c.moneda} ${c.precio_minimo}`,
          tipo: 'status'
        }],
        contraparte: (c.auto_id && compPorAutoId.get(c.auto_id)) || (c.dominio ? compPorDominio.get(c.dominio.toUpperCase()) : null),
        vendedor: c.vendedor || null
      }));

      const listaCompradores = (resCompradores.data || []).map((c: any) => {
        const ventaRelacionada = resVentas.data?.find(v => v.cliente_nombre === c.nombre);
        const hitos: any[] = [];
        if (c.created_at) hitos.push({ fecha: c.created_at, evento: 'Registro Lead', detalle: `Forma de pago: ${c.forma_pago || 'N/A'}`, tipo: 'user' });
        if (c.senia_reserva) hitos.push({ fecha: c.created_at, evento: 'Seña Recibida', detalle: `${c.moneda_senia} ${c.senia_reserva}`, tipo: 'money' });

        return {
          id: c.id,
          nombre: c.nombre || 'Sin nombre',
          contacto: c.contacto || 'Sin contacto',
          rol: 'Comprador' as const,
          unidadAsociada: ventaRelacionada 
            ? `${ventaRelacionada.marca || ''} ${ventaRelacionada.modelo || ''} ${ventaRelacionada.version || ''} ${ventaRelacionada.anio || ''} ${ventaRelacionada.dominio ? `(${ventaRelacionada.dominio})` : '(Sin Patente)'}`.replace(/\s+/g, ' ').trim() 
            : (inventarioMap.get(c.auto_id) || (c.dominio ? inventarioPorDominio.get(c.dominio.toUpperCase()) || `Interés en: ${c.dominio}` : 'Buscando unidad')),
          estadoGestion: c.reserva_caida ? 'Reserva Caída' : (c.venta_concretada ? 'Vendido' : (c.senia_reserva ? 'Señado' : 'Lead')),
          ultimaAccion: c.fecha_venta ? `Vendido el ${c.fecha_venta}` : 'En seguimiento',
          notas: c.notas || '',
          fecha_hitos: hitos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
          contraparte: (c.auto_id && consigPorAutoId.get(c.auto_id)) || (c.dominio ? consigPorDominio.get(c.dominio.toUpperCase()) : null),
          vendedor: c.vendedor || null
        };
      });

      const ahora = new Date();
      const listadoPendientesTemp: ClienteUnificado[] = [];

      const listaInteresados = (resInteresados.data || []).map((c: any) => {
        const fechaLlamada = c.fecha_proxima_llamada ? new Date(c.fecha_proxima_llamada) : null;
        
        const interesadoFormateado: ClienteUnificado = {
          id: c.id,
          nombre: c.nombre || 'Sin nombre',
          contacto: c.telefono || 'Sin contacto',
          rol: 'Interesado' as const,
          unidadAsociada: inventarioMap.get(c.auto_id) || (c.dominio ? inventarioPorDominio.get(c.dominio.toUpperCase()) || `Consultó: ${c.dominio}` : 'Interés general'),
          estadoGestion: fechaLlamada && fechaLlamada <= ahora ? 'Llamada Pendiente' : 'Lead Caliente',
          ultimaAccion: c.fecha_proxima_llamada ? `Llamar el ${new Date(c.fecha_proxima_llamada).toLocaleDateString()}` : 'Pendiente de contacto',
          notas: c.notas || '',
          fecha_hitos: [{ fecha: c.created_at, evento: 'Nueva Consulta', detalle: 'Ingresó como interesado', tipo: 'user' }],
          proxima_llamada: c.fecha_proxima_llamada,
          contraparte: null,
          vendedor: c.vendedor || null
        };

        if (fechaLlamada && fechaLlamada <= ahora) {
          listadoPendientesTemp.push(interesadoFormateado);
        }

        return interesadoFormateado;
      });

      setPendientesLlamada(listadoPendientesTemp);
      setClientes([...listaConsignatarios, ...listaCompradores, ...listaInteresados]);
    } catch (err) {
      console.error("Error HotCars:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClientesReal(); }, []);

  const marcarReservaCaida = async (id: string) => {
    if (!window.confirm('¿Confirmás que esta reserva se cayó?')) return;
    try {
      const { error } = await supabase.from('cliente_comprador').update({ reserva_caida: true }).eq('id', id);
      if (error) throw error;
      setClientes(prev => prev.map(c => c.id === id ? { ...c, estadoGestion: 'Reserva Caída' } : c));
      if (selectedCliente?.id === id) {
        setSelectedCliente(prev => prev ? { ...prev, estadoGestion: 'Reserva Caída' } : null);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleSelectCliente = (c: ClienteUnificado) => {
    setSelectedCliente(c);
    setShowLegajo(true);
  };

  const deleteSelected = async () => {
    if (!window.confirm(`¿Estás seguro de eliminar ${selectedIds.size} cliente(s)?`)) return;
    setIsDeleting(true);
    try {
      const idsArray = Array.from(selectedIds);
      await Promise.all([
        supabase.from('cliente_comprador').delete().in('id', idsArray),
        supabase.from('cliente_consignatario').delete().in('id', idsArray),
        supabase.from('cliente_interesado').delete().in('id', idsArray)
      ]);
      setClientes(prev => prev.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
      setSelectedCliente(null);
      setShowLegajo(false);
      fetchClientesReal(); 
    } catch (err) {
      console.error("Error al borrar:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const clientesFiltrados = clientes.filter(c => {
    const matchesTab = filter === 'Todos' || c.rol === filter;
    const matchesSearch = c.nombre.toLowerCase().includes(search.toLowerCase()) || 
                          c.contacto.toLowerCase().includes(search.toLowerCase()) ||
                          c.unidadAsociada.toLowerCase().includes(search.toLowerCase()) ||
                          (c.vendedor && c.vendedor.toLowerCase().includes(search.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const totalPages = Math.ceil(clientesFiltrados.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = clientesFiltrados.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0b1012]">
      <Loader2 className="animate-spin text-emerald-500" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b1012] text-slate-200 pt-44 px-4 md:px-8 pb-8 font-sans text-left">
      <style>{`@font-face { font-family: 'Genos'; src: url('/fonts/genos/Genos-VariableFont_wght.ttf') format('truetype'); }`}</style>
      
      {showAddModal && <NuevoClienteModal onCreated={fetchClientesReal} onClose={() => setShowAddModal(false)} />}

      <div className="fixed top-[90px] lg:top-[80px] left-0 right-0 z-[40] bg-[#1c2e38] backdrop-blur-md border-b border-white/5 flex flex-col items-center justify-center px-3 py-5 lg:h-20">
        <div className="max-w-[1600px] mx-auto w-full flex flex-col items-center justify-center gap-2">
          <div className="grid grid-cols-4 lg:flex items-center gap-1 p-1 bg-black/20 rounded-lg border border-white/5 w-full lg:w-fit">
            {['Todos', 'Consignatario', 'Comprador', 'Interesado'].map((l) => (
              <button key={l} onClick={() => { setFilter(l); setCurrentPage(1); }}
                className={`relative px-3 py-1.5 rounded-lg text-[9px] lg:text-[11px] font-bold transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap ${filter === l ? 'bg-[#134e4d] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                {l === 'Todos' ? l : l === 'Consignatario' ? 'Consignatarios' : l === 'Comprador' ? 'Compradores' : 'Interesados'}
                
                {l === 'Interesado' && pendientesLlamada.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-purple-600 text-white text-[9px] font-black flex items-center justify-center rounded-full border border-[#1c2e38] shadow-lg animate-pulse">
                    {pendientesLlamada.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <span style={{ fontFamily: 'Genos', fontWeight: 400, letterSpacing: '4px', fontSize: '14px' }} className="text-white uppercase opacity-40 leading-none">Clientes</span>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto">
        {pendientesLlamada.length > 0 && filter !== 'Comprador' && filter !== 'Consignatario' && (
          <div className="w-full mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-[#1c282d] border-l-4 border-purple-500 p-4 rounded-r-xl flex items-center justify-between shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-400 flex-shrink-0 mt-1">
                  <PhoneCall size={20} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-black uppercase tracking-widest text-white">Recordatorio de Gestión</p>
                  <div className="space-y-1">
                    {pendientesLlamada.map(p => (
                      <p key={p.id} className="text-sm text-slate-400">
                        Vendedor <span className="text-purple-400 font-bold">{p.vendedor || 'General'}</span> debe llamar a <span className="text-white font-bold">{p.nombre}</span>.
                      </p>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => { setFilter('Interesado'); setCurrentPage(1); }} className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all h-fit self-center">
                Ver Interesados
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col items-start w-full mb-4">
          <div className="flex items-center gap-3 w-full max-w-2xl">
            <button onClick={() => setShowAddModal(true)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#288b55] hover:bg-[#1e6e42] text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-[#288b55]/10">
              <Plus size={14} /> Agregar Nuevo
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Buscar por nombre, contacto, dominio o vendedor..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                className="bg-white/5 border border-white/10 rounded-md pl-10 pr-4 py-2.5 text-sm w-full outline-none focus:border-[#288b55]/50 transition-all text-white" />
            </div>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex justify-end mb-4">
            <button onClick={deleteSelected} disabled={isDeleting}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/50 text-red-500 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all animate-in fade-in zoom-in">
              {isDeleting ? <Loader2 className="animate-spin" size={14}/> : <Trash2 size={14}/>}
              Eliminar ({selectedIds.size})
            </button>
          </div>
        )}

        <div className="flex gap-8 items-start">
          <div className="flex-1 overflow-x-auto">
            <div className="bg-[#161f23] border border-slate-800/60 rounded-xl shadow-2xl overflow-hidden min-w-[340px]">
              <table className="w-full text-left border-collapse font-sans">
                <thead className="bg-[#1c282d]/50 text-slate-500 text-[11px] uppercase tracking-[0.15em] font-black border-b border-slate-800">
                  <tr>
                    <th className="px-4 md:px-6 py-5 w-10"></th>
                    <th className="px-3 md:px-4 py-5">Cliente</th>
                    <th className="px-4 md:px-6 py-5 text-center hidden sm:table-cell">Rol</th>
                    <th className="px-4 md:px-6 py-5 hidden md:table-cell">Unidad / Vendedor</th>
                    <th className="px-4 md:px-6 py-5 text-center hidden lg:table-cell">Estado</th>
                    <th className="px-4 md:px-6 py-5 hidden lg:table-cell">Última Acción</th>
                    <th className="px-4 md:px-6 py-5 text-center">WA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {currentItems.map((c) => {
                    const phone = c.contacto.replace(/\D/g, '');
                    const waLink = phone ? `https://wa.me/${phone}` : undefined;

                    return (
                      <tr key={c.id} onClick={() => handleSelectCliente(c)}
                        className={`hover:bg-slate-800/20 cursor-pointer transition-all group ${selectedCliente?.id === c.id ? 'bg-emerald-500/[0.03]' : ''} ${selectedIds.has(c.id) ? 'bg-red-500/[0.02]' : ''}`}>
                        <td className="px-4 md:px-6 py-4">
                          <div onClick={(e) => toggleSelect(c.id, e)} className="text-slate-600 hover:text-emerald-500 transition-colors">
                            {selectedIds.has(c.id) ? <CheckSquare size={18} className="text-emerald-500" /> : <Square size={18} />}
                          </div>
                        </td>
                        <td className="px-3 md:px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#1c282d] border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 flex-shrink-0">
                              <User size={18} />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-100 text-sm block truncate max-w-[120px] md:max-w-none">{c.nombre}</span>
                              <span className={`sm:hidden text-[9px] px-2 py-0.5 rounded font-black uppercase border inline-block mt-1 ${c.rol === 'Comprador' ? 'text-sky-400 bg-sky-500/10 border-sky-500/20' : c.rol === 'Interesado' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>{c.rol}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-center hidden sm:table-cell">
                          <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase border inline-block ${c.rol === 'Comprador' ? 'text-sky-400 bg-sky-500/10 border-sky-500/20' : c.rol === 'Interesado' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>{c.rol}</span>
                        </td>
                        <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                          <p className="text-sky-400 font-bold text-sm truncate max-w-[200px]">{c.unidadAsociada}</p>
                          {c.vendedor && <p className="text-[10px] text-slate-500 mt-1 uppercase font-black tracking-widest flex items-center gap-1"><User size={10}/> Vend: {c.vendedor}</p>}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-center hidden lg:table-cell">
                          <span className={`text-[11px] font-bold px-2 py-1 rounded inline-block ${c.estadoGestion === 'Reserva Caída' ? 'text-red-400 bg-red-500/10 border border-red-500/20' : c.estadoGestion === 'Llamada Pendiente' ? 'text-purple-400 border border-purple-500/50 bg-purple-500/10 animate-pulse' : c.rol === 'Interesado' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-slate-400 bg-slate-800/50'}`}>{c.estadoGestion}</span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-[11px] text-slate-400 font-medium max-w-[180px] hidden lg:table-cell">{c.ultimaAccion}</td>
                        <td className="px-4 md:px-6 py-4 text-center">
                          <a 
                            href={waLink}
                            target={waLink ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!waLink) {
                                e.preventDefault();
                                alert("No hay un número de teléfono válido cargado para este cliente.");
                              }
                            }} 
                            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#1c282d] border border-slate-700 text-emerald-500 flex items-center justify-center mx-auto hover:bg-emerald-500/20 transition-all cursor-pointer"
                          >
                            <MessageCircle size={16} />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 bg-[#1c282d]/30 border-t border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Página {currentPage} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-slate-700 text-slate-400 disabled:opacity-20 hover:bg-white/5 transition-all">
                      <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-slate-700 text-slate-400 disabled:opacity-20 hover:bg-white/5 transition-all">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {clientesFiltrados.length === 0 && !loading && (
                <div className="p-16 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">Sin clientes que coincidan</div>
              )}
            </div>
          </div>

          {selectedCliente && (
            <div className="hidden md:block w-[380px] bg-[#161f23] border border-slate-800 rounded-xl p-5 sticky top-8 shadow-2xl animate-in slide-in-from-right-4 duration-500 text-left font-sans flex-shrink-0">
              <LegajoContent 
                cliente={selectedCliente} 
                onClose={() => { setSelectedCliente(null); setShowLegajo(false); }} 
                onMarcarCaida={marcarReservaCaida}
                onLlamadaAgendada={fetchClientesReal} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function LegajoContent({ cliente, onClose, onMarcarCaida, onLlamadaAgendada }: { cliente: ClienteUnificado; onClose: () => void; onMarcarCaida?: (id: string) => void; onLlamadaAgendada?: () => void; }) {
  const [fechaLlamada, setFechaLlamada] = useState(cliente.proxima_llamada || '');
  const [savingLlamada, setSavingLlamada] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    setFechaLlamada(cliente.proxima_llamada || '');
    setSuccessMsg(false);
  }, [cliente.id, cliente.proxima_llamada]);

  const guardarProgramacion = async () => {
    if (!fechaLlamada) return;
    setSavingLlamada(true);
    try {
      const { error } = await supabase
        .from('cliente_interesado')
        .update({ fecha_proxima_llamada: fechaLlamada })
        .eq('id', cliente.id);
      if (error) throw error;
      
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000); 
      if(onLlamadaAgendada) onLlamadaAgendada(); 
    } catch (err: any) {
      alert("Error: " + err.message); 
    } finally {
      setSavingLlamada(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
          <span className={`w-1.5 h-6 rounded-full ${cliente.rol === 'Interesado' ? 'bg-purple-500' : 'bg-emerald-500'}`}></span>Legajo
        </h2>
        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
      </div>
      <div className="flex items-center gap-4 mb-6 p-4 bg-[#1c282d] border border-slate-800 rounded-xl">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cliente.rol === 'Interesado' ? 'bg-purple-500/10 border border-purple-500/20 text-purple-500' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'}`}>
          <User size={24} />
        </div>
        <div className="min-w-0">
          <h3 className="font-black text-white text-lg leading-tight truncate">{cliente.nombre}</h3>
          <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest truncate">{cliente.contacto}</p>
        </div>
      </div>

      <div className="space-y-5 relative">
        {cliente.rol === 'Interesado' && (
          <div className="mb-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-purple-400">
              <PhoneCall size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Agendar Llamada</span>
            </div>
            <input 
              type="datetime-local" 
              value={fechaLlamada}
              onChange={(e) => {
                setFechaLlamada(e.target.value);
                setSuccessMsg(false);
              }}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[11px] font-bold text-white outline-none focus:border-purple-500"
            />
            <button 
              onClick={guardarProgramacion}
              disabled={savingLlamada || !fechaLlamada || successMsg}
              className={`w-full py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2
                ${successMsg 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40'
                }`}
            >
              {savingLlamada ? <Loader2 size={14} className="animate-spin" /> : successMsg ? <><Check size={14} /> Agendado</> : "Confirmar Seguimiento"}
            </button>
          </div>
        )}

        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Timeline</h4>
        <div className="absolute left-[19px] top-[40px] bottom-0 w-[2px] bg-slate-800"></div>
        {cliente.fecha_hitos.map((h: any, i: number) => (
          <div key={i} className="relative pl-12">
            <div className={`absolute left-0 top-0 w-10 h-10 rounded-xl bg-[#161f23] border-2 flex items-center justify-center z-10 ${h.tipo === 'money' ? 'border-emerald-500 text-emerald-500' : 'border-slate-800 text-slate-500'}`}>
               {h.tipo === 'money' ? <DollarSign size={18} /> : <Calendar size={18} />}
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase">
                {new Date(h.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'numeric' })}
              </span>
              <p className="text-sm font-black text-slate-200 mt-1">{h.evento}</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{h.detalle}</p>
            </div>
          </div>
        ))}
        
        {cliente.rol === 'Comprador' && cliente.estadoGestion === 'Señado' && onMarcarCaida && (
          <div className="mt-5 pt-5 border-t border-slate-800">
            <button onClick={() => onMarcarCaida(cliente.id)} className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              Marcar Reserva Caída
            </button>
          </div>
        )}

        <div className="mt-6 p-4 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl">
          <div className="flex items-center gap-2 mb-1.5 text-emerald-500">
            <HandshakeIcon size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Unidad Asociada</span>
          </div>
          <p className="text-sm text-slate-200 font-bold">{cliente.unidadAsociada}</p>

          {cliente.vendedor && (
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-1.5 text-emerald-500">
                <UserCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Vendedor Asignado</span>
              </div>
              <p className="text-sm text-slate-200 font-bold">{cliente.vendedor}</p>
            </div>
          )}
          
          {cliente.contraparte && (
            <>
              <div className="flex items-center gap-2 mt-3 mb-1.5 text-emerald-500">
                <UserCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {cliente.rol === 'Comprador' ? 'Dueño de la unidad' : 'Comprador / Interesado'}
                </span>
              </div>
              <p className="text-sm text-slate-200 font-bold">{cliente.contraparte}</p>
            </>
          )}

          <div className="flex items-center gap-2 mt-3 mb-1.5 text-emerald-500">
            <HandshakeIcon size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Notas</span>
          </div>
          <p className="text-xs text-slate-400 italic">"{cliente.notas || 'Sin observaciones'}"</p>
        </div>
      </div>
    </>
  );
}

export default ClientesPage;