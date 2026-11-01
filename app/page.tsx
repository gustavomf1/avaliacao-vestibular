import { redirect } from 'next/navigation';
import { sessaoAtual } from '@/lib/sessao';
import { listarResumo } from '@/lib/avaliacoes';
import Lista from './Lista';

export const dynamic = 'force-dynamic';

export default async function Inicio() {
  const s = await sessaoAtual();
  if (!s) redirect('/login');
  return <Lista usuario={s} itensIniciais={await listarResumo()} />;
}
