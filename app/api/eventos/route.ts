import { NextResponse } from 'next/server';
import { naoAutorizado, sessaoAtual } from '@/lib/sessao';
import { criarEvento, dataValida, listarEventos, validarEvento } from '@/lib/eventos';

const DIA_MS = 86_400_000;
const INTERVALO_MAX_DIAS = 62;

export async function GET(req: Request) {
  const s = await sessaoAtual();
  if (!s) return naoAutorizado();
  const url = new URL(req.url);
  const de = url.searchParams.get('de');
  const ate = url.searchParams.get('ate');
  if (!dataValida(de) || !dataValida(ate)) return NextResponse.json({ erro: 'Informe de e ate (AAAA-MM-DD).' }, { status: 400 });
  const dias = (Date.parse(ate) - Date.parse(de)) / DIA_MS;
  if (dias < 0 || dias > INTERVALO_MAX_DIAS) return NextResponse.json({ erro: 'Intervalo inválido.' }, { status: 400 });
  return NextResponse.json(await listarEventos(de, ate));
}

export async function POST(req: Request) {
  const s = await sessaoAtual();
  if (!s) return naoAutorizado();
  let corpo: unknown;
  try { corpo = await req.json(); } catch { return NextResponse.json({ erro: 'Requisição inválida.' }, { status: 400 }); }
  const v = validarEvento(corpo);
  if (!v.ok) return NextResponse.json({ erro: v.erro }, { status: 400 });
  return NextResponse.json(await criarEvento(v, s.id), { status: 201 });
}
