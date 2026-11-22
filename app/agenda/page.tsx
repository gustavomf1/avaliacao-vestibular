import { redirect } from 'next/navigation';
import { sessaoAtual } from '@/lib/sessao';
import Agenda from './Agenda';
import { dataValida } from '@/lib/eventos-validar';

export const dynamic = 'force-dynamic';

export default async function PaginaAgenda({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await sessaoAtual();
  if (!s) redirect('/login?voltar=/agenda');
  const q = await searchParams;
  const dia = typeof q.dia === 'string' && dataValida(q.dia) ? q.dia : null;
  const evento = typeof q.evento === 'string' ? q.evento : null;
  return <Agenda usuario={s.nome} diaInicial={dia} eventoInicial={evento} />;
}
