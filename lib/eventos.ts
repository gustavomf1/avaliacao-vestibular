import { db } from '@/lib/db';
import type { DadosEvento } from '@/lib/eventos-validar';

export { validarEvento, dataValida } from '@/lib/eventos-validar';

export type Pessoa = { id: number; nome: string };
export type Evento = DadosEvento & {
  id: string;
  autor: Pessoa;
  atualizado_por: Pessoa | null;
  criado_em: string;
  atualizado_em: string;
};

type Linha = DadosEvento & {
  id: string;
  autor_id: number;
  autor_nome: string;
  editor_id: number | null;
  editor_nome: string | null;
  criado_em: Date;
  atualizado_em: Date;
};

const SELECT = `
  select e.id, e.titulo, e.participantes, e.descricao,
         to_char(e.dia, 'YYYY-MM-DD') as dia,
         to_char(e.inicio, 'HH24:MI') as inicio,
         to_char(e.fim, 'HH24:MI') as fim,
         e.autor_id, a.nome as autor_nome,
         e.atualizado_por as editor_id, ed.nome as editor_nome,
         e.criado_em, e.atualizado_em
    from eventos e
    join usuarios a on a.id = e.autor_id
    left join usuarios ed on ed.id = e.atualizado_por`;

function formatar(l: Linha): Evento {
  return {
    id: l.id,
    titulo: l.titulo,
    participantes: l.participantes,
    descricao: l.descricao,
    dia: l.dia,
    inicio: l.inicio,
    fim: l.fim,
    autor: { id: l.autor_id, nome: l.autor_nome },
    atualizado_por: l.editor_id !== null ? { id: l.editor_id, nome: l.editor_nome ?? '' } : null,
    criado_em: l.criado_em.toISOString(),
    atualizado_em: l.atualizado_em.toISOString(),
  };
}

export async function listarEventos(de: string, ate: string): Promise<Evento[]> {
  const { rows } = await db().query<Linha>(`${SELECT} where e.dia between $1 and $2 order by e.dia, e.inicio, e.criado_em`, [de, ate]);
  return rows.map(formatar);
}

export async function buscarEvento(id: string): Promise<Evento | null> {
  const { rows } = await db().query<Linha>(`${SELECT} where e.id = $1`, [id]);
  return rows[0] ? formatar(rows[0]) : null;
}

export async function criarEvento(d: DadosEvento, autorId: number): Promise<Evento> {
  const { rows } = await db().query<{ id: string }>(
    `insert into eventos (autor_id, titulo, participantes, descricao, dia, inicio, fim)
     values ($1, $2, $3, $4, $5, $6, $7) returning id`,
    [autorId, d.titulo, d.participantes, d.descricao, d.dia, d.inicio, d.fim]
  );
  return (await buscarEvento(rows[0].id))!;
}

export async function atualizarEvento(id: string, d: DadosEvento, editorId: number): Promise<Evento | null> {
  const r = await db().query(
    `update eventos set titulo = $2, participantes = $3, descricao = $4, dia = $5, inicio = $6, fim = $7,
       atualizado_em = now(), atualizado_por = $8
     where id = $1`,
    [id, d.titulo, d.participantes, d.descricao, d.dia, d.inicio, d.fim, editorId]
  );
  return r.rowCount ? buscarEvento(id) : null;
}

export async function excluirEvento(id: string): Promise<boolean> {
  const r = await db().query('delete from eventos where id = $1', [id]);
  return !!r.rowCount;
}
