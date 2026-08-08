# Personalização do Cliente (Histórico e Favoritos) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que o cliente favorite produtos e veja automaticamente os produtos visitados recentemente, tudo local (sem backend), numa nova página "Minha Conta".

**Architecture:** Dois módulos utilitários (`lib/clientHistorico.ts`, `lib/clientFavoritos.ts`) encapsulam leitura/escrita no `localStorage`. Um novo componente client-side (`ProdutoAcoesCliente`) registra a visita e expõe o botão de favoritar na página de produto (que é um Server Component). Uma nova página `/conta` busca os produtos salvos via a rota já existente `GET /api/produto/[id]` e reaproveita o `ProductCard` para exibi-los.

**Tech Stack:** Next.js 14 (App Router), TypeScript, React (client components para tudo que usa `localStorage`/hooks), Tailwind CSS, lucide-react.

## Global Constraints

- Nenhuma chamada de API nova é criada — só reaproveita `GET /api/produto/[id]`, já existente.
- Nenhum backend/persistência de servidor — tudo via `localStorage` do navegador.
- Histórico: no máximo 12 produtos, ordenado do mais recente pro mais antigo, sem duplicar (revisitar um produto move ele pro topo em vez de duplicar a entrada).
- Favoritar só é possível na página de detalhe do produto (`/produto/[id]`), não no `ProductCard` da busca.
- O projeto não tem framework de testes configurado (`package.json` só tem `next`/`tailwind`/`tsx`, sem jest/vitest). Verificação é feita via `npx tsc --noEmit`, um script `tsx` temporário (Task 1) e navegação real via `agent-browser` (Tasks 2-5) — não introduza uma dependência de teste nova.
- Módulos de `lib/clientHistorico.ts` e `lib/clientFavoritos.ts` devem funcionar com segurança em SSR: toda função que toca `window.localStorage` deve checar `typeof window === 'undefined'` no início e retornar um valor vazio/no-op nesse caso.

---

## Task 1: Módulos de armazenamento local (`clientHistorico`, `clientFavoritos`)

**Files:**
- Create: `lib/clientHistorico.ts`
- Create: `lib/clientFavoritos.ts`

**Interfaces:**
- Produces (`clientHistorico.ts`): `addAoHistorico(id: string): void`, `getHistoricoIds(): string[]` (mais recente primeiro).
- Produces (`clientFavoritos.ts`): `isFavorito(id: string): boolean`, `toggleFavorito(id: string): boolean` (retorna o novo estado), `getFavoritosIds(): string[]`.

- [ ] **Step 1: Criar `lib/clientHistorico.ts`**

```ts
const CHAVE = 'lm_historico_produtos'
const LIMITE = 12

interface EntradaHistorico {
  id: string
  visitadoEm: number
}

function lerEntradas(): EntradaHistorico[] {
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

function salvarEntradas(entradas: EntradaHistorico[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAVE, JSON.stringify(entradas))
}

export function addAoHistorico(id: string): void {
  if (typeof window === 'undefined') return
  const entradas = lerEntradas().filter((entrada) => entrada.id !== id)
  entradas.unshift({ id, visitadoEm: Date.now() })
  salvarEntradas(entradas.slice(0, LIMITE))
}

export function getHistoricoIds(): string[] {
  return lerEntradas().map((entrada) => entrada.id)
}
```

- [ ] **Step 2: Criar `lib/clientFavoritos.ts`**

```ts
const CHAVE = 'lm_favoritos_produtos'

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
}

export function isFavorito(id: string): boolean {
  return lerIds().includes(id)
}

export function toggleFavorito(id: string): boolean {
  const ids = lerIds()
  const index = ids.indexOf(id)
  if (index === -1) {
    ids.push(id)
    salvarIds(ids)
    return true
  }
  ids.splice(index, 1)
  salvarIds(ids)
  return false
}

export function getFavoritosIds(): string[] {
  return lerIds()
}
```

- [ ] **Step 3: Criar script de verificação temporário `scripts/_verify-personalizacao.ts`**

