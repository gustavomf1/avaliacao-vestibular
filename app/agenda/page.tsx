import { redirect } from 'next/navigation';
import { sessaoAtual } from '@/lib/sessao';
import Agenda from './Agenda';

export const dynamic = 'force-dynamic';

export default async function PaginaAgenda() {
  const s = await sessaoAtual();
  if (!s) redirect('/login?voltar=/agenda');
  return <Agenda />;
}
