"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function getVehicleSlug(v: any): string {
  const slug = `${v.marca}-${v.modelo}-${v.anio}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return `${slug}-${v.id}`;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      if (!params.id) return;
      try {
        setLoading(true);
        const { data: profile } = await supabase.from('usuarios').select('*').eq('auth_id', params.id).single();
        if (profile) setUserProfile(profile);

        const { data: units } = await supabase.from('inventario').select('*').eq('owner_user_id', params.id).eq('inventory_status', 'activo').order('created_at', { ascending: false });
        if (units) {
          setVehicles(units.map(v => ({
            ...v,
            brand: v.marca,
            model: v.modelo,
            year: v.anio,
            images: v.fotos || [],
            price: Number(v.pv) || 0,
            currency: v.moneda === 'USD' ? 'U$S ' : '$ ',
            versionName: v.version || ''
          })));
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    fetchUserData();
  }, [params.id]);

  if (loading) return null;

  return (
    <div className="min-h-screen w-full bg-[#f0f2f5] pt-[80px]">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Genos:wght@400;700;900&family=Instrument+Serif&display=swap');
      `}</style>

      {/* Franja Verde */}
      <div className="w-full h-64 md:h-72 flex flex-col items-center text-center px-6 bg-[#00984a]">
        <h1
          className="text-4xl md:text-[68px] font-normal text-white tracking-tight"
          style={{ fontFamily: '"Instrument Serif", serif', marginTop: 'calc(3rem + 20px)' }}
        >
          <span className="hidden md:inline" style={{ position: 'relative', top: '-3px' }}>Perfil de Usuario</span>
          <span className="md:hidden" style={{ position: 'relative', top: '20px' }}>Perfil de Usuario</span>
        </h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-24 md:-mt-28 flex flex-col items-center">
        {/* Card Perfil */}
        <div className="w-full bg-white p-8 mb-10 shadow-lg flex flex-col items-center text-center" style={{ borderRadius: '12px', fontFamily: '"Genos", sans-serif', fontWeight: 400 }}>
          <div className="h-20 w-20 relative bg-gray-50 border border-gray-100 mb-4" style={{ borderRadius: '4px' }}>
            {userProfile?.profile_pic && <Image src={userProfile.profile_pic} alt="Perfil" fill className="object-cover" unoptimized style={{ borderRadius: '4px' }} />}
          </div>
          <h2 className="text-2xl font-bold uppercase tracking-tighter italic text-gray-900 leading-none">
            {userProfile?.full_name || `${userProfile?.nombre || ''} ${userProfile?.apellido || ''}`}
          </h2>
          <p className="text-gray-400 font-bold text-sm mt-1">{userProfile?.email}</p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <span className="bg-gray-950 text-white px-4 py-1.5 text-[12px] font-bold uppercase tracking-widest" style={{ borderRadius: '4px' }}>
              {vehicles.length} STOCK
            </span>
            {userProfile?.phone && (
              <span className="bg-green-100 text-green-700 px-4 py-1.5 text-[12px] font-bold uppercase tracking-widest" style={{ borderRadius: '4px' }}>
                WA: {userProfile.phone}
              </span>
            )}
            {userProfile?.location && (
              <span className="bg-gray-100 text-gray-500 px-4 py-1.5 text-[12px] font-bold uppercase tracking-widest" style={{ borderRadius: '4px' }}>
                {userProfile.location.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Título Unidades Publicadas */}
        <div className="mb-10 text-center">
          <h2 className="text-[20px] uppercase italic tracking-[0.4em] text-gray-400" style={{ fontFamily: '"Genos", sans-serif', fontWeight: 400 }}>
            UNIDADES PUBLICADAS
          </h2>
        </div>

        {/* Grid: 2 columnas Mobile / 6 columnas Desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pb-20 w-full">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-white border border-gray-100 flex flex-col group transition-all hover:shadow-md cursor-pointer"
              style={{ borderRadius: '4px' }}
              onClick={() => router.push(`/vehiculos/${getVehicleSlug(v)}`)}
            >
              <div className="relative aspect-video overflow-hidden bg-gray-50" style={{ borderRadius: '4px 4px 0 0' }}>
                <Image src={v.images[0] || '/placeholder.jpg'} alt={v.model} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
              </div>
              <div className="p-2 flex flex-col flex-1 text-left">
                <h3 className="font-bold text-[10px] uppercase tracking-tighter text-gray-900 truncate mb-0.5">{v.brand} {v.model}</h3>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-gray-900 text-[9px] font-bold">{v.year}</span>
                  <span className="text-[8px] font-medium text-gray-400">{v.km?.toLocaleString('es-AR')} KM</span>
                </div>
                <p className="text-[#38bdf8] text-[8px] font-bold uppercase tracking-tight truncate mb-2">{v.versionName}</p>
                <div className="mt-auto pt-2 border-t border-gray-50 flex flex-col gap-2">
                  <span className="text-[11px] font-black text-green-600 tracking-tighter leading-none">{v.currency}{v.price.toLocaleString('es-AR')}</span>
                  <button
                    className="w-full bg-[#111827] text-white text-[7px] font-bold py-1.5 uppercase tracking-widest"
                    style={{ borderRadius: '2px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/vehiculos/${getVehicleSlug(v)}`);
                    }}
                  >
                    DETALLES
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}