# Carrinho de compras

## Contexto

MVP local-only (sem backend, sem pagamento real). Hoje não existe nenhum conceito de carrinho/checkout no app — o mais próximo é `components/ListaDeCompras.tsx` (lista de materiais do Projeto Guiado, que só gera link de WhatsApp) e `components/StoreMap.tsx` (mostra produtos como pins no mapa). Cliente já tem login simulado (`lib/clientAuth.ts`) e padrões estabelecidos de dados client-side em `localStorage` (`lib/clientFavoritos.ts`, `lib/clientHistorico.ts`, `lib/clientAvaliacoes.ts`). A resolução de produto por ID no cliente já existe via `/api/produto/[id]` (usada em `app/conta/page.tsx` para favoritos/histórico).

## Objetivo

Permitir que o cliente monte um carrinho de produtos e finalize um pedido mockado, escolhendo entre retirar na loja ou receber em casa, com histórico de pedidos em "Minha Conta".

## Escopo

**Dentro do escopo:**
- Botão "Adicionar ao carrinho" no `ProdutoDrawer.tsx`, funciona sem login (como favoritar).
- Ícone de carrinho com contador no `NavBar.tsx` (desktop e mobile), leva para `/carrinho`.
- Página `/carrinho`: lista de itens com ajuste de quantidade e remoção, total geral.
- Checkout exige login; permite escolher "Retirar na loja" (seleciona loja) ou "Entrega em casa" (endereço em texto livre).
- Confirmação do pedido: gera número mockado, salva no histórico do cliente, limpa o carrinho.
- Seção "Meus pedidos" em `app/conta/page.tsx` listando o histórico.
- Quantidade adicionada/ajustada respeita o campo `estoque` do produto.

**Fora do escopo (explicitamente adiado):**
- Pagamento real (nenhum gateway, nenhum campo de cartão).
- Cálculo de frete real.
- Edição ou cancelamento de um pedido já confirmado.
- Visão de pedidos no painel do funcionário.
- Refatorar a lista `LOJAS` duplicada nos outros 4 componentes que já a têm (`SearchSection.tsx`, `CategoriaView.tsx`, `ListaDeCompras.tsx`, `AgendamentoForm.tsx`) — o carrinho segue o mesmo padrão de duplicação already estabelecido, não introduz um módulo compartilhado.

## Modelo de dados

### `lib/clientCarrinho.ts`

Carrinho é **global** (não associado a um email) — funciona sem login, como os favoritos. Segue o padrão defensivo (`try/catch`, no-op em SSR) de `lib/clientFavoritos.ts`.

- Chave: `lm_carrinho`
- Formato: `CartItem[]`
  ```ts
  interface CartItem {
    produtoId: string
    quantidade: number
  }
  ```

Funções:
- `getCarrinho(): CartItem[]`
- `getQuantidadeTotal(): number` — soma de todas as quantidades, para o badge do header
- `adicionarAoCarrinho(produtoId: string, quantidade?: number): void` — upsert; se o item já existe, soma `quantidade` (default 1) ao existente; senão cria com `quantidade` (default 1)
- `atualizarQuantidade(produtoId: string, quantidade: number): void` — define a quantidade exata; se `quantidade <= 0`, remove o item
- `removerDoCarrinho(produtoId: string): void`
- `limparCarrinho(): void` — usado após checkout confirmado

Toda função que muda o carrinho (`adicionarAoCarrinho`, `atualizarQuantidade`, `removerDoCarrinho`, `limparCarrinho`) dispara `window.dispatchEvent(new Event('lm-carrinho-change'))` ao final, para que o ícone do header (que vive em outro componente, `NavBar`) saiba atualizar seu contador sem precisar de um estado global/Context — `localStorage` sozinho não notifica outros componentes na mesma aba.

### `lib/clientPedidos.ts`

Pedidos ficam associados a um email (exige login para gerar), seguindo o mesmo padrão de `Record<email, T[]>` de `lib/clientAvaliacoes.ts`.

- Chave: `lm_pedidos_cliente`
- Formato: `Record<string /* email */, Pedido[]>`
  ```ts
  interface ItemPedido {
    produtoId: string
    nome: string       // snapshot do nome no momento da compra
    preco: number       // snapshot do preço no momento da compra
    quantidade: number
  }

  interface Pedido {
    numero: string       // gerado, ex: "LM" + timestamp em base36 maiúsculo
    data: string           // ISO timestamp
    itens: ItemPedido[]
    metodo: 'retirada' | 'entrega'
    loja?: string          // presente quando metodo === 'retirada'
    endereco?: string      // presente quando metodo === 'entrega'
    total: number
  }
  ```

Funções:
- `getPedidos(email: string): Pedido[]` — mais recentes primeiro
- `salvarPedido(email: string, pedido: Pedido): void` — sempre adiciona (pedidos nunca são editados/removidos, fora de escopo)
- `gerarNumeroPedido(): string` — `'LM' + Date.now().toString(36).toUpperCase()`

Um pedido guarda uma cópia (`nome`, `preco`) de cada item no momento da compra, não apenas o `produtoId` — um pedido já feito não deve mudar de conteúdo se o produto for alterado ou removido depois. Isso é diferente do carrinho (que é "vivo" e sempre resolve o produto atual via API).

