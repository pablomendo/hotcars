import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 1. Definimos los dominios raíz (Local y Producción)
  const rootDomains = ['hotcars.com.ar', 'localhost:3000', 'hotcars.com.ar:3000'];
  
  // 2. Buscamos si el hostname actual pertenece a nuestros dominios
  const searchDomain = rootDomains.find(domain => hostname.includes(domain));
  
  if (!searchDomain) return NextResponse.next();

  // 3. Extraemos el subdominio (ej: 'agenciamendo' de 'agenciamendo.hotcars.com.ar')
  const subdomain = hostname.replace(`.${searchDomain}`, '');

  // 4. Casos especiales: Si es el home, www o el dominio pelado, no hacer nada
  if (subdomain === hostname || subdomain === 'www' || subdomain === '') {
    return NextResponse.next();
  }

  // 5. Excluir rutas de sistema, API y archivos con extensión (fotos, iconos, etc)
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 6. REESCRITURA: Redirigir internamente a la carpeta /[subdomain]
  // Si el usuario entra a mendo.hotcars.com.ar/inventario
  // El sistema carga /app/[subdomain]/inventario de forma invisible
  return NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}`, request.url));
}

// El Matcher asegura que el middleware no corra en cada mínima carga de imagen
export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto:
     * 1. /api
     * 2. /_next (internos de Next.js)
     * 3. archivos con extensiones (png, jpg, ico, etc)
     */
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};