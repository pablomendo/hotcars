'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Camera, MapPin, Phone, Instagram, Facebook, Globe, Loader2, ChevronLeft, UploadCloud
} from 'lucide-react';

export default function PerfilPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    user_name: '',
    full_name: '',
    bio: '',
    location: '',
    phone: '',
    instagram: '',
    facebook: '',
    website: '',
    profile_pic: '',
    cover_text: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }
      setUser(session.user);

      const { data: profile } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', session.user.id)
        .single();

      if (profile) {
        setFormData({
          user_name: profile.user_name || '',
          full_name: profile.full_name || '',
          bio: profile.bio || '',
          location: profile.location || '',
          phone: profile.phone || '',
          instagram: profile.instagram || '',
          facebook: profile.facebook || '',
          website: profile.website || '',
          profile_pic: profile.profile_pic || '',
          cover_text: profile.cover_text || ''
        });
      }
      setLoading(false);
    };
    fetchUser();
  }, [router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      setError(null);
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "hotcars_perfiles");

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: data }
      );

      if (!response.ok) throw new Error("Fallo en la subida");

      const fileData = await response.json();
      const imageUrl = fileData.secure_url;

      setFormData(prev => ({ ...prev, profile_pic: imageUrl }));
      
      await supabase
        .from('usuarios')
        .update({ profile_pic: imageUrl })
        .eq('auth_id', user.id);

      setSuccess('Foto actualizada');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError('Error al procesar imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase
      .from('usuarios')
      .update(formData)
      .eq('auth_id', user.id);

    if (updateError) setError(updateError.message);
    else {
      setSuccess('Cambios guardados');
      setTimeout(() => setSuccess(null), 2000);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex h-screen w-full items-center justify-center bg-[#12242e] text-[#00984a] font-black uppercase tracking-widest text-[12px]">Cargando...</div>;

  return (
    <div className="min-h-screen relative font-sans text-white bg-[#12242e] flex flex-col overflow-hidden">
      
      {/* HEADER FIJO */}
      <header className="w-full bg-[#12242e] h-20 flex items-center px-8 sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center justify-between w-full max-w-[1600px] mx-auto">
            <Link href="/" className="relative w-40 h-10">
                <Image src="/logo_hotcars_blanco.png" alt="HotCars" fill className="object-contain" priority />
            </Link>
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <ChevronLeft size={28} />
            </Link>
        </div>
      </header>

      {/* SECCIÓN FRANJA VERDE */}
      <div className="w-full bg-[#00984a] h-64 md:h-72 shadow-inner"></div>

      {/* CONTENEDOR FORMULARIO */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 -mt-40 md:-mt-42 pb-6 relative z-10">
        
        <div className="w-full max-w-md bg-[#12242e] border border-white/10 rounded-[32px] p-5 shadow-2xl">
          
          <h1 className="text-[24px] font-black uppercase tracking-tight mb-4 text-center leading-none text-white drop-shadow-md">
            Editar Perfil de <span className="text-[#00984a]">Usuario</span>
          </h1>

          <div className="flex flex-col items-center mb-6">
            <div className="group relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-[74px] h-[74px] rounded-2xl border-2 border-dashed border-white/20 overflow-hidden bg-black/20 flex flex-col items-center justify-center transition-all group-hover:border-[#00984a]/50">
                {formData.profile_pic ? (
                  <img src={formData.profile_pic} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <UploadCloud size={28} className="text-slate-600" />
                )}
                {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="animate-spin text-[#00984a]" size={18} /></div>}
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#00984a] text-white text-[7px] font-black uppercase px-2.5 py-1 rounded-full shadow-xl whitespace-nowrap border border-white/10">
                Subir Foto
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            </div>
          </div>

          <div className="space-y-0">
            {[
              { label: 'Nombre de Usuario (@)', key: 'user_name' },
              { label: 'Nombre Completo / Agencia', key: 'full_name' },
              { label: 'Slogan de Portada', key: 'cover_text' },
              { label: 'Bio / Trayectoria', key: 'bio' },
              { label: 'WhatsApp', key: 'phone' },
              { label: 'Localidad', key: 'location' }
            ].map((field) => (
              <div key={field.key} className="flex flex-col border-b border-white/5 py-0.5">
                <label className="text-[8px] font-black uppercase text-slate-500">{field.label}</label>
                <input 
                  type="text" 
                  className="bg-transparent outline-none text-[13px] font-bold text-white h-7" 
                  value={(formData as any)[field.key]} 
                  onChange={e => setFormData({...formData, [field.key]: e.target.value})} 
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-xl border border-white/5">
              <Instagram size={14} className="text-slate-500" />
              <input 
                type="text" 
                className="bg-transparent flex-1 outline-none text-[10px] font-bold h-6" 
                value={formData.instagram} 
                onChange={e => setFormData({...formData, instagram: e.target.value})} 
                placeholder="@ig"
              />
            </div>
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-xl border border-white/5">
              <Facebook size={14} className="text-slate-500" />
              <input 
                type="text" 
                className="bg-transparent flex-1 outline-none text-[10px] font-bold h-6" 
                value={formData.facebook} 
                onChange={e => setFormData({...formData, facebook: e.target.value})} 
                placeholder="fb/u"
              />
            </div>
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-xl border border-white/5 col-span-2">
              <Globe size={14} className="text-slate-500" />
              <input 
                type="text" 
                className="bg-transparent flex-1 outline-none text-[10px] font-bold h-6" 
                value={formData.website} 
                onChange={e => setFormData({...formData, website: e.target.value})} 
                placeholder="tuweb.hotcars.com.ar"
              />
            </div>
          </div>

          <button 
            onClick={handleSave} 
            disabled={saving || uploading} 
            className="w-full py-2.5 bg-[#00984a] text-white font-black uppercase tracking-widest rounded-xl text-[11px] shadow-lg transition-all hover:bg-[#007a3b] active:scale-[0.98] disabled:opacity-50 mt-4"
          >
            {saving ? 'Guardando...' : 'Confirmar Cambios'}
          </button>
        </div>

        {success && <div className="mt-4 text-[9px] font-black uppercase text-[#00984a] text-center w-full animate-bounce">{success}</div>}
      </main>
    </div>
  );
}