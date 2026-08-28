# Header em duas linhas + feature Ofertas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reestruturar a `NavBar` em duas linhas (logo + busca + ícones / abas de navegação), tornar a busca funcional a partir de qualquer página, e lançar a feature "Ofertas" com desconto simulado deterministicamente, sem alterar `data/produtos.json` nem criar backend novo.

**Architecture:** Oito tarefas incrementais: (1-3) backend e UI da feature Ofertas isolados primeiro, testáveis sozinhos via `/ofertas`; (4-5) extração e reuso do fetch de busca, sem mudar comportamento existente; (6-7) novo componente de busca de header + divisão de `app/page.tsx` num wrapper de servidor (`Suspense`) e um componente cliente (`HomeView`) que lê `?q=` da URL; (8) reestruturação final da `NavBar` em duas linhas, consumindo tudo que veio antes (`HeaderSearch`, rota `/ofertas`, ícone de conta).

**Tech Stack:** Next.js 14 App Router, React (client components), TypeScript, Tailwind CSS, `lucide-react`, sem framework de testes.

## Global Constraints

- Desconto é 100% derivado em runtime a partir do `id` do produto (mesmo padrão de hash já usado em `getImagemCategoria`/`getMarca`) — `data/produtos.json` nunca é alterado.
- Só a página `/ofertas` mostra preço riscado/badge de desconto — categoria, busca e qualquer outra listagem continuam mostrando o preço cheio normal, mesmo pra um produto que esteja na lista de ofertas.
- Busca do header (`HeaderSearch`) navega pra `/?q=<busca>` e funciona a partir de qualquer página — não guarda estado de resultado nela mesma.
- Ícone de conta substitui o texto "Login"/"Minha Conta" em todo lugar que aparecia (desktop e dentro do painel mobile), mesmo tratamento visual dos outros ícones do header.
- Segunda linha da `NavBar` ganha a aba "Ofertas" (ícone `Tag` de `lucide-react`), apontando pra `/ofertas`.
- Sem framework de testes: verificação via `npx tsc --noEmit`, `npm run build` (obrigatório nas tasks que usam `useSearchParams`) e `agent-browser`.

---

### Task 1: Motor de desconto — `lib/ofertas.ts`

**Files:**
- Create: `lib/ofertas.ts`

**Interfaces:**
- Consumes: nada
- Produces (usado pela Task 2 — API — e indiretamente por tudo que exibe desconto):
  - `export interface InfoOferta { emOferta: boolean; percentualDesconto: number; precoOriginal: number; precoComDesconto: number }`
  - `export function getInfoOferta(id: string, preco: number): InfoOferta`

- [ ] **Step 1: Criar `lib/ofertas.ts`**

```ts
export interface InfoOferta {
  emOferta: boolean
  percentualDesconto: number
  precoOriginal: number
  precoComDesconto: number
}

const PERCENTUAIS_DESCONTO = [10, 15, 20, 25, 30]

export function getInfoOferta(id: string, preco: number): InfoOferta {
  const hash = id.split('').reduce((soma, c) => soma + c.charCodeAt(0), 0)
  const emOferta = hash % 5 === 0 // ~20% do catálogo

  if (!emOferta) {
    return { emOferta: false, percentualDesconto: 0, precoOriginal: preco, precoComDesconto: preco }
  }

  const percentualDesconto = PERCENTUAIS_DESCONTO[hash % PERCENTUAIS_DESCONTO.length]
  const precoComDesconto = Math.round(preco * (1 - percentualDesconto / 100) * 100) / 100
  return { emOferta: true, percentualDesconto, precoOriginal: preco, precoComDesconto }
}
```

- [ ] **Step 2: Verificar determinismo e distribuição com um script temporário**

Criar `_tmp_ofertas_check.ts` na raiz do projeto:

```ts
import { getInfoOferta } from './lib/ofertas'
import produtos from './data/produtos.json'

const lista = produtos as { id: string; preco: number }[]
const emOferta = lista.filter(p => getInfoOferta(p.id, p.preco).emOferta)

console.log(`Total: ${lista.length}, em oferta: ${emOferta.length} (${(emOferta.length / lista.length * 100).toFixed(1)}%)`)

// Determinismo: chamar de novo pros primeiros 5 tem que dar o mesmo resultado
for (const p of lista.slice(0, 5)) {
  const a = getInfoOferta(p.id, p.preco)
  const b = getInfoOferta(p.id, p.preco)
  console.assert(a.emOferta === b.emOferta && a.percentualDesconto === b.percentualDesconto, `FALHOU determinismo: ${p.id}`)
}

// precoComDesconto sempre <= precoOriginal quando em oferta
const invalido = emOferta.find(p => {
  const info = getInfoOferta(p.id, p.preco)
  return info.precoComDesconto >= info.precoOriginal
})
console.assert(!invalido, `FALHOU: ${invalido?.id} não tem desconto real`)

console.log('OK — determinismo e faixas de desconto corretos')
```

