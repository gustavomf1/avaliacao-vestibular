import { NextResponse } from 'next/server';
import { naoAutorizado, sessaoAtual } from '@/lib/sessao';
import { carregarPacientes } from '@/lib/relatorios';
import { gerarTabela } from '@/lib/planilha';

export async function GET(_req: Request, { params }: { params: Promise<{ n: string }> }) {
  if (!(await sessaoAtual())) return naoAutorizado();
  const { n } = await params;
  const numero = Number(n);
  const buf = Number.isInteger(numero) ? await gerarTabela(await carregarPacientes(), numero) : null;
  if (!buf) return NextResponse.json({ erro: 'Tabela não encontrada.' }, { status: 404 });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="tabela-${numero}.xlsx"`,
    },
  });
}
