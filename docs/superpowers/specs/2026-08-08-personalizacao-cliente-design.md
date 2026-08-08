# Personalização do cliente — histórico e favoritos

**Data:** 2026-08-08
**Status:** Aprovado, aguardando plano de implementação

## Contexto

O projeto é um MVP (FIAP Challenge 2026) de assistente de loja com IA para a Leroy Merlin. A área do cliente hoje é totalmente stateless entre visitas: nada é lembrado sobre o que o cliente já viu ou gostou. O backlog de melhorias levantado inclui várias ideias de personalização; este documento cobre o primeiro bloco ("Personalização do cliente"): histórico de produtos visitados e lista de favoritos.

Por decisão explícita, este bloco não usa nenhum backend/persistência de servidor — tudo roda no `localStorage` do navegador, consistente com o momento do projeto ("vai ser tudo local por enquanto, pra ser um MVP").

## Objetivo

Permitir que o cliente final:
1. Marque produtos como favoritos a partir da página de detalhe do produto.
2. Veja automaticamente, sem nenhuma ação manual, os produtos que visitou recentemente.
3. Acesse as duas listas numa página dedicada, "Minha Conta".

## Decisões de design

### 1. Armazenamento

Dois módulos utilitários novos, cada um com sua própria chave no `localStorage` do navegador — nenhuma chamada de rede nova é criada:

- **`lib/clientHistorico.ts`**
  - Chave: `lm_historico_produtos`
  - Formato armazenado: array JSON de `{ id: string, visitadoEm: number }` (timestamp `Date.now()`), ordenado do mais recente pro mais antigo.
  - `addAoHistorico(id: string): void` — insere o id no topo; se o id já existir na lista, remove a ocorrência antiga antes de reinserir no topo (não duplica, mas atualiza a posição pra "mais recente"); mantém no máximo 12 entradas (descarta as mais antigas além desse limite).
  - `getHistoricoIds(): string[]` — retorna só os ids, na ordem armazenada (mais recente primeiro).

- **`lib/clientFavoritos.ts`**
  - Chave: `lm_favoritos_produtos`
  - Formato armazenado: array JSON de `string` (ids de produto), sem limite de tamanho.
  - `isFavorito(id: string): boolean`
  - `toggleFavorito(id: string): boolean` — adiciona se não existir, remove se existir; retorna o novo estado (`true` = favoritado).
  - `getFavoritosIds(): string[]`

Ambos os módulos leem/escrevem o `localStorage` diretamente (sem Context/Provider — não há necessidade de sincronizar múltiplas telas abertas simultaneamente em tempo real). Cada função faz `typeof window === 'undefined'` guard no início e retorna vazio/no-op nesse caso, para serem seguras de chamar em componentes que rendeiam no servidor antes de hidratar.

### 2. Página de produto (`app/produto/[id]/page.tsx`)

- Ao montar (useEffect, uma vez, quando o produto carrega com sucesso), chama `addAoHistorico(produto.id)`.
- Ganha um ícone de coração (`Heart` do lucide-react) ao lado do título/preço do produto: preenchido (`fill-current text-red-500`) quando `isFavorito(produto.id)` é `true`, contorno (`text-gray-400`) quando `false`. Clicar chama `toggleFavorito` e atualiza o estado local do componente pra refletir imediatamente.
- Nenhuma outra parte da página muda.

### 3. Página nova `/conta` ("Minha Conta")

- Arquivo novo: `app/conta/page.tsx`.
- Título via `PageHeader` ("Minha Conta").
- Duas seções, nesta ordem: **Favoritos** primeiro, **Vistos recentemente** depois.
- Cada seção, ao montar, lê os ids saladados (`getFavoritosIds()` / `getHistoricoIds()`) e busca os produtos completos em paralelo via `GET /api/produto/[id]` (rota já existente, reaproveitada sem alteração) — um fetch por id, com `Promise.all`.
- Se um id salvo não retornar produto (ex: 404 — produto removido do catálogo mockado), esse item é silenciosamente descartado da lista renderizada (não gera erro visível).
- Produtos retornados são renderizados com o componente `ProductCard` já existente (mesmo card usado na busca) — cada seção é uma grade/lista desses cards.
- Estado vazio: se a lista de ids for vazia OU todos os fetches falharem, mostra uma mensagem amigável na seção (ex: "Você ainda não favoritou nenhum produto." / "Nenhum produto visitado ainda — suas buscas vão aparecer aqui.") em vez de uma grade vazia.
- Estado de carregamento: enquanto os fetches estão em andamento, mostra um placeholder simples (reaproveita o padrão de loading já usado em outras telas do projeto).

### 4. Navegação (`components/NavBar.tsx`)

- Adiciona uma 5ª aba ao array `tabs` já existente: `{ href: '/conta', label: 'Minha Conta', icon: User }` (ícone `User` do lucide-react), no mesmo padrão visual/comportamental das 4 abas atuais (mesmo estado ativo/hover, mesma posição na `nav`, à esquerda do botão "Login" que já existe).

## Fora de escopo

- Sincronização entre dispositivos/navegadores (é só `localStorage` local ao navegador).
- Qualquer chamada de API nova — reaproveita apenas `/api/produto/[id]`, já existente.
- Notificações (ex: "favorito voltou ao estoque") — fica pra um bloco futuro do backlog.
- Histórico/favoritos de buscas em texto (só produtos visitados contam como histórico, conforme decidido).
- Remover itens do histórico manualmente (só desfavoritar é uma ação do usuário; o histórico é só-leitura/automático nesta primeira versão).