Run: `npx tsx _tmp_ofertas_check.ts`
Expected: imprime uma porcentagem em oferta próxima de 20% (não precisa ser exato, é hash do id) e `OK — determinismo e faixas de desconto corretos`, sem nenhuma linha de "FALHOU".

- [ ] **Step 3: Apagar o script temporário**

```bash
rm _tmp_ofertas_check.ts
```

- [ ] **Step 4: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add lib/ofertas.ts
git commit -m "feat: motor deterministico de desconto para a feature ofertas"
```

---

### Task 2: Rota `GET /api/ofertas`

**Files:**
- Create: `app/api/ofertas/route.ts`

**Interfaces:**
- Consumes: `getInfoOferta` de `@/lib/ofertas` (Task 1); `carregarProdutos` de `@/lib/produtos` (já existe)
- Produces (usado pela Task 3): endpoint `GET /api/ofertas` retornando `Array<Omit<Produto, 'embedding' | 'embedding_text'> & { precoOriginal: number; percentualDesconto: number }>`, com `preco` já sendo o preço **com** desconto, ordenado por `percentualDesconto` decrescente.

- [ ] **Step 1: Criar `app/api/ofertas/route.ts`**

```ts
import { NextResponse } from "next/server";
import { carregarProdutos } from "@/lib/produtos";
import { getInfoOferta } from "@/lib/ofertas";

