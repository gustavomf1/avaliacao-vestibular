export type DadosEvento = { titulo: string; participantes: string; dia: string; inicio: string; fim: string };
export type Validacao = ({ ok: true } & DadosEvento) | { ok: false; erro: string };

export const TITULO_MAX = 120;
export const PARTICIPANTES_MAX = 500;

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export function dataValida(s: unknown): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function validarEvento(corpo: unknown): Validacao {
  if (!corpo || typeof corpo !== 'object') return { ok: false, erro: 'Requisição inválida.' };
  const c = corpo as Record<string, unknown>;
  const titulo = typeof c.titulo === 'string' ? c.titulo.trim() : '';
  const participantes = typeof c.participantes === 'string' ? c.participantes.trim() : '';
  if (!titulo) return { ok: false, erro: 'Informe o título do evento.' };
  if (titulo.length > TITULO_MAX) return { ok: false, erro: `O título pode ter até ${TITULO_MAX} caracteres.` };
  if (participantes.length > PARTICIPANTES_MAX) return { ok: false, erro: `Participantes pode ter até ${PARTICIPANTES_MAX} caracteres.` };
  if (!dataValida(c.dia)) return { ok: false, erro: 'Informe um dia válido.' };
  if (typeof c.inicio !== 'string' || !HORA.test(c.inicio)) return { ok: false, erro: 'Informe a hora de início.' };
  if (typeof c.fim !== 'string' || !HORA.test(c.fim)) return { ok: false, erro: 'Informe a hora de fim.' };
  if (c.fim <= c.inicio) return { ok: false, erro: 'A hora de fim precisa ser depois da hora de início.' };
  return { ok: true, titulo, participantes, dia: c.dia, inicio: c.inicio, fim: c.fim };
}
