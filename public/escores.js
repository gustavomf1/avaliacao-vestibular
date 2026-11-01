export const DHI_F = [1, 4, 8, 11, 13, 17, 25];
export const DHI_FU = [3, 5, 6, 7, 12, 14, 16, 19, 24];
export const DHI_E = [2, 9, 10, 15, 18, 20, 21, 22, 23];
export const DHI_N = 25;
export const EVA_N = 9;
export const MB_ITENS = [1, 2, [3], 4, 5, [6], 7, 8, 9, 10, 11, 12, 13, 14].map(x => Array.isArray(x) ? { n: x[0], sides: true } : { n: x });
export const MB_REF = [[50, 59, '26,3', '25,7–26,8'], [60, 69, '24,7', '23,6–25,8'], [70, 79, '21,0', '19,5–22,4'], [80, 89, '19,6', '17,6–21,6']];
export const CS_OR_KEYS = ['cs_or_ano', 'cs_or_mes', 'cs_or_dia'];
export const CS_FLU = [[0, 5, 0], [6, 8, 1], [9, 11, 2], [12, 14, 3], [15, 99, 4]];

const IRREG = 'Aquele que realiza atividade física, porém insuficiente para ser classificado como ativo, pois não cumpre as recomendações quanto à frequência ou duração. ';
export const IPAQ_DESC = {
  'Muito ativo': 'Aquele que cumpriu as recomendações de: a) VIGOROSA ≥ 5 dias/sem e ≥ 30 minutos por sessão; ou b) VIGOROSA ≥ 3 dias/sem e ≥ 20 minutos por sessão + MODERADA e/ou CAMINHADA ≥ 5 dias/sem e ≥ 30 minutos por sessão.',
  'Ativo': 'Aquele que cumpriu as recomendações de: a) VIGOROSA ≥ 3 dias/sem e ≥ 20 minutos por sessão; ou b) MODERADA ou CAMINHADA ≥ 5 dias/sem e ≥ 30 minutos por sessão; ou c) qualquer atividade somada ≥ 5 dias/sem e ≥ 150 minutos/sem (caminhada + moderada + vigorosa).',
  'Irregularmente ativo A': IRREG + 'Atinge pelo menos um dos critérios da recomendação quanto à frequência ou quanto à duração da atividade: a) frequência: 5 dias/semana; ou b) duração: 150 min/semana.',
  'Irregularmente ativo B': IRREG + 'Não atingiu nenhum dos critérios da recomendação quanto à frequência nem quanto à duração.',
  'Sedentário': 'Aquele que não realizou nenhuma atividade física por pelo menos 10 minutos contínuos durante a semana.'
};

export function leitor(d) {
  return n => {
    const v = d ? d[n] : undefined;
    if (v === undefined || v === null || Array.isArray(v)) return '';
    return String(v);
  };
}

export function scoreDHI(get) {
  const s = arr => arr.reduce((t, q) => t + (+get('dhi_' + q) || 0), 0);
  const f = s(DHI_F), fu = s(DHI_FU), e = s(DHI_E), total = f + fu + e;
  let n = 0;
  for (let i = 1; i <= DHI_N; i++) if (get('dhi_' + i) !== '') n++;
  const level = total <= 30 ? 'leve' : total <= 60 ? 'moderada' : 'severa';
  return { f, fu, e, total, n, level };
}

export function scoreEVA(get) {
  const vals = [];
  for (let i = 1; i <= EVA_N; i++) { const v = get('eva_' + i); if (v !== '') vals.push(Number(v)); }
  const n = vals.length, mean = n ? vals.reduce((a, b) => a + b, 0) / n : 0;
  const level = mean === 0 ? 'sem' : mean <= 4 ? 'leve' : mean <= 7 ? 'moderada' : 'severa';
  return { n, mean, level };
}

export function scoreVAP(get, k, len) {
  let sum = 0, n = 0, na = 0;
  for (let i = 1; i <= len; i++) { const v = get(`${k}_${i}`); if (v === 'NA') na++; else if (v !== '') { sum += +v; n++; } }
  return { sum, n, na, mean: n ? sum / n : 0 };
}

export function scoreMini(get) {
  let total = 0, n = 0;
  for (const it of MB_ITENS) {
    if (it.sides) {
      const e = get(`mb_${it.n}e`), d = get(`mb_${it.n}d`);
      if (e !== '' && d !== '') { total += Math.min(+e, +d); n++; }
      else if (e !== '' || d !== '') total += +(e !== '' ? e : d);
    } else { const v = get('mb_' + it.n); if (v !== '') { total += +v; n++; } }
  }
  const age = parseInt(get('idade'), 10);
  const ref = MB_REF.find(([a, b]) => age >= a && age <= b);
  return { total, n, age, ref };
}

export function scoreCS(get) {
  const orient = CS_OR_KEYS.reduce((t, k) => t + (+get(k) || 0), 0), orN = CS_OR_KEYS.filter(k => get(k) !== '').length;
  const cnt = get('cs_animais').trim(), c = parseInt(cnt, 10);
  const flu = cnt === '' || isNaN(c) ? null : (CS_FLU.find(([a, b]) => c >= a && c <= b) || [0, 0, 0])[2];
  const ev = [1, 2, 3].reduce((t, i) => t + (+get('cs_ev_' + i) || 0), 0), evN = [1, 2, 3].filter(i => get('cs_ev_' + i) !== '').length;
  const anosS = get('anos_estudo').trim(), anos = parseInt(anosS, 10);
  const adj = anosS === '' || isNaN(anos) ? null : anos <= 0 ? 2 : anos <= 3 ? 1 : 0;
  const total = Math.min(10, orient + (flu || 0) + ev + (adj || 0));
  const done = orN === 3 && flu !== null && evN === 3 && adj !== null, any = orN + evN > 0 || flu !== null;
  const cls = !any ? null : total >= 8 ? ['Normal', 'good'] : total >= 6 ? ['Comprometimento cognitivo possível', 'warn'] : ['Comprometimento cognitivo provável', 'bad'];
  return { orient, orN, flu, ev, evN, adj, total, cls, done };
}

