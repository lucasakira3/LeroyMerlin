# Mosaico visual do Projeto Guiado

## Contexto

Usuário reportou que o resultado do Projeto Guiado (`components/ListaDeCompras.tsx`) está "muito texto e muito scroll" — hoje é uma lista vertical de 6 a 14 materiais, cada um com até 3 opções de produto, tudo em cards de texto puro (nome, corredor, estoque, preço), sem nenhuma foto. Pedido: uma tela mais visual, com fotos de produto e menos texto, "como se fosse uma apresentação de PowerPoint do projeto" — e a possibilidade de o cliente descrever a casa e ver um esboço/planta com os produtos recomendados posicionados.

Investigação do estado atual:
- `app/api/projeto/route.ts`: uma única chamada ao `flashModel` (Gemini 2.5 Flash, texto) devolve um JSON com `titulo`, `resumo`, `orcamento_estimado`, `complexidade`, `dica_especialista` e `itens[]` (`material`, `categoria`, `quantidade`, `prioridade`, `observacao`, `etapa_ordem`, `etapa_nome`). Depois disso, `buscaTextoSimples` resolve até 3 produtos reais (`resultados: SearchResult[]`) por item via busca de texto no catálogo.
- `lib/gemini.ts` só expõe `flashModel` (texto + visão de entrada) e `embeddingModel` — **não há modelo de geração de imagem configurado**. Gerar um "esboço" fotorrealista via IA exigiria adicionar uma API nova (custo/cota à parte, projeto já bateu no limite gratuito do Gemini uma vez, ver `[[project-backlog]]`).
- Decisão do usuário: nada de geração de imagem por IA por enquanto. O "esboço" vai ser um **diagrama esquemático construído a partir de dados estruturados** (mesmo espírito do `StoreMap.tsx`, que já desenha a loja como SVG a partir de coordenadas fixas, não de uma imagem gerada).
- `lib/categoriaImagens.ts` já resolve `getImagemCategoria(categoria, id)` com variedade real por produto (5 fotos por categoria, seleção determinística por `produto.id` — ver `[[project-backlog]]`), então "foto de produto" no mosaico é reaproveitar isso, zero trabalho de asset novo.
- `ProdutoDrawer.tsx` já é o padrão estabelecido em todo o app pra abrir detalhes/trocar produto/adicionar ao carrinho a partir de uma foto/card (usado em `CategoriaView.tsx`, `SearchSection.tsx`, etc.) — reaproveitar, não reinventar.

## Objetivo

Trocar a primeira impressão do resultado do Projeto Guiado por uma visão em mosaico — cômodos como caixas visuais, produtos como fotos clicáveis, mínimo de texto — mantendo tudo que já funciona hoje (mapa da loja, compartilhar WhatsApp, trocar produto sem estoque, agendar visita) acessível numa segunda aba, sem reconstruir essas funcionalidades.

## Escopo

**Dentro do escopo:**
- Novo campo `comodo` no JSON que a IA já devolve (`app/api/projeto/route.ts`), mesma chamada existente — sem custo/latência extra.
- Novo componente `components/ProjetoMosaico.tsx`: agrupa itens por `comodo`, renderiza grid de "cards de cômodo" com fotos de produto.
- `components/ListaDeCompras.tsx` ganha duas abas: "Visão geral" (novo mosaico, aberta por padrão) e "Lista completa" (conteúdo atual da coluna esquerda + direita, inalterado).
- Header verde do resultado fica mais enxuto (tira o parágrafo de `resumo`, mantém título/orçamento/badges).
- Interação de clique no mosaico reaproveita o `ProdutoDrawer` já usado em todo o app.

**Fora do escopo:**
- Geração de imagem real por IA (esboço fotorrealista) — fica pro backlog, precisa de modelo/API novo.
- Planta arquitetônica realista (paredes, portas, proporções corretas) — o mosaico é esquemático, não pretende representar a casa real.
- Mudanças em `ProjetoWizard.tsx` (tela de descrever o projeto) — só o resultado muda.
- Mudanças em `ProjetoTimeline.tsx`, mapa (`StoreMap.tsx`), WhatsApp, agendamento — continuam existindo como estão, só se movem para dentro da aba "Lista completa".

## Campo `comodo` no prompt da IA

`app/api/projeto/route.ts`, `PROMPT_SISTEMA`: cada item do array `itens` ganha um campo novo, junto dos já existentes:

```
"comodo": "Cômodo ou área da casa onde este item é usado, ex: Cozinha, Banheiro, Área externa. Se o projeto não menciona um cômodo específico para este item (ex: elétrica da casa toda, ferramentas gerais), use \"Geral\"."
```

Regra adicionada ao bloco de "Regras": `comodo` é obrigatório em todos os itens, mesmo que seja `"Geral"`.

Nenhuma mudança em `buscaTextoSimples` nem no formato de `resultados` — o campo só passa a existir a mais em cada item do array já retornado.