```ts
// Script de verificacao temporario - deletado no Step 5 deste task.
const store: Record<string, string> = {}
;(globalThis as any).localStorage = {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
}
;(globalThis as any).window = globalThis

import { addAoHistorico, getHistoricoIds } from '../lib/clientHistorico'
import { isFavorito, toggleFavorito, getFavoritosIds } from '../lib/clientFavoritos'

function verificar(condicao: boolean, mensagem: string): void {
  if (!condicao) {
    throw new Error(`FALHOU: ${mensagem}`)
  }
}

// Historico: adiciona 3, revisita o primeiro (deve ir pro topo sem duplicar)
addAoHistorico('LM-0001')
addAoHistorico('LM-0002')
addAoHistorico('LM-0003')
addAoHistorico('LM-0001')
const historico = getHistoricoIds()
verificar(historico.length === 3, `esperado 3 ids, veio ${historico.length}`)
verificar(historico[0] === 'LM-0001', `esperado LM-0001 no topo, veio ${historico[0]}`)

// Historico: respeita limite de 12
for (let i = 1; i <= 15; i++) addAoHistorico(`LM-${String(1000 + i)}`)
verificar(getHistoricoIds().length === 12, `esperado limite de 12, veio ${getHistoricoIds().length}`)

// Favoritos: toggle liga e desliga
verificar(isFavorito('LM-0099') === false, 'LM-0099 nao deveria ser favorito ainda')
const ligou = toggleFavorito('LM-0099')
verificar(ligou === true, 'toggle deveria retornar true ao favoritar')
verificar(isFavorito('LM-0099') === true, 'LM-0099 deveria estar favoritado')
const desligou = toggleFavorito('LM-0099')
verificar(desligou === false, 'toggle deveria retornar false ao desfavoritar')
verificar(getFavoritosIds().includes('LM-0099') === false, 'LM-0099 nao deveria mais estar nos favoritos')

console.log('OK: todas as verificacoes de historico/favoritos passaram')
```

- [ ] **Step 4: Rodar o script de verificação**

Run: `npx tsx scripts/_verify-personalizacao.ts`
Expected: imprime `OK: todas as verificacoes de historico/favoritos passaram` e sai sem lançar erro (sem `Error: FALHOU`).

- [ ] **Step 5: Apagar o script temporário e verificar tipos**

Run: `rm scripts/_verify-personalizacao.ts && npx tsc --noEmit`
Expected: nenhum erro de tipo.

- [ ] **Step 6: Commit**

```bash
git add lib/clientHistorico.ts lib/clientFavoritos.ts
git commit -m "feat: modulos de historico e favoritos via localStorage"
```

---

## Task 2: Componente `ProdutoAcoesCliente` e integração na página de produto

**Files:**
- Create: `components/ProdutoAcoesCliente.tsx`
- Modify: `app/produto/[id]/page.tsx`

**Interfaces:**
- Consumes: `addAoHistorico`, `isFavorito`, `toggleFavorito` (Task 1).
- Produces: `ProdutoAcoesCliente` — `import ProdutoAcoesCliente from '@/components/ProdutoAcoesCliente'`, props `{ produtoId: string }`.

- [ ] **Step 1: Criar `components/ProdutoAcoesCliente.tsx`**

`app/produto/[id]/page.tsx` é um Server Component (`async function`, sem `'use client'`) — por isso o registro de histórico e o botão de favoritar precisam de um componente client-side dedicado, montado dentro dele.

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { addAoHistorico } from '@/lib/clientHistorico'
import { isFavorito, toggleFavorito } from '@/lib/clientFavoritos'

interface ProdutoAcoesClienteProps {
  produtoId: string
}

