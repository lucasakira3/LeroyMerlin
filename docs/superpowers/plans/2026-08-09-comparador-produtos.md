# Comparador de Produtos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cliente escolhe até 3 produtos (a partir do `ProdutoDrawer`) e vê uma comparação lado a lado, acessada por uma barra que aparece nas telas de produtos — sem ícone no `NavBar`.

**Architecture:** `lib/clientComparador.ts` (localStorage, mesmo padrão de `clientFavoritos.ts`, com evento customizado como `clientCarrinho.ts`) + botão toggle no `ProdutoDrawer.tsx` + `components/ComparadorBar.tsx` (barra leve, sem resolver produtos) inserida no topo de `SearchSection.tsx` e `CategoriaView.tsx` + página `app/comparar/page.tsx` com tabela lado a lado.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, `lucide-react`, `localStorage`, `lib/produtosCliente.ts` (já existente) para resolver produtos por ID.

## Global Constraints

- Sem ícone/contador no `NavBar` — acesso só pela `ComparadorBar` nas telas de produtos (decisão explícita do usuário).
- Adicionar ao comparador só pelo `ProdutoDrawer` — não mexe em `ProductCard.tsx` nem nos cards de `CategoriaView.tsx`.
- Máximo 3 produtos simultâneos.
- `ComparadorBar` não resolve produtos via API — só lê o tamanho da lista do `localStorage`, pra ficar leve.
- Em `CategoriaView.tsx`, a `ComparadorBar` fica no topo dos resultados, não no `sticky bottom-4` já usado pela barra de seleção do mapa (evita colisão visual).

---

### Task 1: Módulo `lib/clientComparador.ts`

**Files:**
- Create: `lib/clientComparador.ts`
- Test: script temporário `scratch-test-comparador.ts` (escrito, rodado, apagado)

**Interfaces:**
- Consumes: nada
- Produces:
  - `getComparador(): string[]`
  - `estaNoComparador(produtoId: string): boolean`
  - `toggleComparador(produtoId: string): 'added' | 'removed' | 'full'`
  - `removerDoComparador(produtoId: string): void`
  - `limparComparador(): void`
  - Evento DOM `'lm-comparador-change'` disparado em toda mutação

- [ ] **Step 1: Criar `lib/clientComparador.ts`**

```ts
const CHAVE = 'lm_comparador'
const MAX_ITENS = 3

function lerIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return []
    const dados = JSON.parse(bruto)
    if (!Array.isArray(dados)) return []
    return dados
  } catch {
    return []
  }
}

function salvarIds(ids: string[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAVE, JSON.stringify(ids))
  window.dispatchEvent(new Event('lm-comparador-change'))
}

export function getComparador(): string[] {
  return lerIds()
}

export function estaNoComparador(produtoId: string): boolean {
  return lerIds().includes(produtoId)
}

export function toggleComparador(produtoId: string): 'added' | 'removed' | 'full' {
  const ids = lerIds()
  const index = ids.indexOf(produtoId)
  if (index !== -1) {
    ids.splice(index, 1)
    salvarIds(ids)
    return 'removed'
  }
  if (ids.length >= MAX_ITENS) {
    return 'full'
  }
  ids.push(produtoId)
  salvarIds(ids)
  return 'added'
}

export function removerDoComparador(produtoId: string): void {
  const ids = lerIds()
  salvarIds(ids.filter(id => id !== produtoId))
}

export function limparComparador(): void {
  salvarIds([])
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `lib/clientComparador.ts`

- [ ] **Step 3: Escrever script de verificação lógica temporário**

Create: `scratch-test-comparador.ts` na raiz:

```ts
import { getComparador, estaNoComparador, toggleComparador, removerDoComparador, limparComparador } from './lib/clientComparador'

const store: Record<string, string> = {}
;(globalThis as any).window = {
  localStorage: {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
  },
  dispatchEvent: () => {},
}
;(globalThis as any).Event = class {}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error('FALHOU: ' + msg)
  console.log('OK:', msg)
}

