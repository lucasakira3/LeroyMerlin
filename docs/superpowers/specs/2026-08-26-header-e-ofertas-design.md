# Header em duas linhas + feature Ofertas

## Contexto

Usuário mandou um rascunho desenhado à mão da tela inicial que quer: logo + barra de busca real dentro do próprio header + ícones agrupados (sino, conta, carrinho) numa primeira linha, uma segunda linha de navegação por abas (incluindo uma aba nova "Ofertas"), o banner rotativo que já existe (`BannerCarrossel`, já implementado, bate com o rascunho) e um link "Ver todos" no cabeçalho da seção de categorias.

Duas decisões de escopo tomadas antes de desenhar:
1. **Aba "Ofertas":** não existe conceito de desconto/promoção nos dados hoje (`data/produtos.json` só tem `preco`, sem preço original nem flag de promoção) — usuário escolheu **construir a feature de verdade agora**, não só um link decorativo.
2. **Busca no header:** usuário escolheu busca **funcional de qualquer página** (não só um link estilizado) — digitar e confirmar navega pra home já com os resultados carregados.

## Objetivo

Reestruturar a `NavBar` em duas linhas conforme o rascunho, tornar a busca acessível e funcional a partir de qualquer tela, e lançar uma feature real de "Ofertas" com desconto simulado de forma determinística (sem alterar `data/produtos.json`, sem backend novo).

## Escopo

**Dentro do escopo:**
- `NavBar.tsx` em duas linhas: logo + busca + ícones (sino/tema/conta/carrinho) na primeira; abas de navegação (incluindo "Ofertas") na segunda.
- Botão de conta vira ícone (sem o texto "Login"/"Minha Conta"), mesmo tratamento visual dos outros ícones.
- Busca funcional embutida no header, disponível em qualquer página, navegando pra `/?q=<busca>` e dessa vez a home carrega os resultados automaticamente.
- Nova feature "Ofertas": função determinística de desconto (`lib/ofertas.ts`), rota `GET /api/ofertas`, página `/ofertas`, extensão do `ProductCard` pra mostrar preço riscado + badge de desconto.
- Seção "Navegar por categoria" da home ganha link "Ver todos" no cabeçalho; o tile "Todos" que hoje existe na grade é removido (o link substitui, não duplica).

**Fora do escopo:**
- Mudar `data/produtos.json` pra adicionar campo de desconto real — o desconto é 100% derivado em runtime a partir do `id` já existente (mesmo padrão de `getImagemCategoria`/`getMarca`), nada é persistido.
- Mostrar badge de desconto nas grades de categoria/busca normais — só a página `/ofertas` exibe o desconto; um produto "em oferta" continua aparecendo com preço cheio em qualquer outro lugar do app.
- Filtros (complexidade/preço/estoque) ou seleção múltipla/comparador na página de Ofertas — v1 é listagem + paginação + abrir detalhes, mesmo escopo mínimo que uma vitrine.
- Qualquer alteração em `ProdutoDrawer.tsx` — ele já recebe e mostra `produto.preco` normalmente; ao abrir o drawer a partir de Ofertas, `preco` já vem com o desconto aplicado, então não precisa saber que é uma oferta.
- `ThemeToggle` permanece como está hoje (ícone sol/lua) — só muda de posição dentro do grupo de ícones.

## 1. `NavBar.tsx` — duas linhas

**Linha 1 (`h-16`, como hoje):** logo à esquerda; `HeaderSearch` (novo componente) ocupando o espaço central, `flex-1 md:max-w-2xl`; grupo de ícones à direita, nesta ordem: `NotificacoesBell` (só se `logado`), `ThemeToggle`, ícone de conta, `CarrinhoIcon`.

**Ícone de conta** substitui o bloco atual de `Link` texto "Minha Conta"/"Login" por um botão só-ícone, mesmo padrão visual de `CarrinhoIcon` (`w-10 h-10 rounded-xl`):
```tsx
<Link
  href={logado ? '/conta' : '/funcionario/login'}
  aria-label={logado ? 'Minha conta' : 'Entrar'}
  className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
    pathname === '/conta' ? 'bg-white/15 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'
  }`}
