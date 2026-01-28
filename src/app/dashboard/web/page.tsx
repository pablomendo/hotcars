'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Star, Eye, EyeOff, Check, Settings, Zap, Plus, DollarSign, 
  Settings as SettingsIcon 
} from 'lucide-react';

export default function MiWebPage() {
    const [inv, setInv] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('VISIBLE');

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
                    // Mapeo de conceptos clave
                    inv_status: (v.inventory_status || 'activo').toLowerCase(),
                    show: !!v.show_on_web,
                    featured: !!v.is_featured,
                    isNew: !!v.is_new,
                    priceDisplay: `${v.moneda === 'USD' ? 'U$S ' : '$ '}${Number(v.pv || 0).toLocaleString('es-AR')}`
                }));
                setInv(mappedData);
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    // Manejador de acciones respetando la separación de conceptos
    const handleAction = async (id: string, updates: object) => {
        await supabase.from('inventario').update(updates).eq('id', id);
        fetchInventory();
    };

    // Lógica exacta de FILTROS DE LA SECCIÓN "MI WEB"
    const counts = useMemo(() => ({
        VISIBLE: inv.filter(v => ['activo', 'reservado', 'vendido'].includes(v.inv_status) && v.show).length,
        OCULTO: inv.filter(v => !v.show).length,
        DESTACADOS: inv.filter(v => v.inv_status === 'activo' && v.show && v.featured).length,
        NUEVOS: inv.filter(v => v.inv_status === 'activo' && v.show && v.isNew).length,
        RESERVADOS: inv.filter(v => v.inv_status === 'reservado').length,
        VENDIDOS: inv.filter(v => v.inv_status === 'vendido').length,
    }), [inv]);

    const filtered = useMemo(() => {
        switch(tab) {
            case 'OCULTO': return inv.filter(v => !v.show);
            case 'DESTACADOS': return inv.filter(v => v.inv_status === 'activo' && v.show && v.featured);
            case 'NUEVOS': return inv.filter(v => v.inv_status === 'activo' && v.show && v.isNew);
            case 'RESERVADOS': return inv.filter(v => v.inv_status === 'reservado');
            case 'VENDIDOS': return inv.filter(v => v.inv_status === 'vendido');
            default: return inv.filter(v => ['activo', 'reservado', 'vendido'].includes(v.inv_status) && v.show);
        }
    }, [tab, inv]);

    return (
        <div className="bg-[#0b1114] min-h-screen w-full text-slate-300 font-sans pb-20 text-left">
            <style jsx global>{`
                @font-face { font-family: 'Genos'; src: url('/fonts/genos/Genos-VariableFont_wght.ttf') format('truetype'); }
                
                /* Cambio solicitado: cursor pointer para los botones del submenú */
                .grid button { cursor: pointer; }
                
                /* También lo aplicamos a los botones de acción para consistencia */
                button { cursor: pointer; }
            `}</style>

            {/* HEADER */}
            <div className="fixed top-0 left-0 right-0 z-[50] bg-[#0b1114] border-b border-white/5 px-6 py-4">
                <div className="max-w-[1600px] mx-auto flex justify-between items-center h-12">
                    <div className="flex flex-col text-left">
                        <h1 style={{ fontFamily: 'Genos' }} className="text-white text-2xl font-light tracking-[6px] uppercase leading-none">Mi Web</h1>
                        <span className="text-[9px] text-[#22c55e] font-mono tracking-tight uppercase opacity-70 mt-1">agenciamendo.hotcars.com</span>
                    </div>
                    <button className="bg-[#134e4d] text-white px-6 py-2 rounded-xl text-[11px] font-black uppercase shadow-lg border border-[#22c55e]/20 transition-all">Publicar</button>
                </div>
            </div>

            {/* SUBHEADER Y FILTROS */}
            <div className="fixed top-[76px] left-0 right-0 z-[40] h-auto bg-[#1c2e38] backdrop-blur-md border-b border-white/5 flex flex-col items-center justify-center px-6 py-3 lg:h-24">
                <div className="max-w-[1600px] mx-auto w-full flex flex-col items-center gap-2">
                    <div className="grid grid-cols-3 lg:flex items-center gap-1.5 p-1 bg-black/20 rounded-xl border border-white/5 w-full lg:w-fit mt-2">
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
                                className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                                    tab === t.id 
                                    ? 'bg-[#134e4d] text-white' 
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
                    <span style={{ fontFamily: 'Genos' }} className="text-white text-[14px] font-light tracking-[4px] uppercase opacity-50 mt-1">Mi Web</span>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 pt-64">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* ASIDE CONFIGURACIÓN */}
                    <aside className="lg:w-1/4">
                        <div className="sticky top-64 bg-[#141b1f] border border-white/5 p-6 rounded-2xl space-y-8 shadow-2xl">
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

                    {/* MAIN LISTADO */}
                    <main className="lg:w-3/4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {!loading && filtered.map((v) => (
                            <div key={v.id} className={`bg-[#141b1f] border rounded-xl overflow-hidden transition-all ${v.show ? 'border-white/5' : 'border-red-900/40 opacity-50'}`}>
                                <div className="p-4 flex flex-col gap-3">
                                    <div className="w-full aspect-video rounded-lg bg-slate-900 overflow-hidden border border-white/10 relative">
                                        <img src={v.image} className={`w-full h-full object-cover ${!v.show || v.inv_status !== 'activo' ? 'grayscale opacity-40' : ''}`} alt="" />
                                        
                                        <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start">
                                            {v.inv_status === 'vendido' && <span className="bg-[#22c55e] text-black text-[9px] font-black px-2 py-1 rounded uppercase shadow-xl">Vendido</span>}
                                            {v.inv_status === 'reservado' && <span className="bg-yellow-600 text-white text-[9px] font-black px-2 py-1 rounded shadow-xl border border-yellow-400/50 uppercase">Reservado</span>}
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

                                {/* ACCIONES EDITORIALES VS COMERCIALES */}
                                <div className="flex border-t border-white/5 bg-black/20 divide-x divide-white/5">
                                    {/* EDITORIAL: Destacar */}
                                    <button onClick={() => handleAction(v.id, { is_featured: !v.featured })} className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${v.featured ? 'text-yellow-500 bg-yellow-500/5' : 'text-slate-500 hover:text-white'}`}>
                                        <Star size={13} className={v.featured ? "fill-yellow-500" : ""} />
                                        <span className="text-[7px] font-black uppercase tracking-tighter">Destacar</span>
                                    </button>
                                    
                                    {/* EDITORIAL: Nuevo */}
                                    <button onClick={() => handleAction(v.id, { is_new: !v.isNew })} className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${v.isNew ? 'text-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-white'}`}>
                                        <Zap size={13} className={v.isNew ? "fill-blue-500" : ""} />
                                        <span className="text-[7px] font-black uppercase tracking-tighter">Nuevo</span>
                                    </button>

                                    {/* COMERCIAL: Reservar */}
                                    <button onClick={() => handleAction(v.id, { inventory_status: v.inv_status === 'reservado' ? 'activo' : 'reservado' })} className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${v.inv_status === 'reservado' ? 'text-yellow-600 bg-yellow-600/5' : 'text-slate-500 hover:text-yellow-500'}`}>
                                        <DollarSign size={13}/>
                                        <span className="text-[7px] font-black uppercase tracking-tighter">Reservar</span>
                                    </button>

                                    {/* COMERCIAL: Vender */}
                                    <button onClick={() => handleAction(v.id, { inventory_status: v.inv_status === 'vendido' ? 'activo' : 'vendido' })} className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${v.inv_status === 'vendido' ? 'text-[#22c55e] bg-[#22c55e]/5' : 'text-slate-500 hover:text-[#22c55e]'}`}>
                                        <Check size={13}/>
                                        <span className="text-[7px] font-black uppercase tracking-tighter">Vender</span>
                                    </button>

                                    {/* EDITORIAL: Visibilidad */}
                                    <button onClick={() => handleAction(v.id, { show_on_web: !v.show })} className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${!v.show ? 'text-red-500 bg-red-500/5' : 'text-slate-500 hover:text-[#22c55e]'}`}>
                                        {v.show ? <Eye size={13} /> : <EyeOff size={13} />}
                                        <span className="text-[7px] font-black uppercase tracking-tighter">{v.show ? 'Ocultar' : 'Mostrar'}</span>
                                    </button>

                                    {/* COMERCIAL: Activar (hecho real) */}
                                    <button onClick={() => handleAction(v.id, { inventory_status: 'activo' })} className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${v.inv_status === 'activo' ? 'text-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-blue-400'}`}>
                                        <Plus size={13} className="rotate-45" />
                                        <span className="text-[7px] font-black uppercase tracking-tighter">Activo</span>
                                    </button>
                                </div>
                            </div>
                        ))}
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