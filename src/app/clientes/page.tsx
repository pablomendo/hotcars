"use client";

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
  Square
} from 'lucide-react';

interface ClienteUnificado {
  id: string;
  nombre: string;
  contacto: string;
  rol: 'Comprador' | 'Consignador';
  unidadAsociada: string;
  estadoGestion: string;
  ultimaAccion: string;
  notas: string;
  fecha_hitos: any[];
}

const ClientesPage = () => {
  const [selectedCliente, setSelectedCliente] = useState<ClienteUnificado | null>(null);
  const [filter, setFilter] = useState('Todos');
  const [clientes, setClientes] = useState<ClienteUnificado[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para selección y borrado
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchClientesReal = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [resConsignatarios, resCompradores, resVentas, resInventario] = await Promise.all([
        supabase.from('cliente_consignatario').select('*').eq('user_id', user.id),
        supabase.from('cliente_comprador').select('*').eq('user_id', user.id),
        supabase.from('ventas').select('*').eq('owner_user_id', user.id),
        supabase.from('inventario').select('id, marca, modelo')
      ]);

      const inventarioMap = new Map();
      if (resInventario.data) {
        resInventario.data.forEach(i => inventarioMap.set(i.id, `${i.marca} ${i.modelo}`));
      }

      const listaConsignadores = (resConsignatarios.data || []).map((c: any) => ({
        id: c.id,
        nombre: c.nombre || 'Sin nombre',
        contacto: c.telefono || 'Sin contacto',
        rol: 'Consignador' as const,
        unidadAsociada: inventarioMap.get(c.auto_id) || 'Unidad Consignada',
        estadoGestion: 'En Venta',
        ultimaAccion: `Consignó: ${c.moneda || 'ARS'} ${Number(c.precio_minimo || 0).toLocaleString()}`,
        notas: c.notas || `DNI: ${c.dni || 'N/A'}`,
        fecha_hitos: [{
          fecha: c.created_at,
          evento: 'Consignación Recibida',
          detalle: `Precio mínimo: ${c.moneda} ${c.precio_minimo}`,
          tipo: 'status'
        }]
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
          unidadAsociada: ventaRelacionada ? `${ventaRelacionada.marca} ${ventaRelacionada.modelo}` : (inventarioMap.get(c.auto_id) || 'Buscando unidad'),
          estadoGestion: c.venta_concretada ? 'Vendido' : (c.senia_reserva ? 'Señado' : 'Lead'),
          ultimaAccion: c.fecha_venta ? `Vendido el ${c.fecha_venta}` : 'En seguimiento',
          notas: c.notas || '',
          fecha_hitos: hitos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        };
      });

      setClientes([...listaConsignadores, ...listaCompradores]);
    } catch (err) {
      console.error("Error HotCars:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClientesReal(); }, []);

  // Lógica de Selección
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Para que no se abra el legajo al clickear el checkbox
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  // Lógica de Eliminación
  const deleteSelected = async () => {
    if (!window.confirm(`¿Estás seguro de eliminar ${selectedIds.size} cliente(s)?`)) return;
    
    setIsDeleting(true);
    try {
      const idsArray = Array.from(selectedIds);
      
      // Borramos de ambas tablas porque no sabemos cuál es cuál sin filtrar
      await Promise.all([
        supabase.from('cliente_comprador').delete().in('id', idsArray),
        supabase.from('cliente_consignatario').delete().in('id', idsArray)
      ]);

      setClientes(prev => prev.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
      setSelectedCliente(null);
    } catch (err) {
      console.error("Error al borrar:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="flex h-screen w-full items-center justify-center bg-[#0b1012]"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#0b1012] text-slate-200 pt-44 px-8 pb-8 font-sans text-left">
      <style>{`@font-face { font-family: 'Genos'; src: url('/fonts/genos/Genos-VariableFont_wght.ttf') format('truetype'); }`}</style>
      
      <div className="fixed top-[90px] lg:top-[80px] left-0 right-0 z-[40] bg-[#1c2e38] backdrop-blur-md border-b border-white/5 flex flex-col items-center justify-center px-3 py-5 lg:h-20">
          <div className="max-w-[1600px] mx-auto w-full flex flex-col items-center justify-center">
              <span style={{ fontFamily: 'Genos', fontWeight: 400, letterSpacing: '4px', fontSize: '14px' }} className="text-white uppercase opacity-40 leading-none">
                Clientes
              </span>
          </div>
      </div>

      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-2 bg-[#161f23]/50 p-1.5 rounded-2xl border border-slate-800/50">
            {['Todos', 'Consignador', 'Comprador'].map((l) => (
              <button key={l} onClick={() => setFilter(l)} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${filter === l ? 'bg-[#1c282d] text-emerald-400 border border-slate-700 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                {l === 'Todos' ? l : l + 'es'}
              </button>
            ))}
          </div>

          {selectedIds.size > 0 && (
            <button 
              onClick={deleteSelected}
              disabled={isDeleting}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/50 text-red-500 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all animate-in fade-in zoom-in"
            >
              {isDeleting ? <Loader2 className="animate-spin" size={14}/> : <Trash2 size={14}/>}
              Eliminar ({selectedIds.size})
            </button>
          )}
        </div>

        <div className="flex gap-8 items-start">
          <div className="flex-1 overflow-x-auto">
            <div className="bg-[#161f23] border border-slate-800/60 rounded-2xl shadow-2xl overflow-hidden">
              <table className="w-full text-left border-collapse font-sans">
                <thead className="bg-[#1c282d]/50 text-slate-500 text-[11px] uppercase tracking-[0.15em] font-black border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-5 w-10"></th>
                    <th className="px-4 py-5">Cliente</th>
                    <th className="px-6 py-5 text-center">Rol</th>
                    <th className="px-6 py-5">Unidad Asociada</th>
                    <th className="px-6 py-5 text-center">Estado</th>
                    <th className="px-6 py-5">Última Acción</th>
                    <th className="px-6 py-5 text-center">WhatsApp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {clientes.filter(c => filter === 'Todos' || c.rol === filter).map((c) => (
                    <tr 
                      key={c.id} 
                      onClick={() => setSelectedCliente(c)} 
                      className={`hover:bg-slate-800/20 cursor-pointer transition-all group ${selectedCliente?.id === c.id ? 'bg-emerald-500/[0.03]' : ''} ${selectedIds.has(c.id) ? 'bg-red-500/[0.02]' : ''}`}
                    >
                      <td className="px-6 py-5">
                        <div onClick={(e) => toggleSelect(c.id, e)} className="text-slate-600 hover:text-emerald-500 transition-colors">
                          {selectedIds.has(c.id) ? <CheckSquare size={18} className="text-emerald-500" /> : <Square size={18} />}
                        </div>
                      </td>
                      <td className="px-4 py-5 flex items-center gap-4 text-left">
                        <div className="w-10 h-10 rounded-full bg-[#1c282d] border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-emerald-400">
                          <User size={20} />
                        </div>
                        <span className="font-bold text-slate-100 text-sm">{c.nombre}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase border inline-block ${c.rol === 'Comprador' ? 'text-sky-400 bg-sky-500/10 border-sky-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>
                          {c.rol}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sky-400 font-bold text-sm truncate max-w-[180px] text-left">{c.unidadAsociada}</td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-[11px] font-bold text-slate-400 bg-slate-800/50 px-2 py-1 rounded inline-block">{c.estadoGestion}</span>
                      </td>
                      <td className="px-6 py-5 text-[11px] text-slate-400 font-medium max-w-[200px] text-left">{c.ultimaAccion}</td>
                      <td className="px-6 py-5 text-center">
                        <button className="w-10 h-10 rounded-full bg-[#1c282d] border border-slate-700 text-emerald-500 flex items-center justify-center mx-auto hover:bg-emerald-500/20 transition-all"><MessageCircle size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {clientes.length === 0 && !loading && <div className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">Sin datos para tu usuario</div>}
            </div>
          </div>

          {selectedCliente && (
            <div className="w-[420px] bg-[#161f23] border border-slate-800 rounded-3xl p-8 sticky top-8 shadow-2xl animate-in slide-in-from-right-4 duration-500 text-left font-sans">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase flex items-center gap-3"><span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>Legajo</h2>
                <button onClick={() => setSelectedCliente(null)} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
              </div>
              <div className="flex items-center gap-5 mb-10 p-5 bg-[#1c282d] border border-slate-800 rounded-2xl relative overflow-hidden group">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500"><User size={28} /></div>
                <div className="min-w-0"><h3 className="font-black text-white text-lg leading-tight truncate">{selectedCliente.nombre}</h3><p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest truncate">{selectedCliente.contacto}</p></div>
              </div>
              <div className="space-y-8 relative">
                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 text-left">Timeline</h4>
                <div className="absolute left-[23px] top-[48px] bottom-0 w-[2px] bg-slate-800"></div>
                {selectedCliente.fecha_hitos.map((h: any, i: number) => (
                  <div key={i} className="relative pl-14 text-left">
                    <div className={`absolute left-0 top-0 w-12 h-12 rounded-2xl bg-[#161f23] border-2 flex items-center justify-center z-10 ${h.tipo === 'money' ? 'border-emerald-500 text-emerald-500' : 'border-slate-800 text-slate-500'}`}>
                      {h.tipo === 'money' ? <DollarSign size={20} /> : <Calendar size={20} />}
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase">{new Date(h.fecha).toLocaleDateString()}</span>
                      <p className="text-sm font-black text-slate-200 mt-1">{h.evento}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{h.detalle}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-10 p-5 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl text-left">
                  <div className="flex items-center gap-2 mb-2 text-emerald-500"><HandshakeIcon size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Notas</span></div>
                  <p className="text-xs text-slate-400 italic">"{selectedCliente.notas || 'Sin observaciones'}"</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientesPage;