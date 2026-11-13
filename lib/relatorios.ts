import { listar, type Respostas } from './avaliacoes';
import { dp, media, regressaoLogistica, type Ajuste } from './estatistica';
import { resumoEscores } from '@/public/escores.js';

export const COMORB = ['Alterações metabólicas', 'Hipertensão', 'Hipotensão postural', 'Doença osteomuscular', 'Doença do aparelho circulatório', 'Doença do aparelho respiratório', 'Doença do sistema nervoso', 'Doença do aparelho geniturinário', 'Doença do olho e anexos', 'Transtornos mentais', 'Neoplasias', 'Outros'];
export const IDENTIFICADORES = ['nome', 'nascimento', 'endereco', 'telefone', 'acompanhante', 'profissao', 'data_avaliacao', '__meds', '__step'];
const ESCOLARIDADE = ['Não alfabetizado', 'Fundamental incompleto', 'Fundamental completo', 'Médio incompleto', 'Médio completo', 'Superior incompleto', 'Superior completo'];

export type Paciente = {
  codigo: string;
  idade: number | null;
  sexo: string | null;
  escolaridade: string | null;
  anos_estudo: number | null;
  tabaco: string | null;
  alcool: string | null;
  comorb: string[];
  audicao: string | null;
  aparelho_aud: string | null;
  oculos: string | null;
  queda_6m: string | null;
  caiu: 0 | 1 | null;
  medo_queda: string | null;
  tontura_tem: string | null;
  cs10: number | null;
  cs10_cls: string | null;
  ipaq_min: number | null;
  ipaq_cls: string | null;
  ipaq_ativo: 0 | 1 | null;
  eva: number | null;
  eva_cls: string | null;
  dhi_aplica: string | null;
  dhi_total: number | null;
  dhi_fisico: number | null;
  dhi_funcional: number | null;
  dhi_emocional: number | null;
  dhi_cls: string | null;
  vap1_media: number | null;
  vap2_media: number | null;
  minibest: number | null;
  tug: number | null;
  tug_dt: number | null;
  respostas: Respostas;
};

const txt = (r: Respostas, k: string) => (typeof r[k] === 'string' && (r[k] as string).trim() !== '' ? (r[k] as string).trim() : null);
function num(r: Respostas, k: string) {
  const s = txt(r, k);
  if (s === null) return null;
  const v = Number(s.replace(',', '.'));
  return Number.isFinite(v) ? v : null;
}

export function paraPaciente(r: Respostas, codigo: string): Paciente {
  const e = resumoEscores(r);
  const dhiOk = e.dhi.aplicavel !== false && e.dhi.respondidas === 25;
  const evaOk = e.eva.respondidas === 9;
  const ipaqOk = e.ipaq.classificacao !== null;
  const queda = txt(r, 'queda_6m');
  const comorb = Array.isArray(r.comorb) ? (r.comorb as unknown[]).filter((x): x is string => typeof x === 'string') : [];
  return {
    codigo,
    idade: num(r, 'idade'),
    sexo: txt(r, 'sexo'),
    escolaridade: txt(r, 'escolaridade'),
    anos_estudo: num(r, 'anos_estudo'),
    tabaco: txt(r, 'tabaco'),
    alcool: txt(r, 'alcool'),
    comorb,
    audicao: txt(r, 'audicao'),
    aparelho_aud: txt(r, 'aparelho_aud'),
    oculos: txt(r, 'oculos'),
    queda_6m: queda,
    caiu: queda === null ? null : queda === 'Nenhuma' ? 0 : 1,
    medo_queda: txt(r, 'medo_queda'),
    tontura_tem: txt(r, 'tontura_tem'),
    cs10: e.cs10.completo ? e.cs10.total : null,
    cs10_cls: e.cs10.completo ? e.cs10.classificacao : null,
    ipaq_min: ipaqOk ? e.ipaq.total_min_semana : null,
    ipaq_cls: e.ipaq.classificacao,
    ipaq_ativo: ipaqOk ? (e.ipaq.classificacao === 'Ativo' || e.ipaq.classificacao === 'Muito ativo' ? 1 : 0) : null,
    eva: evaOk ? e.eva.media : null,
    eva_cls: evaOk ? e.eva.classificacao : null,
    dhi_aplica: txt(r, 'dhi_aplica'),
    dhi_total: dhiOk ? e.dhi.total : null,
    dhi_fisico: dhiOk && 'fisico' in e.dhi ? e.dhi.fisico : null,
    dhi_funcional: dhiOk && 'funcional' in e.dhi ? e.dhi.funcional : null,
    dhi_emocional: dhiOk && 'emocional' in e.dhi ? e.dhi.emocional : null,
    dhi_cls: dhiOk ? e.dhi.classificacao : null,
    vap1_media: e.vap.aplicavel === false || !('vap1_media' in e.vap) ? null : e.vap.vap1_media ?? null,
    vap2_media: e.vap.aplicavel === false || !('vap2_media' in e.vap) ? null : e.vap.vap2_media ?? null,
    minibest: e.minibest.itens_completos === 14 ? e.minibest.total : null,
    tug: num(r, 'mb_14_tug'),
    tug_dt: num(r, 'mb_14_tugd'),
    respostas: r,
  };
}

