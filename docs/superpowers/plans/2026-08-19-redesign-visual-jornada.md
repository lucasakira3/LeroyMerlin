# Redesign Visual da Jornada de Compra Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar peso visual real à jornada de compra do cliente (home → categoria/busca → produto → comparar/carrinho) usando fotos reais por categoria, sem backend novo.

**Architecture:** 9 imagens curadas do Wikimedia Commons (licença livre, sem API key) salvas em `public/categorias/*.jpg`, resolvidas por `lib/categoriaImagens.ts` (`categoria → caminho`). `components/ProductCard.tsx` é reescrito no formato "vertical imersivo" (foto grande no topo, corredor/carrinho como badge sobre a foto) e passa a ser o único componente de card de produto, usado em `CategoriaView.tsx` e `app/conta/page.tsx`. `ProdutoDrawer.tsx`, `app/comparar/page.tsx`, `app/carrinho/page.tsx` e `StoreMap.tsx` ganham a mesma foto de categoria inserida na própria estrutura existente de cada um (sem forçar esses cinco lugares — estruturalmente diferentes entre si: stepper de quantidade, cor dinâmica por pin, colunas de comparação — a compartilhar um único componente de card).

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, `lucide-react`.

## Global Constraints

- Sem API key nova — as 9 imagens são arquivos estáticos locais em `public/categorias/`, sem chamada de rede em runtime.
- Foto é por **categoria** (9 categorias fixas), nunca por produto individual.
- Painel do funcionário (`app/funcionario/**`) não é tocado neste plano.
- Banner da home é decorativo/estático — não lê nenhum dado real de promoção.
- Sem carrossel/rotação de banner — uma imagem fixa só.
- Grid de categorias da home continua com as mesmas 8 entradas de hoje (7 categorias reais + "Todos"); "Todos" mantém o tratamento de ícone atual, sem foto.
- Em `CategoriaView.tsx`, o card precisa preservar os dois cliques distintos que já existem: clicar no corpo do card seleciona o produto (pro mapa/comparador), um botão "Detalhes" separado abre o `ProdutoDrawer`.

---

### Task 1: Imagens de categoria + `lib/categoriaImagens.ts`

**Files:**
- Create: `public/categorias/ferramentas.jpg`, `eletrica.jpg`, `hidraulica.jpg`, `iluminacao.jpg`, `jardim.jpg`, `pisos-ceramica.jpg`, `banheiro.jpg`, `pintura.jpg`, `construcao.jpg`
- Create: `lib/categoriaImagens.ts`

**Interfaces:**
- Consumes: nada
- Produces: `getImagemCategoria(categoria: string): string` — retorna o caminho público (`/categorias/<slug>.jpg`) da foto da categoria; cai em `Ferramentas` se a categoria não for reconhecida.

Todas as 9 imagens abaixo já foram pesquisadas e conferidas visualmente (conteúdo bate com a categoria, boa resolução, licença livre no Wikimedia Commons) durante o brainstorming desta feature — os links são para o arquivo original (não thumbnail), evitando o erro intermitente que o redimensionamento `/thumb/` do Wikimedia às vezes retorna.

- [ ] **Step 1: Baixar as 9 imagens**

Run (da raiz do projeto):

