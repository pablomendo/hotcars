import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parámetros dinámicos
    const marca = searchParams.get('marca') || 'Vehículo';
    const modelo = searchParams.get('modelo') || '';
    const version = searchParams.get('version') || '';
    const precio = searchParams.get('precio') || 'Consultar';
    const moneda = searchParams.get('moneda') || 'U$S';
    const km = searchParams.get('km') || '0';
    const anio = searchParams.get('anio') || '2024';
    
    // Captura de la foto
    const fotoRaw = searchParams.get('foto');
    let fotoUrl = 'https://via.placeholder.com/1080x1920?text=HotCars+Pro';

    if (fotoRaw) {
      try {
        fotoUrl = decodeURIComponent(fotoRaw);
      } catch (e) {
        console.error("Error decodificando foto:", e);
      }
    }

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
          {/* FOTO DEL AUTO */}
          <div style={{ 
            display: 'flex', 
            width: '100%', 
            height: '60%', 
            borderRadius: '30px', 
            overflow: 'hidden', 
            border: '4px solid #1e3a4a' 
          }}>
            <img
              src={fotoUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* CONTENIDO INFO */}
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '40px', flexGrow: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ 
                color: '#288b55', 
                fontSize: '30px', 
                fontWeight: '900', 
                letterSpacing: '2px', 
                textTransform: 'uppercase' 
              }}>
                HotCars <span style={{ color: '#2596be' }}>PRO</span>
              </span>
            </div>

            <h1 style={{ 
              color: 'white', 
              fontSize: '70px', 
              fontWeight: '900', 
              margin: '10px 0', 
              textTransform: 'uppercase', 
              lineHeight: '0.9' 
            }}>
              {marca} {modelo}
            </h1>
            
            <p style={{ 
              color: '#2596be', 
              fontSize: '35px', 
              fontWeight: '700', 
              margin: '0 0 40px 0', 
              textTransform: 'uppercase' 
            }}>
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

            <div style={{ 
                display: 'flex', 
                backgroundColor: '#288b55', 
                padding: '25px 40px', 
                borderRadius: '20px',
                marginTop: 'auto'
            }}>
              <span style={{ color: 'white', fontSize: '80px', fontWeight: '900', letterSpacing: '-2px' }}>
                {moneda} {precio}
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1920,
      }
    );
  } catch (e: any) {
    console.error("OG Error:", e.message);
    return new Response(`Error generando placa`, { status: 500 });
  }
}