export async function carregarPacientes() {
  const lista = await listar();
  lista.sort((a, b) => a.criado_em.localeCompare(b.criado_em));
  const dig = Math.max(2, String(lista.length).length);
  return lista.map((a, i) => paraPaciente(a.respostas, 'P' + String(i + 1).padStart(dig, '0')));
}

export const fmt = (x: number, d = 1) => x.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtP = (p: number) => (p < 0.001 ? '< 0,001' : fmt(p, 3));
const pct = (k: number, n: number) => `${k} (${fmt((100 * k) / n, 1)})`;

export type Celula = { texto: string; negrito?: boolean };
export type Linha = { rotulo: string; nivel: 0 | 1; titulo?: boolean; celulas: Celula[] };
export type Explicacao = { titulo: string; texto: string[] };
export type Tabela = {
  id: string;
  numero: number;
  titulo: string;
  grupos?: { texto: string; curto?: string; span: number }[];
  colunas: string[];
  linhas: Linha[];
  nota: string[];
  explicacao: Explicacao[];
  aviso?: string;
};

const vals = (ps: Paciente[], f: (p: Paciente) => number | null) => ps.map(f).filter((v): v is number => v !== null);

function linhaNum(rotulo: string, xs: number[], d: number, nivel: 0 | 1 = 0): Linha {
  if (xs.length === 0) return { rotulo, nivel, celulas: [{ texto: '—' }, { texto: '—' }, { texto: '0' }] };
  const s = dp(xs);
  return {
    rotulo,
    nivel,
    celulas: [
      { texto: `${fmt(media(xs), d)} ± ${s === null ? '—' : fmt(s, d)}` },
      { texto: `${fmt(Math.min(...xs), d)}–${fmt(Math.max(...xs), d)}` },
      { texto: String(xs.length) },
    ],
  };
}

function linhasCat(rotulo: string, ps: Paciente[], f: (p: Paciente) => string | null, ordem?: string[]): Linha[] {
  const vs = ps.map(f);
  const validos = vs.filter((v): v is string => v !== null);
  const cats = [...(ordem ?? []).filter(c => validos.includes(c)), ...[...new Set(validos)].filter(c => !(ordem ?? []).includes(c)).sort()];
  const n = validos.length;
  const faltam = vs.length - n;
  const linhas: Linha[] = [{ rotulo: faltam ? `${rotulo} (não informado: ${faltam})` : rotulo, nivel: 0, titulo: true, celulas: [{ texto: '' }, { texto: '' }, { texto: String(n) }] }];
  for (const c of cats) linhas.push({ rotulo: c, nivel: 1, celulas: [{ texto: pct(validos.filter(v => v === c).length, n) }, { texto: '' }, { texto: '' }] });
  return linhas;
}

function linhaSim(rotulo: string, ps: Paciente[], f: (p: Paciente) => boolean | null, nivel: 0 | 1 = 0): Linha {
  const vs = ps.map(f).filter((v): v is boolean => v !== null);
  return { rotulo, nivel, celulas: [{ texto: vs.length ? pct(vs.filter(Boolean).length, vs.length) : '—' }, { texto: '' }, { texto: String(vs.length) }] };
}

