import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const COOKIE = 'sessao';
export const DURACAO_S = 60 * 60 * 24 * 7;

export type Sessao = { id: number; nome: string };

function chave() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET ausente ou curta (mínimo 32 caracteres)');
  return new TextEncoder().encode(s);
}

export async function criarToken(s: Sessao) {
  return new SignJWT({ nome: s.nome })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(s.id))
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_S}s`)
    .sign(chave());
}

export async function lerToken(token?: string): Promise<Sessao | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave(), { algorithms: ['HS256'] });
    const id = Number(payload.sub);
    if (!Number.isInteger(id) || typeof payload.nome !== 'string') return null;
    return { id, nome: payload.nome };
  } catch {
    return null;
  }
}

export async function sessaoAtual() {
  const c = await cookies();
  return lerToken(c.get(COOKIE)?.value);
}

export function naoAutorizado() {
  return NextResponse.json({ erro: 'Sessão expirada. Entre de novo.' }, { status: 401 });
}

export function opcoesCookie() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: DURACAO_S,
  };
}
