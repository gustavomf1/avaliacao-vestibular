import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, lerToken } from '@/lib/sessao';

const PUBLICAS = ['/login', '/api/login'];

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const sessao = await lerToken(req.cookies.get(COOKIE)?.value);
  const publica = PUBLICAS.includes(pathname);

  if (sessao && pathname === '/login') return NextResponse.redirect(new URL('/', req.url));
  if (sessao || publica) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ erro: 'Sessão expirada. Entre de novo.' }, { status: 401 });
  }
  const destino = new URL('/login', req.url);
  if (pathname !== '/') destino.searchParams.set('voltar', pathname + search);
  return NextResponse.redirect(destino);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|escores.js).*)'],
};
