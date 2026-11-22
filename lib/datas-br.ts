// Datas e horas no padrão brasileiro, independente do idioma do navegador.

/** Formata o que foi digitado como DD/MM/AAAA, colocando as barras sozinho. */
export function mascaraData(texto: string) {
  const d = texto.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** "22/11/2026" -> "2026-11-22"; null se incompleta ou inexistente. */
export function brParaIso(br: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(iso + 'T00:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso ? iso : null;
}

export const isoParaBr = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

export const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

/** Minutos de 5 em 5; se o valor atual estiver fora do passo, entra na lista para não se perder. */
export function opcoesMinuto(atual: string) {
  const base = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
  return base.includes(atual) ? base : [...base, atual].sort();
}

const emMin = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
const emHora = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** Ao mudar o início, o fim acompanha mantendo a duração (1 h se a duração não for válida), sem passar de 23:59. */
export function fimAoMudarInicio(inicioAntigo: string, fimAntigo: string, novoInicio: string) {
  const dur = emMin(fimAntigo) - emMin(inicioAntigo);
  return emHora(Math.min(emMin(novoInicio) + (dur > 0 ? dur : 60), 23 * 60 + 59));
}
