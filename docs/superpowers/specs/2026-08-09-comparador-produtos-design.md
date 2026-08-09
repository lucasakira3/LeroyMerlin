# Comparador de produtos

## Contexto

MVP local-only. O projeto já tem três features com o mesmo formato — toggle por `produtoId` em `localStorage`, botão dentro do `ProdutoDrawer.tsx` — que servem de modelo direto: `lib/clientFavoritos.ts` (favoritar), `lib/clientCarrinho.ts` (carrinho, com evento customizado `lm-carrinho-change` pra sincronizar componentes) e `lib/clientAvaliacoes.ts` (avaliações). A resolução de produtos por ID via `/api/produto/[id]` já está centralizada em `lib/produtosCliente.ts`, usada em `/conta`, `/carrinho` e `/lista`.

`SearchSection.tsx` e `CategoriaView.tsx` são as duas telas de navegação de produtos (busca e categoria). `CategoriaView.tsx` já tem um padrão de "barra flutuante" (`sticky bottom-4`) pra outra finalidade (visualizar seleção no mapa) — o comparador não deve competir por esse mesmo espaço.

## Objetivo

Cliente escolhe até 3 produtos (a partir do `ProdutoDrawer`) e vê uma comparação lado a lado (preço, estoque, corredor, complexidade, sustentabilidade, especificações, tags, avaliação média), acessada por uma barra que aparece nas telas de produtos — sem nenhum ícone fixo no `NavBar`.

## Escopo

**Dentro do escopo:**
- `lib/clientComparador.ts`: lista de até 3 `produtoId` em `localStorage`.
- Botão "Comparar" (toggle) no `ProdutoDrawer.tsx`, mesmo padrão visual do favoritar.
- `components/ComparadorBar.tsx`: barra que aparece no topo dos resultados em `SearchSection.tsx` e `CategoriaView.tsx` quando há pelo menos 1 produto no comparador; leva pra `/comparar`.
- `/comparar`: tabela lado a lado com os campos citados, botão de adicionar ao carrinho e remover da comparação por coluna.

**Fora do escopo:**
- Ícone/contador no `NavBar` (decisão explícita do usuário).
- Adicionar ao comparador a partir dos cards de busca/categoria — só pelo `ProdutoDrawer`.
- Mais de 3 produtos simultâneos.

## Módulo de dados: `lib/clientComparador.ts`

Mesmo padrão defensivo (`try/catch`, no-op em SSR) de `lib/clientFavoritos.ts`.

- Chave: `lm_comparador`
- Formato: `string[]` (até 3 `produtoId`)

Funções:
- `getComparador(): string[]`
- `estaNoComparador(produtoId: string): boolean`
- `toggleComparador(produtoId: string): 'added' | 'removed' | 'full'` — remove se já presente; adiciona se ausente e a lista tiver menos de 3; retorna `'full'` sem alterar nada se ausente e a lista já tiver 3 (o chamador decide como avisar o usuário).
- `removerDoComparador(produtoId: string): void` — usado na página de comparação (remoção explícita por coluna, sem toggle).

Toda mutação dispara `window.dispatchEvent(new Event('lm-comparador-change'))`, mesmo mecanismo do `lm-carrinho-change`, pra sincronizar a `ComparadorBar` sem estado global/Context.

## Botão no `ProdutoDrawer.tsx`

Ícone `Scale` (lucide-react) ao lado do coração de favoritar, no cabeçalho do drawer. Estado local `comparadorMsg: string | null` pra feedback transitório (~1.5s, mesmo padrão de "Adicionado ✓"):
- Ao clicar: chama `toggleComparador(produto.id)`.
- `'added'` → ícone preenchido (estado ativo).
- `'removed'` → ícone volta ao estado neutro.
- `'full'` → ícone não muda, mostra tooltip/texto rápido "Comparador cheio (máx. 3)" perto do botão.

## `components/ComparadorBar.tsx`

`'use client'`, autocontido — só lê `getComparador().length`, não resolve produtos (fica leve, sem chamada à API). Escuta `lm-comparador-change` (+ carrega o valor inicial no mount), igual ao `CarrinhoIcon`.

- Se `length === 0`: não renderiza nada.
- Se `length > 0`: barra compacta — "`{length}` produto{s} para comparar" + link "Ver comparação →" pra `/comparar` + botão "Limpar" (chama uma nova `limparComparador()` exportada por `lib/clientComparador.ts`).

Posicionada no **topo** dos resultados (logo abaixo do seletor de loja/filtros, antes do mapa ou da grade) em `SearchSection.tsx` e `CategoriaView.tsx` — não usa `sticky`, então não compete com a barra flutuante existente em `CategoriaView.tsx` (que fica no `bottom-4` e serve outro propósito).

## Página `/comparar`

`'use client'`, resolve os `produtoId` do comparador via `buscarProdutosPorIds` (`lib/produtosCliente.ts`). Layout: uma coluna por produto (até 3), lado a lado — em telas estreitas, `overflow-x-auto` (mesmo padrão já aceito nas tabelas de estoque/clientes do funcionário).

Linhas comparadas, cada uma reaproveitando componentes existentes quando possível:
- Nome + categoria + corredor
- Preço (destaca o menor com um badge "Melhor preço")
- `StockIndicator` (estoque)
- Complexidade (badge)
- `SustainabilityBadge`
- Especificações técnicas (texto completo)
- Tags (chips)
- Avaliação média — `StarRating` somente-leitura + `getMedia(produtoId)` de `lib/clientAvaliacoes.ts`

Por coluna: botão "Adicionar ao carrinho" (`adicionarAoCarrinho`, já existente) e botão "Remover da comparação" (`removerDoComparador`, atualiza a página imediatamente).

**Estado vazio** (comparador sem itens ao abrir a página direto): mensagem "Nenhum produto selecionado pra comparar." + link pra home.

## Tratamento de erros

Mesmo padrão dos demais módulos `lib/client*.ts` — leitura corrompida de `localStorage` retorna `[]`, nunca lança. Produto cujo ID não existe mais na base é descartado por `buscarProdutosPorIds` (mesmo comportamento já usado em `/carrinho`, `/conta`, `/lista`).

## Testes

Sem framework de testes (convenção do projeto). Verificação via:
- `npx tsc --noEmit`
- Script `tsx` temporário para `lib/clientComparador.ts` (adicionar até o limite de 3, tentar um 4º retorna `'full'`, remover, `limparComparador`)
- Navegação real via `agent-browser`: adicionar 3 produtos ao comparador pelo `ProdutoDrawer` (em buscas/categorias diferentes), confirmar que a `ComparadorBar` aparece nas duas telas de produtos, tentar um 4º (mensagem "cheio"), abrir `/comparar` e conferir os campos, remover um item da página e confirmar atualização, adicionar ao carrinho direto da comparação, testar em modo claro e escuro
