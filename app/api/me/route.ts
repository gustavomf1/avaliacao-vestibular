import { NextResponse } from 'next/server';
import { naoAutorizado, sessaoAtual } from '@/lib/sessao';

export async function GET() {
  const s = await sessaoAtual();
  if (!s) return naoAutorizado();
  return NextResponse.json(s);
}