>
  <User size={19} />
</Link>
```
Isso remove o botão verde "Login" que hoje chama atenção visualmente — decisão consciente do usuário ao aprovar o rascunho (o rascunho mostra só um ícone de pessoa, sem texto, para os dois estados).

**Linha 2 (nova, `h-11` aprox., mesmo `bg-lm-green`, `border-t border-white/10` separando das linhas):** as abas de navegação, mesmo componente/estilo de hoje, só que numa linha própria abaixo em vez de coexistir com os ícones na linha 1. Array `tabs` ganha uma entrada:
```tsx
const tabs = [
  { href: '/', label: 'Buscar Produtos', icon: Search },
  { href: '/projeto', label: 'Projeto Guiado', icon: Sparkles },
  { href: '/duvidas', label: 'Tire Dúvidas', icon: MessageCircleQuestion },
  { href: '/agendamento', label: 'Agendar Visita', icon: CalendarCheck },
  { href: '/ofertas', label: 'Ofertas', icon: Tag },
]
```
(`Tag` de `lucide-react`.)

**Mobile:** hoje a barra mobile só tem logo + botão hambúrguer (os ícones de carrinho/sino/tema e o link de conta só aparecem dentro do painel que abre com o hambúrguer, não numa barra visível) — isso não muda de estrutura. A única adição é uma **linha nova, sempre visível, com a `HeaderSearch` full-width**, entre a barra logo+hambúrguer e o painel expansível — busca é ação central demais pra ficar escondida atrás de um menu. Dentro do painel do hambúrguer (que já existe), o bloco de ícones (`CarrinhoIcon`, `NotificacoesBell` se logado, `ThemeToggle`) e o link de conta seguem exatamente onde estão hoje, só que o link de conta também vira ícone-só (mesmo componente do ícone de conta da linha 1 do desktop, reaproveitado aqui). As abas de navegação continuam só dentro do painel do hambúrguer, sem mudança de comportamento, só ganhando a entrada "Ofertas" na lista (o `tabs.map` já é compartilhado entre desktop e mobile).

## 2. `components/HeaderSearch.tsx` (novo)

Componente pequeno e autocontido, sem as dependências do `SearchBar.tsx` atual (sem botão de voz, sem botão "Buscar produto" separado — aqui é só um campo compacto de header):
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
Não guarda estado de resultado nenhum — só navega. `router.push` pra `/` com um `q` diferente do atual atualiza `useSearchParams()` na home mesmo estando já nela (comportamento padrão do App Router, sem necessidade de lógica extra aqui).

## 3. Busca funcional cross-page

**Problema:** hoje a busca só existe dentro do estado local de `components/SearchSection.tsx`, renderizado dentro de `app/page.tsx` (que é `'use client'` sem `Suspense`). Pra um `?q=` da URL disparar a busca automaticamente, a home precisa ler `useSearchParams()` — que exige um limite de `Suspense` (regra do Next 14 App Router; sem isso `npm run build` quebra mesmo com `npm run dev` funcionando, gotcha já documentado neste projeto na página `/lista`).

**`lib/buscarProdutos.ts` (novo)** — extrai o fetch que hoje está inline em `SearchBar.tsx`, pra ser reaproveitado tanto pela busca manual quanto pela busca disparada por `?q=`:
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

**`components/SearchBar.tsx`** — `handleSearch` passa a chamar `buscarProdutos` em vez do fetch inline (comportamento idêntico, só remove duplicação):
```ts
const handleSearch = useCallback(async (searchQuery: string) => {
  if (!searchQuery.trim()) return
  setLoading(true)
  const { resultados, queryProcessada } = await buscarProdutos(searchQuery)
  onResults(resultados, queryProcessada)
  setLoading(false)
}, [onResults, setLoading])
```

**`components/SearchSection.tsx`** ganha uma prop opcional `initialQuery?: string`. Quando presente (componente montado a partir de uma navegação com `?q=`), dispara a mesma busca automaticamente e rola a seção pra vista:
```ts
interface SearchSectionProps {
  initialQuery?: string
}

export default function SearchSection({ initialQuery }: SearchSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  // ...estados existentes...

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

  return (
    <div ref={sectionRef} className="space-y-5">
      {/* ...JSX existente sem mudança... */}
```
(`sectionRef` embrulha a `div` raiz que já existe hoje; só precisa virar de `<div className="space-y-5">` pra `<div ref={sectionRef} className="space-y-5">`.)

**`app/page.tsx` vira um componente servidor fino:**
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

**`components/HomeView.tsx` (novo)** recebe o corpo inteiro do componente `Home` que hoje está em `app/page.tsx` (banner, grade de categorias, card "Busca inteligente", barra de info — sem mudança nenhuma nesse conteúdo), com três adições:
1. `import { useSearchParams } from 'next/navigation'` e `const initialQuery = useSearchParams().get('q') ?? undefined` no topo do componente.
2. `<SearchSection key={initialQuery ?? 'default'} initialQuery={initialQuery} />` no lugar de `<SearchSection />` — a `key` força remontagem sempre que uma busca **diferente** da anterior chega pela URL, garantindo que o efeito de `initialQuery` sempre dispare pra uma consulta nova (uma busca idêntica repetida não precisa de remontagem, já que o resultado já exibido continuaria sendo o mesmo).
3. A troca do tile "Todos" por um link "Ver todos" (seção 5 abaixo).

## 4. Feature Ofertas

**`lib/ofertas.ts` (novo)** — mesmo padrão de hash determinístico já usado em `getImagemCategoria`/`getMarca`, sem tocar `data/produtos.json`:
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
  const emOferta = hash % 5 === 0 // ~20% do catálogo (1000 produtos → ~200 em oferta)

  if (!emOferta) {
    return { emOferta: false, percentualDesconto: 0, precoOriginal: preco, precoComDesconto: preco }
  }

  const percentualDesconto = PERCENTUAIS_DESCONTO[hash % PERCENTUAIS_DESCONTO.length]
  const precoComDesconto = Math.round(preco * (1 - percentualDesconto / 100) * 100) / 100
  return { emOferta: true, percentualDesconto, precoOriginal: preco, precoComDesconto }
}
```
Determinístico por `id` — o mesmo produto está sempre em oferta (ou sempre não está) em qualquer carregamento, sem estado nenhum salvo.

**`app/api/ofertas/route.ts` (novo)** — mesmo padrão de `app/api/categoria/[slug]/route.ts` (usa `carregarProdutos()`, remove `embedding`/`embedding_text` antes de responder):
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
Note que `preco` no objeto retornado **já é o preço com desconto** — o front-end (e o `ProdutoDrawer`, se aberto a partir daqui) trata como preço normal do produto, sem lógica condicional extra. `precoOriginal` e `percentualDesconto` são os campos extras só usados pro badge visual.

**`components/ProductCard.tsx`** ganha um campo opcional em `ProductCardProduto`:
```ts
interface ProductCardProduto {
  id: string
  categoria: string
  produto: string
  corredor: string
  preco: number
  precoOriginal?: number   // presente só quando o produto está em oferta
  estoque: number
  sustentabilidade: SustentabilidadeScore
}
```
No bloco de preço (linha ~93-95 hoje), quando `precoOriginal` existe e é maior que `preco`, mostra o preço original riscado acima do preço com desconto, mais um badge vermelho "-X%" sobre a imagem (mesmo canto/estilo do badge de corredor, mas do lado oposto teria conflito com o botão de carrinho — usar o canto inferior direito, ao lado do botão "Detalhes" quando houver, ou logo acima dele):
```tsx
{produto.precoOriginal && produto.precoOriginal > produto.preco && (
  <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md">
    -{Math.round((1 - produto.preco / produto.precoOriginal) * 100)}%
  </span>
)}
```
(posicionado `top-2 left-2`, canto livre — o badge de corredor já ocupa `bottom-2 left-2`, o botão de carrinho ocupa `top-2 right-2`.)
```tsx
<div className="p-3">
  <h3 className="...">{produto.produto}</h3>
  {produto.precoOriginal && produto.precoOriginal > produto.preco && (
    <p className="text-xs text-gray-400 line-through">
      {produto.precoOriginal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
    </p>
  )}
  <p className="text-base font-black text-lm-dark mb-1.5">
    {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
  </p>
  {/* resto sem mudança */}
```

**`components/OfertasView.tsx` (novo)** — versão enxuta de `CategoriaView.tsx`, sem filtro de complexidade/preço, sem mapa, sem comparador (fora de escopo, seção "Escopo" acima):
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
`produto={produtoDrawer as any}` no `ProdutoDrawer` é o mesmo cast já usado hoje em `CategoriaView.tsx` (o drawer espera o tipo `Produto` completo incluindo `embedding`, mas a API já remove esse campo — wart pré-existente no projeto, não introduzido aqui).

**`app/ofertas/page.tsx` (novo)**, seguindo o mesmo padrão full-width das outras telas de vitrine (`px-4 sm:px-6 lg:px-8`, sem `max-w`, decisão já tomada na sessão anterior sobre largura das telas de navegação):
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

## 5. "Ver todos" na seção de categorias

Dentro de `HomeView.tsx` (seção `{/* Categorias */}`), a grade de categorias (`CATEGORIAS`) perde o item `{ slug: 'todos', label: 'Todos', icon: Grid2x2, ... }` do array (deixa só as 8 categorias reais), e o cabeçalho da seção ganha o link:
```tsx
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
```
Mesmo destino de hoje (`CategoriaView` com `slug: 'todos'`, que a API `/api/categoria/todos` já trata como "sem filtro, todos os produtos" — comportamento inalterado, só muda de onde o clique parte).

## Dark mode

Nenhum elemento novo introduz cor fora da paleta já coberta pelos overrides `.dark` existentes: `HeaderSearch` usa `bg-white/95` sobre o header verde (mesma lógica de opacidade que independe de tema, como os badges do carrossel); o badge de desconto usa `bg-red-600` fixo (cor de alerta, não precisa inverter); o preço riscado usa `text-gray-400`, que já tem tratamento `.dark` genérico. O ícone de conta usa as mesmas classes de texto/hover que os outros itens do header (`text-white/80` etc.), já corretas em qualquer tema porque o header inteiro é verde fixo, independente de tema.

## Testes

Sem framework de testes automatizado. Verificação via `npx tsc --noEmit`, `npm run build` (obrigatório aqui por causa do `useSearchParams`, gotcha já documentado no projeto) e `agent-browser` cobrindo:
- Header em duas linhas aparece corrigido no desktop e mobile (busca sempre visível em ambos).
- Digitar uma busca no header a partir de `/duvidas` (ou qualquer página que não seja a home) navega pra `/` e mostra os resultados corretos, com a seção de busca rolando pra vista.
- Estando já na home com resultados de uma busca anterior na tela, disparar uma busca **diferente** pelo header substitui os resultados corretamente (a mudança de `initialQuery` altera a `key` do `SearchSection`, forçando a remontagem e o novo fetch).
- Ícone de conta leva pra `/conta` quando logado e pra `/funcionario/login` quando deslogado, sem mudança de comportamento além do visual.
- Aba "Ofertas" no menu abre `/ofertas` com produtos com desconto, badge "-X%" e preço riscado visíveis, paginação funcionando, "Detalhes" abre o drawer com o preço já descontado.
- Confirmar que uma busca ou navegação por categoria normal (fora de `/ofertas`) **não** mostra nenhum preço riscado/badge de desconto, mesmo pra um produto que esteja na lista de ofertas.
- "Ver todos" na home abre a mesma tela que o tile "Todos" abria antes.
- Mobile 390×844 e modo escuro em todas as telas tocadas.
