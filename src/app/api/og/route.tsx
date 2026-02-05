import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return new Response("ID no proporcionado", { status: 400 });

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

    // Lógica comercial dinámica
    const aceptaPermuta = v.acepta_permuta === true || v.permuta === true;
    const esFinanciable = v.financiacion === true || v.cuotas === true;

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
            
            <p style={{ color: '#2596be', fontSize: '35px', fontWeight: '700', margin: '0 0 30px 0', textTransform: 'uppercase' }}>
              {version}
            </p>

            <div style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#526b77', fontSize: '20px', fontWeight: '900', textTransform: 'uppercase' }}>Año</span>
                    <span style={{ color: 'white', fontSize: '30px', fontWeight: '700' }}>{anio}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#526b77', fontSize: '20px', fontWeight: '900', textTransform: 'uppercase' }}>Kilómetros</span>
                    <span style={{ color: 'white', fontSize: '30px', fontWeight: '700' }}>{km} KM</span>
                </div>
            </div>

            {/* SECCIÓN COMERCIAL DINÁMICA */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              {aceptaPermuta && (
                <div style={{ backgroundColor: '#2596be', padding: '10px 20px', borderRadius: '12px', display: 'flex' }}>
                  <span style={{ color: 'white', fontSize: '18px', fontWeight: '900', textTransform: 'uppercase' }}>Acepta Permuta</span>
                </div>
              )}
              {esFinanciable && (
                <div style={{ backgroundColor: 'white', padding: '10px 20px', borderRadius: '12px', display: 'flex', border: '2px solid #288b55' }}>
                  <span style={{ color: '#288b55', fontSize: '18px', fontWeight: '900', textTransform: 'uppercase' }}>Financiación</span>
                </div>
              )}
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