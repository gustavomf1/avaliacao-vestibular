import writeExcelFile, { type Row, type SheetData } from 'write-excel-file/node';
import { IDENTIFICADORES, montarTabelas, type Paciente, type Tabela } from './relatorios';
import { COLUNAS, GUIA_BRUTAS } from './colunas';

const negrito = (value: string): Row[number] => ({ value, fontWeight: 'bold' });

function celula(v: unknown) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return { value: v, type: Number };
  if (Array.isArray(v)) return v.length ? { value: v.join('; '), type: String } : null;
  return { value: String(v), type: String };
}

export function abaTabela(t: Tabela): SheetData {
  const ncol = t.colunas.length;
  const linhas: SheetData = [[{ value: `Tabela ${t.numero} – ${t.titulo}`, fontWeight: 'bold', columnSpan: ncol }, ...Array(ncol - 1).fill(null)]];
  if (t.grupos) linhas.push(t.grupos.flatMap(g => [{ value: g.texto, fontWeight: 'bold' as const, columnSpan: g.span, align: 'center' as const }, ...Array(g.span - 1).fill(null)]));
  linhas.push(t.colunas.map(negrito));
  for (const l of t.linhas) {
    linhas.push([
      { value: (l.nivel ? '    ' : '') + l.rotulo, fontWeight: l.titulo ? 'bold' : undefined },
      ...l.celulas.map(c => (c.texto ? { value: c.texto, fontWeight: c.negrito ? ('bold' as const) : undefined } : null)),
    ]);
  }
  linhas.push([]);
  for (const n of t.nota) linhas.push([{ value: n, wrap: true, columnSpan: ncol }, ...Array(ncol - 1).fill(null)]);
  return linhas;
}

export async function gerarPlanilha(ps: Paciente[]) {
  const dados: SheetData = [COLUNAS.map(c => negrito(c.titulo)), ...ps.map(p => COLUNAS.map(c => celula(c.valor(p))))];

  const chaves: string[] = [];
  for (const p of ps) for (const k of Object.keys(p.respostas)) if (!IDENTIFICADORES.includes(k) && !chaves.includes(k)) chaves.push(k);
  const brutas: SheetData = [[negrito('codigo'), ...chaves.map(negrito)], ...ps.map(p => [{ value: p.codigo }, ...chaves.map(k => celula(p.respostas[k]))])];

  const dic: SheetData = [
    [negrito('coluna'), negrito('descrição')],
    ...COLUNAS.map(c => [{ value: c.titulo }, { value: c.descricao, wrap: true }]),
    [],
    [{ value: 'Aba "Respostas brutas": grupos de colunas', fontWeight: 'bold' }],
    ...GUIA_BRUTAS.map(g => [{ value: g.campos, wrap: true }, { value: g.descricao, wrap: true }]),
    [],
    [{ value: 'Aba "Respostas brutas"', fontWeight: 'bold' }, { value: 'Todas as respostas da ficha como foram salvas, uma coluna por campo (o nome é o do campo no formulário). Nome, data de nascimento, endereço, telefone, acompanhante, profissão e data da avaliação foram retirados. Campos de texto livre (observações) não são revisados: confira antes de compartilhar.', wrap: true }],
    [{ value: 'Células vazias', fontWeight: 'bold' }, { value: 'Informação não preenchida ou instrumento incompleto.', wrap: true }],
  ];

  const tabelas = montarTabelas(ps);
  return writeExcelFile([
    { data: dados, sheet: 'Variáveis e escores', columns: COLUNAS.map(c => ({ width: Math.max(c.largura ?? 0, c.titulo.length + 2) })), stickyRowsCount: 1 },
    { data: dic, sheet: 'Dicionário', columns: [{ width: 22 }, { width: 90 }] },
    ...tabelas.map(t => ({ data: abaTabela(t), sheet: `Tabela ${t.numero}`, columns: [{ width: 48 }, ...t.colunas.slice(1).map(() => ({ width: 20 }))] })),
    { data: brutas, sheet: 'Respostas brutas', stickyRowsCount: 1 },
  ]).toBuffer();
}

export async function gerarTabela(ps: Paciente[], numero: number) {
  const t = montarTabelas(ps).find(x => x.numero === numero);
  if (!t) return null;
  return writeExcelFile([
    { data: abaTabela(t), sheet: `Tabela ${t.numero}`, columns: [{ width: 48 }, ...t.colunas.slice(1).map(() => ({ width: 20 }))] },
  ]).toBuffer();
}
