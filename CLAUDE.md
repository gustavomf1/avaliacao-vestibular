# Avaliação Vestibular (TCC)

Formulário web da ficha de **Avaliação Fisioterapêutica Neurofuncional – Disfunção vestibular**, usado no TCC sobre hipofunção vestibular. Quem preenche é a fisioterapeuta, muitas vezes de pé e com o celular na mão, durante a avaliação do paciente.

## Stack

- **Next.js 16** (App Router, TypeScript), hospedado na **Vercel** (plano Hobby, gratuito).
- **Postgres no Neon** (plano free), acessado com `pg` e SQL puro, sem ORM.
- Login com e-mail e senha: `bcryptjs` para o hash e sessão em cookie httpOnly assinado com `jose` (JWT HS256, 7 dias).
- A ficha continua em HTML e JS puro (`public/ficha.html`), servida em `/avaliacao`. Só a listagem e o login são React.

Next 16 mudou bastante: o antigo `middleware.ts` agora é `proxy.ts`, e `params` das rotas é uma Promise. Antes de mexer em APIs do Next, leia `node_modules/next/dist/docs/` (ver `AGENTS.md`).

## Como rodar

```
cp .env.example .env            # ajuste DATABASE_URL e gere SESSION_SECRET (openssl rand -hex 32)
docker run -d --name avaliacao-pg -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=avaliacao -p 127.0.0.1:5439:5432 postgres:17-alpine
npm install
npm run db:migrar               # cria as tabelas (db/schema.sql, idempotente)
npm run usuario -- "Nome" email@exemplo.com "senha-com-8+" [avaliador|admin]
npm run dev                     # http://localhost:3000
```

`npm run usuario` com um e-mail que já existe troca nome, senha e perfil (serve para redefinir senha). Não existe cadastro público.

## Estrutura

| Caminho | O que é |
|---|---|
| `public/ficha.html` | A ficha (antigo `index.html`). Servida em `/avaliacao` por rewrite no `next.config.ts`. Abre uma avaliação com `/avaliacao?id=<uuid>`. |
| `public/escores.js` | **Fonte única dos escores** (`scoreDHI`, `scoreEVA`, `scoreVAP`, `scoreMini`, `scoreCS`, `scoreIPAQ`, `resumoEscores`). A ficha importa como módulo; o servidor importa em `lib/avaliacoes.ts`. Cada função recebe `get(nome)`; `leitor(respostas)` cria esse `get` a partir do objeto salvo. Mudou regra de pontuação, mude só aqui. |
| `proxy.ts` | Barra quem não tem sessão: páginas redirecionam para `/login?voltar=…`, `/api/*` responde 401. As rotas checam a sessão de novo (não confiar só no proxy). |
| `lib/sessao.ts` | Cria e lê o cookie `sessao`. |
| `lib/db.ts` | Pool do `pg` (guardado em `globalThis` por causa do hot reload). |
| `lib/avaliacoes.ts` | Consultas, validação (nome e idade obrigatórios) e o formato das avaliações com escores. |
| `app/api/login`, `logout`, `me` | Autenticação. Erro de login sempre "E-mail ou senha incorretos." |
| `app/api/avaliacoes` | `GET` lista (sem `respostas`), `POST` cria. `[id]`: `GET`, `PUT`, `DELETE`. Autor e `atualizado_por` vêm da sessão, nunca do corpo. |
| `app/api/backup` | Baixa `backup-avaliacoes-AAAA-MM-DD.json` com **todas** as avaliações. Qualquer usuário logado pode gerar. Data e `gerado_em` no horário de Brasília. |
| `app/page.tsx` + `Lista.tsx` | Listagem (primeira tela): busca por paciente, filtro por avaliador, Abrir, Excluir com confirmação no cartão, backup. |
| `app/login` | Tela de login. |
| `db/schema.sql` | Tabelas `usuarios` e `avaliacoes` (id uuid, `respostas` jsonb). |
| `scripts/` | `migrar.mjs` e `criar-usuario.mjs`. |

### Salvar na ficha

- Botão **Salvar** fixo na barra de etapas (com um ponto quando há alteração não salva) e **Salvar avaliação** no Resumo.
- O primeiro salvar faz `POST` e troca a URL para `?id=…`; os seguintes fazem `PUT`. Não duplica.
- Rascunho no `localStorage` por avaliação (`avaliacao-vestibular-rascunho:<id>` ou `:novo`). Só existe enquanto há alteração não salva. Ao abrir uma avaliação, se o rascunho for da mesma versão salva, ele é recuperado e a página avisa.
- Sessão expirada ao salvar: o rascunho fica no aparelho e a página leva ao login, que volta para a mesma ficha.
- Rascunho recuperado mostra **Descartar alterações**, que volta à versão do servidor.
- Numa avaliação já salva, **Limpar ficha** começa uma avaliação nova (tira o `?id=`), para nunca sobrescrever o paciente anterior. **Preencher exemplo** fica escondido em avaliações salvas.
- Se a avaliação não carregar (sem conexão), salvar fica bloqueado até recarregar.
- A data padrão da avaliação usa a data local do aparelho, não UTC.