export async function GET() {
  const produtos = await carregarProdutos();

  const comOferta = produtos
    .map(({ embedding: _e, embedding_text: _et, ...rest }) => {
      const info = getInfoOferta(rest.id, rest.preco);
      if (!info.emOferta) return null;
      return {
        ...rest,
        preco: info.precoComDesconto,
        precoOriginal: info.precoOriginal,
        percentualDesconto: info.percentualDesconto,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => b.percentualDesconto - a.percentualDesconto);

  return NextResponse.json(comOferta);
}
```

- [ ] **Step 2: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Subir o servidor e testar a rota diretamente**

Run: `npm run dev` (background), poll em foreground com `curl` até `200` na home. Verificar `netstat -ano | grep ":3000" | grep LISTENING` antes e matar processo órfão se houver.

```bash
curl -s http://localhost:3000/api/ofertas | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
console.log('total em oferta:', data.length);
console.log('primeiro (maior desconto):', data[0].id, data[0].percentualDesconto + '%', 'de', data[0].precoOriginal, 'por', data[0].preco);
console.log('tem embedding?', 'embedding' in data[0]);
console.log('ordenado decrescente?', data.every((p, i) => i === 0 || data[i-1].percentualDesconto >= p.percentualDesconto));
"
```

Expected: `total em oferta` próximo de 200 (±uns 30), `tem embedding? false`, `ordenado decrescente? true`, e o preço do primeiro item é visivelmente menor que o `precoOriginal`.

Parar o servidor ao final, confirmar porta livre.

- [ ] **Step 4: Commit**

```bash
git add app/api/ofertas/route.ts
git commit -m "feat: rota GET /api/ofertas"
```

---

### Task 3: `components/ProductCard.tsx` — badge de desconto

**Files:**
- Modify: `components/ProductCard.tsx`

**Interfaces:**
- Consumes: nada novo
- Produces (usado pela Task 4): `ProductCardProduto` ganha campo opcional `precoOriginal?: number`

- [ ] **Step 1: Adicionar `precoOriginal` opcional à interface**

Texto atual (linhas 12-20):
```tsx
interface ProductCardProduto {
  id: string
  categoria: string
  produto: string
  corredor: string
  preco: number
  estoque: number
  sustentabilidade: SustentabilidadeScore
}
```

Novo texto:
```tsx
interface ProductCardProduto {
  id: string
  categoria: string
  produto: string
  corredor: string
  preco: number
  precoOriginal?: number
  estoque: number
  sustentabilidade: SustentabilidadeScore
}
```

- [ ] **Step 2: Adicionar o badge "-X%" sobre a imagem**

Texto atual (linhas 58-66):
```tsx
      <div className="relative">
        <img
          src={getImagemCategoria(produto.categoria, produto.id)}
          alt={produto.categoria}
          className="w-full h-36 object-cover"
        />
        <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-lm-green text-white text-[10px] font-bold px-2 py-1 rounded-md">
          <MapPin size={10} strokeWidth={2.5} /> {produto.corredor}
        </span>
```

Novo texto:
```tsx
      <div className="relative">
        <img
          src={getImagemCategoria(produto.categoria, produto.id)}
          alt={produto.categoria}
          className="w-full h-36 object-cover"
        />
        {produto.precoOriginal !== undefined && produto.precoOriginal > produto.preco && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md">
            -{Math.round((1 - produto.preco / produto.precoOriginal) * 100)}%
          </span>
        )}
        <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-lm-green text-white text-[10px] font-bold px-2 py-1 rounded-md">
          <MapPin size={10} strokeWidth={2.5} /> {produto.corredor}
        </span>
```

- [ ] **Step 3: Mostrar o preço original riscado acima do preço com desconto**

Texto atual (linhas 89-95):
```tsx
      <div className="p-3">
        <h3 className="text-sm font-semibold text-lm-dark leading-snug mb-1.5 line-clamp-2 min-h-[2.5rem]">
          {produto.produto}
        </h3>
        <p className="text-base font-black text-lm-dark mb-1.5">
          {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
```

Novo texto:
```tsx
      <div className="p-3">
        <h3 className="text-sm font-semibold text-lm-dark leading-snug mb-1.5 line-clamp-2 min-h-[2.5rem]">
          {produto.produto}
        </h3>
        {produto.precoOriginal !== undefined && produto.precoOriginal > produto.preco && (
          <p className="text-xs text-gray-400 line-through">
            {produto.precoOriginal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        )}
        <p className="text-base font-black text-lm-dark mb-1.5">
          {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
```

- [ ] **Step 4: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros. Nenhum outro call site de `ProductCard` no projeto passa `precoOriginal`, então o campo opcional não quebra nenhum uso existente (categoria, busca, etc. continuam sem badge nenhum).

- [ ] **Step 5: Commit**

```bash
git add components/ProductCard.tsx
git commit -m "feat: ProductCard exibe preco riscado e badge de desconto quando aplicavel"
```

---

### Task 4: `components/OfertasView.tsx` + `app/ofertas/page.tsx`

**Files:**
- Create: `components/OfertasView.tsx`
- Create: `app/ofertas/page.tsx`

**Interfaces:**
- Consumes: `GET /api/ofertas` (Task 2); `ProductCard` com `precoOriginal` (Task 3); `Pagination` de `./ui/Pagination` (já existe, props `page`, `totalPages`, `onChange`); `ProdutoDrawer` (já existe); `PageHeader` (já existe)
- Produces: nada consumido por tasks futuras (é o fim da cadeia da feature Ofertas — a Task 8 só linka pra `/ofertas`, não importa nada daqui)

- [ ] **Step 1: Criar `components/OfertasView.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'
import ProdutoDrawer from './ProdutoDrawer'
import Pagination from './ui/Pagination'
import Skeleton from './ui/Skeleton'
import type { Produto } from '@/types/produto'

type ProdutoComOferta = Omit<Produto, 'embedding' | 'embedding_text'> & {
  precoOriginal: number
  percentualDesconto: number
}

const ITENS_POR_PAGINA = 20

export default function OfertasView() {
  const [produtos, setProdutos] = useState<ProdutoComOferta[]>([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [produtoDrawer, setProdutoDrawer] = useState<ProdutoComOferta | null>(null)

  useEffect(() => {
    fetch('/api/ofertas')
      .then(r => r.json())
      .then(data => { setProdutos(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const totalPaginas = Math.max(1, Math.ceil(produtos.length / ITENS_POR_PAGINA))
  const produtosPaginados = produtos.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA)

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border-2 border-gray-200 bg-white space-y-2">
            <Skeleton className="w-full h-36" />
            <Skeleton className="w-full h-3.5" />
            <Skeleton className="w-2/3 h-3.5" />
          </div>
        ))}
      </div>
    )
  }

  if (produtos.length === 0) {
    return <p className="text-sm text-gray-500 py-10 text-center">Nenhuma oferta disponível no momento.</p>
  }

  return (
    <>
      <ProdutoDrawer produto={produtoDrawer as any} onClose={() => setProdutoDrawer(null)} />
      <p className="text-xs text-gray-400 mb-4">{produtos.length} produtos em oferta</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 mb-6">
        {produtosPaginados.map(p => (
          <ProductCard key={p.id} produto={p} onSelect={() => setProdutoDrawer(p)} />
        ))}
      </div>
      <Pagination page={pagina} totalPages={totalPaginas} onChange={setPagina} />
    </>
  )
}
```

Nota: `produto={produtoDrawer as any}` é necessário porque `ProdutoDrawer` espera o tipo `Produto` completo (incluindo `embedding`), mas a API já remove esse campo — mesmo cast já usado hoje em `components/CategoriaView.tsx` pro mesmo motivo, não é uma gambiarra nova desta task.

- [ ] **Step 2: Criar `app/ofertas/page.tsx`**

```tsx
import OfertasView from '@/components/OfertasView'
import PageHeader from '@/components/ui/PageHeader'

export default function OfertasPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="Ofertas" description="Produtos com desconto por tempo limitado." />
      <OfertasView />
    </div>
  )
}
```

- [ ] **Step 3: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Verificação manual**

Run: `npm run dev` (background), poll em foreground até `200`. Confirmar porta livre antes.

Via `agent-browser` em `http://localhost:3000/ofertas`:
1. Confirmar skeleton de loading aparece brevemente, depois a grade de produtos com badge vermelho "-X%" no canto superior esquerdo de cada card e preço original riscado acima do preço com desconto.
2. Confirmar contagem "N produtos em oferta" bate com o total (comparar com o `total em oferta` da Task 2).
3. Clicar num card (ou "Detalhes") — confirmar que o `ProdutoDrawer` abre mostrando o preço **já com desconto** como preço normal do produto.
4. Testar paginação (ir pra página 2, confirmar produtos diferentes, com desconto ainda visível).
5. Confirmar em 390×844 que a grade cai pra 1 coluna sem cortar o badge/preço riscado.
6. Confirmar em modo escuro que o badge vermelho e o preço riscado continuam legíveis.

Parar o servidor ao final, confirmar porta livre.

- [ ] **Step 5: Commit**

```bash
git add components/OfertasView.tsx app/ofertas/page.tsx
git commit -m "feat: pagina de ofertas com produtos com desconto"
```

---

### Task 5: Extrair `lib/buscarProdutos.ts` e refatorar `SearchBar.tsx`

**Files:**
- Create: `lib/buscarProdutos.ts`
- Modify: `components/SearchBar.tsx`

**Interfaces:**
- Consumes: `SearchResult` de `@/types/produto` (já existe)
- Produces (usado pela Task 6): `export async function buscarProdutos(query: string, limit?: number): Promise<{ resultados: SearchResult[]; queryProcessada: string }>`

- [ ] **Step 1: Criar `lib/buscarProdutos.ts`**

```ts
import type { SearchResult } from '@/types/produto'

export async function buscarProdutos(query: string, limit = 12): Promise<{ resultados: SearchResult[]; queryProcessada: string }> {
  const q = query.trim()
  if (!q) return { resultados: [], queryProcessada: '' }

  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, limit }),
    })
    if (!res.ok) throw new Error('Erro na busca')
    const data = await res.json()
    return { resultados: data.resultados, queryProcessada: data.query_processada || q }
  } catch (err) {
    console.error('Erro ao buscar:', err)
    return { resultados: [], queryProcessada: q }
  }
}
```

- [ ] **Step 2: Refatorar `handleSearch` em `components/SearchBar.tsx` pra usar a função extraída**

Texto atual (linhas 1-12):
```tsx
'use client'

import { useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import VoiceButton from './VoiceButton'
import type { SearchResult } from '@/types/produto'

interface SearchBarProps {
  onResults: (results: SearchResult[], query: string) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}
```

Novo texto:
```tsx
'use client'

import { useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import VoiceButton from './VoiceButton'
import { buscarProdutos } from '@/lib/buscarProdutos'
import type { SearchResult } from '@/types/produto'

interface SearchBarProps {
  onResults: (results: SearchResult[], query: string) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}
```

Texto atual (linhas 17-42):
```tsx
  const handleSearch = useCallback(
    async (searchQuery: string) => {
      const q = searchQuery.trim()
      if (!q) return

      setLoading(true)
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, limit: 12 }),
        })

        if (!res.ok) throw new Error('Erro na busca')

        const data = await res.json()
        onResults(data.resultados, data.query_processada || q)
      } catch (err) {
        console.error('Erro ao buscar:', err)
        onResults([], q)
      } finally {
        setLoading(false)
      }
    },
    [onResults, setLoading]
  )
```

Novo texto:
```tsx
  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) return

      setLoading(true)
      const { resultados, queryProcessada } = await buscarProdutos(searchQuery)
      onResults(resultados, queryProcessada)
      setLoading(false)
    },
    [onResults, setLoading]
  )
```

- [ ] **Step 3: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Verificação de regressão manual**

Run: `npm run dev` (background), poll em foreground até `200`. Confirmar porta livre antes.

Via `agent-browser` em `/`: digitar uma busca no card "Busca inteligente" (ex: "torneira") e confirmar que o comportamento é idêntico ao de antes da refatoração — loading aparece, resultados aparecem no mapa, nenhuma regressão. Parar o servidor ao final, confirmar porta livre.

- [ ] **Step 5: Commit**

```bash
git add lib/buscarProdutos.ts components/SearchBar.tsx
git commit -m "refactor: extrai fetch de busca para lib/buscarProdutos.ts"
```

---

### Task 6: `SearchSection.tsx` aceita `initialQuery`

**Files:**
- Modify: `components/SearchSection.tsx`

**Interfaces:**
- Consumes: `buscarProdutos` de `@/lib/buscarProdutos` (Task 5)
- Produces (usado pela Task 7): `SearchSection` aceita prop opcional `initialQuery?: string`; quando fornecida e não-vazia, dispara a busca automaticamente ao montar e rola a própria seção pra vista.

- [ ] **Step 1: Adicionar a prop e o efeito de busca automática**

Texto atual (linhas 1-13):
```tsx
'use client'

import { useMemo, useState } from 'react'
import SearchBar from './SearchBar'
import ImageUpload from './ImageUpload'
import StoreMap from './StoreMap'
import ProdutoDrawer from './ProdutoDrawer'
import SearchFilters, { FILTROS_INICIAIS, aplicarFiltros, type FiltrosBusca } from './SearchFilters'
import ComparadorBar from './ComparadorBar'
import Skeleton from './ui/Skeleton'
import { MapPin } from 'lucide-react'
import type { SearchResult } from '@/types/produto'
```

Novo texto:
```tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import SearchBar from './SearchBar'
import ImageUpload from './ImageUpload'
import StoreMap from './StoreMap'
import ProdutoDrawer from './ProdutoDrawer'
import SearchFilters, { FILTROS_INICIAIS, aplicarFiltros, type FiltrosBusca } from './SearchFilters'
import ComparadorBar from './ComparadorBar'
import Skeleton from './ui/Skeleton'
import { MapPin } from 'lucide-react'
import { buscarProdutos } from '@/lib/buscarProdutos'
import type { SearchResult } from '@/types/produto'
```

Texto atual (linha 32):
```tsx
export default function SearchSection() {
```

Novo texto:
```tsx
interface SearchSectionProps {
  initialQuery?: string
}

export default function SearchSection({ initialQuery }: SearchSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
```

Texto atual (logo depois dos `useState` existentes, linhas 38-44 — o corpo entre a declaração de `filtros` e `handleSearchResults`):
```tsx
  const [filtros, setFiltros] = useState<FiltrosBusca>(FILTROS_INICIAIS)

  const handleSearchResults = (results: SearchResult[], query: string) => {
```

Novo texto:
```tsx
  const [filtros, setFiltros] = useState<FiltrosBusca>(FILTROS_INICIAIS)

  useEffect(() => {
    if (!initialQuery) return
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setLoading(true)
    buscarProdutos(initialQuery).then(({ resultados, queryProcessada }) => {
      setResultados(resultados)
      setQueryProcessada(queryProcessada)
      setFiltros(FILTROS_INICIAIS)
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery])

  const handleSearchResults = (results: SearchResult[], query: string) => {
```

- [ ] **Step 2: Adicionar o `ref` na div raiz**

Texto atual (linha 58 do arquivo original):
```tsx
    <div className="space-y-5">
```

Novo texto:
```tsx
    <div ref={sectionRef} className="space-y-5">
```

- [ ] **Step 3: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add components/SearchSection.tsx
git commit -m "feat: SearchSection aceita initialQuery e dispara busca automatica"
```

(Sem verificação via `agent-browser` isolada nesta task — ninguém ainda passa `initialQuery` de verdade pro `SearchSection` neste ponto do plano, já que `HomeView` só é criado na Task 7. A Task 7 verifica esse comportamento diretamente, navegando pra uma URL com `?q=` manualmente antes mesmo de `HeaderSearch` existir na Task 8 — o campo de busca no header, criado na Task 8, é só mais uma forma de chegar nessa mesma URL.)

---

### Task 7: `components/HeaderSearch.tsx` + divisão de `app/page.tsx` em `HomeView`

**Files:**
- Create: `components/HeaderSearch.tsx`
- Create: `components/HomeView.tsx`
- Modify: `app/page.tsx` (reescrita completa — vira um wrapper de servidor)

**Interfaces:**
- Consumes: `SearchSection` com `initialQuery` (Task 6)
- Produces (usado pela Task 8): `export default function HeaderSearch(): JSX.Element` — form com input controlado, `onSubmit` faz `router.push('/?q=' + encodeURIComponent(query))`.

- [ ] **Step 1: Criar `components/HeaderSearch.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export default function HeaderSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    router.push(`/?q=${encodeURIComponent(q)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex-1 md:max-w-2xl">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={17} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar produtos..."
        aria-label="Buscar produtos"
        className="w-full h-10 pl-10 pr-4 rounded-xl border-0 bg-white/95 text-sm text-lm-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
      />
    </form>
  )
}
```

- [ ] **Step 2: Criar `components/HomeView.tsx` com o conteúdo atual de `app/page.tsx` + leitura de `?q=` + troca do tile "Todos" por link "Ver todos"**

```tsx
'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import SearchSection from '@/components/SearchSection'
import CategoriaView from '@/components/CategoriaView'
import BannerCarrossel from '@/components/BannerCarrossel'
import Card from '@/components/ui/Card'
import { Grid2x2, Zap, Droplets, Hammer, Palette, Flower2, Lightbulb, BrickWall, Frame } from 'lucide-react'
import { getImagemCategoria } from '@/lib/categoriaImagens'

const CATEGORIAS = [
  { slug: 'ferramentas', label: 'Ferramentas', icon: Hammer },
  { slug: 'eletrica',    label: 'Elétrica',    icon: Zap },
  { slug: 'hidraulica',  label: 'Hidráulica',  icon: Droplets },
  { slug: 'pintura',     label: 'Pintura',     icon: Palette },
  { slug: 'jardim',      label: 'Jardim',      icon: Flower2 },
  { slug: 'iluminacao',  label: 'Iluminação',  icon: Lightbulb },
  { slug: 'construcao',  label: 'Construção',  icon: BrickWall },
  { slug: 'decoracao',   label: 'Decoração',   icon: Frame },
]

export default function HomeView() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? undefined
  const [categoriaAtiva, setCategoriaAtiva] = useState<{ slug: string; label: string } | null>(null)

  if (categoriaAtiva) {
    return (
      <div key={categoriaAtiva.slug} className="px-4 sm:px-6 lg:px-8 py-6 animate-fade-in-up">
        <CategoriaView
          slug={categoriaAtiva.slug}
          label={categoriaAtiva.label}
          onBack={() => setCategoriaAtiva(null)}
        />
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      {/* Banner promocional */}
      <BannerCarrossel onCategoriaClick={setCategoriaAtiva} />

      {/* Categorias */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Navegar por categoria
          </h2>
          <button
            onClick={() => setCategoriaAtiva({ slug: 'todos', label: 'Todos' })}
            className="flex items-center gap-1.5 text-xs font-semibold text-lm-green hover:underline"
          >
            Ver todos <Grid2x2 size={13} />
          </button>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {CATEGORIAS.map(({ slug, label, icon: Icon }, i) => (
            <button
              key={slug}
              onClick={() => setCategoriaAtiva({ slug, label })}
              style={{ '--stagger-delay': `${i * 30}ms` } as React.CSSProperties}
              className="group relative rounded-xl overflow-hidden aspect-square animate-fade-in-up hover:shadow-soft hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
            >
              <img src={getImagemCategoria(label)} alt={label} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="absolute bottom-1.5 left-0 right-0 text-center text-white text-[11px] font-bold leading-tight px-1">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Busca semântica */}
      <Card className="mb-8">
        <h1 className="text-base font-bold text-lm-dark mb-0.5">Busca inteligente</h1>
        <p className="text-xs text-gray-400 mb-4">Descreva com suas palavras — a IA encontra o produto certo</p>
        <SearchSection key={initialQuery ?? 'default'} initialQuery={initialQuery} />
      </Card>

      {/* Info bar */}
      <div className="grid grid-cols-3 gap-4 text-center text-xs text-gray-500">
        <Card padding="sm">
          <p className="font-bold text-lm-dark text-base">5.000+</p>
          <p>produtos disponíveis</p>
        </Card>
        <Card padding="sm">
          <p className="font-bold text-lm-dark text-base">45</p>
          <p>lojas no Brasil</p>
        </Card>
        <Card padding="sm">
          <p className="font-bold text-lm-dark text-base">IA</p>
          <p>busca por linguagem natural</p>
        </Card>
      </div>
    </div>
  )
}
```

Nota: o item `{ slug: 'todos', ... }` saiu do array `CATEGORIAS` (a grade agora só lista as 8 categorias reais); a ação de "todos" agora só existe no link "Ver todos" do cabeçalho, chamando o mesmo `setCategoriaAtiva({ slug: 'todos', label: 'Todos' })` de antes. Como o `slug === 'todos'` não aparece mais dentro do `.map`, o branch condicional que existia pra renderizar o tile "Todos" (ícone `Grid2x2` num botão sem imagem) foi removido — todo item do array agora é sempre o botão com foto de categoria. O campo `cor` de cada categoria também saiu do array: ele só era usado pelo tile "Todos" removido (as cores por categoria — laranja pra Ferramentas, amarelo pra Elétrica etc. — nunca foram aplicadas aos tiles com foto, só ao tile de ícone), então mantê-lo seria dado morto.

- [ ] **Step 3: Reescrever `app/page.tsx` como wrapper de servidor**

```tsx
import { Suspense } from 'react'
import HomeView from '@/components/HomeView'

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-lm-light" />}>
      <HomeView />
    </Suspense>
  )
}
```

- [ ] **Step 4: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Verificação manual — home sem query e com query manual na URL**

Run: `npm run dev` (background), poll em foreground até `200`. Confirmar porta livre antes.

Via `agent-browser`:
1. Em `/`, confirmar que a home renderiza normalmente (banner, categorias sem tile "Todos", link "Ver todos" no cabeçalho da seção abrindo a mesma tela de antes, busca inteligente, barra de info) — nenhuma regressão visual.
2. Navegar direto pra `http://localhost:3000/?q=torneira` — confirmar que a seção "Busca inteligente" já aparece com os resultados de "torneira" carregados automaticamente, sem precisar digitar nada, e que a página rolou até essa seção.
3. Type-check + visual em modo escuro e mobile 390×844 pra essa mesma URL com `?q=`.

Parar o servidor ao final, confirmar porta livre.

- [ ] **Step 6: Build de produção**

Run: `npm run build`
Expected: build conclui sem erro (`useSearchParams` exige o `Suspense` do Step 3 pra não quebrar aqui, mesmo com `npm run dev` funcionando sem ele). Depois: `rm -rf .next`.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx components/HomeView.tsx components/HeaderSearch.tsx
git commit -m "feat: home le query da URL e busca automaticamente; extrai HomeView e HeaderSearch"
```

---

### Task 8: `NavBar.tsx` — duas linhas, busca no header, ícone de conta, aba Ofertas

**Files:**
- Modify: `components/NavBar.tsx` (reescrita completa)

**Interfaces:**
- Consumes: `HeaderSearch` de `./HeaderSearch` (Task 7); rota `/ofertas` (Task 4) — só como `href`, sem import de código
- Produces: nada consumido por outras tasks (última task do plano)

- [ ] **Step 1: Reescrever `components/NavBar.tsx` por completo**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, MessageCircleQuestion, CalendarCheck, Sparkles, Tag, User, Menu, X } from 'lucide-react'
import { getUsuarioLogado } from '@/lib/clientAuth'
import ThemeToggle from './ThemeToggle'
import CarrinhoIcon from './CarrinhoIcon'
import NotificacoesBell from './NotificacoesBell'
import HeaderSearch from './HeaderSearch'

const tabs = [
  { href: '/', label: 'Buscar Produtos', icon: Search },
  { href: '/projeto', label: 'Projeto Guiado', icon: Sparkles },
  { href: '/duvidas', label: 'Tire Dúvidas', icon: MessageCircleQuestion },
  { href: '/agendamento', label: 'Agendar Visita', icon: CalendarCheck },
  { href: '/ofertas', label: 'Ofertas', icon: Tag },
]

export default function NavBar() {
  const pathname = usePathname()
  const [logado, setLogado] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    setLogado(getUsuarioLogado() !== null)
  }, [])

  useEffect(() => {
    setMenuAberto(false)
  }, [pathname])

  if (pathname.startsWith('/funcionario')) return null;

  const contaIconClass = `flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
    pathname === '/conta'
      ? 'bg-white/15 text-white'
      : 'text-white/80 hover:text-white hover:bg-white/10'
  }`

  return (
    <header className="bg-lm-green shadow-md relative z-30">
      {/* Linha 1 — logo, busca, ícones */}
      <div className="px-4 md:px-6 flex items-center gap-3 md:gap-4 h-16">

        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/leroy-logo.png"
            alt="Leroy Merlin"
            className="h-9 md:h-10 w-auto object-contain"
          />
        </Link>

        {/* Busca — visível em qualquer largura de tela */}
        <HeaderSearch />

        {/* Ícones — desktop */}
        <div className="hidden md:flex items-center gap-1 flex-shrink-0">
          {logado && <NotificacoesBell />}
          <ThemeToggle />
          <Link href={logado ? '/conta' : '/funcionario/login'} aria-label={logado ? 'Minha conta' : 'Entrar'} className={contaIconClass}>
            <User size={19} />
          </Link>
          <CarrinhoIcon />
        </div>

        {/* Botão hambúrguer — mobile */}
        <button
          type="button"
          onClick={() => setMenuAberto((v) => !v)}
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuAberto}
          className="md:hidden flex items-center justify-center w-10 h-10 -mr-2 text-white flex-shrink-0"
        >
          {menuAberto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Linha 2 — abas de navegação (desktop) */}
      <div className="hidden md:block border-t border-white/10">
        <nav className="px-4 md:px-6 flex items-center gap-1 py-2">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Menu mobile */}
      {menuAberto && (
        <div className="md:hidden bg-lm-green border-t border-white/15 px-4 py-3 space-y-1 animate-fade-in">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                  active ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}

          <div className="flex items-center justify-between gap-3 pt-3 mt-2 border-t border-white/15">
            <div className="flex items-center gap-1">
              {logado && <NotificacoesBell />}
              <ThemeToggle />
              <CarrinhoIcon />
            </div>
            <Link href={logado ? '/conta' : '/funcionario/login'} aria-label={logado ? 'Minha conta' : 'Entrar'} className={contaIconClass}>
              <User size={19} />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
```

Notas de design que valem registrar (pra não serem confundidas com bug na revisão):
- A busca (`HeaderSearch`) fica **fora** dos blocos `hidden md:flex`/`md:hidden` — ela é a única parte da linha 1 visível em qualquer largura de tela, por decisão explícita da spec ("busca é ação central demais pra ficar atrás de um menu").
- O grupo de ícones desktop (sino/tema/conta/carrinho) usa `gap-1` em vez do `gap-3` de antes, porque agora são só ícones quadrados de `w-10 h-10` lado a lado (sem o botão de texto "Login"/"Minha Conta" que precisava de mais respiro) — visual mais compacto, igual ao rascunho.
- A linha 2 (abas) mantém o mesmo estilo de aba ativa/inativa de hoje (`bg-white/15` + `rounded-xl`), só movido pra sua própria linha abaixo dos ícones em vez de coexistir com eles — nenhuma mudança visual na aba em si, só de posição.

- [ ] **Step 2: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Verificação manual completa — desktop**

Run: `npm run dev` (background), poll em foreground até `200`. Confirmar porta livre antes.

Via `agent-browser`, viewport 1440×900:
1. Confirmar layout de duas linhas: logo + busca + ícones (sino só aparece se logado) na linha 1; abas Buscar Produtos/Projeto Guiado/Tire Dúvidas/Agendar Visita/**Ofertas** na linha 2.
2. Digitar uma busca (ex: "furadeira") no campo do header estando em `/duvidas` — confirmar que navega pra `/` com os resultados de "furadeira" já carregados (end-to-end da Task 7 + Task 8 juntas).
3. Clicar em "Ofertas" na linha 2 — confirmar que abre `/ofertas` com produtos com desconto (da Task 4).
4. Deslogado: confirmar que o ícone de conta leva pra `/funcionario/login`. Logar (via Cadastre-se, esse app não aceita login direto sem conta) e confirmar que o mesmo ícone agora leva pra `/conta`, e que o sino de notificações aparece.
5. Confirmar que nenhuma busca ou navegação por categoria fora de `/ofertas` mostra preço riscado/badge de desconto, mesmo que o produto esteja entre os que têm desconto.

- [ ] **Step 4: Verificação manual completa — mobile**

Viewport 390×844:
1. Confirmar logo + hambúrguer na linha 1, campo de busca full-width sempre visível logo abaixo (sem precisar abrir o menu).
2. Abrir o hambúrguer — confirmar que a lista de abas inclui "Ofertas" e que o ícone de conta (sem texto) aparece ao lado de carrinho/sino/tema no rodapé do painel.
3. Repetir a busca cross-page do Step 3.2 nesse viewport.

Parar o servidor ao final, confirmar porta livre.

- [ ] **Step 5: Build de produção**

Run: `npm run build`
Expected: build conclui sem erro. Depois: `rm -rf .next`.

- [ ] **Step 6: Commit**

```bash
git add components/NavBar.tsx
git commit -m "feat: navbar em duas linhas com busca funcional, icone de conta e aba ofertas"
```
