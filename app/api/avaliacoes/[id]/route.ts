import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { naoAutorizado, sessaoAtual } from '@/lib/sessao';
import { buscar, idValido, validarRespostas } from '@/lib/avaliacoes';

const naoEncontrada = () => NextResponse.json({ erro: 'Avaliação não encontrada.' }, { status: 404 });

export async function GET(_req: Request, ctx: RouteContext<'/api/avaliacoes/[id]'>) {
  const s = await sessaoAtual();
  if (!s) return naoAutorizado();
  const { id } = await ctx.params;
  if (!idValido(id)) return naoEncontrada();
  const a = await buscar(id);
  return a ? NextResponse.json(a) : naoEncontrada();
}

export async function PUT(req: Request, ctx: RouteContext<'/api/avaliacoes/[id]'>) {
  const s = await sessaoAtual();
  if (!s) return naoAutorizado();
  const { id } = await ctx.params;
  if (!idValido(id)) return naoEncontrada();
  let corpo: unknown;
  try { corpo = await req.json(); } catch { return NextResponse.json({ erro: 'Requisição inválida.' }, { status: 400 }); }
  const v = validarRespostas(corpo);
  if (!v.ok) return NextResponse.json({ erro: v.erro }, { status: 400 });

  const { rows } = await db().query<{ atualizado_em: Date }>(
    `update avaliacoes set paciente_nome = $2, paciente_idade = $3, data_avaliacao = $4, respostas = $5,
       atualizado_em = now(), atualizado_por = $6
     where id = $1 returning atualizado_em`,
    [id, v.nome, v.idade, v.data, JSON.stringify(v.respostas), s.id]
  );
  if (!rows[0]) return naoEncontrada();
  return NextResponse.json({ id, atualizado_em: rows[0].atualizado_em.toISOString() });
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/avaliacoes/[id]'>) {
  const s = await sessaoAtual();
  if (!s) return naoAutorizado();
  const { id } = await ctx.params;
  if (!idValido(id)) return naoEncontrada();
  const r = await db().query('delete from avaliacoes where id = $1', [id]);
  return r.rowCount ? NextResponse.json({ ok: true }) : naoEncontrada();
}
