# Avaliações de produto (0-5 estrelas)

## Contexto

MVP local-only (sem backend, sem persistência em servidor). Clientes já têm login simulado (`lib/clientAuth.ts`) e favoritos/histórico persistidos em `localStorage` (`lib/clientFavoritos.ts`, `lib/clientHistorico.ts`). A superfície de detalhe de produto realmente usada pelos fluxos de busca/categoria é o `components/ProdutoDrawer.tsx` (não a página órfã `/produto/[id]`).

## Objetivo

Permitir que o cliente logado avalie um produto com nota de 0 a 5 estrelas, com comentário opcional, e que qualquer visitante (logado ou não) veja a média e a lista de avaliações daquele produto.

## Escopo

**Dentro do escopo:**
- Nova seção "Avaliações" no `ProdutoDrawer.tsx`, entre o bloco de preço/localização/badges e a seção "O que o especialista diz".
- Cliente logado pode criar/editar sua avaliação (uma por produto, upsert por email).
- Cliente não logado (ou visitante anônimo) vê a lista e a média, mas não pode avaliar — vê aviso para fazer login.
- Persistência em `localStorage`.

**Fora do escopo (explicitamente adiado):**
- Nota/estrelas exibidas nos cards de produto (busca/categoria).
- Visualização de avaliações no painel do funcionário.
- Qualquer moderação/exclusão de avaliações.

## Modelo de dados

Novo módulo `lib/clientAvaliacoes.ts`, seguindo o mesmo padrão de `lib/clientFavoritos.ts` (leitura/escrita defensiva em `localStorage`, no-op em SSR, `try/catch` retornando vazio em caso de dado corrompido).

- Chave: `lm_avaliacoes_produtos`
- Formato armazenado: `Record<string /* produtoId */, Avaliacao[]>`
- `Avaliacao`:
  ```ts
  interface Avaliacao {
    email: string        // identifica o autor (de getUsuarioLogado())
    nota: number          // inteiro 0-5
    comentario?: string   // opcional, texto livre
    data: string           // ISO timestamp de criação/última edição
  }
  ```

Funções expostas:
- `getAvaliacoes(produtoId): Avaliacao[]` — lista bruta (todas as avaliações do produto)
- `getAvaliacaoDoUsuario(produtoId, email): Avaliacao | null` — avaliação existente do usuário atual, se houver
- `salvarAvaliacao(produtoId, email, nota, comentario?): void` — upsert: se já existe avaliação daquele email para aquele produto, substitui (nota, comentario, data atualizados); senão, adiciona
- `getMedia(produtoId): { media: number; total: number }` — média aritmética das notas e contagem total (`{ media: 0, total: 0 }` se vazio)

## Componentes

### `components/ui/StarRating.tsx`
Widget reutilizável de 5 estrelas (ícone `Star` do `lucide-react`).

Props:
```ts
interface StarRatingProps {
  value: number            // 0-5
  onChange?: (n: number) => void  // se ausente, componente é somente-leitura
  size?: number             // default 16
}
```
- Modo leitura: preenche estrelas `<= Math.round(value)`, sem interação.
- Modo interativo: `onClick` em cada estrela chama `onChange(indice)`; clicar na estrela já ativa (quando `value === indice`) chama `onChange(0)` — assim o range completo 0-5 fica acessível com os 5 ícones padrão.

### `components/AvaliacoesProduto.tsx`
Seção autocontida, recebe só `produtoId: string` (mesmo padrão de `ProdutoAcoesCliente.tsx`). Estado interno via `useState`/`useEffect` (recarrega ao trocar `produtoId`, mesmo padrão do `DrawerContent` do `ProdutoDrawer`).

Comportamento:
1. Header: `StarRating` somente-leitura com a média + texto `"{media.toFixed(1)} · {total} avaliação(ões)"`. Se `total === 0`, mostra "Seja o primeiro a avaliar este produto".
2. Se `getUsuarioLogado()` é `null`: mostra aviso discreto "Faça login para avaliar este produto" (sem link — login fica em outra tela, não é objetivo desta feature abrir fluxo de navegação a partir do drawer).
3. Se logado: formulário com `StarRating` interativo (estado local começando em 0, ou pré-preenchido com `getAvaliacaoDoUsuario` se já existir) + `<textarea>` opcional para comentário (com `bg-white` explícito, conforme gotcha de dark mode) + botão de envio. Texto do botão: "Enviar avaliação" ou "Atualizar avaliação" dependendo se já existe avaliação prévia. Ao enviar, chama `salvarAvaliacao` e atualiza a lista/média local.
4. Lista de avaliações abaixo (mais recente primeiro, `sort` por `data` desc): cada item mostra `StarRating` somente-leitura pequeno, comentário (se houver), email mascarado (`primeiros 3 chars + '***@' + domínio`, ex: `luc***@gmail.com`) e data formatada (`toLocaleDateString('pt-BR')`).

### Integração no `ProdutoDrawer.tsx`
`<AvaliacoesProduto produtoId={produto.id} />` inserido como novo bloco `border-b border-gray-100` entre a seção de preço/badges e a seção "O que o especialista diz", seguindo o mesmo padrão visual (`px-5 py-4`, header `text-xs font-bold ... uppercase tracking-widest`) das demais seções do drawer.

## Tratamento de erros

Segue o padrão já estabelecido em `lib/clientFavoritos.ts`/`lib/clientHistorico.ts`: leitura de `localStorage` envolvida em `try/catch`, retornando `[]`/vazio em caso de dado corrompido ou ambiente SSR (`typeof window === 'undefined'`). Nenhum tratamento de erro adicional é necessário — não há chamada de rede envolvida.

## Testes

Sem framework de testes no projeto (convenção existente). Verificação via:
- `npx tsc --noEmit` para checagem de tipos
- Script `tsx` temporário (escrito, rodado, apagado) para validar a lógica pura de `clientAvaliacoes.ts` (upsert, cálculo de média)
- Navegação real via `agent-browser`: abrir um produto, avaliar sem estar logado (deve bloquear com aviso), logar, avaliar, editar a avaliação, verificar que a média/lista atualiza, testar em modo claro e escuro