## Componentes

### `components/CarrinhoIcon.tsx`
Ícone `ShoppingCart` (lucide-react) com badge numérico, usado dentro do `NavBar.tsx` (bloco desktop e bloco mobile). `'use client'`, autocontido:
- Estado local `quantidade: number`, inicializado com `getQuantidadeTotal()` em `useEffect` (mount) e recalculado sempre que o evento `lm-carrinho-change` dispara (`window.addEventListener`) — cleanup no unmount.
- Badge (círculo pequeno, `bg-lm-yellow text-black` ou similar contraste, posicionado `absolute -top-1 -right-1`) só aparece se `quantidade > 0`.
- É um `<Link href="/carrinho">` envolvendo o ícone + badge.

### `app/carrinho/page.tsx`
Página dedicada (`'use client'`), reaproveita o padrão de resolução de produtos por ID de `app/conta/page.tsx` (`fetch('/api/produto/{id}')` em paralelo com `Promise.all`).

Estados: `itens: CartItem[]` (de `getCarrinho()`), `produtos: Record<string, ProdutoResolvido> | null` (resolvidos via API), `usuario: {email} | null`, `metodo: 'retirada' | 'entrega'`, `loja: string`, `endereco: string`, `pedidoConfirmado: Pedido | null`.

Fluxo de renderização:
1. **Carrinho vazio** (`itens.length === 0` e sem pedido recém-confirmado): mensagem "Seu carrinho está vazio" + link para a home.
2. **Carrinho com itens**: para cada item, um card mostrando nome, preço unitário, corredor, estoque disponível, stepper de quantidade (`-`/`+`, desabilita `+` quando `quantidade === estoque`), botão remover (ícone `X` ou `Trash2`), e subtotal (`preco * quantidade`). Total geral no rodapé.
3. **Bloco de checkout** (abaixo da lista, só quando há itens):
   - Se `!usuario`: aviso "Faça login para finalizar o pedido" + link para `/funcionario/login`.
   - Se `usuario`: toggle "Retirar na loja" / "Entrega em casa" (dois botões, como o toggle Cliente/Funcionário do login). Se retirada, `<select>` com a mesma lista `LOJAS` (copiada localmente neste arquivo, seguindo o padrão já duplicado no projeto). Se entrega, `<textarea>` "Endereço completo" (obrigatório, `bg-white` explícito). Botão "Confirmar pedido" (desabilitado se faltar loja/endereço).
4. **Confirmação** (após `pedidoConfirmado` ser setado): substitui a lista por um painel de sucesso — número do pedido, resumo dos itens, método escolhido, total, e um botão "Ver meus pedidos" (`/conta`) e "Continuar comprando" (`/`).

Ao confirmar: monta `ItemPedido[]` a partir dos itens do carrinho já resolvidos (produtos já estão em memória, sem nova chamada), chama `salvarPedido(usuario.email, pedido)`, depois `limparCarrinho()`, depois `setPedidoConfirmado(pedido)`.

### Integração no `ProdutoDrawer.tsx`
Botão "Adicionar ao carrinho" (ícone `ShoppingCart`, `Button variant="primary"`) ao lado do bloco de preço, na seção já existente de preço/localização. Desabilitado quando `produto.estoque === 0`. `onClick` chama `adicionarAoCarrinho(produto.id)`; feedback imediato: o texto do botão muda brevemente para "Adicionado ✓" por ~1.5s (`setTimeout` com estado local), sem precisar navegar para o carrinho.

### Integração no `app/conta/page.tsx`
Nova seção "Meus pedidos" (usando o mesmo componente de layout das seções existentes, mas sem reaproveitar `SecaoProdutos` — pedidos têm forma diferente de favoritos/histórico). Para cada pedido: número, data formatada (`toLocaleDateString('pt-BR')`), método (com loja ou endereço), lista de itens (nome × quantidade), total. Estado vazio: "Você ainda não fez nenhum pedido."

## Tratamento de erros

Mesmo padrão dos demais módulos `lib/client*.ts`: leitura de `localStorage` em `try/catch`, retorno vazio em caso de dado corrompido ou SSR. A resolução de produtos via `/api/produto/[id]` já trata 404 (produto removido) retornando `null` e filtrando — um item do carrinho cujo produto não existe mais na base simplesmente não aparece na lista (comportamento idêntico ao já usado em `/conta` para favoritos/histórico órfãos).

## Testes

Sem framework de testes (convenção do projeto). Verificação via:
- `npx tsc --noEmit`
- Script `tsx` temporário para a lógica pura de `clientCarrinho.ts` e `clientPedidos.ts` (upsert, limites de quantidade, geração de número de pedido)
- Navegação real via `agent-browser`: adicionar produto ao carrinho deslogado, ver contador do header atualizar, abrir `/carrinho`, ajustar quantidade, tentar finalizar sem login (deve bloquear), logar, escolher retirada e depois entrega, confirmar pedido, verificar que o carrinho esvazia e o pedido aparece em `/conta`, testar em modo claro e escuro