```bash
mkdir -p public/categorias

curl -sL -A "Mozilla/5.0 (compatible; leroymerlin-mvp/1.0)" \
  "https://upload.wikimedia.org/wikipedia/commons/8/85/Cordless_Power_Drill_%2849253538983%29.jpg" \
  -o public/categorias/ferramentas.jpg

curl -sL -A "Mozilla/5.0 (compatible; leroymerlin-mvp/1.0)" \
  "https://upload.wikimedia.org/wikipedia/commons/4/4c/Electrical_Outlet.jpg" \
  -o public/categorias/eletrica.jpg

curl -sL -A "Mozilla/5.0 (compatible; leroymerlin-mvp/1.0)" \
  "https://upload.wikimedia.org/wikipedia/commons/b/b8/Kupferfittings_4062.jpg" \
  -o public/categorias/hidraulica.jpg

curl -sL -A "Mozilla/5.0 (compatible; leroymerlin-mvp/1.0)" \
  "https://upload.wikimedia.org/wikipedia/commons/4/4e/Philips_LED_bulbs.jpg" \
  -o public/categorias/iluminacao.jpg

curl -sL -A "Mozilla/5.0 (compatible; leroymerlin-mvp/1.0)" \
  "https://upload.wikimedia.org/wikipedia/commons/7/78/Flower_nursery_or_garden%2C_located_in_a_hilly_area%2C_with_many_potted_plants_arranged_on_tiered_shelves.jpg" \
  -o public/categorias/jardim.jpg

curl -sL -A "Mozilla/5.0 (compatible; leroymerlin-mvp/1.0)" \
  "https://upload.wikimedia.org/wikipedia/commons/a/a8/Garnet_red_ceramic_cemented_clean_tile_pattern_floor_ground_texture.jpg" \
  -o public/categorias/pisos-ceramica.jpg

curl -sL -A "Mozilla/5.0 (compatible; leroymerlin-mvp/1.0)" \
  "https://upload.wikimedia.org/wikipedia/commons/d/d6/Washbasins_of_the_restrooms_in_Crowne_Plaza_Vientiane.jpg" \
  -o public/categorias/banheiro.jpg

curl -sL -A "Mozilla/5.0 (compatible; leroymerlin-mvp/1.0)" \
  "https://upload.wikimedia.org/wikipedia/commons/c/c0/Paint_roller_4.jpg" \
  -o public/categorias/pintura.jpg

curl -sL -A "Mozilla/5.0 (compatible; leroymerlin-mvp/1.0)" \
  "https://upload.wikimedia.org/wikipedia/commons/9/9d/Brick_and_Flint_facade_of_house_under_construction_-_geograph.org.uk_-_3204361.jpg" \
  -o public/categorias/construcao.jpg
```

- [ ] **Step 2: Verificar que os 9 arquivos baixaram de verdade (não página de erro HTML)**

Run: `ls -la public/categorias/ && node -e "const fs=require('fs'); for (const f of fs.readdirSync('public/categorias')) { const s=fs.statSync('public/categorias/'+f).size; if (s < 5000) console.log('SUSPEITO (muito pequeno):', f, s); }"`

Expected: 9 arquivos listados, todos com dezenas/centenas de KB (Electrical Outlet e Washbasins são >1MB); nenhuma linha "SUSPEITO" impressa. Se algum arquivo aparecer como suspeito, ele provavelmente baixou uma página de erro HTML do Wikimedia em vez da imagem — repetir o `curl` daquele item específico (às vezes é falha transitória do servidor).

- [ ] **Step 3: Criar `lib/categoriaImagens.ts`**

```ts
// Fotos de categoria — Wikimedia Commons, licença livre, curadas manualmente.
// Fonte de cada arquivo (pra referência futura, não usado em runtime):
// ferramentas: Cordless Power Drill (49253538983).jpg
// eletrica: Electrical Outlet.jpg
// hidraulica: Kupferfittings 4062.jpg
// iluminacao: Philips LED bulbs.jpg
// jardim: Flower nursery or garden...tiered shelves.jpg
// pisos-ceramica: Garnet red ceramic cemented clean tile pattern floor ground texture.jpg
// banheiro: Washbasins of the restrooms in Crowne Plaza Vientiane.jpg
// pintura: Paint roller 4.jpg
// construcao: Brick and Flint facade of house under construction.jpg

const IMAGENS_POR_CATEGORIA: Record<string, string> = {
  'Ferramentas': '/categorias/ferramentas.jpg',
  'Elétrica': '/categorias/eletrica.jpg',
  'Hidráulica': '/categorias/hidraulica.jpg',
  'Iluminação': '/categorias/iluminacao.jpg',
  'Jardim': '/categorias/jardim.jpg',
  'Pisos e Cerâmica': '/categorias/pisos-ceramica.jpg',
  'Banheiro': '/categorias/banheiro.jpg',
  'Pintura': '/categorias/pintura.jpg',
  'Construção': '/categorias/construcao.jpg',
}

const FALLBACK = IMAGENS_POR_CATEGORIA['Ferramentas']

export function getImagemCategoria(categoria: string): string {
  return IMAGENS_POR_CATEGORIA[categoria] ?? FALLBACK
}
```

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `lib/categoriaImagens.ts`

- [ ] **Step 5: Commit**

```bash
git add public/categorias lib/categoriaImagens.ts
git commit -m "feat: imagens de categoria curadas e helper de resolucao"
```

