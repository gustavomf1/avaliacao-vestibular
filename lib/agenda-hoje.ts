type EvHoje = { id: string; inicio: string; fim: string; participantes: string[] };
export type Situacao = { tipo: 'agora' | 'logo' | 'depois' | 'passou'; texto: string };

const min = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

/** Situação de um evento de hoje em relação ao minuto atual do dia. */
export function situacao(e: EvHoje, agora: number): Situacao {
  const ini = min(e.inicio);
  const fim = min(e.fim);
  if (agora >= fim) return { tipo: 'passou', texto: 'Terminou' };
  if (agora >= ini) return { tipo: 'agora', texto: 'Agora' };
  if (ini - agora < 60) return { tipo: 'logo', texto: `em ${ini - agora} min` };
  const falta = ini - agora;
  const m = falta % 60;
  return { tipo: 'depois', texto: `em ${Math.floor(falta / 60)}h${m ? String(m).padStart(2, '0') : ''}` };
}

/** Eventos ainda não terminados, por horário de início, e quantos já terminaram. */
export function resumoHoje<T extends EvHoje>(evs: T[], agora: number) {
  const proximos = evs
    .filter(e => min(e.fim) > agora)
    .sort((a, b) => min(a.inicio) - min(b.inicio) || min(a.fim) - min(b.fim));
  return { proximos, passaram: evs.length - proximos.length };
}

export function participa(participantes: string[], nome: string) {
  const n = norm(nome);
  return !!n && participantes.some(p => norm(p) === n);
}
