create extension if not exists pgcrypto;

create table if not exists usuarios (
  id serial primary key,
  nome text not null,
  email text not null unique,
  senha_hash text not null,
  perfil text not null default 'avaliador' check (perfil in ('avaliador', 'admin')),
  criado_em timestamptz not null default now()
);

create table if not exists avaliacoes (
  id uuid primary key default gen_random_uuid(),
  autor_id integer not null references usuarios(id),
  paciente_nome text not null,
  paciente_idade integer not null,
  data_avaliacao date,
  respostas jsonb not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  atualizado_por integer references usuarios(id)
);

create index if not exists avaliacoes_ordem on avaliacoes (data_avaliacao desc nulls last, criado_em desc);

create table if not exists eventos (
  id uuid primary key default gen_random_uuid(),
  autor_id integer not null references usuarios(id),
  titulo text not null,
  participantes text[] not null default '{}',
  descricao text not null default '',
  dia date not null,
  inicio time not null,
  fim time not null check (fim > inicio),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  atualizado_por integer references usuarios(id)
);

create index if not exists eventos_dia on eventos (dia, inicio);

-- Bancos criados antes de participantes virar lista (texto separado por vírgula).
alter table eventos add column if not exists descricao text not null default '';
do $$
begin
  if (select data_type from information_schema.columns
       where table_name = 'eventos' and column_name = 'participantes') = 'text' then
    alter table eventos alter column participantes drop default;
    alter table eventos alter column participantes type text[]
      using case when btrim(participantes) = '' then '{}'::text[]
                 else regexp_split_to_array(btrim(participantes), '\s*,\s*') end;
    alter table eventos alter column participantes set default '{}';
  end if;
end $$;