## Estrutura do `public/ficha.html`

1. **`<style>`**: tokens do design system em `:root` (cores, fontes, espaços, raios), depois os componentes (`.vc-btn`, `.vc-input`, `.vc-choice`, `.vc-check`, `.vc-score`, `.vc-tag`, `.eva`, etc.).
2. **Marcação fixa**: cabeçalho, barra de etapas (`#steps`), `<form id="form">` (vazio, preenchido pelo JS), rodapé com Voltar/Próxima (`.bar`) e o toast.
3. **`<script>`**: monta o formulário a partir de dados.

### Script, de cima para baixo

| Parte | O que faz |
|---|---|
| `field()`, `choice()`, `checks()`, `card()`, `opts()` | Construtores de HTML. `choice` = escolha única em pílulas (`{multi:true}` vira múltipla, `{scale:true}` vira números, `{bare:true}` sem legenda). `field` aceita `unit`, `hint`, `required`, `if`, `options` (vira select), `textarea`. |
| Constantes de conteúdo | `COMORB`, `SINTOMAS`, `POSICOES`, `EVA`, `DHI`, `VAP1/VAP2`, `MUSC`, `MB` (MiniBESTest), `CS_*` (10-CS), `IPAQ_Q`, `IPAQ_DESC`. Texto das perguntas fica aqui. |
| `STEPS` | Array com as 14 etapas: `{id, name, title?, score?, html()}`. Para criar/mover etapa, mexa aqui. |
| Estado | `serialize()` / `apply()` leem e escrevem o form inteiro como objeto. É esse objeto que vai para o banco (`respostas`). `save()` só cuida do rascunho local; `salvar()` envia ao servidor. |
| Escala visual | `setEva()` controla barra, rostinho SVG e valor. O valor real fica num `<input type="hidden" name="eva_N">`. |
| Escores | Vêm de `public/escores.js` (`import * as ESC`). `renderScores()` desenha os painéis. |
| Resumo | `renderResumo()` (tela) e `summaryText()` (botão Copiar). |
| Navegação | `go(i)` troca de etapa e bloqueia sair da etapa 1 sem nome e idade (`checkRequired`). |
| Exemplo | `EXEMPLO()` gera um paciente fictício para demonstração. |

### Campos condicionais (`data-if`)

Qualquer elemento com `data-if` aparece ou some sozinho em `conditionals()`:

- `data-if="oculos:Sim"`: mostra quando o campo `oculos` vale `Sim` (ou quando o checkbox com esse valor está marcado).
- `data-if="queda_6m!:Nenhuma"`: mostra quando **não** vale `Nenhuma`.

Ao esconder, os valores **não** são apagados (decisão para não perder dados num toque errado). Escores e resumo ignoram seções escondidas (`dhi_aplica`, `vap_aplica`, `posicoes_tem`).

### Comportamentos de interface

- Tocar de novo numa opção de escolha única já marcada desmarca.
- Textos e inputs com 16px (abaixo disso o iPhone dá zoom no campo).
- Alvos de toque com no mínimo 44px.
- Tem que funcionar em celular (390px) e PC (1366px) sem rolagem horizontal. A barra de etapas rola para o lado no celular e quebra em 2 linhas a partir de 900px.
- Sem `alert()`/`confirm()`: confirmações ficam na própria página (ex.: "Limpar ficha").

## Etapas (ordem atual)

1. **10-CS**: dados do paciente (nome* e idade* obrigatórios) + orientação, aprendizado (versão A/B/C), fluência verbal (cronômetro 1 min + contador − / +), evocação, ajuste por escolaridade, classificação.
2. **IPAQ** versão curta, com minutos/semana e classificação CELAFISCS.
3. **Caracterização**: vícios e sinais vitais.
4. **Comorbidades**: audição (lado E/D, múltipla), aparelho auditivo, sistema visual.
5. **Medicamentos**: linhas dinâmicas.
6. **Sintomas**
7. **Queda e tontura**: com "Não possui tontura / Possui tontura" abrindo os detalhes.
8. **Escala visual analógica** (9 itens, 0 a 10).
9. **DHI**: "Não aplicável / Aplicável".
10. **VAP**: "Não aplicável / Aplicável".
11. **Testes oculares**: motricidade com Limitação **ou** Mov. conjugado; Limitação abre observação.
12. **Testes vestibulares**
13. **MiniBESTest**
14. **Resumo**: na mesma ordem das etapas.

