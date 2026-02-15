'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { CldUploadWidget } from 'next-cloudinary';
import { Camera, Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PerfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    phone: '',
    profile_pic: ''
  });

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          full_name: data.full_name || '',
          bio: data.bio || '',
          phone: data.phone || '',
          profile_pic: data.profile_pic || ''
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay sesión activa');

      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
          phone: formData.phone,
          profile_pic: formData.profile_pic, // Aquí se guarda la URL de Cloudinary
          updated_at: new Date().toISOString(),
        })
        .eq('auth_id', user.id);

      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1114] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#288b55]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1114] text-white p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-black uppercase tracking-tighter">Editar Perfil</h1>
          <div className="w-10"></div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* SECCIÓN DE FOTO / LOGO */}
          <div className="flex flex-col items-center py-4">
            <CldUploadWidget 
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_PERFIL}
              onSuccess={(result: any) => {
                const url = result.info.secure_url;
                setFormData(prev => ({ ...prev, profile_pic: url }));
              }}
              options={{
                maxFiles: 1,
                language: 'es',
                sources: ['local', 'camera'],
                styles: { palette: { theme: 'dark' } }
              }}
            >
              {({ open }) => (
                <div 
                  onClick={() => open()}
                  className="group relative w-28 h-28 rounded-3xl border-2 border-dashed border-white/10 bg-black/40 flex items-center justify-center overflow-hidden transition-all hover:border-[#288b55] cursor-pointer"
                >
                  {formData.profile_pic ? (
                    <img 
                      src={formData.profile_pic} 
                      alt="Logo Agencia" 
                      className="w-full h-full object-cover transition-opacity group-hover:opacity-40" 
                    />
                  ) : (
                    <Camera className="text-slate-700 group-hover:text-[#288b55] transition-colors" size={32} />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-[#288b55]/10 transition-opacity">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
              )}
            </CldUploadWidget>
            <p className="text-[9px] font-black uppercase text-slate-500 mt-3 tracking-[0.2em]">Logo de la Agencia</p>
          </div>

          {/* CAMPOS DE TEXTO */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2 px-1">Nombre de la Agencia / Vendedor</label>
              <input 
                type="text"
                className="w-full bg-[#141b1f] border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-[#288b55] transition-all"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2 px-1">Teléfono de contacto</label>
              <input 
                type="text"
                className="w-full bg-[#141b1f] border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-[#288b55] transition-all"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2 px-1">Descripción / Bio</label>
              <textarea 
                rows={4}
                className="w-full bg-[#141b1f] border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-[#288b55] transition-all resize-none"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Contanos sobre tu agencia..."
              />
            </div>
          </div>

          {/* ALERTAS */}
          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase text-center">{error}</div>}
          {success && <div className="p-4 bg-[#288b55]/10 border border-[#288b55]/20 rounded-xl text-[#288b55] text-xs font-bold uppercase text-center">¡Perfil actualizado!</div>}

          {/* BOTÓN GUARDAR */}
          <button 
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-[#288b55] text-white font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-[#288b55]/20"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Guardar Cambios</>}
          </button>

        </form>
      </div>
    </div>
  );
}