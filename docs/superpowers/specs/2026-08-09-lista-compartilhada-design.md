# Compartilhar lista de materiais por link

## Contexto

MVP local-only (sem backend, sem banco de dados). `components/ListaDeCompras.tsx` (tela do Projeto Guiado) já tem um botão "Compartilhar lista" que gera um texto formatado e abre `wa.me`. Falta uma opção de compartilhamento por link. Sem persistência server-side, qualquer link compartilhável precisa carregar os próprios dados — não há onde "salvar" a lista para outra pessoa buscar depois.

`components/StoreMap.tsx` já ganhou (feature anterior) um botão "Adicionar ao carrinho" tanto na legenda de pins quanto no popup que aparece ao clicar num pin — funciona sem login, chamando `lib/clientCarrinho.ts` diretamente.

A resolução de produto-por-ID a partir do cliente já existe via `/api/produto/[id]` e está duplicada (a mesma função `buscarProdutos`) em `app/conta/page.tsx` e `app/carrinho/page.tsx`.

## Objetivo

Permitir copiar um link que, ao ser aberto por qualquer pessoa (em qualquer dispositivo, sem login), mostra a lista de materiais selecionada — nome dos produtos, preço, corredor, mapa da loja — e permite adicionar itens individuais ao próprio carrinho.

## Escopo

**Dentro do escopo:**
- Botão "Copiar link" em `ListaDeCompras.tsx`, ao lado do "Compartilhar lista" (WhatsApp).
- Codificação da lista (título do projeto, loja, IDs dos produtos selecionados) em base64 na URL — sem backend.
- Nova página `/lista` que decodifica o parâmetro, resolve os produtos via API e exibe uma visão somente-leitura (mapa + lista), reaproveitando `StoreMap.tsx`.
- Extrair a função de resolução de produtos por ID (hoje duplicada em `/conta` e `/carrinho`) para `lib/produtosCliente.ts`, reaproveitada nos três lugares.

**Fora do escopo:**
- Qualquer persistência server-side (banco de dados, encurtador de URL próprio).
- Botão "adicionar tudo ao carrinho" — o `StoreMap` já permite adicionar item a item (feature anterior), suficiente para este objetivo.
- Edição da lista compartilhada (a pessoa que recebe o link só visualiza/compra, não remonta a lista).

## Módulo de dados: `lib/listaCompartilhada.ts`

Funções puras (sem I/O, sem `localStorage`):

```ts
interface ListaCompartilhadaDados {
  titulo: string
  loja: string
  produtoIds: string[]
}

function codificarLista(dados: ListaCompartilhadaDados): string
function decodificarLista(codificado: string): ListaCompartilhadaDados | null
```

- `codificarLista`: serializa para JSON e codifica em base64, com tratamento UTF-8 explícito (`unescape(encodeURIComponent(json))` antes de `btoa`) para suportar acentos em título/loja.
- `decodificarLista`: operação inversa dentro de um `try/catch` — em qualquer falha (base64 inválido, JSON malformado, campos ausentes/tipo errado), retorna `null`. Nunca lança exceção — mesmo padrão defensivo dos demais módulos `lib/client*.ts`, mesmo não sendo um módulo `client*` (não usa `localStorage`, mas seria usado tanto no cliente quanto potencialmente no servidor).

O chamador (botão em `ListaDeCompras.tsx`) monta a URL completa: `${window.location.origin}/lista?d=${encodeURIComponent(codificarLista(dados))}`.

## Módulo compartilhado: `lib/produtosCliente.ts`

Extrai a função hoje duplicada em `app/conta/page.tsx` (`buscarProdutos`) e `app/carrinho/page.tsx` (`buscarProdutos`):

```ts
async function buscarProdutosPorIds(ids: string[]): Promise<ProdutoResolvido[]>
```

Busca cada ID em paralelo via `/api/produto/{id}` (`Promise.all`), descarta IDs não encontrados (404 → `null`, filtrado do resultado). Retorna um array plano — cada consumidor molda o resultado conforme sua necessidade (`/conta` embrulha em `{produto, score: 1}` para o `ProductCard`; `/carrinho` indexa por ID num `Record`; `/lista` embrulha em `{produto, score: 1}` para o `StoreMap`).

`app/conta/page.tsx` e `app/carrinho/page.tsx` são atualizados para importar essa função em vez de manter sua própria cópia.

## Botão em `ListaDeCompras.tsx`

Ao lado do botão "Compartilhar lista" (WhatsApp) existente, um novo botão "Copiar link":
- Monta `produtoIds` a partir de `mapResultados` (a mesma lista deduplicada de produtos selecionados já usada pelo mapa e pelo texto do WhatsApp).
- Copia a URL via `navigator.clipboard.writeText`.
- Feedback local: o texto do botão muda para "Link copiado ✓" por ~1.5s (mesmo padrão de `setTimeout` já usado em `ProdutoDrawer.tsx` e `StoreMap.tsx` para o feedback de "Adicionado ✓").

## Página `app/lista/page.tsx`

`'use client'`, lê `d` via `useSearchParams().get('d')`.

- **Sem parâmetro ou `decodificarLista` retorna `null`:** mensagem "Este link parece inválido ou incompleto." + botão para voltar à home. Não tenta resolver produtos.
- **Parâmetro válido:** resolve `produtoIds` via `buscarProdutosPorIds`, monta `SearchResult[]` (`{produto, score: 1}`), calcula `totalEstimado` (soma de `preco`), e renderiza:
  - Cabeçalho com o `titulo` decodificado e a `loja`.
  - Nota curta explicando o que é a página (ex: "Lista de materiais compartilhada por um cliente Leroy Merlin — clique num produto no mapa para localizá-lo ou adicione ao seu carrinho.").
  - `<StoreMap resultados={...} loja={loja} totalEstimado={...} />` sem prop `onSelect` — cliques nos pins/legenda abrem o popup de detalhes (já existente no `StoreMap`) com o botão "Adicionar ao carrinho" (sem "Ver detalhes →", já que não há `ProdutoDrawer` nesta página).
  - Se, após resolver, a lista de produtos ficar vazia (todos os IDs correspondem a produtos removidos da base): mensagem "Os produtos desta lista não estão mais disponíveis." em vez do mapa.

## Tratamento de erros

`decodificarLista` nunca lança — qualquer link corrompido, editado manualmente ou de uma versão futura/antiga do formato cai no estado "link inválido" da página, sem crash. IDs de produto que não existem mais na base são simplesmente descartados por `buscarProdutosPorIds` (mesmo comportamento já usado em `/conta` para favoritos/histórico órfãos).

## Testes

Sem framework de testes (convenção do projeto). Verificação via:
- `npx tsc --noEmit`
- Script `tsx` temporário para `codificarLista`/`decodificarLista` (round-trip, string inválida retorna `null`, título/loja com acentos preservados)
- Navegação real via `agent-browser`: gerar uma lista no Projeto Guiado, clicar "Copiar link", abrir a URL copiada numa nova aba/sessão (simulando outra pessoa, sem login), conferir mapa e lista carregando corretamente, adicionar um item ao carrinho a partir dessa página, testar link com parâmetro `d` ausente e com valor corrompido, testar em modo claro e escuro
