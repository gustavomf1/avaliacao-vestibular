import { NextResponse } from 'next/server';
import { naoAutorizado, sessaoAtual } from '@/lib/sessao';
import { carregarPacientes } from '@/lib/relatorios';
import { gerarPlanilha } from '@/lib/planilha';

export async function GET() {
  if (!(await sessaoAtual())) return naoAutorizado();
  const buf = await gerarPlanilha(await carregarPacientes());
  const dia = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="dados-pesquisa-${dia}.xlsx"`,
    },
  });
}