## `components/ProjetoMosaico.tsx` (novo)

**Recebe:** `itens: Projeto['itens']` (mesmo tipo já usado em `ListaDeCompras`), `selecionados: Set<string>`, `onSelecionarProduto: (produto) => void` (abre o drawer).

**Lógica:**
1. Agrupa `itens` por `comodo` (`Map<string, Item[]>`, preservando a primeira ordem de aparição).
2. Para cada item do grupo, usa o produto cujo `id` está em `selecionados` dentro de `item.resultados` — o mesmo produto que a aba "Lista completa" já mostra marcado (respeitando qualquer troca manual que o usuário tenha feito por lá). Se nenhum resultado do item estiver em `selecionados` (não deveria acontecer, dado que `ListaDeCompras` já inicializa `selecionados` com o preferido de cada item), cai no primeiro resultado do item como fallback. Não duplica a lógica de "produto preferido em estoque" — essa lógica já existe em `ListaDeCompras` e só precisa ser respeitada aqui, não recalculada.
3. Renderiza um card por cômodo, grid responsivo (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, mesmo breakpoint style do resto do app).

**Card de cômodo:**
- Título curto: nome do cômodo (`comodo`), sem descrição.
- Grid interno de fotos de produto (`getImagemCategoria(produto.categoria, produto.id)`), até 6 visíveis; se houver mais, mostra as 6 primeiras + um tile "+N" (abre a aba "Lista completa" ao ser clicado, filtrada não é necessário — só navega pra lá).
- Cada foto: `object-cover` quadrada/arredondada, anel colorido de prioridade (`essencial` = vermelho, `recomendado` = âmbar, `opcional` = cinza — mesmas cores já usadas em `PRIORIDADE` no `ListaDeCompras.tsx`), preço pequeno abaixo da foto (sem nome do produto por extenso — isso é exatamente o texto que estamos cortando; o nome aparece no drawer ao clicar).
- Clique na foto chama `onSelecionarProduto(produto)`.
- Sem contagem de estoque/corredor no card (isso é "modo lista", fica na aba 2) — mantém o mosaico limpo.

**Casos extremos:**
- Cômodo `"Geral"` sempre aparece por último no grid (ferramentas/itens sem cômodo específico não devem ser o primeiro impacto visual).
- Projeto com um único cômodo: grid vira uma coluna só, card ocupa a largura, ainda funciona sem layout quebrado (grid responsivo já lida com isso naturalmente).
- Item sem nenhum resultado em estoque (`resultados` vazio ou tudo sem estoque): foto normal, badge vermelho pequeno de "sem estoque" sobre a foto, clique ainda abre o drawer (mesmo tratamento de alternativas que já existe lá).

## `components/ListaDeCompras.tsx`

- Header verde perde o parágrafo `<p>{projeto.resumo}</p>` (linha 129 hoje); mantém título, os 3 badges (orçamento/materiais/complexidade), total estimado e a dica do especialista (já é curta, uma linha).
- Abaixo do header, duas abas simples (mesmo padrão visual de toggle já usado em outros lugares do app, ex: o toggle Cliente/Funcionário do login): **"Visão geral"** (default) e **"Lista completa"**.
- Estado novo: `const [aba, setAba] = useState<'visao-geral' | 'lista-completa'>('visao-geral')` e `const [produtoDrawer, setProdutoDrawer] = useState<Produto | null>(null)` (mesmo padrão de `CategoriaView.tsx`).
- Aba "Visão geral": renderiza `<ProjetoMosaico itens={projeto.itens} selecionados={selecionados} onSelecionarProduto={setProdutoDrawer} />`.
- Aba "Lista completa": todo o JSX que hoje é o corpo do componente (grid de 2 colunas com timeline/lista de materiais/mapa/WhatsApp/agendamento) — inalterado, só passa a ficar dentro de `{aba === 'lista-completa' && (...)}`.
- `<ProdutoDrawer produto={produtoDrawer} onClose={() => setProdutoDrawer(null)} />` renderizado uma vez fora das abas (visível em ambas).

## Dark mode

Segue a convenção já estabelecida (`[[project-dev-workflow]]`): cards e badges novos usam classes já cobertas pelos overrides globais (`bg-white`, cores de badge existentes); fotos não mudam com o tema.

## Testes

Sem framework de testes no projeto (`[[project-dev-workflow]]`). Verificação: `npx tsc --noEmit`, e navegação manual via `agent-browser` cobrindo — projeto com múltiplos cômodos (ex: "reforma completa da cozinha"), projeto de cômodo único (ex: "reformar meu banheiro"), projeto sem cômodo claro (ex: "trocar toda a parte elétrica da casa", confirma bucket "Geral"), clique numa foto abre o drawer corretamente, troca de aba preserva seleção de produtos, responsividade mobile (390×844, reaproveitando o breakpoint já testado no resto do app).
