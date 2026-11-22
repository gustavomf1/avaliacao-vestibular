# Agenda compartilhada: design

## Por quê

As avaliadoras precisam de um controle simples de quem vai estar onde e em que horário, dentro do próprio sistema. É uma agenda interna: sem lembretes, sem convites e sem integração com outros calendários.

## Objetivos

- Botão **Agenda** na listagem (ao lado de Relatórios), que leva para `/agenda`.
- Qualquer usuário logado cria um evento com **título**, **participantes** (texto livre), **dia**, **hora de início** e **hora de fim**.
- O sistema registra quem criou (vem da sessão, nunca do corpo da requisição).
- Todo mundo vê todos os eventos. Horários sobrepostos são permitidos e aparecem **lado a lado**.
- Responsivo: celular (390px) e PC (1366px), sem rolagem horizontal, alvos de 44px e inputs de 16px.

## Não objetivos

- Lembretes, notificações, e-mail, eventos recorrentes, eventos que atravessam a meia-noite, ligação com fichas/pacientes (pode vir depois).

## Anti-objetivos

- Bloquear um horário porque já existe outro evento nele.
- Tela que no celular exige zoom ou rolagem lateral.

## Abordagens consideradas

- **A. Mês + linha do tempo do dia (escolhida).** Mês compacto com marcador nos dias que têm evento. Tocar num dia mostra a linha do tempo daquele dia, com os eventos sobrepostos em colunas. Funciona bem no celular. No PC, o mês e o dia ficam lado a lado.
- **B. Grade semanal.** Melhor no PC, mas ilegível no celular, onde teria que virar visão de dia de qualquer jeito.
- **C. FullCalendar.** Rápido de montar, mas pesa no bundle, é difícil de adaptar ao design system e o modo celular é fraco.

O Gustavo escolheu a A em 22/11/2026.

## Design

### Banco (`db/schema.sql`, idempotente)

```sql
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
```

`date` + `time` sem fuso: o horário digitado é o horário mostrado (Brasília), sem conversão de UTC.

### API (mesmo padrão de `app/api/avaliacoes`)

- `GET /api/eventos?de=AAAA-MM-DD&ate=AAAA-MM-DD`: eventos do intervalo (o mês visível), com o nome do autor.
- `POST /api/eventos`: cria.
- `PUT /api/eventos/[id]`, `DELETE /api/eventos/[id]`.
- Toda rota confere a sessão de novo. Validação em `lib/eventos.ts`: título obrigatório (até 120 caracteres), participantes até 500, dia válido, `fim > inicio`. Erros em português.
- Permissão: igual às avaliações, ou seja, qualquer usuário logado edita e exclui qualquer evento. O cartão mostra "Criado por X" e, se for o caso, "Editado por Y".

### Tela (`app/agenda/page.tsx` + `Agenda.tsx`)

- Cabeçalho no padrão da listagem, com "‹ Avaliações" para voltar.
- **Mês:** grade de 7 colunas com navegação ‹ ›, botão "Hoje", o dia selecionado destacado com `--accent` e um ponto nos dias com evento. "Hoje" usa a data local do aparelho.
- **Dia:** título "Domingo, 22/11" e botão **+ Evento**. A linha do tempo vai das 07:00 às 19:00 por padrão e se estende quando houver evento fora dessa faixa. A altura é proporcional à duração.
- **Sobreposição:** os eventos que se cruzam formam um grupo, e cada evento recebe a primeira coluna livre. A largura de cada um é 1/(número de colunas do grupo). O cartão mostra horário, título e participantes, cortados com reticências se não couberem.
- **Formulário** (painel na própria página: no celular ocupa a tela, no PC é um painel lateral): título, participantes, dia, início e fim (`input type="time"`), Salvar / Cancelar. Editando, aparece Excluir com a confirmação no próprio painel (sem `confirm()`).
- **Layout:** abaixo de 900px, o mês fica em cima e o dia embaixo. A partir de 900px, ficam em duas colunas.
- Sessão expirada (401): leva ao login com `voltar=/agenda`.

## Fica a critério de quem implementa

- Nomes exatos das classes CSS e dos componentes, seguindo `docs/design-system/`.
- Altura por hora da linha do tempo.
- Atualizar `CLAUDE.md` (estrutura e decisões) ao terminar.