const EXP_DESCRITIVA: Explicacao[] = [
  {
    titulo: 'Média ± desvio-padrão (DP)',
    texto: [
      'Para variáveis numéricas (idade, anos de estudo) mostramos a média e o desvio-padrão amostral, que indica o quanto os valores se espalham em torno da média. Usamos o DP amostral (divide por n − 1), que é o padrão em artigos.',
      'Mín–máx mostra o menor e o maior valor encontrados, para o leitor ter noção da amplitude da amostra.',
    ],
  },
  {
    titulo: 'n (%)',
    texto: [
      'Para variáveis de categoria (sexo, escolaridade, comorbidades) mostramos quantos pacientes estão em cada categoria e a porcentagem. A porcentagem é calculada só sobre quem tem a informação preenchida; quando falta resposta, isso aparece ao lado do nome da variável.',
      'Nas comorbidades, cada linha é independente (um paciente pode ter várias), por isso as porcentagens não somam 100%.',
    ],
  },
];

function tabela1(ps: Paciente[]): Tabela {
  const linhas: Linha[] = [
    linhaNum('Idade (anos)', vals(ps, p => p.idade), 1),
    ...linhasCat('Sexo', ps, p => p.sexo, ['Feminino', 'Masculino']),
    ...linhasCat('Escolaridade', ps, p => p.escolaridade, ESCOLARIDADE),
    linhaNum('Anos de estudo', vals(ps, p => p.anos_estudo), 1),
    ...linhasCat('Tabagismo', ps, p => p.tabaco, ['Não', 'Sim', 'Ex-fumante']),
    ...linhasCat('Etilismo', ps, p => p.alcool, ['Não', 'Sim']),
    { rotulo: 'Comorbidades', nivel: 0, titulo: true, celulas: [{ texto: '' }, { texto: '' }, { texto: String(ps.length) }] },
    ...COMORB.map(c => linhaSim(c, ps, p => p.comorb.includes(c), 1)).filter(l => !l.celulas[0].texto.startsWith('0 ')),
    linhaSim('Hipoacusia', ps, p => (p.audicao === null ? null : p.audicao === 'Hipoacusia')),
    linhaSim('Uso de aparelho auditivo', ps, p => (p.aparelho_aud === null ? null : p.aparelho_aud === 'Sim')),
    linhaSim('Uso de óculos', ps, p => (p.oculos === null ? null : p.oculos === 'Sim')),
    linhaSim('Tontura', ps, p => (p.tontura_tem === null ? null : p.tontura_tem === 'Possui tontura')),
    ...linhasCat('Quedas nos últimos 6 meses', ps, p => p.queda_6m, ['Nenhuma', 'Uma', 'Duas ou mais']),
    linhaSim('Medo de cair', ps, p => (p.medo_queda === null ? null : p.medo_queda === 'Sim')),
  ];
  return {
    id: 'tabela-1',
    numero: 1,
    titulo: `Características sociodemográficas e clínicas da amostra (n = ${ps.length})`,
    colunas: ['Variável', 'Média ± DP ou n (%)', 'Mín–máx', 'n'],
    linhas,
    nota: ['Nota: DP = desvio-padrão; n = número de participantes com a informação preenchida. Comorbidades sem nenhum caso foram omitidas.'],
    explicacao: [
      { titulo: 'O que esta tabela mostra', texto: ['É a "Tabela 1" de quase todo artigo: descreve quem são os participantes, para o leitor saber a que população os resultados se aplicam. Não tem teste estatístico, só descrição.'] },
      ...EXP_DESCRITIVA,
    ],
  };
}

