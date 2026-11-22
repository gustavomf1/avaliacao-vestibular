type Intervalo = { id: string; inicio: string; fim: string };
export type Posicao = { col: number; total: number };

/** "HH:MM" -> minutos desde a meia-noite. */
export const minutos = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));

/**
 * Distribui eventos sobrepostos em colunas. Eventos que se cruzam (direta ou
 * indiretamente) formam um grupo; cada um pega a primeira coluna livre e todos
 * do grupo dividem a largura pelo número de colunas do grupo.
 * Encostar (um termina 11:00, outro começa 11:00) não é sobreposição.
 */
export function colunas<T extends Intervalo>(evs: T[]): Map<string, Posicao> {
  const res = new Map<string, Posicao>();
  const ord = [...evs].sort((a, b) => minutos(a.inicio) - minutos(b.inicio) || minutos(a.fim) - minutos(b.fim));
  let grupo: string[] = [];
  let fimCols: number[] = [];
  let fimGrupo = -1;

  const fechar = () => {
    for (const id of grupo) res.get(id)!.total = fimCols.length;
    grupo = [];
    fimCols = [];
  };

  for (const e of ord) {
    const ini = minutos(e.inicio);
    const fim = minutos(e.fim);
    if (ini >= fimGrupo) fechar();
    let col = fimCols.findIndex(f => f <= ini);
    if (col === -1) col = fimCols.length;
    fimCols[col] = fim;
    grupo.push(e.id);
    res.set(e.id, { col, total: 0 });
    fimGrupo = Math.max(fimGrupo, fim);
  }
  fechar();
  return res;
}

/** Horas mostradas na linha do tempo: 7 às 19, estendendo para caber todos os eventos. */
export function faixaHoras(evs: Intervalo[]): { de: number; ate: number } {
  let de = 7;
  let ate = 19;
  for (const e of evs) {
    de = Math.min(de, Math.floor(minutos(e.inicio) / 60));
    ate = Math.max(ate, Math.ceil(minutos(e.fim) / 60));
  }
  return { de, ate };
}