## Regras de pontuação implementadas

- **10-CS**: orientação (0–3) + fluência (0–5 animais = 0, 6–8 = 1, 9–11 = 2, 12–14 = 3, 15+ = 4) + evocação (0–3) + escolaridade (0 anos +2, 1–3 anos +1, 4+ anos +0), com **máximo de 10**. Classificação (Apolinario et al., 2016): 8–10 normal, 6–7 comprometimento cognitivo possível, 0–5 provável.
- **IPAQ**: minutos/semana = dias × (h×60 + min) por atividade. Classificação em `scoreIPAQ()` conforme o documento do CELAFISCS (`docs/fontes/ipaq-classificacao.jpg`). Validado com os 7 exemplos da tabela desse documento.
- **DHI**: Sim 4, Às vezes 2, Não 0. Físico 1,4,8,11,13,17,25; funcional 3,5,6,7,12,14,16,19,24; emocional 2,9,10,15,18,20,21,22,23. Leve 0–30, moderada 31–60, severa 61–100.
- **Escala visual analógica**: média dos itens respondidos. Leve até 4, moderado 4,1–7, severo acima de 7.
- **VAP**: soma e média por subescala; NA fica fora.
- **MiniBESTest**: 14 itens de 0 a 2, total 28. Nos itens 3 e 6 conta o lado com menor nota. Referência por faixa etária (50 a 89 anos) mostrada conforme a idade.

### Interpretações a confirmar com a autora do TCC

- Cortes da escala visual analógica (não estão no PDF original).
- Regra "menor lado" nos itens 3 e 6 do MiniBESTest.
- IPAQ, critério "MODERADA e/ou CAMINHADA ≥ 5 dias e ≥ 30 min": somados os dias de caminhada e moderada com sessões de 30 min ou mais.
- Faixas de "Tempo de início da tontura" seguem o PDF, que pula de "3 a 4 anos" para "mais de 5 anos".

## Design system

`docs/design-system/` traz o guia **Vestibular Clínico** (README, `tokens.json`, `componentes.css`). Resumo das regras:

- Fundo branco, um acento só (`--accent` verde-azulado) para ação/seleção.
- `good` / `warn` / `bad` só para resultados clínicos e exclusão.
- Números em `IBM Plex Mono`; títulos em `Sora`; texto em `Atkinson Hyperlegible`.
- Bordas em vez de sombras; sem emoji; ícones de traço simples.
- Português do Brasil, vocabulário da fisioterapia.

## Fontes

`docs/fontes/` tem o PDF original da ficha e as imagens do 10-CS, IPAQ (perguntas e classificação) e da escala visual analógica. As referências bibliográficas aparecem no fim de cada etapa do formulário.

## Decisões já tomadas

- Backup: **todas** as avaliações, e **qualquer** usuário logado pode gerar (decidido com o Gustavo em 01/11/2026). Senhas e hashes nunca entram.
- Todo usuário logado vê, edita e exclui qualquer avaliação. O perfil `admin` existe na tabela mas ainda não muda nada.
- Ids de avaliação são uuid.
- Esconder uma seção não apaga respostas. Por isso `resumoEscores()` devolve DHI e VAP como "não aplicável" quando `dhi_aplica`/`vap_aplica` valem "Não aplicável", mesmo que existam respostas antigas.

## Publicar (Neon + Vercel)

1. Criar projeto no Neon (região mais próxima do Brasil disponível) e copiar a connection string **pooled** com `sslmode=require`.
2. Rodar localmente com essa URL: `DATABASE_URL=… node scripts/migrar.mjs` e criar as avaliadoras com `scripts/criar-usuario.mjs`.
3. Importar o repositório na Vercel e definir `DATABASE_URL` e `SESSION_SECRET` (nova, `openssl rand -hex 32`) em Environment Variables.
4. São dados de saúde: usar só o domínio HTTPS da Vercel, não logar `respostas`, não compartilhar backups por canais abertos.

## Pendências

- Importar backup (ler o JSON, validar `versao_formato`, recriar avaliações).
- Cadastro de usuários pela interface, se for preciso (hoje só pelo script).

## Depois disso

- Gerar planilha Excel com todas as respostas (campos não marcados contam como "ausente"/"N"), a partir do mesmo formato do backup.