function tabela2(ps: Paciente[]): Tabela {
  const cls = (rotulo: string, f: (p: Paciente) => string | null, ordem: string[]) => linhasCat(rotulo, ps.filter(p => f(p) !== null), f, ordem).slice(1).map(l => ({ ...l, rotulo: l.rotulo }));
  const linhas: Linha[] = [
    linhaNum('10-CS, escore (0–10)', vals(ps, p => p.cs10), 1),
    ...cls('10-CS', p => p.cs10_cls, ['Normal', 'Comprometimento cognitivo possível', 'Comprometimento cognitivo provável']),
    linhaNum('IPAQ, atividade física (min/semana)', vals(ps, p => p.ipaq_min), 0),
    ...cls('IPAQ', p => p.ipaq_cls, ['Muito ativo', 'Ativo', 'Irregularmente ativo A', 'Irregularmente ativo B', 'Sedentário']),
    linhaNum('Escala visual analógica, média (0–10)', vals(ps, p => p.eva), 1),
    ...cls('EVA', p => p.eva_cls, ['Sem desconforto', 'Desconforto leve', 'Desconforto moderado', 'Desconforto severo']),
    linhaNum('DHI total (0–100)', vals(ps, p => p.dhi_total), 1),
    linhaNum('Físico (0–28)', vals(ps, p => p.dhi_fisico), 1, 1),
    linhaNum('Funcional (0–36)', vals(ps, p => p.dhi_funcional), 1, 1),
    linhaNum('Emocional (0–36)', vals(ps, p => p.dhi_emocional), 1, 1),
    ...cls('DHI', p => p.dhi_cls, ['leve', 'moderada', 'severa']).map(l => ({ ...l, rotulo: `Handicap ${l.rotulo}` })),
    linhaNum('VAP parte 1, média', vals(ps, p => p.vap1_media), 2),
    linhaNum('VAP parte 2, média', vals(ps, p => p.vap2_media), 2),
    linhaNum('MiniBESTest total (0–28)', vals(ps, p => p.minibest), 1),
    linhaNum('TUG (s)', vals(ps, p => p.tug), 1),
    linhaNum('TUG com dupla tarefa (s)', vals(ps, p => p.tug_dt), 1),
  ];
  return {
    id: 'tabela-2',
    numero: 2,
    titulo: `Resultados dos instrumentos de avaliação (n = ${ps.length})`,
    colunas: ['Instrumento', 'Média ± DP ou n (%)', 'Mín–máx', 'n'],
    linhas,
    nota: [
      'Nota: DP = desvio-padrão; 10-CS = Ten-Point Cognitive Screener; IPAQ = International Physical Activity Questionnaire (versão curta); EVA = escala visual analógica; DHI = Dizziness Handicap Inventory; VAP = escala de Vestibular Activities and Participation; MiniBESTest = Mini Balance Evaluation Systems Test; TUG = Timed Up and Go.',
      'Cada instrumento considera apenas os participantes que o completaram (coluna n).',
    ],
    explicacao: [
      { titulo: 'O que esta tabela mostra', texto: ['Os resultados de cada teste aplicado na amostra: o escore médio e, quando o instrumento tem pontos de corte, quantos pacientes ficaram em cada classificação.'] },
      {
        titulo: 'Só instrumentos completos',
        texto: [
          'Um escore só entra se o instrumento foi respondido por inteiro: 10-CS com todas as partes, IPAQ com classificação, EVA com os 9 itens, DHI com as 25 perguntas (e marcado como aplicável) e MiniBESTest com os 14 itens. Um escore parcial pareceria mais baixo do que é e puxaria a média para baixo.',
          'Por isso o n pode mudar de linha para linha. Isso deve ser citado no texto do artigo (ex.: "o DHI foi aplicado em 3 dos 5 participantes").',
        ],
      },
      {
        titulo: 'Classificações usadas',
        texto: [
          '10-CS: 8–10 normal, 6–7 comprometimento cognitivo possível, 0–5 provável (Apolinario et al., 2016). DHI: 0–30 leve, 31–60 moderado, 61–100 severo. IPAQ: classificação do CELAFISCS.',
          'Os cortes da escala visual analógica (leve até 4, moderado até 7, severo acima de 7) foram definidos para o app e precisam ser confirmados com a orientação antes de publicar.',
        ],
      },
      ...EXP_DESCRITIVA.slice(0, 1),
    ],
  };
}

