import { NextResponse } from 'next/server';
import { naoAutorizado, sessaoAtual } from '@/lib/sessao';
import { listar } from '@/lib/avaliacoes';

function agoraSaoPaulo() {
  const local = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 19);
  return { iso: `${local}-03:00`, dia: local.slice(0, 10) };
}

export async function GET() {
  const s = await sessaoAtual();
  if (!s) return naoAutorizado();
  const avaliacoes = (await listar()).map(a => ({
    id: a.id,
    autor: a.autor,
    atualizado_por: a.atualizado_por,
    criado_em: a.criado_em,
    atualizado_em: a.atualizado_em,
    respostas: a.respostas,
    escores: a.escores,
  }));
  const agora = agoraSaoPaulo();
  const corpo = {
    sistema: 'avaliacao-vestibular',
    versao_formato: 1,
    gerado_em: agora.iso,
    gerado_por: { id: s.id, nome: s.nome },
    total: avaliacoes.length,
    avaliacoes,
  };
  return new NextResponse(JSON.stringify(corpo, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="backup-avaliacoes-${agora.dia}.json"`,
    },
  });
}
