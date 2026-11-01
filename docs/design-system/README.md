# Vestibular Clínico

Sistema visual do site de avaliação fisioterapêutica para hipofunção vestibular (TCC). Branco, claro e legível: feito para ser preenchido rápido, no celular, durante a avaliação do paciente.

## Para quem e para quê

Uma fisioterapeuta preenche uma ficha longa (anamnese, DHI, VAP-BR, testes oculares e vestibulares, MiniBESTest), muitas vezes de pé e com o celular na mão. Depois lista, edita, exclui e exporta tudo para Excel. Cada decisão visual serve a isso: ler sem esforço, tocar sem errar, ver o escore sem fazer conta.

## Princípios

1. **Branco primeiro.** A página é `bg` (quase branco) e o conteúdo fica em `surface` (branco puro). A cor é exceção, nunca fundo de seção.
2. **Um acento só.** `accent` (verde-azulado clínico) marca o que é ação ou seleção: botão principal, opção escolhida, etapa atual e foco. Nada decorativo usa `accent`.
3. **Cor de estado só para resultado.** `good`, `warn` e `bad` aparecem apenas em resultados clínicos (classificação do DHI, referência do MiniBEST) e na exclusão. Sempre sobre o fundo `-soft` da mesma família.
4. **Números em mono.** Escores, códigos de paciente, número de questão e pontos de opção usam a família `mono` com algarismos tabulares, para alinhar em colunas.
5. **Bordas, não sombras.** Cartões se separam por `line` e no máximo `shadow-card`. A única sombra marcada é `shadow-sticky`, na barra de etapas do rodapé.

## Cores

| Token | Uso |
| --- | --- |
| `bg` | Fundo da página |
| `surface` | Cartões, seções, modais |
| `surface-subtle` | Áreas secundárias, linhas alternadas de tabela |
| `surface-accent` | Item selecionado, painel de escores |
| `line` / `line-control` | Divisórias / borda de controles (3:1) |
| `ink` / `ink-muted` | Texto principal / texto de apoio |
| `accent` / `accent-hover` / `on-accent` | Ação e seleção |
| `good` `warn` `bad` (+ `-soft`) | Tontura leve, moderada, severa e excluir |

Todo texto passa de 4.5:1 sobre o seu fundo. Inputs e checkboxes usam `line-control` na borda, nunca `line`, porque `line` é clara demais para indicar um controle.

## Tipografia

- **Sora** (`display`): títulos de página, de etapa e de subseção. Só em `t-display`, `t-title` e `t-heading`.
- **Atkinson Hyperlegible** (`body`): todo o resto. Foi desenhada para baixa visão, com letras bem distintas (Il1, 0O), o que ajuda a ler rápido números e respostas.
- **IBM Plex Mono** (`mono`): `t-score`, `t-code` e `t-eyebrow`.

Inputs ficam sempre com 16px (`t-body`). Abaixo disso, o iPhone dá zoom sozinho ao tocar no campo.

## Espaço e forma

- Grade de 4px: `space-1` a `space-8`. No celular o gutter lateral mínimo é `space-4`.
- `radius-pill` em tudo que é tocável e escolhido (botões, escolhas, tags, etapas). `radius-md` em inputs e chips de checkbox. `radius-lg` em cartões e seções.
- Todo alvo de toque tem pelo menos `touch-min` (44px) de altura.

## Padrões do formulário

- **Ficha em etapas.** 10 etapas, na ordem do PDF: Identificação, Comorbidades, Medicamentos, Sintomas, Queda e tontura, DHI, VAP, Testes oculares, Testes vestibulares, MiniBESTest. A barra `Stepper` fica no topo e rola na horizontal no celular. Voltar, Próxima e Salvar ficam fixos no rodapé.
- **Escolha única** (sexo, Sim/Não, Normal/Alterado, respostas do DHI) usa `Choice`, nunca um select. Um toque resolve.
- **Escalas numéricas** (VAP 0–4 + NA) usam `Choice` na variante `--scale`, com a legenda acima.
- **MiniBESTest** mostra o texto completo de cada nível (2 Normal, 1 Moderado, 0 Grave) como cartões de opção, porque a avaliadora precisa ler o critério.
- **Múltipla escolha** (comorbidades, sintomas, posições) usa `Checklist`. O que não for marcado vale "ausente" na planilha.
- **Escores ao vivo** em `ScoreCard` no topo das etapas DHI, VAP e MiniBEST, e resumidos na barra do rodapé.
- **Selects** só para listas longas e pouco usadas (escolaridade).

## Escrita

- Português do Brasil, direto, no vocabulário da fisioterapia: "Avaliação", "Paciente", "Escore final", "Tontura moderada".
- Botões dizem o que fazem: "Salvar", "Nova avaliação", "Gerar planilha Excel", "Excluir". A confirmação mostra o resultado: "Avaliação P004 salva".
- Erro explica o que fazer: "Preencha o nome do paciente para salvar."
- Exclusão nunca usa diálogo do navegador. Abre uma faixa `bad-soft` no próprio cartão, com Cancelar e Excluir.
- Referências bibliográficas das escalas aparecem no fim da etapa em `t-caption`.

## Ícones

Não há biblioteca de ícones. Os poucos ícones (mais, lixeira, busca, planilha) são traços simples de 1.8 a 2px, cantos arredondados, na cor do texto ao lado. Sem emoji e sem ilustrações.

## Acessibilidade

- Foco visível em todo controle: contorno de 2px em `accent`, afastado 2px.
- Escolhas e checkboxes são inputs nativos escondidos com `label` clicável, então funcionam com teclado e leitor de tela.
- Cor nunca é o único sinal. A classificação do DHI também aparece escrita ("Tontura moderada").
