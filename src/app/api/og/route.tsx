import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// Inicializamos Supabase (Asegurate de tener estas variables en Vercel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return new Response("ID no proporcionado", { status: 400 });

    // Buscamos los datos reales para evitar URLs largas
    const { data: v, error } = await supabase
      .from('inventario')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !v) return new Response("Vehículo no encontrado", { status: 404 });

    const marca = v.marca || 'Vehículo';
    const modelo = v.modelo || '';
    const version = v.version || '';
    const precio = Number(v.pv || 0).toLocaleString('de-DE');
    const moneda = v.moneda === 'USD' ? 'U$S' : '$';
    const km = v.km?.toLocaleString('de-DE') || '0';
    const anio = v.anio?.toString() || '';
    const fotoUrl = v.fotos?.[0] || 'https://via.placeholder.com/1080x1920?text=HotCars+Pro';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#12242e',
            padding: '40px',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ display: 'flex', width: '100%', height: '60%', borderRadius: '30px', overflow: 'hidden', border: '4px solid #1e3a4a' }}>
            <img src={fotoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '40px', flexGrow: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: '#288b55', fontSize: '30px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>
                HotCars <span style={{ color: '#2596be' }}>PRO</span>
              </span>
            </div>

            <h1 style={{ color: 'white', fontSize: '70px', fontWeight: '900', margin: '10px 0', textTransform: 'uppercase', lineHeight: '0.9' }}>
              {marca} {modelo}
            </h1>
            
            <p style={{ color: '#2596be', fontSize: '35px', fontWeight: '700', margin: '0 0 40px 0', textTransform: 'uppercase' }}>
              {version}
            </p>

            <div style={{ display: 'flex', gap: '30px', marginBottom: '50px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#526b77', fontSize: '20px', fontWeight: '900', textTransform: 'uppercase' }}>Año</span>
                    <span style={{ color: 'white', fontSize: '30px', fontWeight: '700' }}>{anio}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#526b77', fontSize: '20px', fontWeight: '900', textTransform: 'uppercase' }}>Kilómetros</span>
                    <span style={{ color: 'white', fontSize: '30px', fontWeight: '700' }}>{km} KM</span>
                </div>
            </div>

            <div style={{ display: 'flex', backgroundColor: '#288b55', padding: '25px 40px', borderRadius: '20px', marginTop: 'auto' }}>
              <span style={{ color: 'white', fontSize: '80px', fontWeight: '900', letterSpacing: '-2px' }}>
                {moneda} {precio}
              </span>
            </div>
          </div>
        </div>
      ),
      { width: 1080, height: 1920 }
    );
  } catch (e: any) {
    return new Response(`Error`, { status: 500 });
  }
}