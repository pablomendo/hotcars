import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SKIP_PREFIXES = ['/_next', '/api', '/favicon', '/fonts', '/images', '/slider_front', '/logo', '/portada', '/hero', '/auth'];

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  const hostname = (request.headers.get('host') || '').split(':')[0];

  // 1. Si tiene un punto (archivo) o está en la lista de SKIP, que pase directo a /public
  if (pathname.includes('.') || SKIP_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2. Si ya viene con el path de agencia, no tocamos nada
  if (pathname.startsWith('/agencia/')) return NextResponse.next();

  let slug: string | null = null;

  // Lógica de detección de subdominio
  if (hostname.endsWith('.localhost')) {
    slug = hostname.slice(0, hostname.lastIndexOf('.localhost')) || null;
  } else if (hostname.endsWith('.hotcars.com.ar')) {
    const s = hostname.slice(0, hostname.lastIndexOf('.hotcars.com.ar'));
    slug = (s && s !== 'www') ? s : null;
  }

  // Dev fallback: /sub/[slug]
  if (!slug) {
    const m = pathname.match(/^\/sub\/([^/]+)/);
    if (m) slug = m[1];
  }

  if (slug) {
    // REWRITE LIMPIO: Si es la raíz, solo mandamos al slug. 
    // Esto evita que Next.js se maree con los layouts.
    url.pathname = `/agencia/${slug}${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Excluimos explícitamente archivos con extensión (.png, .jpg, etc.) 
     * para que el middleware ni se entere que existen.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};