export default function ProdutoAcoesCliente({ produtoId }: ProdutoAcoesClienteProps) {
  const [favorito, setFavorito] = useState(false)

  useEffect(() => {
    addAoHistorico(produtoId)
    setFavorito(isFavorito(produtoId))
  }, [produtoId])

  return (
    <button
      type="button"
      onClick={() => setFavorito(toggleFavorito(produtoId))}
      aria-label={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      aria-pressed={favorito}
      className="shrink-0 p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
    >
      <Heart size={20} className={favorito ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
    </button>
  )
}
```

- [ ] **Step 2: Integrar em `app/produto/[id]/page.tsx`**

Adicionar o import e passar o componente como `action` do `PageHeader` já existente:

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { carregarProdutos } from '@/lib/produtos'
import CorridorBadge from '@/components/CorridorBadge'
import StockIndicator from '@/components/StockIndicator'
import SustainabilityBadge from '@/components/SustainabilityBadge'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import ProdutoAcoesCliente from '@/components/ProdutoAcoesCliente'
```

E trocar a linha do `PageHeader`:

```tsx
        <PageHeader
          title={produto.produto}
          description={produto.categoria}
          action={<ProdutoAcoesCliente produtoId={produto.id} />}
        />
```

O resto do arquivo (`app/produto/[id]/page.tsx`) não muda.

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: nenhum erro.

- [ ] **Step 4: Verificar visualmente com `agent-browser`**

O servidor de dev deve estar rodando em `http://localhost:3000` (suba com `npm run dev` em background se não estiver). Navegue até um produto válido (ex: `http://localhost:3000/produto/LM-0022`; se der 404, pegue outro ID válido buscando na home primeiro). Confirme:
- O ícone de coração aparece ao lado do título, começa sem preenchimento (cinza).
- Clicar no coração preenche ele de vermelho; clicar de novo volta ao estado cinza.
- Depois de visitar a página, leia o `localStorage` (via `agent-browser eval` ou equivalente disponível na skill) e confirme que a chave `lm_historico_produtos` contém uma entrada com o `id` do produto visitado.

- [ ] **Step 5: Commit**

```bash
git add components/ProdutoAcoesCliente.tsx "app/produto/[id]/page.tsx"
git commit -m "feat: registrar historico e favoritar produto na pagina de detalhe"
```

---

## Task 3: Página "Minha Conta" (`/conta`)

**Files:**
- Create: `app/conta/page.tsx`

**Interfaces:**
- Consumes: `getFavoritosIds` (Task 1), `getHistoricoIds` (Task 1), `ProductCard` (`components/ProductCard.tsx`, já existente — espera `{ result: SearchResult }`), `PageHeader` (`components/ui/PageHeader.tsx`, já existente).
- Decisão de design: o `ProductCard` exibe um badge de "% de match" (`score`) pensado pra resultados de busca. Nesta página, como não há relevância de busca, cada produto é passado com `score: 1` (badge sempre mostra "100%") — comportamento cosmético aceito para o MVP, não é um bug a corrigir.

- [ ] **Step 1: Criar `app/conta/page.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import ProductCard from '@/components/ProductCard'
import { getFavoritosIds } from '@/lib/clientFavoritos'
import { getHistoricoIds } from '@/lib/clientHistorico'
import type { SearchResult } from '@/types/produto'

async function buscarProdutos(ids: string[]): Promise<SearchResult[]> {
  const respostas = await Promise.all(
    ids.map(async (id) => {
      const resposta = await fetch(`/api/produto/${id}`)
      if (!resposta.ok) return null
      const produto = await resposta.json()
      return { produto, score: 1 } as SearchResult
    })
  )
  return respostas.filter((item): item is SearchResult => item !== null)
}

function SecaoProdutos({
  titulo,
  ids,
  mensagemVazia,
}: {
  titulo: string
  ids: string[]
  mensagemVazia: string
}) {
  const [produtos, setProdutos] = useState<SearchResult[] | null>(null)

  useEffect(() => {
    let cancelado = false
    if (ids.length === 0) {
      setProdutos([])
      return
    }
    buscarProdutos(ids).then((resultado) => {
      if (!cancelado) setProdutos(resultado)
    })
    return () => {
      cancelado = true
    }
  }, [ids])

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{titulo}</h2>
      {produtos === null && (
        <div className="flex items-center justify-center py-14">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-lm-green border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Carregando...</p>
          </div>
        </div>
      )}
      {produtos !== null && produtos.length === 0 && (
        <p className="text-sm text-gray-500 py-6">{mensagemVazia}</p>
      )}
      {produtos !== null && produtos.length > 0 && (
        <div className="space-y-3">
          {produtos.map((resultado) => (
            <ProductCard key={resultado.produto.id} result={resultado} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function ContaPage() {
  const [favoritosIds, setFavoritosIds] = useState<string[]>([])
  const [historicoIds, setHistoricoIds] = useState<string[]>([])

  useEffect(() => {
    setFavoritosIds(getFavoritosIds())
    setHistoricoIds(getHistoricoIds())
  }, [])

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <PageHeader title="Minha Conta" description="Seus favoritos e produtos visitados recentemente" />
        <SecaoProdutos
          titulo="Favoritos"
          ids={favoritosIds}
          mensagemVazia="Você ainda não favoritou nenhum produto."
        />
        <SecaoProdutos
          titulo="Vistos recentemente"
          ids={historicoIds}
          mensagemVazia="Nenhum produto visitado ainda — suas buscas vão aparecer aqui."
        />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: nenhum erro.

- [ ] **Step 3: Verificar visualmente com `agent-browser`**

Com o servidor de dev rodando: favorite 1 produto e visite pelo menos 2 produtos diferentes (via `/produto/[id]`, usando o fluxo da Task 2), depois navegue até `http://localhost:3000/conta`. Confirme:
- A seção "Favoritos" mostra o produto favoritado.
- A seção "Vistos recentemente" mostra os produtos visitados, mais recente primeiro.
- Os cards são clicáveis e levam de volta pra página do produto (comportamento herdado do `ProductCard`).

Depois, com o `localStorage` limpo (ex: `agent-browser eval "localStorage.clear()"` ou equivalente, seguido de reload), confirme que aparecem as duas mensagens de estado vazio.

- [ ] **Step 4: Commit**

```bash
git add app/conta/page.tsx
git commit -m "feat: pagina Minha Conta com favoritos e historico"
```

---

## Task 4: Aba "Minha Conta" no NavBar

**Files:**
- Modify: `components/NavBar.tsx`

**Interfaces:**
- Não altera a interface do componente `NavBar` (sem props) nem o comportamento das 4 abas existentes ou do botão "Login".

- [ ] **Step 1: Adicionar o import do ícone `User` e a 5ª aba**

Trocar a linha de import:

```tsx
import { Search, MessageCircleQuestion, CalendarCheck, Sparkles, LogIn, User } from 'lucide-react'
```

E adicionar a nova entrada no array `tabs` (mantendo as 4 existentes, na mesma ordem, e adicionando a 5ª no final):

```tsx
const tabs = [
  { href: '/', label: 'Buscar Produtos', icon: Search },
  { href: '/projeto', label: 'Projeto Guiado', icon: Sparkles },
  { href: '/duvidas', label: 'Tire Dúvidas', icon: MessageCircleQuestion },
  { href: '/agendamento', label: 'Agendar Visita', icon: CalendarCheck },
  { href: '/conta', label: 'Minha Conta', icon: User },
]
```

Nenhuma outra parte do arquivo muda — a nova aba é renderizada automaticamente pelo `.map()` existente, com o mesmo estilo ativo/hover das outras 4.

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: nenhum erro.

- [ ] **Step 3: Verificar visualmente com `agent-browser`**

Navegue até `http://localhost:3000` e confirme que a aba "Minha Conta" aparece no header, entre "Agendar Visita" e o botão "Login", e que clicar nela navega para `/conta` com o estado "ativo" (fundo destacado) aplicado corretamente.

- [ ] **Step 4: Commit**

```bash
git add components/NavBar.tsx
git commit -m "feat: aba Minha Conta no NavBar"
```

---

## Task 5: Verificação final ponta-a-ponta

**Files:**
- (nenhum arquivo novo — task de verificação)

**Interfaces:**
- N/A

- [ ] **Step 1: Checagem de tipos completa**

Run: `npx tsc --noEmit`
Expected: nenhum erro.

- [ ] **Step 2: Build de produção**

Run: `npm run build`
Expected: build completa sem erros, incluindo a nova rota `/conta` na lista de rotas geradas.

- [ ] **Step 3: Fluxo completo via `agent-browser`**

Com o servidor de dev limpo rodando (se o `.next/` tiver sido tocado pelo build do Step 2, apague `.next/` e reinicie `npm run dev` antes deste passo, para evitar cache misto de build/dev):
1. Abra a home, dispense o tour se aparecer.
2. Visite 2 produtos diferentes.
3. Na página do segundo produto, clique no coração para favoritá-lo.
4. Clique na aba "Minha Conta" no header.
5. Confirme: o produto favoritado aparece em "Favoritos", os 2 produtos visitados aparecem em "Vistos recentemente" (o segundo, visitado por último, aparece primeiro).
6. Clique em um card da seção "Vistos recentemente" e confirme que abre a página do produto correto.

Expected: todo o fluxo funciona sem erro de console, nenhuma outra tela/funcionalidade do site é afetada.

- [ ] **Step 4: Commit final (se houver ajustes de última hora)**

```bash
git add -A
git commit -m "fix: ajustes finais da personalizacao do cliente"
```