---

### Task 2: `components/ProductCard.tsx` — formato vertical imersivo

**Files:**
- Modify: `components/ProductCard.tsx` (reescrita completa)
- Modify: `components/ProductCardSkeleton.tsx`

**Interfaces:**
- Consumes: `getImagemCategoria` de `lib/categoriaImagens.ts` (Task 1), `StockIndicator` (`components/StockIndicator.tsx`, já existe), `SustainabilityBadge` (`components/SustainabilityBadge.tsx`, já existe), `adicionarAoCarrinho` de `lib/clientCarrinho.ts` (já existe)
- Produces:
  ```ts
  interface ProductCardProduto {
    id: string
    categoria: string
    produto: string
    corredor: string
    preco: number
    estoque: number
    sustentabilidade: import('@/types/produto').SustentabilidadeScore
  }
  interface ProductCardProps {
    produto: ProductCardProduto
    selected?: boolean       // aro/sombra verde quando true
    href?: string             // se definido e sem onSelect: card inteiro é um Link
    onSelect?: () => void     // se definido: card inteiro é um botão, clique chama isso
    onDetalhes?: () => void   // opcional: mostra um botão "Detalhes" sobre a foto
    style?: React.CSSProperties
    className?: string
  }
  ```
  Componente sempre renderiza o botão de carrinho internamente (usa `adicionarAoCarrinho` + feedback próprio de 1.5s) — quem usa o card não precisa mais gerenciar esse estado.

O card antigo (`Link` horizontal com score de busca) sai completamente. O "% de relevância" que existia não é mais mostrado — não fazia sentido fora do contexto de busca semântica (nem `CategoriaView` nem `/conta` têm um score real).

- [ ] **Step 1: Reescrever `components/ProductCard.tsx`**

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, ShoppingCart, Check } from 'lucide-react'
import StockIndicator from './StockIndicator'
import SustainabilityBadge from './SustainabilityBadge'
import { getImagemCategoria } from '@/lib/categoriaImagens'
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'
import type { SustentabilidadeScore } from '@/types/produto'

interface ProductCardProduto {
  id: string
  categoria: string
  produto: string
  corredor: string
  preco: number
  estoque: number
  sustentabilidade: SustentabilidadeScore
}

interface ProductCardProps {
  produto: ProductCardProduto
  selected?: boolean
  href?: string
  onSelect?: () => void
  onDetalhes?: () => void
  style?: React.CSSProperties
  className?: string
}

export default function ProductCard({
  produto,
  selected = false,
  href,
  onSelect,
  onDetalhes,
  style,
  className = '',
}: ProductCardProps) {
  const [adicionado, setAdicionado] = useState(false)

  function handleAdicionarCarrinho(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (produto.estoque === 0) return
    adicionarAoCarrinho(produto.id)
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 1500)
  }

  const wrapperClass = `group relative block text-left w-full rounded-card overflow-hidden border-2 bg-white transition-all hover:shadow-md ${
    selected ? 'border-lm-green shadow-sm' : 'border-gray-200 hover:border-lm-green/40'
  } ${className}`

  const conteudo = (
    <>
      <div className="relative">
        <img
          src={getImagemCategoria(produto.categoria)}
          alt={produto.categoria}
          className="w-full h-36 object-cover"
        />
        <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-lm-green text-white text-[10px] font-bold px-2 py-1 rounded-md">
          <MapPin size={10} strokeWidth={2.5} /> {produto.corredor}
        </span>
        <button
          type="button"
          onClick={handleAdicionarCarrinho}
          disabled={produto.estoque === 0}
          aria-label="Adicionar ao carrinho"
          className={`absolute top-2 right-2 flex items-center justify-center w-8 h-8 rounded-full shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white ${
            adicionado ? 'bg-lm-green' : 'bg-lm-dark/80 hover:bg-lm-green'
          }`}
        >
          {adicionado ? <Check size={14} /> : <ShoppingCart size={14} />}
        </button>
        {onDetalhes && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); e.preventDefault(); onDetalhes() }}
            className="absolute bottom-2 right-2 text-[10px] font-semibold text-white bg-black/50 hover:bg-black/70 rounded-full px-2 py-1 transition-colors"
          >
            Detalhes
          </button>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold text-lm-dark leading-snug mb-1.5 line-clamp-2 min-h-[2.5rem]">
          {produto.produto}
        </h3>
        <p className="text-base font-black text-lm-dark mb-1.5">
          {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <StockIndicator estoque={produto.estoque} />
          <SustainabilityBadge sustentabilidade={produto.sustentabilidade} />
        </div>
      </div>
    </>
  )

  if (href && !onSelect) {
    return (
      <Link href={href} className={wrapperClass} style={style}>
        {conteudo}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onSelect} className={wrapperClass} style={style}>
      {conteudo}
    </button>
  )
}
```

- [ ] **Step 2: Atualizar `components/ProductCardSkeleton.tsx` pro mesmo formato**

```tsx
import Skeleton from './ui/Skeleton'

