export type DadosEvento = { titulo: string; participantes: string[]; descricao: string; dia: string; inicio: string; fim: string };
export type Validacao = ({ ok: true } & DadosEvento) | { ok: false; erro: string };

export const TITULO_MAX = 120;
export const PARTICIPANTE_MAX = 80;
export const PARTICIPANTES_QTD_MAX = 30;
export const DESCRICAO_MAX = 1000;

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
  if (!titulo) return { ok: false, erro: 'Informe o título do evento.' };
  if (titulo.length > TITULO_MAX) return { ok: false, erro: `O título pode ter até ${TITULO_MAX} caracteres.` };

  const brutos = c.participantes ?? [];
  if (!Array.isArray(brutos) || brutos.some(p => typeof p !== 'string')) return { ok: false, erro: 'Participantes inválidos.' };
  const participantes = (brutos as string[]).map(p => p.trim()).filter(Boolean);
  if (participantes.length > PARTICIPANTES_QTD_MAX) return { ok: false, erro: `Até ${PARTICIPANTES_QTD_MAX} participantes por evento.` };
  if (participantes.some(p => p.length > PARTICIPANTE_MAX)) return { ok: false, erro: `Cada participante pode ter até ${PARTICIPANTE_MAX} caracteres.` };

  const descricao = typeof c.descricao === 'string' ? c.descricao.trim() : '';
  if (descricao.length > DESCRICAO_MAX) return { ok: false, erro: `A descrição pode ter até ${DESCRICAO_MAX} caracteres.` };

  if (!dataValida(c.dia)) return { ok: false, erro: 'Informe um dia válido.' };
  if (typeof c.inicio !== 'string' || !HORA.test(c.inicio)) return { ok: false, erro: 'Informe a hora de início.' };
  if (typeof c.fim !== 'string' || !HORA.test(c.fim)) return { ok: false, erro: 'Informe a hora de fim.' };
  if (c.fim <= c.inicio) return { ok: false, erro: 'A hora de fim precisa ser depois da hora de início.' };
  return { ok: true, titulo, participantes, descricao, dia: c.dia, inicio: c.inicio, fim: c.fim };
}
