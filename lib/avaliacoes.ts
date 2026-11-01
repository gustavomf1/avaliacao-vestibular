import { db } from './db';
import { resumoEscores } from '@/public/escores.js';

export type Respostas = Record<string, unknown>;

export type ItemLista = {
  id: string;
  paciente_nome: string;
  paciente_idade: number;
  data_avaliacao: string | null;
  autor: { id: number; nome: string };
  atualizado_por: { id: number; nome: string } | null;
  criado_em: string;
  atualizado_em: string;
  escores: ReturnType<typeof resumoEscores>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const idValido = (id: string) => UUID.test(id);

export function validarRespostas(corpo: unknown):
  | { ok: true; respostas: Respostas; nome: string; idade: number; data: string | null }
  | { ok: false; erro: string } {
  const r = (corpo as { respostas?: unknown })?.respostas;
  if (!r || typeof r !== 'object' || Array.isArray(r)) return { ok: false, erro: 'Ficha inválida.' };
  const respostas = { ...(r as Respostas) };
  delete respostas.__step;
  const nome = typeof respostas.nome === 'string' ? respostas.nome.trim() : '';
  const idade = Number.parseInt(String(respostas.idade ?? ''), 10);
  if (!nome || Number.isNaN(idade)) return { ok: false, erro: 'Preencha nome e idade do paciente na etapa 1.' };
  if (idade < 0 || idade > 130) return { ok: false, erro: 'Confira a idade do paciente.' };
  const d = typeof respostas.data_avaliacao === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(respostas.data_avaliacao) ? respostas.data_avaliacao : null;
  return { ok: true, respostas, nome, idade, data: d };
}

const COLUNAS = `a.id, a.paciente_nome, a.paciente_idade, to_char(a.data_avaliacao, 'YYYY-MM-DD') as data_avaliacao,
  a.respostas, a.criado_em, a.atualizado_em,
  u.id as autor_id, u.nome as autor_nome, up.id as upd_id, up.nome as upd_nome`;
const DE = `from avaliacoes a join usuarios u on u.id = a.autor_id left join usuarios up on up.id = a.atualizado_por`;

type Linha = {
  id: string; paciente_nome: string; paciente_idade: number; data_avaliacao: string | null;
  respostas: Respostas; criado_em: Date; atualizado_em: Date;
  autor_id: number; autor_nome: string; upd_id: number | null; upd_nome: string | null;
};

function mapear(l: Linha) {
  return {
    id: l.id,
    paciente_nome: l.paciente_nome,
    paciente_idade: l.paciente_idade,
    data_avaliacao: l.data_avaliacao,
    autor: { id: l.autor_id, nome: l.autor_nome },
    atualizado_por: l.upd_id ? { id: l.upd_id, nome: l.upd_nome as string } : null,
    criado_em: l.criado_em.toISOString(),
    atualizado_em: l.atualizado_em.toISOString(),
    respostas: l.respostas,
    escores: resumoEscores(l.respostas),
  };
}

export async function listar() {
  const { rows } = await db().query<Linha>(`select ${COLUNAS} ${DE} order by a.data_avaliacao desc nulls last, a.criado_em desc`);
  return rows.map(mapear);
}

export async function listarResumo(): Promise<ItemLista[]> {
  return (await listar()).map(a => {
    const r: Partial<typeof a> = { ...a };
    delete r.respostas;
    return r as ItemLista;
  });
}

export async function buscar(id: string) {
  const { rows } = await db().query<Linha>(`select ${COLUNAS} ${DE} where a.id = $1`, [id]);
  return rows[0] ? mapear(rows[0]) : null;
}
