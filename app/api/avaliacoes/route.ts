import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { naoAutorizado, sessaoAtual } from '@/lib/sessao';
import { listarResumo, validarRespostas } from '@/lib/avaliacoes';

export async function GET() {
  const s = await sessaoAtual();
  if (!s) return naoAutorizado();
  return NextResponse.json(await listarResumo());
}

export async function POST(req: Request) {
  const s = await sessaoAtual();
  if (!s) return naoAutorizado();
  let corpo: unknown;
  try { corpo = await req.json(); } catch { return NextResponse.json({ erro: 'Requisição inválida.' }, { status: 400 }); }
  const v = validarRespostas(corpo);
  if (!v.ok) return NextResponse.json({ erro: v.erro }, { status: 400 });

  const { rows } = await db().query<{ id: string; atualizado_em: Date }>(
    `insert into avaliacoes (autor_id, paciente_nome, paciente_idade, data_avaliacao, respostas, atualizado_por)
     values ($1, $2, $3, $4, $5, $1) returning id, atualizado_em`,
    [s.id, v.nome, v.idade, v.data, JSON.stringify(v.respostas)]
  );
  return NextResponse.json({ id: rows[0].id, atualizado_em: rows[0].atualizado_em.toISOString() }, { status: 201 });
}