export function scoreIPAQ(get) {
  const act = n => {
    const d = get(`ipaq_${n}a`);
    if (d === '' || d === 'Nenhum') return { set: d !== '', min: 0 };
    return { set: true, min: +d * ((parseInt(get(`ipaq_${n}b_h`), 10) || 0) * 60 + (parseInt(get(`ipaq_${n}b_m`), 10) || 0)) };
  };
  const sit = s => { const h = get(`ipaq_${s}_h`), m = get(`ipaq_${s}_m`); return h === '' && m === '' ? null : (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0); };
  const w = act(1), m = act(2), v = act(3);
  const fd = n => {
    const d = get(`ipaq_${n}a`), h = get(`ipaq_${n}b_h`), mi = get(`ipaq_${n}b_m`);
    const f = d === '' ? null : d === 'Nenhum' ? 0 : +d;
    const dur = (parseInt(h, 10) || 0) * 60 + (parseInt(mi, 10) || 0);
    return { f, d: f ? dur : 0, ok: f === 0 || (f > 0 && (h !== '' || mi !== '') && dur > 0) };
  };
  const W = fd(1), Mo = fd(2), V = fd(3);
  let cls = null;
  if ([W, Mo, V].every(x => x.f !== null && x.ok)) {
    const dias = W.f + Mo.f + V.f, mins = W.f * W.d + Mo.f * Mo.d + V.f * V.d;
    const mw30 = (W.d >= 30 ? W.f : 0) + (Mo.d >= 30 ? Mo.f : 0);
    if (dias === 0) cls = ['Sedentário', 'bad'];
    else if ((V.f >= 5 && V.d >= 30) || (V.f >= 3 && V.d >= 20 && mw30 >= 5)) cls = ['Muito ativo', 'good'];
    else if ((V.f >= 3 && V.d >= 20) || mw30 >= 5 || (dias >= 5 && mins >= 150)) cls = ['Ativo', 'good'];
    else if (dias >= 5 || mins >= 150) cls = ['Irregularmente ativo A', 'warn'];
    else cls = ['Irregularmente ativo B', 'warn'];
    cls.push(IPAQ_DESC[cls[0]]);
  }
  return { w: w.min, m: m.min, v: v.min, total: w.min + m.min + v.min, n: [w, m, v].filter(x => x.set).length, s4a: sit('4a'), s4b: sit('4b'), cls };
}

export function calcular(get) {
  return {
    C: scoreCS(get), I: scoreIPAQ(get), D: scoreDHI(get), E: scoreEVA(get),
    V1: scoreVAP(get, 'vap1', 6), V2: scoreVAP(get, 'vap2', 6), M: scoreMini(get)
  };
}

const arred = (x, c = 1) => Math.round(x * 10 ** c) / 10 ** c;
const DHI_TAG = { leve: 'good', moderada: 'warn', severa: 'bad' };
const EVA_NOME = { sem: 'Sem desconforto', leve: 'Desconforto leve', moderada: 'Desconforto moderado', severa: 'Desconforto severo' };

export function resumoEscores(respostas) {
  const get = leitor(respostas);
  const { C, I, D, E, V1, V2, M } = calcular(get);
  const dhiNA = get('dhi_aplica') === 'Não aplicável';
  const vapNA = get('vap_aplica') === 'Não aplicável';
  return {
    cs10: { total: C.total, classificacao: C.cls ? C.cls[0] : null, tom: C.cls ? C.cls[1] : null, completo: C.done },
    ipaq: { total_min_semana: I.total, caminhada: I.w, moderada: I.m, vigorosa: I.v, classificacao: I.cls ? I.cls[0] : null, tom: I.cls ? I.cls[1] : null },
    eva: E.n ? { media: arred(E.mean), respondidas: E.n, classificacao: EVA_NOME[E.level], tom: E.level === 'sem' ? null : DHI_TAG[E.level] } : { media: null, respondidas: 0, classificacao: null, tom: null },
    dhi: dhiNA ? { aplicavel: false, total: null, classificacao: 'Não aplicável', tom: null }
      : { aplicavel: get('dhi_aplica') === 'Aplicável' ? true : null, total: D.n ? D.total : null, fisico: D.f, funcional: D.fu, emocional: D.e, respondidas: D.n, classificacao: D.n ? D.level : null, tom: D.n ? DHI_TAG[D.level] : null },
    vap: vapNA ? { aplicavel: false, vap1: null, vap2: null }
      : { aplicavel: get('vap_aplica') === 'Aplicável' ? true : null, vap1: V1.sum, vap2: V2.sum, vap1_media: V1.n ? arred(V1.mean, 2) : null, vap2_media: V2.n ? arred(V2.mean, 2) : null, na: V1.na + V2.na },
    minibest: { total: M.total, itens_completos: M.n, referencia: M.ref ? { faixa: `${M.ref[0]}–${M.ref[1]} anos`, media: M.ref[2], ic: M.ref[3] } : null }
  };
}
