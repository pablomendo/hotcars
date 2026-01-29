'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Star, Eye, EyeOff, Check, Settings, Zap, Plus, DollarSign, 
  Settings as SettingsIcon, Search, LayoutGrid, List 
} from 'lucide-react';

export default function MiWebPage() {
    const [inv, setInv] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('VISIBLE');
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        fetchInventory();
        const channel = supabase
            .channel('hotcars-sync-real')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario' }, () => {
                fetchInventory();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchInventory = async () => {
        try {
            const { data, error } = await supabase.from('inventario').select('*').order('created_at', { ascending: false });
            if (!error && data) {
                const mappedData = data.map(v => ({
                    ...v,
                    brand: v.marca, 
                    model: v.modelo, 
                    year: v.anio, 
                    km: v.km,
                    image: v.fotos?.[0] || null,
                    // Mantenemos los nombres de las columnas de Supabase tal cual
                    inventory_status: (v.inventory_status || 'activo').toLowerCase(),
                    show: !!v.show_on_web,
                    featured: !!v.is_featured,
                    isNew: !!v.is_new,
                    priceDisplay: `${v.moneda === 'USD' ? 'U$S ' : '$ '}${Number(v.pv || 0).toLocaleString('es-AR')}`
                }));
                setInv(mappedData);
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleAction = async (id: string, updates: object) => {
        await supabase.from('inventario').update(updates).eq('id', id);
        fetchInventory();
    };

    const counts = useMemo(() => ({
        VISIBLE: inv.filter(v => ['activo', 'reservado', 'vendido'].includes(v.inventory_status) && v.show).length,
        OCULTO: inv.filter(v => !v.show).length,
        DESTACADOS: inv.filter(v => v.show && v.featured).length,
        NUEVOS: inv.filter(v => v.show && v.isNew).length,
        RESERVADOS: inv.filter(v => v.inventory_status === 'reservado').length,
        VENDIDOS: inv.filter(v => v.inventory_status === 'vendido').length,
    }), [inv]);

    const filtered = useMemo(() => {
        return inv.filter(v => {
            const searchMatch = (v.brand?.toLowerCase() || "").includes(search.toLowerCase()) || 
                               (v.model?.toLowerCase() || "").includes(search.toLowerCase());
            if (!searchMatch) return false;

            switch(tab) {
                case 'OCULTO': return !v.show;
                case 'DESTACADOS': return v.show && v.featured;
                case 'NUEVOS': return v.show && v.isNew;
                case 'RESERVADOS': return v.inventory_status === 'reservado';
                case 'VENDIDOS': return v.inventory_status === 'vendido';
                default: return ['activo', 'reservado', 'vendido'].includes(v.inventory_status) && v.show;
            }
        });
    }, [tab, inv, search]);

    return (
        <div className="bg-[#0b1114] min-h-screen w-full text-slate-300 font-sans pb-20 text-left">
            <style jsx global>{`
                @font-face { font-family: 'Genos'; src: url('/fonts/genos/Genos-VariableFont_wght.ttf') format('truetype'); }
                .grid button { cursor: pointer; }
                button { cursor: pointer; }
            `}</style>

            <div className="fixed top-0 left-0 right-0 z-[50] bg-[#0b1114] border-b border-white/5 px-6 py-4">
                <div className="max-w-[1600px] mx-auto flex justify-between items-center h-12">
                    <div className="flex flex-col text-left">
                        <h1 style={{ fontFamily: 'Genos' }} className="text-white text-2xl font-light tracking-[6px] uppercase leading-none">Mi Web</h1>
                        <span className="text-[9px] text-[#22c55e] font-mono tracking-tight uppercase opacity-70 mt-1">agenciamendo.hotcars.com</span>
                    </div>
                    <button className="bg-[#134e4d] text-white px-6 py-2 rounded-xl text-[11px] font-black uppercase shadow-lg border border-[#22c55e]/20 transition-all">Publicar</button>
                </div>
            </div>

            <div className="fixed top-[76px] left-0 right-0 z-[40] bg-[#1c2e38] backdrop-blur-md border-b border-white/5 px-6 pt-[14px] pb-3 lg:h-20 flex flex-col items-center justify-center">
                <div className="max-w-[1600px] mx-auto w-full flex flex-col items-center">
                    <div className="grid grid-cols-3 lg:flex items-center gap-1 p-1 bg-black/20 rounded-xl border border-white/5 w-full lg:w-fit">
                        {[
                            { id: 'VISIBLE', label: 'Visible' },
                            { id: 'OCULTO', label: 'Oculto' },
                            { id: 'DESTACADOS', label: 'Destacados' },
                            { id: 'NUEVOS', label: 'Nuevo Ingreso' },
                            { id: 'RESERVADOS', label: 'Reservados' },
                            { id: 'VENDIDOS', label: 'Vendidos' }
                        ].map((t) => (
                            <button 
                                key={t.id} 
                                onClick={() => setTab(t.id)} 
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                                    tab === t.id 
                                    ? 'bg-[#134e4d] text-white shadow-md' 
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {t.label}
                                {counts[t.id as keyof typeof counts] > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${tab === t.id ? 'bg-black/40 text-white' : 'bg-[#00984a]/20 text-[#22c55e]'}`}>
                                        {counts[t.id as keyof typeof counts]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    <span style={{ fontFamily: 'Genos' }} className="text-white text-[12px] lg:text-[14px] font-light tracking-[3px] lg:tracking-[4px] uppercase opacity-40 mt-1">
                        Mi Web
                    </span>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 pt-64 lg:pt-56">
                <div className="flex flex-col lg:flex-row gap-8">
                    <aside className="lg:w-1/4">
                        <div className="sticky top-56 bg-[#141b1f] border border-white/5 p-6 rounded-2xl space-y-8 shadow-2xl">
                            <div>
                                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-left">
                                    <SettingsIcon size={14} className="text-[#22c55e]"/> Configuración Web
                                </h3>
                                <div className="space-y-4 text-left">
                                    <ToggleItem label='Auto-ocultar vendidos' active={true} />
                                    <ToggleItem label='Banner "Financiación"' active={true} />
                                    <ToggleItem label='Chat flotante WhatsApp' active={true} />
                                </div>
                            </div>
                        </div>
                    </aside>

                    <main className="lg:w-3/4">
                        <div className="flex flex-wrap items-center gap-3 mb-8">
                            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                                <button onClick={() => setViewMode('grid')} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-[#22c55e]' : 'text-slate-500'}`}>
                                    <LayoutGrid size={16}/> <span className="text-[10px] font-bold uppercase tracking-wider">Grilla</span>
                                </button>
                                <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-[#22c55e]' : 'text-slate-500'}`}>
                                    <List size={16}/> <span className="text-[10px] font-bold uppercase tracking-wider">Lista</span>
                                </button>
                            </div>

                            <div className="relative flex-1 min-w-[280px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar unidad..." 
                                    value={search} 
                                    onChange={(e) => setSearch(e.target.value)} 
                                    className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm w-full outline-none focus:border-[#22c55e]/50 transition-all"
                                />
                            </div>
                        </div>

                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {!loading && filtered.map((v) => (
                                    <div key={v.id} className={`bg-[#141b1f] border rounded-xl overflow-hidden transition-all ${v.show ? 'border-white/5' : 'border-red-900/40 opacity-50'}`}>
                                        <div className="p-4 flex flex-col gap-3">
                                            <div className="w-full aspect-video rounded-lg bg-slate-900 overflow-hidden border border-white/10 relative">
                                                <img src={v.image} className={`w-full h-full object-cover ${!v.show || v.inventory_status === 'pausado' ? 'grayscale opacity-40' : ''}`} alt="" />
                                                <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start">
                                                    {v.inventory_status === 'vendido' && <span className="bg-[#22c55e] text-black text-[9px] font-black px-2 py-1 rounded uppercase shadow-xl">Vendido</span>}
                                                    {v.inventory_status === 'reservado' && <span className="bg-yellow-600 text-white text-[9px] font-black px-2 py-1 rounded shadow-xl border border-yellow-400/50 uppercase">Reservado</span>}
                                                    {v.featured && <span className="bg-yellow-500 text-black text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase">Destacado</span>}
                                                    {v.isNew && <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase">Nuevo</span>}
                                                    {!v.show && <span className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase">Oculto en Web</span>}
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <h4 className="text-xs font-bold text-white uppercase tracking-tight truncate leading-none">{v.brand} {v.model}</h4>
                                                <div className="flex justify-between items-end mt-3">
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{v.year} • {v.km?.toLocaleString('es-AR')} KM</span>
                                                    <span className="text-sm font-black text-[#22c55e] leading-none">{v.priceDisplay}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex border-t border-white/5 bg-black/20 divide-x divide-white/5">
                                            <button onClick={() => handleAction(v.id, { is_featured: !v.featured })} className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${v.show ? (v.featured ? 'text-yellow-500 bg-yellow-500/5' : 'text-slate-500 hover:text-white') : 'text-slate-600'}`}>
                                                <Star size={13} className={v.featured && v.show ? "fill-yellow-500" : ""} />
                                                <span className="text-[7px] font-black uppercase tracking-tighter">Destacar</span>
                                            </button>
                                            <button onClick={() => handleAction(v.id, { is_new: !v.isNew })} className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${v.show ? (v.isNew ? 'text-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-white') : 'text-slate-600'}`}>
                                                <Zap size={13} className={v.isNew && v.show ? "fill-blue-500" : ""} />
                                                <span className="text-[7px] font-black uppercase tracking-tighter">Nuevo</span>
                                            </button>
                                            <button onClick={() => handleAction(v.id, { inventory_status: v.inventory_status === 'reservado' ? 'activo' : 'reservado' })} className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${v.show ? (v.inventory_status === 'reservado' ? 'text-yellow-600 bg-yellow-600/5' : 'text-slate-500 hover:text-yellow-500') : 'text-slate-600'}`}>
                                                <DollarSign size={13}/>
                                                <span className="text-[7px] font-black uppercase tracking-tighter">Reservar</span>
                                            </button>
                                            <button onClick={() => handleAction(v.id, { inventory_status: v.inventory_status === 'vendido' ? 'activo' : 'vendido' })} className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${v.show ? (v.inventory_status === 'vendido' ? 'text-[#22c55e] bg-[#22c55e]/5' : 'text-slate-500 hover:text-[#22c55e]') : 'text-slate-600'}`}>
                                                <Check size={13}/>
                                                <span className="text-[7px] font-black uppercase tracking-tighter">Vendido</span>
                                            </button>
                                            <button onClick={() => handleAction(v.id, { show_on_web: !v.show })} className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${!v.show ? 'text-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-[#22c55e]'}`}>
                                                {v.show ? <Eye size={13} /> : <EyeOff size={13} />}
                                                <span className="text-[7px] font-black uppercase tracking-tighter">{v.show ? 'Ocultar' : 'Mostrar'}</span>
                                            </button>
                                            <button onClick={() => handleAction(v.id, { inventory_status: 'activo' })} className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${v.show ? (v.inventory_status === 'activo' ? 'text-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-blue-400') : 'text-slate-600'}`}>
                                                <Plus size={13} className="rotate-45" />
                                                <span className="text-[7px] font-black uppercase tracking-tighter">Visible</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[#141b1f] border border-white/5 rounded-xl overflow-hidden shadow-2xl overflow-x-auto text-left">
                                <table className="w-full text-left text-[11px] min-w-[600px]">
                                    <thead className="bg-black/40 text-slate-500 uppercase font-black border-b border-white/5 tracking-widest">
                                        <tr>
                                            <th className="p-4 text-left">Unidad</th>
                                            <th className="p-4 text-right">Precio Web</th>
                                            <th className="p-4 text-right">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filtered.map((v) => (
                                            <tr key={v.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-4 font-black text-white uppercase tracking-tight">{v.brand} {v.model}</td>
                                                <td className="p-4 text-right font-mono font-black text-[#22c55e] text-sm">{v.priceDisplay}</td>
                                                <td className="p-4 text-right">
                                                    <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${v.show ? 'bg-blue-600/20 text-blue-400' : 'bg-red-600/20 text-red-400'}`}>
                                                        {v.show ? 'Visible' : 'Oculto'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

function ToggleItem({ label, active }: any) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
            <div className={`w-7 h-3.5 rounded-full relative transition-all cursor-pointer ${active ? 'bg-[#22c55e]' : 'bg-slate-700'}`}>
                <div className={`w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 transition-all ${active ? 'right-0.5' : 'left-0.5'}`} />
            </div>
        </div>
    );
}