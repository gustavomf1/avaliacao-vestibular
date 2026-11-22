import { NextResponse } from 'next/server';
import { naoAutorizado, sessaoAtual } from '@/lib/sessao';
import { idValido } from '@/lib/avaliacoes';
import { atualizarEvento, buscarEvento, excluirEvento, validarEvento } from '@/lib/eventos';

const naoEncontrado = () => NextResponse.json({ erro: 'Evento não encontrado.' }, { status: 404 });

export async function GET(_req: Request, ctx: RouteContext<'/api/eventos/[id]'>) {
  const s = await sessaoAtual();
  if (!s) return naoAutorizado();
  const { id } = await ctx.params;
  if (!idValido(id)) return naoEncontrado();
  const e = await buscarEvento(id);
  return e ? NextResponse.json(e) : naoEncontrado();
}

export async function PUT(req: Request, ctx: RouteContext<'/api/eventos/[id]'>) {
  const s = await sessaoAtual();
  if (!s) return naoAutorizado();
  const { id } = await ctx.params;
  if (!idValido(id)) return naoEncontrado();
  let corpo: unknown;
  try { corpo = await req.json(); } catch { return NextResponse.json({ erro: 'Requisição inválida.' }, { status: 400 }); }
  const v = validarEvento(corpo);
  if (!v.ok) return NextResponse.json({ erro: v.erro }, { status: 400 });
  const e = await atualizarEvento(id, v, s.id);
  return e ? NextResponse.json(e) : naoEncontrado();
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/eventos/[id]'>) {
  const s = await sessaoAtual();
  if (!s) return naoAutorizado();
  const { id } = await ctx.params;
  if (!idValido(id)) return naoEncontrado();
  return (await excluirEvento(id)) ? NextResponse.json({ ok: true }) : naoEncontrado();
}