type Preditor = { chave: string; rotulo: string; valor: (p: Paciente) => number | null; ajuste: ('idade' | 'sexo')[] };
const sexoM = (p: Paciente) => (p.sexo === null ? null : p.sexo === 'Masculino' ? 1 : 0);
export const PREDITORES: Preditor[] = [
  { chave: 'idade', rotulo: 'Idade (por ano)', valor: p => p.idade, ajuste: ['sexo'] },
  { chave: 'sexo', rotulo: 'Sexo masculino (ref.: feminino)', valor: sexoM, ajuste: ['idade'] },
  { chave: 'cs10', rotulo: '10-CS (por ponto)', valor: p => p.cs10, ajuste: ['idade', 'sexo'] },
  { chave: 'ipaq', rotulo: 'Fisicamente ativo, IPAQ (ref.: irregularmente ativo ou sedentário)', valor: p => p.ipaq_ativo, ajuste: ['idade', 'sexo'] },
  { chave: 'eva', rotulo: 'Escala visual analógica (por ponto)', valor: p => p.eva, ajuste: ['idade', 'sexo'] },
  { chave: 'dhi', rotulo: 'DHI total (por ponto)', valor: p => p.dhi_total, ajuste: ['idade', 'sexo'] },
  { chave: 'minibest', rotulo: 'MiniBESTest (por ponto)', valor: p => p.minibest, ajuste: ['idade', 'sexo'] },
  { chave: 'tug', rotulo: 'TUG (por segundo)', valor: p => p.tug, ajuste: ['idade', 'sexo'] },
];
export const MIN_EVENTOS_POR_PREDITOR = 5;

function ajustar(ps: Paciente[], fs: ((p: Paciente) => number | null)[]): Ajuste {
  const x: number[][] = [], y: number[] = [];
  for (const p of ps) {
    if (p.caiu === null) continue;
    const l = fs.map(f => f(p));
    if (l.some(v => v === null)) continue;
    x.push(l as number[]);
    y.push(p.caiu);
  }
  return regressaoLogistica(x, y, MIN_EVENTOS_POR_PREDITOR);
}

const MOTIVO: Record<string, string> = {
  'sem-variacao': 'sem variação',
  'poucos-eventos': 'n insuficiente',
  'nao-convergiu': 'não estimável',
  separacao: 'não estimável',
};

function celulasAjuste(a: Ajuste): Celula[] {
  if (!a.ok) return [{ texto: MOTIVO[a.motivo] }, { texto: '—' }];
  const c = a.coefs[0];
  return [{ texto: `${fmt(c.or, 2)} (${fmt(c.ic[0], 2)}–${fmt(c.ic[1], 2)})` }, { texto: fmtP(c.p), negrito: c.p < 0.05 }];
}