assert(getComparador().length === 0, 'comparador começa vazio')
assert(estaNoComparador('LM-0001') === false, 'produto não está no comparador vazio')

assert(toggleComparador('LM-0001') === 'added', 'adiciona o primeiro produto')
assert(toggleComparador('LM-0002') === 'added', 'adiciona o segundo produto')
assert(toggleComparador('LM-0003') === 'added', 'adiciona o terceiro produto')
assert(getComparador().length === 3, 'comparador tem 3 itens')

assert(toggleComparador('LM-0004') === 'full', 'quarto produto retorna full')
assert(getComparador().length === 3, 'comparador continua com 3 itens após tentativa de adicionar o 4º')

assert(toggleComparador('LM-0002') === 'removed', 'toggle no item existente remove')
assert(getComparador().length === 2, 'comparador tem 2 itens após remoção')
assert(estaNoComparador('LM-0002') === false, 'produto removido não está mais no comparador')

removerDoComparador('LM-0001')
assert(getComparador().length === 1, 'removerDoComparador remove o item específico')

limparComparador()
assert(getComparador().length === 0, 'limparComparador esvazia tudo')

console.log('Todos os testes passaram.')
```

- [ ] **Step 4: Rodar e verificar saída**

Run: `npx tsx scratch-test-comparador.ts`
Expected: todas as linhas `OK:` impressas, terminando em `Todos os testes passaram.`

- [ ] **Step 5: Apagar o script temporário**

Run: `rm scratch-test-comparador.ts`

- [ ] **Step 6: Commit**

```bash
git add lib/clientComparador.ts
git commit -m "feat: modulo de dados para comparador de produtos"
```

---

### Task 2: Botão "Comparar" no `ProdutoDrawer.tsx`

**Files:**
- Modify: `components/ProdutoDrawer.tsx`

**Interfaces:**
- Consumes: `estaNoComparador`, `toggleComparador` de `lib/clientComparador.ts` (Task 1)
- Produces: nada novo

- [ ] **Step 1: Importar dependências**

Adicionar `Scale` à lista de ícones já importada de `lucide-react` (linha 4):

```tsx
import { X, MapPin, Tag, Zap, Leaf, Package, BadgeCheck, SendHorizonal, Bot, Heart, ShoppingCart, Scale } from 'lucide-react'
```

Adicionar import do módulo:

```tsx
import { estaNoComparador, toggleComparador } from '@/lib/clientComparador'
```

- [ ] **Step 2: Adicionar estado**

Junto aos outros `useState` em `DrawerContent` (perto de `const [adicionado, setAdicionado] = useState(false)`):

```tsx
  const [noComparador, setNoComparador] = useState(false)
  const [comparadorMsg, setComparadorMsg] = useState<string | null>(null)
```

E inicializar/resetar no `useEffect` que já roda ao trocar de produto:

```tsx
  useEffect(() => {
    setMensagens([])
    setInputChat('')
    setFavorito(isFavorito(produto.id))
    setAdicionado(false)
    setNoComparador(estaNoComparador(produto.id))
    setComparadorMsg(null)
    addAoHistorico(produto.id)
  }, [produto.id])
```

- [ ] **Step 3: Adicionar a função de clique**

Logo após `handleAdicionarCarrinho`:

```tsx
  function handleComparar() {
    const resultado = toggleComparador(produto.id)
    if (resultado === 'full') {
      setComparadorMsg('Comparador cheio (máx. 3)')
      setTimeout(() => setComparadorMsg(null), 1500)
      return
    }
    setNoComparador(resultado === 'added')
  }
