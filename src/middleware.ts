import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SKIP = ['/_next', '/api', '/favicon', '/fonts', '/images', '/slider_front', '/logo', '/portada', '/hero', '/auth'];

export function middleware(request: NextRequest) {
  const url      = request.nextUrl.clone();
  const pathname = url.pathname;
  const hostname = (request.headers.get('host') || '').split(':')[0];

  if (SKIP.some(p => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.startsWith('/agencia/')) return NextResponse.next();

  let slug: string | null = null;

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
    url.pathname = `/agencia/${slug}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};