function tabela3(ps: Paciente[]): Tabela {
  const comDesfecho = ps.filter(p => p.caiu !== null);
  const eventos = comDesfecho.filter(p => p.caiu === 1).length;
  const cov = { idade: (p: Paciente) => p.idade, sexo: sexoM };
  const linhas: Linha[] = PREDITORES.map(pr => {
    const bruto = ajustar(ps, [pr.valor]);
    const aj = ajustar(ps, [pr.valor, ...pr.ajuste.map(k => cov[k])]);
    return { rotulo: pr.rotulo, nivel: 0, celulas: [{ texto: String(bruto.n) }, ...celulasAjuste(bruto), ...celulasAjuste(aj)] };
  });
  const algum = linhas.some(l => l.celulas.some(c => c.texto.includes('(')));
  return {
    id: 'tabela-3',
    numero: 3,
    titulo: 'Razões de chances calculadas por regressão logística para a ocorrência de queda nos últimos seis meses, em modelos não ajustados e ajustados por idade e sexo',
    grupos: [{ texto: '', span: 2 }, { texto: 'Análise não ajustada', curto: 'Não ajustada', span: 2 }, { texto: 'Ajustada por idade e sexo', curto: 'Ajustada', span: 2 }],
    colunas: ['Variável', 'n', 'OR (IC 95%)', 'p', 'OR (IC 95%)', 'p'],
    linhas,
    nota: [
      `Nota: desfecho = pelo menos uma queda nos últimos seis meses (${eventos} de ${comDesfecho.length} participantes com a informação). OR = odds ratio (razão de chances); IC = intervalo de confiança; n = participantes com a variável e o desfecho preenchidos; 10-CS = Ten-Point Cognitive Screener; IPAQ = International Physical Activity Questionnaire; DHI = Dizziness Handicap Inventory; TUG = Timed Up and Go.`,
      `Fisicamente ativo = classificação "Ativo" ou "Muito ativo" no IPAQ. No modelo ajustado, idade foi ajustada por sexo e sexo por idade. Resultados em negrito representam p < 0,05. "n insuficiente" = menos de ${MIN_EVENTOS_POR_PREDITOR} participantes com e ${MIN_EVENTOS_POR_PREDITOR} sem queda por variável do modelo; "não estimável" = o modelo não converge (geralmente quando a variável separa perfeitamente quem caiu de quem não caiu).`,
    ],
    aviso: algum ? undefined : `Com ${comDesfecho.length} participantes (${eventos} com queda), ainda não há dados suficientes para nenhuma regressão. A tabela se preenche sozinha conforme novas avaliações forem salvas: cada variável precisa de pelo menos ${MIN_EVENTOS_POR_PREDITOR} pacientes que caíram e ${MIN_EVENTOS_POR_PREDITOR} que não caíram (e o triplo disso no modelo ajustado).`,
    explicacao: [
      {
        titulo: 'O que esta tabela mostra',
        texto: [
          'Ela responde: "quais resultados da avaliação estão associados a ter caído nos últimos seis meses?". O formato é o mesmo da tabela de referência (regressão de Cox), mas usamos regressão logística porque a ficha registra se o paciente caiu ou não (sim/não) num momento só, e não o tempo até a queda num acompanhamento. Cox exigiria acompanhar cada paciente depois da avaliação.',
        ],
      },
      {
        titulo: 'Como ler a OR (razão de chances)',
        texto: [
          'OR = 1 significa sem associação. OR acima de 1 significa mais chance de ter caído; abaixo de 1, menos chance. Ex.: OR 0,80 no MiniBESTest quer dizer que cada ponto a mais no teste está associado a uma chance 20% menor de ter caído. Em variáveis sim/não (sexo, IPAQ), a OR compara o grupo descrito com o grupo de referência ("ref.").',
          'O IC 95% é a faixa de valores plausíveis para a OR. Se ele inclui o 1 (ex.: 0,70–1,40), o resultado não é estatisticamente significativo, o que coincide com p ≥ 0,05.',
        ],
      },
      {
        titulo: 'Não ajustada x ajustada',
        texto: [
          'Na análise não ajustada, cada variável é testada sozinha. Na ajustada, ela entra junto com idade e sexo, para ver se a associação continua quando se "desconta" o efeito dessas duas características (ex.: idosos mais velhos tendem a ter pior equilíbrio e a cair mais; o ajuste separa uma coisa da outra).',
        ],
      },
      {
        titulo: 'Detalhes do cálculo (para a seção Métodos)',
        texto: [
          'Regressão logística binária estimada por máxima verossimilhança (método de Newton-Raphson). Intervalos de confiança de 95% e valores de p pelo teste de Wald. Nível de significância de 5%. Análise de casos completos: cada modelo usa só os participantes que têm todas as variáveis dele preenchidas.',
          `Para evitar resultados instáveis em amostra pequena, só calculamos um modelo quando há pelo menos ${MIN_EVENTOS_POR_PREDITOR} participantes com e ${MIN_EVENTOS_POR_PREDITOR} sem queda para cada variável do modelo (critério de eventos por variável; Peduzzi et al., 1996; Vittinghoff e McCulloch, 2007). O ideal citado na literatura é 10 por variável; resultados entre 5 e 10 devem ser interpretados com cautela.`,
          'O cálculo foi conferido contra o pacote statsmodels (Python), com diferença menor que 0,001 nas OR, nos IC e no p. Se a orientação preferir, a planilha bruta pode ser analisada em SPSS, Jamovi ou R para confirmar.',
        ],
      },
    ],
  };
}

export function montarTabelas(ps: Paciente[]) {
  return [tabela1(ps), tabela2(ps), tabela3(ps)];
}