```

- [ ] **Step 4: Adicionar o botão no cabeçalho do drawer**

No bloco `<div className="flex items-center gap-2 flex-shrink-0">` do cabeçalho (entre o botão de favoritar e o de fechar), adicionar o botão de comparar e, logo depois desse `<div>`, a mensagem transitória:

```tsx
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setFavorito(toggleFavorito(produto.id))}
              className="mt-0.5 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              aria-label={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              aria-pressed={favorito}
            >
              <Heart size={16} className={favorito ? 'fill-red-500 text-red-500' : 'text-white'} />
            </button>
            <button
              onClick={handleComparar}
              className="mt-0.5 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors relative"
              aria-label={noComparador ? 'Remover da comparação' : 'Adicionar à comparação'}
              aria-pressed={noComparador}
            >
              <Scale size={16} className={noComparador ? 'fill-lm-yellow text-lm-yellow' : 'text-white'} />
            </button>
            <button
              onClick={onClose}
              className="mt-0.5 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {comparadorMsg && (
          <p className="text-[11px] text-lm-yellow text-right -mt-2 mb-2">{comparadorMsg}</p>
        )}
```

Nota: o `Scale` (lucide) não é um ícone que preenche bem com `fill`, mas a classe `fill-lm-yellow` some silenciosamente se o ícone não suportar preenchimento — o `text-lm-yellow` já basta pra indicar o estado ativo visualmente (cor muda), então isso é aceitável mesmo que o preenchimento não apareça.

- [ ] **Step 5: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `components/ProdutoDrawer.tsx`

- [ ] **Step 6: Commit**

```bash
git add components/ProdutoDrawer.tsx
git commit -m "feat: botao de comparar produto no drawer"
```

---

### Task 3: `components/ComparadorBar.tsx` e integração nas telas de produtos

**Files:**
- Create: `components/ComparadorBar.tsx`
- Modify: `components/SearchSection.tsx`
- Modify: `components/CategoriaView.tsx`

**Interfaces:**
- Consumes: `getComparador`, `limparComparador` de `lib/clientComparador.ts` (Task 1), evento `'lm-comparador-change'`
- Produces: `<ComparadorBar />` — componente default export, sem props

- [ ] **Step 1: Criar `components/ComparadorBar.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Scale } from 'lucide-react'
import { getComparador, limparComparador } from '@/lib/clientComparador'

