export const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function dp(xs: number[]) {
  if (xs.length < 2) return null;
  const m = media(xs);
  return Math.sqrt(xs.reduce((t, x) => t + (x - m) ** 2, 0) / (xs.length - 1));
}

function erf(x: number) {
  const s = Math.sign(x), a = Math.abs(x);
  const t = 1 / (1 + 0.5 * a);
  const y = 1 - t * Math.exp(-a * a - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return s * y;
}

export const normalCdf = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2));

function inverter(m: number[][]): number[][] | null {
  const n = m.length;
  const a = m.map((l, i) => [...l, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
    if (Math.abs(a[p][c]) < 1e-12) return null;
    [a[c], a[p]] = [a[p], a[c]];
    const piv = a[c][c];
    for (let j = 0; j < 2 * n; j++) a[c][j] /= piv;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = a[r][c];
      if (f !== 0) for (let j = 0; j < 2 * n; j++) a[r][j] -= f * a[c][j];
    }
  }
  return a.map(l => l.slice(n));
}

export type Coeficiente = { or: number; ic: [number, number]; p: number };
export type Ajuste =
  | { ok: true; n: number; eventos: number; coefs: Coeficiente[] }
  | { ok: false; n: number; eventos: number; motivo: 'sem-variacao' | 'poucos-eventos' | 'nao-convergiu' | 'separacao' };

export function regressaoLogistica(x: number[][], y: number[], minEventosPorPreditor = 0): Ajuste {
  const n = y.length, eventos = y.filter(v => v === 1).length, k = (x[0]?.length ?? 0) + 1;
  if (n === 0 || eventos === 0 || eventos === n) return { ok: false, n, eventos, motivo: 'sem-variacao' };
  if (Math.min(eventos, n - eventos) < minEventosPorPreditor * (k - 1)) return { ok: false, n, eventos, motivo: 'poucos-eventos' };
  const X = x.map(l => [1, ...l]);
  let b = new Array(k).fill(0);
  let cov: number[][] | null = null;
  let convergiu = false;
  for (let it = 0; it < 100; it++) {
    const p = X.map(l => 1 / (1 + Math.exp(-l.reduce((t, v, j) => t + v * b[j], 0))));
    const h = Array.from({ length: k }, () => new Array(k).fill(0));
    const g = new Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      const w = p[i] * (1 - p[i]);
      for (let a = 0; a < k; a++) {
        g[a] += X[i][a] * (y[i] - p[i]);
        for (let c = 0; c < k; c++) h[a][c] += w * X[i][a] * X[i][c];
      }
    }
    cov = inverter(h);
    if (!cov) return { ok: false, n, eventos, motivo: 'separacao' };
    const passo = cov.map(l => l.reduce((t, v, j) => t + v * g[j], 0));
    b = b.map((v, j) => v + passo[j]);
    if (b.some(v => !Number.isFinite(v) || Math.abs(v) > 30)) return { ok: false, n, eventos, motivo: 'separacao' };
    if (Math.max(...passo.map(Math.abs)) < 1e-8) { convergiu = true; break; }
  }
  if (!convergiu || !cov) return { ok: false, n, eventos, motivo: 'nao-convergiu' };
  const pf = X.map(l => 1 / (1 + Math.exp(-l.reduce((t, v, j) => t + v * b[j], 0))));
  const ses = cov.map((l, j) => Math.sqrt(l[j]));
  if (pf.every((v, i) => Math.abs(v - y[i]) < 1e-4) || ses.some(s => !Number.isFinite(s) || s > 1e3)) {
    return { ok: false, n, eventos, motivo: 'separacao' };
  }
  const coefs = b.slice(1).map((v, j) => {
    const se = ses[j + 1];
    return { or: Math.exp(v), ic: [Math.exp(v - 1.959964 * se), Math.exp(v + 1.959964 * se)] as [number, number], p: 2 * (1 - normalCdf(Math.abs(v / se))) };
  });
  return { ok: true, n, eventos, coefs };
}
