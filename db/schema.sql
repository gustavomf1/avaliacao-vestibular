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
  participantes text not null default '',
  dia date not null,
  inicio time not null,
  fim time not null check (fim > inicio),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  atualizado_por integer references usuarios(id)
);

create index if not exists eventos_dia on eventos (dia, inicio);
