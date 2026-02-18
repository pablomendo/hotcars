'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Star, Eye, EyeOff, Check, Settings, Zap, Plus, DollarSign, 
  Settings as SettingsIcon, Search, LayoutGrid, List, PauseCircle,
  Instagram, Facebook, MessageCircle, Share2, Image as ImageIcon,
  Type, Globe, Trash2, Upload, MapPin, Clock, Phone
} from 'lucide-react';

export default function MiWebPage() {
    const [inv, setInv] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('VISIBLE');
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    
    const [openConfig, setOpenConfig] = useState(false);
    const [userData, setUserData] = useState<{ plan_type: string; id: string | null }>({ plan_type: 'FREE', id: null }); 
    const [planFeatures, setPlanFeatures] = useState({
        custom_domain: false,
        banners: false,
        footer: false,
        cover_image: false
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewImage, setPreviewImage] = useState('/portada_mi_web.jpg');
    const [showSocialsInFooter, setShowSocialsInFooter] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [maxWebVehicles, setMaxWebVehicles] = useState(10);

    const [config, setConfig] = useState({
        subdomain: 'miagencia',
        customDomain: '',
        title: 'TITULAR DE MI WEB',
        subtitle: 'SUBTITULO DE MI WEB',
        instagram: '',
        facebook: '',
        tiktok: '',
        whatsapp: '',
        direccion: '',
        horarios: '',
        telefono: ''
    });

    const handleSaveConfig = () => {
        console.log("Configuración guardada localmente:", config);
    };

    const handleTriggerFile = (e: React.MouseEvent) => {
        if (!planFeatures.cover_image) return;
        e.stopPropagation();
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setPreviewImage(imageUrl);
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('usuarios')
                    .select('plan_type')
                    .eq('auth_id', user.id)
                    .single();

                if (profile) {
                    const planType = profile.plan_type.toUpperCase();
                    setUserData({ plan_type: planType, id: user.id });

                    const [featuresRes, limitsRes] = await Promise.all([
                        supabase
                            .from('plan_features')
                            .select('custom_domain, banners, footer, cover_image')
                            .eq('plan_type', profile.plan_type.toLowerCase())
                            .single(),
                        supabase
                            .from('plan_limits')
                            .select('max_web_vehicles')
                            .ilike('plan_type', profile.plan_type)
                            .single()
                    ]);

                    if (featuresRes.data) setPlanFeatures(featuresRes.data);
                    if (limitsRes.data) setMaxWebVehicles(limitsRes.data.max_web_vehicles || 10);

                    await fetchInventory(user.id);
                }
            }
        };
        fetchUserData();

        const channel = supabase
            .channel('hotcars-sync-real')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario' }, () => {
                fetchInventory();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchInventory = async (currentUserId?: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const uid = currentUserId || user?.id;

            console.log('UID:', uid);

            if (!uid) return;

            const [propiosRes, flipsRes] = await Promise.all([
                supabase
                    .from('inventario')
                    .select('*')
                    .eq('created_by_user_id', uid)
                    .neq('publish_status', 'borrador')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('flip_compartido')
                    .select('auto_id, inventario:auto_id(*)')
                    .eq('vendedor_user_id', uid)
                    .eq('status', 'approved')
            ]);

            console.log('Propios data:', propiosRes.data);
            console.log('Propios error:', propiosRes.error);
            console.log('Flips data:', flipsRes.data);

            const propios = propiosRes.data || [];
            const terceros = (flipsRes.data || [])
                .map((f: any) => f.inventario)
                .filter((i: any) => i !== null);

            const allData = [...propios, ...terceros].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            const mappedData = allData.map((v) => {
                const status = (v.inventory_status || 'activo').toLowerCase();
                let shouldShow = !!v.show_on_web;
                if (status === 'pausado') shouldShow = false;

                return {
                    ...v,
                    brand: v.marca,
                    model: v.modelo,
                    year: v.anio,
                    km: v.km,
                    image: v.fotos?.[0] || null,
                    inventory_status: status,
                    show: shouldShow,
                    featured: !!v.is_featured,
                    isNew: !!v.is_new,
                    isProprio: v.created_by_user_id === uid,
                    priceDisplay: `${v.moneda === 'USD' ? 'U$S ' : '$ '}${Number(v.pv || 0).toLocaleString('es-AR')}`
                };
            });

            setInv(mappedData);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleAction = async (id: string, updates: any) => {
        const item = inv.find(v => v.id === id);

        if ('show_on_web' in updates) {
            const mostrar = updates.show_on_web;

            if (mostrar && item?.inventory_status === 'pausado') {
                alert("No podés mostrar en la web una unidad que está pausada en el inventario.");
                return;
            }

            const { data, error } = await supabase.rpc('toggle_visibilidad_web', {
                p_auto_id: id,
                p_user_id: userData.id,
                p_mostrar: mostrar
            });

            if (error) {
                console.error(error);
                return;
            }

            if (!data.ok) {
                if (data.error === 'limite_alcanzado') {
                    setShowLimitModal(true);
                }
                return;
            }

            setInv(prev => prev.map(v => v.id === id ? { ...v, show: mostrar, show_on_web: mostrar } : v));
            setTimeout(() => fetchInventory(), 500);
            return;
        }

        await supabase.from('inventario').update(updates).eq('id', id);
        fetchInventory();
    };

    const counts = useMemo(() => ({
        VISIBLE: inv.filter(v => v.show).length, 
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
                default: return v.show; 
            }
        });
    }, [tab, inv, search]);

    if (loading) return <div className="bg-[#0b1114] min-h-screen flex items-center justify-center text-white">Cargando...</div>;

    return (
        <div className="bg-[#0b1114] min-h-screen w-full text-slate-300 font-sans pb-20 text-left">
            <style jsx global>{`
                @font-face { font-family: 'Genos'; src: url('/fonts/genos/Genos-VariableFont_wght.ttf') format('truetype'); }
                button { cursor: pointer; }
            `}</style>

            {showLimitModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-center">
                    <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-8 text-orange-600 border border-orange-100">
                            <EyeOff size={48} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-2xl font-black uppercase text-[#1e293b] mb-4">Límite de visibles</h3>
                        <p className="text-gray-500 text-[15px] leading-relaxed mb-10 font-medium text-center">
                            Tu plan permite hasta <strong>{maxWebVehicles}</strong> unidades visibles en tu web. <br/> Ocultá alguna o mejorá tu plan.
                        </p>
                        <button 
                            onClick={() => setShowLimitModal(false)} 
                            className="w-full py-5 bg-[#ff4d00] text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-orange-200 hover:bg-[#e64500] transition-all active:scale-95 mb-6"
                        >
                            Mejorar plan ahora
                        </button>
                        <button onClick={() => setShowLimitModal(false)} className="text-gray-400 text-[11px] font-black uppercase tracking-[0.2em] hover:text-gray-600">Cerrar</button>
                    </div>
                </div>
            )}

            <div className="fixed top-0 left-0 right-0 z-[50] bg-[#0b1114] border-b border-white/5 px-6 py-4">
                <div className="max-w-[1600px] mx-auto flex justify-between items-center h-12">
                    <div className="flex flex-col text-left">
                        <h1 style={{ fontFamily: 'Genos' }} className="text-white text-2xl font-light tracking-[6px] uppercase leading-none">Mi Web</h1>
                        <span className="text-[9px] text-[#22c55e] font-mono tracking-tight uppercase opacity-70 mt-1">agenciamendo.hotcars.com</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black bg-[#22c55e]/10 text-[#22c55e] px-2 py-0.5 rounded uppercase tracking-widest">Plan {userData.plan_type}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {counts.VISIBLE} / {userData.plan_type === 'VIP' ? '∞' : maxWebVehicles} visibles
                        </span>
                        <button className="bg-[#134e4d] text-white px-6 py-2 rounded-xl text-[11px] font-black uppercase shadow-lg border border-[#22c55e]/20 transition-all">Publicar</button>
                    </div>
                </div>
            </div>

            <div className="fixed top-[76px] left-0 right-0 z-[40] bg-[#1c2e38] backdrop-blur-md border-b border-white/5 px-6 pt-[14px] pb-3 lg:h-20 flex flex-col items-center justify-center">
                <div className="max-w-[1600px] mx-auto w-full flex flex-col items-center">
                    <div className="grid grid-cols-3 lg:flex items-center gap-1 p-1 bg-black/20 rounded-xl border border-white/5 w-full lg:w-fit">
                        {[
                            { id: 'VISIBLE', label: 'Visible' }, { id: 'OCULTO', label: 'Oculto' },
                            { id: 'DESTACADOS', label: 'Destacados' }, { id: 'NUEVOS', label: 'Nuevo Ingreso' },
                            { id: 'RESERVADOS', label: 'Reservados' }, { id: 'VENDIDOS', label: 'Vendidos' }
                        ].map((t) => (
                            <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${tab === t.id ? 'bg-[#134e4d] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                                {t.label}
                                {counts[t.id as keyof typeof counts] > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${tab === t.id ? 'bg-black/40 text-white' : 'bg-[#00984a]/20 text-[#22c55e]'}`}>{counts[t.id as keyof typeof counts]}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 pt-64 lg:pt-56">
                <main className="w-full">
                    <div className="flex justify-start mb-6">
                        <button onClick={() => setOpenConfig(!openConfig)} className={`flex items-center gap-2 px-4 py-2 rounded-md border border-white/10 transition-all ${openConfig ? 'bg-white/10 text-[#22c55e] border-[#22c55e]/30' : 'bg-white/5 text-slate-500 hover:text-white'}`}>
                            <SettingsIcon size={16}/><span className="text-[10px] font-bold uppercase tracking-wider font-sans">Configurar mi web</span>
                        </button>
                    </div>

                    {openConfig && (
                        <div className="w-full space-y-4 mb-12 animate-in fade-in slide-in-from-top-2 duration-300 font-sans">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <ConfigCard title="Dominio HotCars" description="miagencia.hotcars.com.ar">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-end gap-2 bg-black/40 border border-white/5 rounded-lg px-3 py-2">
                                            <input className="bg-transparent text-xs text-white outline-none w-full font-bold uppercase text-right" value={config.subdomain} onChange={(e) => setConfig({...config, subdomain: e.target.value.toLowerCase()})} />
                                            <span className="text-slate-500 text-[13px] font-bold">.hotcars.com.ar</span>
                                        </div>
                                        <div className="flex justify-center mt-2">
                                            <button onClick={handleSaveConfig} className="bg-[#134e4d] text-white text-[10px] font-black px-8 py-2 rounded uppercase shadow-md">Confirmar</button>
                                        </div>
                                    </div>
                                </ConfigCard>

                                <ConfigCard title="Dominio Propio" description={planFeatures.custom_domain ? 'Disponible en tu plan' : 'Solo VIP'}>
                                    <div className={`flex flex-col gap-3 ${!planFeatures.custom_domain ? 'opacity-20 pointer-events-none' : ''}`}>
                                        <div className="flex items-center justify-end gap-2 bg-black/40 border border-white/5 rounded-lg px-3 py-2">
                                            <input className="bg-transparent text-xs text-white outline-none w-full font-bold uppercase text-right" placeholder="miagencia.com.ar" value={config.customDomain} onChange={(e) => setConfig({...config, customDomain: e.target.value.toLowerCase()})} />
                                            <Globe size={14} className="text-slate-500" />
                                        </div>
                                        <div className="flex justify-center mt-2">
                                            <button onClick={handleSaveConfig} className="bg-[#134e4d] text-white text-[10px] font-black px-8 py-2 rounded uppercase shadow-md">Confirmar</button>
                                        </div>
                                    </div>
                                </ConfigCard>

                                <ConfigCard title="Redes y Contacto" description="Configuración vertical">
                                    <div className="flex flex-col gap-2">
                                        <SocialInput icon={<Instagram size={14}/>} placeholder="Instagram" value={config.instagram} onChange={(val:string) => setConfig({...config, instagram: val})} />
                                        <SocialInput icon={<Facebook size={14}/>} placeholder="Facebook" value={config.facebook} onChange={(val:string) => setConfig({...config, facebook: val})} />
                                        <SocialInput icon={<Share2 size={14}/>} placeholder="TikTok" value={config.tiktok} onChange={(val:string) => setConfig({...config, tiktok: val})} />
                                        <SocialInput icon={<MessageCircle size={14} className="text-green-500" />} placeholder="WhatsApp" value={config.whatsapp} onChange={(val:string) => setConfig({...config, whatsapp: val})} />
                                    </div>
                                </ConfigCard>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ConfigCard title="Editar Portada" description={planFeatures.cover_image ? 'Disponible en tu plan' : 'Solo PRO y VIP'}>
                                    <div className="relative aspect-video rounded-xl border border-white/10 overflow-hidden bg-slate-900 group">
                                        <img src={previewImage} className={`w-full h-full object-cover opacity-60 ${!planFeatures.cover_image ? 'grayscale' : ''}`} alt="Preview" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                                            <input className="bg-transparent text-white text-lg font-black uppercase tracking-[4px] text-center outline-none w-full mb-1" value={config.title} onChange={(e) => setConfig({...config, title: e.target.value})} />
                                            <input className="bg-transparent text-slate-300 text-[10px] uppercase tracking-widest text-center outline-none w-full" value={config.subtitle} onChange={(e) => setConfig({...config, subtitle: e.target.value})} />
                                            <div className="flex flex-col items-center gap-4 mt-6">
                                                <button onClick={handleTriggerFile} className={`bg-white/10 text-white text-[10px] font-black px-5 py-2 rounded uppercase border border-white/10 transition-all flex items-center gap-2 ${!planFeatures.cover_image ? 'opacity-20 pointer-events-none' : ''}`}><Upload size={14} /> Agregar Foto</button>
                                                <button onClick={handleSaveConfig} className="bg-[#134e4d] text-white text-[10px] font-black px-10 py-2 rounded uppercase shadow-xl">Confirmar</button>
                                            </div>
                                        </div>
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </div>
                                </ConfigCard>

                                <ConfigCard title="Banners Promocionales" description={planFeatures.banners ? 'Disponible en tu plan' : 'Solo VIP'}>
                                    <div className={`grid grid-cols-1 gap-3 aspect-video flex flex-col ${!planFeatures.banners ? 'opacity-20 pointer-events-none' : ''}`}>
                                        <div className="flex-1 border-2 border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center bg-black/20 hover:border-[#134e4d]/30 transition-all cursor-pointer relative"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Banner 1</span></div>
                                        <div className="flex-1 border-2 border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center bg-black/20 hover:border-[#134e4d]/30 transition-all cursor-pointer relative"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Banner 2</span></div>
                                    </div>
                                </ConfigCard>
                            </div>

                            <ConfigCard title="Pie de Página" description={planFeatures.footer ? 'Disponible en tu plan' : 'Solo VIP'}>
                                <div className={`flex flex-col gap-4 ${!planFeatures.footer ? 'opacity-20 pointer-events-none' : ''}`}>
                                    <div className="flex flex-row items-center gap-2 mt-2">
                                        <div className="flex-1 flex items-center gap-2 bg-black/40 border border-white/5 rounded-lg px-3 py-2"><MapPin size={14} className="text-slate-500" /><input className="bg-transparent text-[10px] text-white outline-none w-full font-bold uppercase" placeholder="Direccion" value={config.direccion} onChange={(e) => setConfig({...config, direccion: e.target.value})} /></div>
                                        <div className="flex-1 flex items-center gap-2 bg-black/40 border border-white/5 rounded-lg px-3 py-2"><Clock size={14} className="text-slate-500" /><input className="bg-transparent text-[10px] text-white outline-none w-full font-bold uppercase" placeholder="Horarios" value={config.horarios} onChange={(e) => setConfig({...config, horarios: e.target.value})} /></div>
                                        <div className="flex-1 flex items-center gap-2 bg-black/40 border border-white/5 rounded-lg px-3 py-2"><Phone size={14} className="text-slate-500" /><input className="bg-transparent text-[10px] text-white outline-none w-full font-bold uppercase" placeholder="Telefono" value={config.telefono} onChange={(e) => setConfig({...config, telefono: e.target.value})} /></div>
                                    </div>
                                    <FooterPreview config={config} showSocials={showSocialsInFooter} />
                                    <div className="flex flex-col items-center gap-4 border-t border-white/5 pt-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Iconos Redes:</span>
                                            <button onClick={() => setShowSocialsInFooter(!showSocialsInFooter)} className={`relative w-8 h-4 rounded-full transition-colors ${showSocialsInFooter ? 'bg-[#134e4d]' : 'bg-white/10'}`}>
                                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showSocialsInFooter ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                        <button onClick={handleSaveConfig} className="bg-[#134e4d] text-white text-[10px] font-black px-12 py-2 rounded uppercase shadow-xl transition-all">Confirmar Cambios</button>
                                    </div>
                                </div>
                            </ConfigCard>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mb-8">
                        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                            <button onClick={() => setViewMode('grid')} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#134e4d] text-white shadow-md' : 'text-slate-400'}`}><LayoutGrid size={16}/><span className="text-[10px] font-bold uppercase tracking-wider font-sans">Grilla</span></button>
                            <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-[#134e4d] text-white shadow-md' : 'text-slate-400'}`}><List size={16}/><span className="text-[10px] font-bold uppercase tracking-wider font-sans">Lista</span></button>
                        </div>
                        <div className="relative flex-1 min-w-[280px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><input type="text" placeholder="Buscar unidad..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm w-full outline-none focus:border-[#22c55e]/50 transition-all" /></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {!loading && filtered.map((v) => (
                            <div key={v.id} className={`bg-[#141b1f] border rounded-xl overflow-hidden transition-all ${v.show ? 'border-white/5' : 'border-red-900/40 opacity-50'}`}>
                                <div className="p-4 flex flex-col gap-3">
                                    <div className="w-full aspect-video rounded-lg bg-slate-900 overflow-hidden border border-white/10 relative">
                                        <img src={v.image} className={`w-full h-full object-cover ${!v.show || v.inventory_status === 'pausado' ? 'grayscale opacity-40' : ''}`} alt="" />
                                        <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start">
                                            {v.inventory_status === 'vendido' && <span className="bg-[#22c55e] text-black text-[9px] font-black px-2 py-1 rounded uppercase shadow-xl">Vendido</span>}
                                            {v.inventory_status === 'reservado' && <span className="bg-yellow-600 text-white text-[9px] font-black px-2 py-1 rounded shadow-xl border border-yellow-400/50 uppercase">Reservado</span>}
                                            {v.inventory_status === 'pausado' && <span className="bg-gray-600 text-white text-[9px] font-black px-2 py-1 rounded shadow-xl uppercase">Pausado</span>}
                                            {v.featured && <span className="bg-yellow-500 text-black text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase">Destacado</span>}
                                            {v.isNew && <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase">Nuevo</span>}
                                            {!v.show && <span className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase">Oculto</span>}
                                            {!v.isProprio && <span className="bg-[#2596be] text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase">Flip</span>}
                                        </div>
                                    </div>
                                    <div className="text-left font-sans">
                                        <h4 className="text-xs font-bold text-white uppercase tracking-tight truncate leading-none">{v.brand} {v.model}</h4>
                                        <div className="flex justify-between items-end mt-3"><span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{v.year} • {v.km?.toLocaleString('es-AR')} KM</span><span className="text-sm font-black text-[#22c55e] leading-none">{v.priceDisplay}</span></div>
                                    </div>
                                </div>
                                <div className="flex border-t border-white/5 bg-black/20 divide-x divide-white/5 font-sans">
                                    <button onClick={() => handleAction(v.id, { is_featured: !v.featured })} className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${v.show ? (v.featured ? 'text-yellow-500 bg-yellow-500/5' : 'text-slate-500 hover:text-white') : 'text-slate-600'}`}><Star size={13} className={v.featured && v.show ? "fill-yellow-500" : ""} /><span className="text-[7px] font-black uppercase tracking-tighter">Destacar</span></button>
                                    <button onClick={() => handleAction(v.id, { is_new: !v.isNew })} className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${v.show ? (v.isNew ? 'text-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-white') : 'text-slate-600'}`}><Zap size={13} className={v.isNew && v.show ? "fill-blue-500" : ""} /><span className="text-[7px] font-black uppercase tracking-tighter">Nuevo</span></button>
                                    <button onClick={() => handleAction(v.id, { inventory_status: v.inventory_status === 'reservado' ? 'activo' : 'reservado' })} className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${v.inventory_status === 'reservado' ? 'text-yellow-600 bg-yellow-600/5' : 'text-slate-500 hover:text-yellow-500'}`}><DollarSign size={13}/><span className="text-[7px] font-black uppercase tracking-tighter">Reservar</span></button>
                                    <button onClick={() => handleAction(v.id, { inventory_status: v.inventory_status === 'vendido' ? 'activo' : 'vendido' })} className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${v.inventory_status === 'vendido' ? 'text-[#22c55e] bg-[#22c55e]/5' : 'text-slate-500 hover:text-[#22c55e]'}`}><Check size={13}/><span className="text-[7px] font-black uppercase tracking-tighter">Vendido</span></button>
                                    <button onClick={() => handleAction(v.id, { show_on_web: !v.show })} className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${!v.show ? 'text-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-[#22c55e]'}`}>{v.show ? <Eye size={13} /> : <EyeOff size={13} />}<span className="text-[7px] font-black uppercase tracking-tighter">{v.show ? 'Ocultar' : 'Mostrar'}</span></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}

function ConfigCard({ title, description, children }: { title: string; description: string; children: React.ReactNode; }) {
    return (
        <div className="bg-[#141b1f] border border-white/5 rounded-xl p-5 font-sans h-full">
            <div className="mb-4">
                <div className="text-[13px] font-black text-slate-500 uppercase tracking-[2px] leading-none text-left">{title}</div>
                <div className="text-[12px] opacity-40 uppercase tracking-tighter mt-1 text-left">{description}</div>
            </div>
            {children}
        </div>
    );
}

function SocialInput({ icon, placeholder, value, onChange }: any) {
    return (
        <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-lg px-4 py-2">
            <span className="text-slate-500">{icon}</span>
            <input className="bg-transparent text-[11px] text-white outline-none w-full font-bold uppercase tracking-tighter placeholder:text-white/20" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    );
}

function FooterPreview({ config, showSocials }: { config: any, showSocials: boolean }) {
    return (
        <div className="p-5 bg-black/40 border border-white/5 rounded-xl flex flex-col items-center justify-center min-h-[80px] transition-all relative overflow-hidden">
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-white/90">
                <div className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-tighter ${!config.direccion ? 'opacity-20' : 'opacity-100'}`}><MapPin size={12} className="text-[#22c55e]" /> {config.direccion || "Dirección"}</div>
                <div className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-tighter ${!config.horarios ? 'opacity-20' : 'opacity-100'}`}><Clock size={12} className="text-[#22c55e]" /> {config.horarios || "Horarios"}</div>
                <div className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-tighter ${!config.telefono ? 'opacity-20' : 'opacity-100'}`}><Phone size={12} className="text-[#22c55e]" /> {config.telefono || "Teléfono"}</div>
            </div>
            {showSocials && (
                <div className="flex gap-8 pt-4 mt-2 border-t border-white/5 w-full justify-center">
                    <Instagram size={16} className={config.instagram ? "text-white opacity-80" : "text-white/10"} />
                    <Facebook size={16} className={config.facebook ? "text-white opacity-80" : "text-white/10"} />
                    <Share2 size={16} className={config.tiktok ? "text-white opacity-80" : "text-white/10"} />
                    <MessageCircle size={16} className={config.whatsapp ? "text-[#22c55e]" : "text-white/10"} />
                </div>
            )}
        </div>
    );
}