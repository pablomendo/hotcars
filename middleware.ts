import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 1. Definimos los dominios raíz (Quitamos los puertos para que sea flexible)
  const rootDomains = ['hotcars.com.ar', 'localhost', '127.0.0.1', '0.0.0.0'];
  
  // Limpiamos el hostname de puertos (ej: 'localhost:3000' -> 'localhost')
  const hostnameWithoutPort = hostname.split(':')[0];

  // 2. Buscamos si el hostname actual pertenece a nuestros dominios
  const searchDomain = rootDomains.find(domain => hostnameWithoutPort === domain || hostnameWithoutPort.endsWith(`.${domain}`));
  
  if (!searchDomain) return NextResponse.next();

  // 3. Extraemos el subdominio
  // Si entramos por localhost:3000, el subdominio debería ser vacío.
  let subdomain = '';
  if (hostnameWithoutPort !== searchDomain) {
    subdomain = hostnameWithoutPort.replace(`.${searchDomain}`, '');
  }

  // 4. Casos especiales: Si es el home, www o no hay subdominio, no hacer nada
  if (subdomain === '' || subdomain === 'www' || subdomain === hostnameWithoutPort) {
    return NextResponse.next();
  }

  // 5. Excluir rutas de sistema, API y archivos con extensión
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 6. REESCRITURA interna a la carpeta del subdominio
  return NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}`, request.url));
}

export const config = {
  matcher: [
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};