export default function ProductCardSkeleton() {
  return (
    <div className="rounded-card overflow-hidden border-2 border-gray-200 bg-white">
      <Skeleton className="w-full h-36" />
      <div className="p-3 space-y-2">
        <Skeleton className="w-full h-3.5" />
        <Skeleton className="w-2/3 h-3.5" />
        <Skeleton className="w-20 h-4" />
        <div className="flex items-center justify-between pt-0.5">
          <Skeleton className="w-20 h-4 rounded-full" />
          <Skeleton className="w-14 h-4 rounded-full" />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: erros aparecerão em `app/conta/page.tsx` (Task 3 ainda não fez a migração de props) — confirmar que os erros são exatamente sobre a prop `result` não existir mais em `ProductCard`, nenhum outro erro novo.

- [ ] **Step 4: Commit**

```bash
git add components/ProductCard.tsx components/ProductCardSkeleton.tsx
git commit -m "feat: ProductCard no formato vertical imersivo com foto de categoria"
```

---

### Task 3: `app/conta/page.tsx` — grid com o novo `ProductCard`

**Files:**
- Modify: `app/conta/page.tsx:47-68`

**Interfaces:**
- Consumes: `ProductCard` (Task 2) com prop `href`
- Produces: nada novo

- [ ] **Step 1: Trocar a lista vertical por um grid e ajustar a chamada do `ProductCard`**

Substituir o corpo de `SecaoProdutos` (linhas 47-68 de `app/conta/page.tsx`):

```tsx
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{titulo}</h2>
      {produtos === null && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[0, 1, 2].map((i) => <ProductCardSkeleton key={i} />)}
        </div>
      )}
      {produtos !== null && produtos.length === 0 && (
        <p className="text-sm text-gray-500 py-6">{mensagemVazia}</p>
      )}
      {produtos !== null && produtos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {produtos.map(({ produto }, i) => (
            <ProductCard
              key={produto.id}
              produto={produto}
              href={`/produto/${produto.id}`}
              className="animate-fade-in-up"
              style={{ '--stagger-delay': `${Math.min(i, 15) * 30}ms` } as React.CSSProperties}
            />
          ))}
        </div>
      )}
    </section>
  )
```

Nota: `produtos` continua vindo de `buscarProdutos` (linha 17-20 do mesmo arquivo), que já mapeia pra `SearchResult[]` (`{ produto, score: 1 }`) — só passamos `produto` adiante agora, o `score` fixo de 1 não é mais usado em lugar nenhum, mas a função `buscarProdutos`/tipo `SearchResult[]` podem continuar como estão (não vale a pena mexer no tipo por causa disso).

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros relacionados a `app/conta/page.tsx` ou `components/ProductCard.tsx`

- [ ] **Step 3: Commit**

```bash
git add app/conta/page.tsx
git commit -m "feat: favoritos e historico da conta em grid com foto"
```

---

### Task 4: `components/CategoriaView.tsx` — trocar card inline pelo `ProductCard`

**Files:**
- Modify: `components/CategoriaView.tsx`

**Interfaces:**
- Consumes: `ProductCard` (Task 2) com `selected`/`onSelect`/`onDetalhes`
- Produces: nada novo (remove estado interno que fica redundante)

- [ ] **Step 1: Atualizar o import de ícones e adicionar o import do `ProductCard`**

Linha 5, trocar:

```tsx
import { ArrowLeft, MapPin, Package, CheckCircle2, SlidersHorizontal, Info, Scale, ShoppingCart, Check } from 'lucide-react'
```

por:

```tsx
import { ArrowLeft, MapPin, Package, SlidersHorizontal, Scale } from 'lucide-react'
```

(`CheckCircle2`, `Info`, `ShoppingCart`, `Check` só eram usados dentro do card antigo, que sai neste task.)

Logo abaixo dos outros imports (depois da linha `import { trackProductView } from '@/lib/hooks/useProductTracker'`), adicionar:

```tsx
import ProductCard from './ProductCard'
```

- [ ] **Step 2: Remover o estado e a função de carrinho que agora vivem dentro do `ProductCard`**

Remover a linha (perto das outras `useState`):

```tsx
  const [adicionadoId, setAdicionadoId] = useState<string | null>(null)
```

Remover a função inteira:

```tsx
  function handleAdicionarCarrinho(produtoId: string, estoque: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (estoque === 0) return
    adicionarAoCarrinho(produtoId)
    setAdicionadoId(produtoId)
    setTimeout(() => setAdicionadoId(prev => prev === produtoId ? null : prev), 1500)
  }
```

Remover também o import agora não usado (linha 11):

```tsx
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'
```

- [ ] **Step 3: Substituir o bloco do grid de produtos**

Trocar todo o bloco `{/* Grid de produtos */} ... {!loading && (<div className="grid ...">{produtosFiltrados.map(...)}</div>)}` (linhas 236-322 do arquivo original) por:

```tsx
      {/* Grid de produtos */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
          {produtosFiltrados.map((p, i) => (
            <ProductCard
              key={p.id}
              produto={p}
              selected={selecionados.some(s => s.id === p.id)}
              onSelect={() => toggleSelecionado(p)}
              onDetalhes={() => {
                trackProductView({ id: p.id, nome: p.produto, categoria: p.categoria })
                setProdutoDrawer(p)
              }}
              className="animate-fade-in-up"
              style={{ '--stagger-delay': `${Math.min(i, 15) * 20}ms` } as React.CSSProperties}
            />
          ))}
        </div>
      )}
```

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros relacionados a `components/CategoriaView.tsx`

- [ ] **Step 5: Commit**

```bash
git add components/CategoriaView.tsx
git commit -m "feat: grid de categoria usando o ProductCard com foto"
```

---

### Task 5: Home (`app/page.tsx`) — banner + categorias com foto

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `getImagemCategoria` de `lib/categoriaImagens.ts` (Task 1)
- Produces: nada novo

- [ ] **Step 1: Adicionar o import**

Linha 7, adicionar depois do import de ícones:

```tsx
import { getImagemCategoria } from '@/lib/categoriaImagens'
```

- [ ] **Step 2: Adicionar o banner e trocar o grid de categorias por tiles com foto**

Substituir o bloco (linhas 35-55 do arquivo original, dentro do `return` principal — a versão sem categoria ativa):

```tsx
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in-up">
      {/* Categorias */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Navegar por categoria
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {CATEGORIAS.map(({ slug, label, icon: Icon, cor }, i) => (
            <button
              key={slug}
              onClick={() => setCategoriaAtiva({ slug, label })}
              style={{ '--stagger-delay': `${i * 30}ms` } as React.CSSProperties}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all hover:shadow-soft hover:-translate-y-0.5 active:scale-95 cursor-pointer animate-fade-in-up ${cor}`}
            >
              <Icon size={22} />
              <span className="text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>
```

por:

```tsx
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in-up">
      {/* Banner promocional */}
      <div className="relative h-40 sm:h-44 mb-8 overflow-hidden rounded-card bg-gradient-to-r from-green-800 to-lm-green">
        <img
          src={getImagemCategoria('Ferramentas')}
          alt=""
          className="absolute -right-4 -top-2 h-[120%] w-3/5 object-cover"
        />
        <div className="relative h-full flex flex-col justify-center px-6 sm:px-10 max-w-xs sm:max-w-sm">
          <span className="inline-block w-fit bg-lm-yellow text-black text-[10px] font-extrabold px-2.5 py-1 rounded-md mb-2 tracking-wide">
            OFERTA DA SEMANA
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">Até 30% off</h1>
          <p className="text-sm text-white/85 mt-1">em ferramentas elétricas selecionadas</p>
        </div>
      </div>

      {/* Categorias */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Navegar por categoria
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {CATEGORIAS.map(({ slug, label, icon: Icon, cor }, i) => {
            if (slug === 'todos') {
              return (
                <button
                  key={slug}
                  onClick={() => setCategoriaAtiva({ slug, label })}
                  style={{ '--stagger-delay': `${i * 30}ms` } as React.CSSProperties}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all hover:shadow-soft hover:-translate-y-0.5 active:scale-95 cursor-pointer animate-fade-in-up ${cor}`}
                >
                  <Icon size={22} />
                  <span className="text-center leading-tight">{label}</span>
                </button>
              )
            }
            return (
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
            )
          })}
        </div>
      </div>
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros relacionados a `app/page.tsx`

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: banner e categorias com foto na home"
```

---

### Task 6: `components/ProdutoDrawer.tsx` — foto hero no topo

**Files:**
- Modify: `components/ProdutoDrawer.tsx`

**Interfaces:**
- Consumes: `getImagemCategoria` de `lib/categoriaImagens.ts` (Task 1)
- Produces: nada novo

- [ ] **Step 1: Adicionar o import**

Linha 5, adicionar depois do import de `lib/marcas`:

```tsx
import { getImagemCategoria } from '@/lib/categoriaImagens'
```

- [ ] **Step 2: Garantir que o painel corta a imagem nos cantos arredondados**

No componente `ProdutoDrawer` (não `DrawerContent`), a `<div>` do painel lateral (linha 60-62) ganha `overflow-hidden`:

```tsx
          <div
          className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white rounded-l-card shadow-soft-lg overflow-hidden flex flex-col transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
        >
```

- [ ] **Step 3: Inserir a foto antes do cabeçalho verde**

No início do `return` de `DrawerContent` (logo antes de `{/* Header */}`), adicionar:

```tsx
  return (
    <>
      {/* Foto da categoria */}
      <img
        src={getImagemCategoria(produto.categoria)}
        alt={produto.categoria}
        className="w-full h-40 object-cover flex-shrink-0"
      />

      {/* Header */}
      <div className="bg-lm-green px-5 pt-5 pb-4 text-white flex-shrink-0">
```

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros relacionados a `components/ProdutoDrawer.tsx`

- [ ] **Step 5: Commit**

```bash
git add components/ProdutoDrawer.tsx
git commit -m "feat: foto de categoria no topo do drawer de produto"
```

---

### Task 7: `app/comparar/page.tsx` — foto por coluna

**Files:**
- Modify: `app/comparar/page.tsx`

**Interfaces:**
- Consumes: `getImagemCategoria` de `lib/categoriaImagens.ts` (Task 1)
- Produces: nada novo

- [ ] **Step 1: Adicionar o import**

Linha 16, adicionar depois do import de `lib/clientAvaliacoes`:

```tsx
import { getImagemCategoria } from '@/lib/categoriaImagens'
```

- [ ] **Step 2: Adicionar a foto no topo de cada coluna**

Dentro do `.map(produto => ...)` do comparador, logo após o botão de remover (`<Trash2 ... />`) e antes de `<p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{produto.categoria}</p>`, adicionar:

```tsx
                  <img
                    src={getImagemCategoria(produto.categoria)}
                    alt={produto.categoria}
                    className="w-full h-28 object-cover rounded-lg mb-3"
                  />

                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{produto.categoria}</p>
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros relacionados a `app/comparar/page.tsx`

- [ ] **Step 4: Commit**

```bash
git add app/comparar/page.tsx
git commit -m "feat: foto de categoria nas colunas do comparador"
```

---

### Task 8: `app/carrinho/page.tsx` — thumbnail por item

**Files:**
- Modify: `app/carrinho/page.tsx`

**Interfaces:**
- Consumes: `getImagemCategoria` de `lib/categoriaImagens.ts` (Task 1)
- Produces: nada novo

- [ ] **Step 1: Adicionar o import**

Linha 13, adicionar depois do import de `lib/hooks/useProductTracker`:

```tsx
import { getImagemCategoria } from '@/lib/categoriaImagens'
```

- [ ] **Step 2: Adicionar a miniatura no início de cada linha do carrinho**

No `.map(({ item, produto }) => ...)`, logo depois de `<Card key={produto.id} padding="sm" className="flex items-center gap-3">` e antes de `<div className="flex-1 min-w-0">`, adicionar:

```tsx
                <Card key={produto.id} padding="sm" className="flex items-center gap-3">
                  <img
                    src={getImagemCategoria(produto.categoria)}
                    alt={produto.categoria}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros relacionados a `app/carrinho/page.tsx`

- [ ] **Step 4: Commit**

```bash
git add app/carrinho/page.tsx
git commit -m "feat: thumbnail de categoria nos itens do carrinho"
```

---

### Task 9: `components/StoreMap.tsx` — thumbnail na legenda

**Files:**
- Modify: `components/StoreMap.tsx`

**Interfaces:**
- Consumes: `getImagemCategoria` de `lib/categoriaImagens.ts` (Task 1)
- Produces: nada novo

Não usa o `ProductCard` — a legenda já tem cor dinâmica por pin (`pin.color`) pra casar com o número no mapa, então só ganha uma miniatura na própria estrutura existente.

- [ ] **Step 1: Adicionar o import**

Linha 7, adicionar depois do import de `lib/hooks/useProductTracker`:

```tsx
import { getImagemCategoria } from '@/lib/categoriaImagens'
```

- [ ] **Step 2: Adicionar a miniatura em cada item da legenda**

No bloco da legenda (`.map((pin, i) => ...)`), logo depois do `<span>` do número colorido (`{pin.idx}`) e antes de `<div className="min-w-0">`, adicionar:

```tsx
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                  style={{ backgroundColor: pin.color }}>{pin.idx}</span>
                <img
                  src={getImagemCategoria(pin.produto.categoria)}
                  alt={pin.produto.categoria}
                  className="w-9 h-9 rounded-md object-cover flex-shrink-0"
                />
                <div className="min-w-0">
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros relacionados a `components/StoreMap.tsx`

- [ ] **Step 4: Commit**

```bash
git add components/StoreMap.tsx
git commit -m "feat: thumbnail de categoria na legenda do mapa"
```

---

### Task 10: Verificação manual completa

**Files:** nenhum

**Interfaces:**
- Consumes: app rodando localmente (`npm run dev`)
- Produces: confirmação de que a jornada inteira ficou visual e nada quebrou

- [ ] **Step 1: Build de produção limpo**

Run: `rm -rf .next && npm run build`
Expected: build passa sem erros (confirma que nenhuma página com `useSearchParams`, ex. `/comparar`, quebrou).

- [ ] **Step 2: Subir o dev server limpo**

Run: `rm -rf .next && npm run dev` (em background)

- [ ] **Step 3: Home**

Via `agent-browser`: abrir `/`, confirmar banner no topo (foto + "Oferta da semana") e os 7 tiles de categoria com foto + o tile "Todos" com ícone. Clicar numa categoria com foto, confirmar que navega normalmente pra `CategoriaView`.

- [ ] **Step 4: Categoria**

Confirmar que o grid de produtos mostra o novo card (foto grande, corredor em badge verde na foto, botão de carrinho circular no canto). Clicar no corpo do card — confirmar que seleciona (borda verde) sem abrir o drawer. Clicar em "Detalhes" — confirmar que abre o `ProdutoDrawer` com a foto no topo. Clicar no botão de carrinho — confirmar feedback de check sem selecionar o card nem abrir o drawer (checar `stopPropagation`).

- [ ] **Step 5: Busca**

Buscar um produto, abrir o mapa, confirmar que a legenda mostra a miniatura da categoria ao lado do número colorido de cada pin. Abrir um produto pelo pin, confirmar a foto no topo do drawer.

- [ ] **Step 6: Comparador e carrinho**

Selecionar 2-3 produtos e ir pra `/comparar`, confirmar foto no topo de cada coluna. Adicionar um item ao carrinho e abrir `/carrinho`, confirmar a miniatura ao lado de cada item.

- [ ] **Step 7: `/conta`**

Fazer login, favoritar 1-2 produtos, abrir `/conta`, confirmar que "Favoritos" e "Histórico" aparecem em grid com o novo card (não mais lista vertical), foto correta por categoria.

- [ ] **Step 8: Modo escuro**

Repetir os passos 3-7 com o tema escuro ativado (`ThemeToggle`), conferir contraste dos badges/gradiente do banner sobre as fotos.

- [ ] **Step 9: Mobile**

Repetir home + categoria em viewport 390×844 (`agent-browser set viewport`), confirmar que o grid de categorias e os cards de produto colapsam para menos colunas sem cortar texto/foto.