export default function ComparadorBar() {
  const [quantidade, setQuantidade] = useState(0)

  useEffect(() => {
    setQuantidade(getComparador().length)
    const atualizar = () => setQuantidade(getComparador().length)
    window.addEventListener('lm-comparador-change', atualizar)
    return () => window.removeEventListener('lm-comparador-change', atualizar)
  }, [])

  if (quantidade === 0) return null

  return (
    <div className="flex items-center justify-between gap-3 bg-lm-yellow/10 border border-lm-yellow/30 rounded-xl px-4 py-2.5 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <Scale size={15} className="text-lm-yellow flex-shrink-0" />
        <span className="font-medium">{quantidade} produto{quantidade > 1 ? 's' : ''} para comparar</span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => limparComparador()}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Limpar
        </button>
        <Link href="/comparar" className="text-xs font-semibold text-lm-green hover:underline">
          Ver comparação →
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Integrar em `components/SearchSection.tsx`**

Adicionar import:

```tsx
import ComparadorBar from './ComparadorBar'
```

Inserir `<ComparadorBar />` logo após o seletor de loja e antes do `<SearchBar />` (topo da tela, sempre visível independente de haver resultados):

```tsx
      {/* Seletor de loja */}
      <div className="flex items-center gap-3">
        <MapPin size={15} className="text-lm-green flex-shrink-0" />
        <label className="text-xs font-semibold text-gray-600 flex-shrink-0">Loja:</label>
        <select
          value={loja}
          onChange={(e) => setLoja(e.target.value)}
          className="flex-1 h-9 px-3 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
        >
          {LOJAS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      <ComparadorBar />

      {/* Busca */}
```

- [ ] **Step 3: Integrar em `components/CategoriaView.tsx`**

Adicionar import:

```tsx
import ComparadorBar from './ComparadorBar'
```

Inserir `<ComparadorBar />` logo após o header da categoria (o `<div className="flex flex-col sm:flex-row ...">` que tem o botão Voltar + título + seletor de loja) e antes do bloco do mapa condicional, com uma margem inferior pra separar dos filtros:

```tsx
      </div>

      <div className="mb-5">
        <ComparadorBar />
      </div>

      {/* Mapa — aparece no topo com destaque */}
```

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 5: Commit**

```bash
git add components/ComparadorBar.tsx components/SearchSection.tsx components/CategoriaView.tsx
git commit -m "feat: barra do comparador nas telas de busca e categoria"
```

---

### Task 4: Página `/comparar`

**Files:**
- Create: `app/comparar/page.tsx`

**Interfaces:**
- Consumes:
  - `getComparador`, `removerDoComparador` de `lib/clientComparador.ts` (Task 1)
  - `buscarProdutosPorIds`, `type ProdutoResolvido` de `lib/produtosCliente.ts` (já existente)
  - `adicionarAoCarrinho` de `lib/clientCarrinho.ts` (já existente)
  - `getMedia` de `lib/clientAvaliacoes.ts` (já existente)
  - `StarRating` de `components/ui/StarRating.tsx`, `StockIndicator` de `components/StockIndicator.tsx`, `SustainabilityBadge` de `components/SustainabilityBadge.tsx`
  - `PageHeader`, `Button`, `Card` de `components/ui/*`
- Produces: rota `/comparar`

- [ ] **Step 1: Criar `app/comparar/page.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Scale, Trash2, ShoppingCart, MapPin } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import StarRating from '@/components/ui/StarRating'
import StockIndicator from '@/components/StockIndicator'
import SustainabilityBadge from '@/components/SustainabilityBadge'
import { getComparador, removerDoComparador } from '@/lib/clientComparador'
import { buscarProdutosPorIds, type ProdutoResolvido } from '@/lib/produtosCliente'
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'
import { getMedia } from '@/lib/clientAvaliacoes'

export default function ComparadorPage() {
  const [ids, setIds] = useState<string[]>([])
  const [produtos, setProdutos] = useState<ProdutoResolvido[] | null>(null)
  const [adicionadoId, setAdicionadoId] = useState<string | null>(null)

  useEffect(() => {
    const atuais = getComparador()
    setIds(atuais)
    if (atuais.length === 0) {
      setProdutos([])
      return
    }
    buscarProdutosPorIds(atuais).then(setProdutos)
  }, [])

  function remover(produtoId: string) {
    removerDoComparador(produtoId)
    const novosIds = ids.filter(id => id !== produtoId)
    setIds(novosIds)
    setProdutos(prev => prev?.filter(p => p.id !== produtoId) ?? null)
  }

  function handleAdicionar(produtoId: string) {
    adicionarAoCarrinho(produtoId)
    setAdicionadoId(produtoId)
    setTimeout(() => setAdicionadoId(prev => prev === produtoId ? null : prev), 1500)
  }

  if (produtos === null) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-sm text-gray-400">Carregando...</p>
        </div>
      </main>
    )
  }

  if (produtos.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-xl mx-auto px-4 py-10">
          <Card className="text-center py-10">
            <Scale size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">Nenhum produto selecionado pra comparar.</p>
            <Link href="/"><Button variant="primary">Ver produtos</Button></Link>
          </Card>
        </div>
      </main>
    )
  }

  const menorPreco = Math.min(...produtos.map(p => p.preco))

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <PageHeader title="Comparar produtos" description={`${produtos.length} de 3 produtos`} />

        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-full" style={{ minWidth: `${produtos.length * 220}px` }}>
            {produtos.map(produto => {
              const { media, total } = getMedia(produto.id)
              return (
                <Card key={produto.id} className="flex-1 min-w-[220px] relative">
                  <button
                    onClick={() => remover(produto.id)}
                    className="absolute top-3 right-3 text-gray-300 hover:text-red-500"
                    aria-label="Remover da comparação"
                  >
                    <Trash2 size={15} />
                  </button>

                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{produto.categoria}</p>
                  <h3 className="text-sm font-bold text-gray-900 leading-snug mb-3 pr-6">{produto.produto}</h3>

                  <div className="flex items-center gap-1.5 text-lm-green mb-3">
                    <MapPin size={12} strokeWidth={2.5} />
                    <span className="text-xs font-bold">{produto.corredor}</span>
                  </div>

                  <div className="mb-3">
                    <p className="text-xl font-black text-lm-green">
                      {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    {produto.preco === menorPreco && produtos.length > 1 && (
                      <span className="inline-block mt-1 text-[10px] font-semibold text-lm-green bg-lm-green/10 px-2 py-0.5 rounded-full">
                        Melhor preço
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <StockIndicator estoque={produto.estoque} />
                    <SustainabilityBadge sustentabilidade={produto.sustentabilidade} />
                  </div>

                  <div className="mb-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Complexidade</p>
                    <p className="text-xs text-gray-700">{produto.complexidade}</p>
                  </div>

                  <div className="mb-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Avaliação</p>
                    {total > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <StarRating value={media} size={13} />
                        <span className="text-xs text-gray-500">{media.toFixed(1)} ({total})</span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Sem avaliações</p>
                    )}
                  </div>

                  {produto.especificacoes && (
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Especificações</p>
                      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{produto.especificacoes}</p>
                    </div>
                  )}

                  {produto.tags && produto.tags.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {produto.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleAdicionar(produto.id)}
                    disabled={produto.estoque === 0}
                    className="w-full flex items-center justify-center gap-1.5 bg-lm-green text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart size={13} />
                    {adicionadoId === produto.id ? 'Adicionado ✓' : 'Adicionar ao carrinho'}
                  </button>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `app/comparar/page.tsx`

- [ ] **Step 3: Commit**

```bash
git add app/comparar/page.tsx
git commit -m "feat: pagina de comparacao de produtos"
```

---

### Task 5: Verificação manual end-to-end

**Files:** nenhum

**Interfaces:**
- Consumes: app rodando localmente (`npm run dev`)
- Produces: confirmação visual do fluxo completo

- [ ] **Step 1: Subir o dev server limpo**

Run: `rm -rf .next && npm run dev` (em background)

- [ ] **Step 2: Adicionar produtos ao comparador**

Via `agent-browser`: abrir um produto no drawer (via busca), clicar no botão de comparar (ícone de balança), confirmar que a `ComparadorBar` aparece no topo da tela de busca com "1 produto para comparar". Repetir em outro produto na tela de categoria, confirmar que a barra também aparece lá (estado compartilhado via `localStorage`).

- [ ] **Step 3: Testar limite de 3**

Adicionar um terceiro produto, depois tentar adicionar um quarto — confirmar a mensagem "Comparador cheio (máx. 3)" no drawer, sem alterar a lista.

- [ ] **Step 4: Abrir a comparação**

Clicar em "Ver comparação →", confirmar que os 3 produtos aparecem lado a lado com preço (menor destacado), estoque, complexidade, sustentabilidade, especificações, tags e avaliação (ou "Sem avaliações").

- [ ] **Step 5: Remover e adicionar ao carrinho**

Remover um produto pela página de comparação, confirmar que some da lista e a `ComparadorBar` (ao voltar pra busca) reflete a nova contagem. Clicar "Adicionar ao carrinho" num dos produtos restantes, confirmar feedback "Adicionado ✓" e que o carrinho recebeu o item.

- [ ] **Step 6: Testar "Limpar"**

Com itens no comparador, clicar "Limpar" na `ComparadorBar`, confirmar que ela desaparece.

- [ ] **Step 7: Modo escuro**

Repetir a visualização da `ComparadorBar` e da página `/comparar` em dark mode, conferir contraste dos cards e badges.
