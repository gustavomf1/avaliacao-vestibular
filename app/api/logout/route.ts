import { NextResponse } from 'next/server';
import { COOKIE, opcoesCookie } from '@/lib/sessao';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, '', { ...opcoesCookie(), maxAge: 0 });
  return res;
}
