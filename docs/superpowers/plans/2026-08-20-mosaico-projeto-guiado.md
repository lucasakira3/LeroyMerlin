# Mosaico visual do Projeto Guiado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a primeira tela do resultado do Projeto Guiado (hoje uma lista longa de texto) por um mosaico visual agrupado por cômodo, com fotos de produto, mantendo a lista detalhada atual acessível numa segunda aba.

**Architecture:** A IA (`app/api/projeto/route.ts`) passa a devolver um campo `comodo` por item, na mesma chamada que já existe. Um novo componente `components/ProjetoMosaico.tsx` agrupa os itens por cômodo e renderiza fotos de produto (reaproveitando `getImagemCategoria`). `components/ListaDeCompras.tsx` ganha duas abas — "Visão geral" (mosaico) e "Lista completa" (conteúdo atual, inalterado) — e um estado único de `ProdutoDrawer` compartilhado entre as duas.

**Tech Stack:** Next.js 14 App Router, React (client components), TypeScript, Tailwind CSS, Gemini 2.5 Flash (`lib/gemini.ts`), sem framework de testes (verificação via `npx tsc --noEmit`, scripts `tsx` descartáveis, e `agent-browser`).

## Global Constraints

- Sem geração de imagem por IA — o "esboço" é 100% dados estruturados renderizados em HTML/CSS, não uma imagem gerada.
- Sem nova chamada de API — o campo `comodo` é pedido na mesma chamada única que `app/api/projeto/route.ts` já faz ao Gemini.
- Reaproveitar `getImagemCategoria(categoria, id)` (`lib/categoriaImagens.ts`) para as fotos — não criar nenhum asset novo.
- Reaproveitar `ProdutoDrawer` (`components/ProdutoDrawer.tsx`) para a interação de clique — não duplicar a lógica de detalhes/troca de produto/carrinho.
- A aba "Lista completa" deve ser o JSX atual de `ListaDeCompras.tsx` sem mudança de comportamento — mapa, WhatsApp, timeline, agendamento continuam idênticos.
- Sem framework de testes: verificação de lógica pura via script `tsx` temporário (escrito, rodado, apagado); verificação de UI via `npx tsc --noEmit` + `agent-browser`.
- Cores de prioridade seguem o padrão já usado em `ListaDeCompras.tsx` (`essencial` = vermelho, `recomendado` = âmbar, `opcional` = cinza).

---

### Task 1: Campo `comodo` no schema da IA

**Files:**
- Modify: `app/api/projeto/route.ts:17-36`

**Interfaces:**
- Consumes: nada novo
- Produces: cada item do array `itens` retornado por `POST /api/projeto` passa a incluir `comodo: string` (a API já validava o resto do shape via `JSON.parse`, nenhuma validação de schema explícita existe hoje — não adicionar uma agora, fora de escopo).

- [ ] **Step 1: Editar o exemplo de JSON no `PROMPT_SISTEMA`**

Em `app/api/projeto/route.ts`, dentro do array `itens` do exemplo JSON (linhas 17-27), adicionar o campo `comodo` logo após `categoria`:

Texto atual:
```
    {
      "material": "Nome exato do produto para buscar no estoque",
      "categoria": "categoria geral ex: Hidráulica, Pintura, Ferramentas",
      "quantidade": "ex: 2 un., 5L, 12m²",
      "prioridade": "essencial",
      "observacao": "dica rápida de uso",
      "etapa_ordem": 1,
      "etapa_nome": "Nome curto da fase do projeto em que este item é usado, ex: Remoção e preparo"
    }
```

Novo texto:
```
    {
      "material": "Nome exato do produto para buscar no estoque",
      "categoria": "categoria geral ex: Hidráulica, Pintura, Ferramentas",
      "comodo": "Cômodo ou área da casa onde este item é usado, ex: Cozinha, Banheiro, Área externa",
      "quantidade": "ex: 2 un., 5L, 12m²",
      "prioridade": "essencial",
      "observacao": "dica rápida de uso",
      "etapa_ordem": 1,
      "etapa_nome": "Nome curto da fase do projeto em que este item é usado, ex: Remoção e preparo"
    }
```

- [ ] **Step 2: Adicionar a regra do campo `comodo`**

No mesmo arquivo, no bloco "Regras:" (linhas 30-36), adicionar uma linha nova depois de `- prioridade pode ser: essencial, recomendado, opcional`:

Texto atual dessa linha em diante:
```
- prioridade pode ser: essencial, recomendado, opcional
- Focar em produtos que a Leroy Merlin vende
```

Novo texto:
```
- prioridade pode ser: essencial, recomendado, opcional
- comodo é obrigatório em todos os itens. Se o projeto não menciona um cômodo específico para aquele item (ex: elétrica da casa toda, ferramentas gerais que servem para o projeto inteiro), use exatamente "Geral"
- Focar em produtos que a Leroy Merlin vende
```

- [ ] **Step 3: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros (esse arquivo não tem tipagem estática sobre o JSON retornado pela IA, então nada deveria quebrar aqui — a tipagem entra na Task 4).

- [ ] **Step 4: Commit**

```bash
git add app/api/projeto/route.ts
git commit -m "feat: pede campo comodo por item no prompt do projeto guiado"
```

---

### Task 2: Funções puras de agrupamento e seleção

**Files:**
- Create: `components/ProjetoMosaico.tsx` (só os tipos e as duas funções puras nesta task — o componente visual vem na Task 3)

**Interfaces:**
- Consumes: `SearchResult` de `@/types/produto` (já existe)
- Produces (usado pelas Tasks 3 e 4):
  - `interface ItemProjeto { material: string; categoria: string; quantidade: string; prioridade: string; observacao: string; comodo: string; resultados: SearchResult[]; etapa_ordem?: number; etapa_nome?: string }`
  - `interface Projeto { titulo: string; resumo: string; orcamento_estimado: string; complexidade: string; dica_especialista: string; itens: ItemProjeto[] }`
  - `interface GrupoComodo { comodo: string; itens: ItemProjeto[] }`
  - `function agruparPorComodo(itens: ItemProjeto[]): GrupoComodo[]`
  - `function resolverProdutoSelecionado(item: ItemProjeto, selecionados: Set<string>): SearchResult['produto'] | null`

- [ ] **Step 1: Criar o arquivo com os tipos e as duas funções puras**

Criar `components/ProjetoMosaico.tsx`:

```tsx
import type { SearchResult } from '@/types/produto'

export interface ItemProjeto {
  material: string
  categoria: string
  quantidade: string
  prioridade: string
  observacao: string
  comodo: string
  resultados: SearchResult[]
  etapa_ordem?: number
  etapa_nome?: string
}

export interface Projeto {
  titulo: string
  resumo: string
  orcamento_estimado: string
  complexidade: string
  dica_especialista: string
  itens: ItemProjeto[]
}

export interface GrupoComodo {
  comodo: string
  itens: ItemProjeto[]
}

export function agruparPorComodo(itens: ItemProjeto[]): GrupoComodo[] {
  const ordem: string[] = []
  const grupos = new Map<string, ItemProjeto[]>()

  for (const item of itens) {
    const nome = item.comodo || 'Geral'
    if (!grupos.has(nome)) {
      grupos.set(nome, [])
      ordem.push(nome)
    }
    grupos.get(nome)!.push(item)
  }

  const semGeral = ordem.filter(n => n !== 'Geral')
  const ordemFinal = ordem.includes('Geral') ? [...semGeral, 'Geral'] : semGeral

  return ordemFinal.map(nome => ({ comodo: nome, itens: grupos.get(nome)! }))
}

export function resolverProdutoSelecionado(
  item: ItemProjeto,
  selecionados: Set<string>
): SearchResult['produto'] | null {
  const selecionado = item.resultados.find(r => selecionados.has(r.produto.id))
  if (selecionado) return selecionado.produto
  return item.resultados[0]?.produto ?? null
}
```

- [ ] **Step 2: Escrever script temporário de verificação**

Criar `_tmp_agrupar.ts` na raiz do projeto:

```ts
import { agruparPorComodo, resolverProdutoSelecionado, type ItemProjeto } from './components/ProjetoMosaico'
import type { SearchResult } from './types/produto'

function produtoFake(id: string): SearchResult['produto'] {
  return {
    id,
    categoria: 'Ferramentas',
    produto: `Produto ${id}`,
    pergunta: '',
    resposta_ia: '',
    corredor: 'Corredor 01',
    corredor_normalizado: 'corredor-01',
    complexidade: 'DIY',
    especificacoes: '',
    tags: [],
    estoque: 5,
    preco: 10,
    sustentabilidade: 'Bronze',
  } as SearchResult['produto']
}

function itemFake(comodo: string, id: string): ItemProjeto {
  return {
    material: `Material ${id}`,
    categoria: 'Ferramentas',
    quantidade: '1 un.',
    prioridade: 'essencial',
    observacao: '',
    comodo,
    resultados: [{ produto: produtoFake(id), score: 1 }],
  }
}

// Teste 1: agrupamento preserva ordem de primeira aparição, "Geral" sempre por último
const itens = [
  itemFake('Cozinha', 'A'),
  itemFake('Geral', 'B'),
  itemFake('Banheiro', 'C'),
  itemFake('Cozinha', 'D'),
]
const grupos = agruparPorComodo(itens)
const ordemObtida = grupos.map(g => g.comodo)
console.assert(
  JSON.stringify(ordemObtida) === JSON.stringify(['Cozinha', 'Banheiro', 'Geral']),
  `FALHOU teste 1: esperado [Cozinha, Banheiro, Geral], obtido ${JSON.stringify(ordemObtida)}`
)
console.assert(
  grupos.find(g => g.comodo === 'Cozinha')!.itens.length === 2,
  'FALHOU teste 1b: Cozinha deveria ter 2 itens'
)

// Teste 2: resolverProdutoSelecionado respeita o Set de selecionados
const itemComOpcoes: ItemProjeto = {
  material: 'Item com opções',
  categoria: 'Ferramentas',
  quantidade: '1 un.',
  prioridade: 'essencial',
  observacao: '',
  comodo: 'Geral',
  resultados: [
    { produto: produtoFake('X'), score: 1 },
    { produto: produtoFake('Y'), score: 0.8 },
  ],
}
const selecionadoY = resolverProdutoSelecionado(itemComOpcoes, new Set(['Y']))
console.assert(selecionadoY?.id === 'Y', `FALHOU teste 2: esperado Y, obtido ${selecionadoY?.id}`)

// Teste 3: fallback para o primeiro resultado quando nada está no Set
const fallback = resolverProdutoSelecionado(itemComOpcoes, new Set(['nao-existe']))
console.assert(fallback?.id === 'X', `FALHOU teste 3: esperado X (fallback), obtido ${fallback?.id}`)

console.log('Todos os testes passaram (se não apareceu nenhuma linha "FALHOU" acima).')
```

- [ ] **Step 3: Rodar o script e verificar que passa**

Run: `npx tsx _tmp_agrupar.ts`
Expected: só a linha `Todos os testes passaram (se não apareceu nenhuma linha "FALHOU" acima).` — nenhuma linha começando com `FALHOU`.

- [ ] **Step 4: Apagar o script temporário**

```bash
rm _tmp_agrupar.ts
```

- [ ] **Step 5: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add components/ProjetoMosaico.tsx
git commit -m "feat: funcoes puras de agrupamento por comodo do projeto guiado"
```

---

### Task 3: Componente visual `ProjetoMosaico`

**Files:**
- Modify: `components/ProjetoMosaico.tsx` (adicionar o componente React por cima dos tipos/funções da Task 2)
- Create temporário (apagado no final da task): `app/_mosaico-preview/page.tsx`

**Interfaces:**
- Consumes: `agruparPorComodo`, `resolverProdutoSelecionado`, `ItemProjeto` (Task 2, mesmo arquivo); `getImagemCategoria` de `@/lib/categoriaImagens`; `Badge` de `./ui/Badge`; `Card` de `./ui/Card`; `carregarProdutos` de `@/lib/produtos` (só no preview temporário)
- Produces (usado pela Task 4): `export default function ProjetoMosaico(props: { itens: ItemProjeto[]; selecionados: Set<string>; onSelecionarProduto: (produto: SearchResult['produto']) => void }): JSX.Element`

- [ ] **Step 1: Adicionar o componente ao final de `components/ProjetoMosaico.tsx`**

Adicionar ao final do arquivo (depois de `resolverProdutoSelecionado`), com os imports novos no topo do arquivo:

Import a adicionar no topo (junto do import de `SearchResult` já existente):
```tsx
import { getImagemCategoria } from '@/lib/categoriaImagens'
import Badge from './ui/Badge'
```

Código a adicionar no final do arquivo:
```tsx
const PRIORIDADE_ANEL: Record<string, string> = {
  essencial: 'ring-red-400',
  recomendado: 'ring-amber-400',
  opcional: 'ring-gray-300',
}

const MAX_FOTOS_VISIVEIS = 6

interface ProjetoMosaicoProps {
  itens: ItemProjeto[]
  selecionados: Set<string>
  onSelecionarProduto: (produto: SearchResult['produto']) => void
  onVerMais?: () => void
}

export default function ProjetoMosaico({ itens, selecionados, onSelecionarProduto, onVerMais }: ProjetoMosaicoProps) {
  const grupos = agruparPorComodo(itens)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {grupos.map(grupo => {
        const produtosDoGrupo = grupo.itens
          .map(item => ({ item, produto: resolverProdutoSelecionado(item, selecionados) }))
          .filter((x): x is { item: ItemProjeto; produto: SearchResult['produto'] } => x.produto !== null)

        const visiveis = produtosDoGrupo.slice(0, MAX_FOTOS_VISIVEIS)
        const restantes = produtosDoGrupo.length - visiveis.length

        return (
          <Card key={grupo.comodo} padding="sm">
            <p className="text-sm font-bold text-gray-900 mb-3">{grupo.comodo}</p>
            <div className="grid grid-cols-3 gap-2">
              {visiveis.map(({ item, produto }) => (
                <button
                  key={produto.id}
                  onClick={() => onSelecionarProduto(produto)}
                  className="text-left"
                >
                  <div className={`relative aspect-square rounded-lg overflow-hidden ring-2 ${PRIORIDADE_ANEL[item.prioridade] || 'ring-gray-200'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getImagemCategoria(produto.categoria, produto.id)}
                      alt={produto.categoria}
                      className="w-full h-full object-cover"
                    />
                    {produto.estoque === 0 && (
                      <span className="absolute top-1 right-1">
                        <Badge tone="red" className="px-1.5 py-0.5 text-[9px]">Sem estoque</Badge>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-gray-700 mt-1 truncate">
                    {produto.preco != null
                      ? Number(produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : ''}
                  </p>
                </button>
              ))}
              {restantes > 0 && (
                <button
                  onClick={onVerMais}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-400 hover:border-lm-green hover:text-lm-green transition-colors"
                >
                  +{restantes}
                </button>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Criar página temporária de preview**

Criar `app/_mosaico-preview/page.tsx`:

```tsx
import { carregarProdutos } from '@/lib/produtos'
import PreviewClient from './PreviewClient'

export default async function MosaicoPreviewPage() {
  const produtos = await carregarProdutos()
  const porCategoria = (categoria: string, n: number) =>
    produtos.filter(p => p.categoria === categoria).slice(0, n)

  const cozinha = porCategoria('Pisos e Cerâmica', 3)
  const banheiro = porCategoria('Hidráulica', 8)
  const geral = porCategoria('Ferramentas', 2)

  const itens = [
    ...cozinha.map((p, i) => ({
      material: p.produto, categoria: p.categoria, quantidade: '1 un.',
      prioridade: i === 0 ? 'essencial' : 'recomendado', observacao: '', comodo: 'Cozinha',
      resultados: [{ produto: p, score: 1 }],
    })),
    ...banheiro.map((p, i) => ({
      material: p.produto, categoria: p.categoria, quantidade: '1 un.',
      prioridade: i === 0 ? 'essencial' : 'opcional', observacao: '', comodo: 'Banheiro',
      resultados: [{ produto: p, score: 1 }],
    })),
    ...geral.map(p => ({
      material: p.produto, categoria: p.categoria, quantidade: '1 un.',
      prioridade: 'essencial', observacao: '', comodo: 'Geral',
      resultados: [{ produto: p, score: 1 }],
    })),
  ]

  return <PreviewClient itens={itens as any} />
}
```

Criar `app/_mosaico-preview/PreviewClient.tsx`:

```tsx
'use client'

import { useState } from 'react'
import ProjetoMosaico, { type ItemProjeto } from '@/components/ProjetoMosaico'
import ProdutoDrawer from '@/components/ProdutoDrawer'
import type { SearchResult } from '@/types/produto'

export default function PreviewClient({ itens }: { itens: ItemProjeto[] }) {
  const [drawer, setDrawer] = useState<SearchResult['produto'] | null>(null)
  const selecionados = new Set(itens.map(i => i.resultados[0].produto.id))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ProjetoMosaico itens={itens} selecionados={selecionados} onSelecionarProduto={setDrawer} />
      <ProdutoDrawer produto={drawer} onClose={() => setDrawer(null)} />
    </div>
  )
}
```

- [ ] **Step 4: Subir o servidor de dev e conferir visualmente**

Run: `npm run dev` (em background)
Then use `agent-browser` para navegar até `http://localhost:3000/_mosaico-preview`, tirar um screenshot, e confirmar:
- 3 cards de cômodo aparecem: "Cozinha", "Banheiro", "Geral" — nessa ordem (Geral por último)
- Card "Banheiro" mostra 6 fotos + um tile "+2" (tem 8 itens, `MAX_FOTOS_VISIVEIS = 6`)
- Clicar numa foto abre o `ProdutoDrawer`
- Fotos dentro do mesmo cômodo mostram categorias diferentes de imagem quando o produto muda (variedade do `getImagemCategoria`)

Expected: mosaico renderiza sem erro no console, comportamento acima confirmado.

- [ ] **Step 5: Apagar a página de preview temporária**

```bash
rm -rf app/_mosaico-preview
```

Parar o servidor de dev (`TaskStop` na task do `npm run dev`, depois confirmar porta 3000 livre com `netstat -ano | grep ":3000" | grep LISTENING` — se algo aparecer, `taskkill //PID <pid> //F`, gotcha conhecido deste projeto).

- [ ] **Step 6: Rodar type-check final**

Run: `npx tsc --noEmit`
Expected: sem erros (a pasta de preview já foi removida, não deve sobrar nenhuma referência).

- [ ] **Step 7: Commit**

```bash
git add components/ProjetoMosaico.tsx
git commit -m "feat: componente visual do mosaico de comodos do projeto guiado"
```

---

### Task 4: Integrar o mosaico em `ListaDeCompras.tsx` com abas

**Files:**
- Modify: `components/ListaDeCompras.tsx`

**Interfaces:**
- Consumes: `Projeto`, `ItemProjeto` de `./ProjetoMosaico` (Task 2); `ProjetoMosaico` (default export, Task 3); `ProdutoDrawer` de `./ProdutoDrawer` (já existe no projeto)
- Produces: nada novo (é o ponto final de integração)

- [ ] **Step 1: Trocar a interface `Projeto` local pelo import compartilhado**

Substituir em `components/ListaDeCompras.tsx`, o bloco de imports (linhas 1-12):

Texto atual:
```tsx
'use client'

import { useState } from 'react'
import { MapPin, CheckCircle2, Circle, Map, ShoppingBag, Lightbulb, CalendarCheck, ChevronDown, ChevronUp, X, Share2, AlertTriangle } from 'lucide-react'
import StoreMap from './StoreMap'
import ProjetoTimeline from './ProjetoTimeline'
import type { SearchResult } from '@/types/produto'
import Link from 'next/link'
import Card from './ui/Card'
import Button from './ui/Button'
import Badge from './ui/Badge'
import { codificarLista } from '@/lib/listaCompartilhada'
```

Novo texto:
```tsx
'use client'

import { useState } from 'react'
import { MapPin, CheckCircle2, Circle, Map, ShoppingBag, Lightbulb, CalendarCheck, ChevronDown, ChevronUp, X, Share2, AlertTriangle } from 'lucide-react'
import StoreMap from './StoreMap'
import ProjetoTimeline from './ProjetoTimeline'
import ProjetoMosaico, { type Projeto } from './ProjetoMosaico'
import ProdutoDrawer from './ProdutoDrawer'
import type { SearchResult } from '@/types/produto'
import Link from 'next/link'
import Card from './ui/Card'
import Button from './ui/Button'
import Badge from './ui/Badge'
import { codificarLista } from '@/lib/listaCompartilhada'
```

- [ ] **Step 2: Remover a interface `Projeto` local**

Remover o bloco (linhas 27-43 do arquivo original):

Texto a remover:
```tsx
interface Projeto {
  titulo: string
  resumo: string
  orcamento_estimado: string
  complexidade: string
  dica_especialista: string
  itens: Array<{
    material: string
    categoria: string
    quantidade: string
    prioridade: string
    observacao: string
    resultados: SearchResult[]
    etapa_ordem?: number
    etapa_nome?: string
  }>
}

```

(o `Projeto` importado na Task 2 já cobre exatamente esse shape, incluindo o campo `comodo` novo — a Task 1 garante que a API sempre o envia).

- [ ] **Step 3: Adicionar estado de aba e de drawer**

Localizar a linha (dentro de `export default function ListaDeCompras`):
```tsx
  const [linkCopiado, setLinkCopiado] = useState(false)
```

Substituir por:
```tsx
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [aba, setAba] = useState<'visao-geral' | 'lista-completa'>('visao-geral')
  const [produtoDrawer, setProdutoDrawer] = useState<SearchResult['produto'] | null>(null)
```

- [ ] **Step 4: Remover o parágrafo de resumo do header**

Texto atual:
```tsx
            <p className="text-white/80 text-sm mb-3">{projeto.resumo}</p>
            <div className="flex flex-wrap gap-2">
```

Novo texto:
```tsx
            <div className="flex flex-wrap gap-2">
```

- [ ] **Step 5: Inserir as abas e envolver o conteúdo existente**

Localizar o trecho que fecha o header verde e abre o layout de duas colunas:

Texto atual:
```tsx
        {projeto.dica_especialista && (
          <div className="mt-4 bg-lm-yellow/20 border border-lm-yellow/40 rounded-xl p-3 flex items-start gap-2">
            <Lightbulb size={14} className="text-lm-yellow flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/90">
              <span className="font-bold text-lm-yellow">Dica: </span>{projeto.dica_especialista}
            </p>
          </div>
        )}
      </div>

      {/* Layout 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
```

Novo texto:
```tsx
        {projeto.dica_especialista && (
          <div className="mt-4 bg-lm-yellow/20 border border-lm-yellow/40 rounded-xl p-3 flex items-start gap-2">
            <Lightbulb size={14} className="text-lm-yellow flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/90">
              <span className="font-bold text-lm-yellow">Dica: </span>{projeto.dica_especialista}
            </p>
          </div>
        )}
      </div>

      {/* Abas */}
      <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
        <button
          type="button"
          onClick={() => setAba('visao-geral')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            aba === 'visao-geral' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Visão geral
        </button>
        <button
          type="button"
          onClick={() => setAba('lista-completa')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            aba === 'lista-completa' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Lista completa
        </button>
      </div>

      {aba === 'visao-geral' && (
        <ProjetoMosaico
          itens={projeto.itens}
          selecionados={selecionados}
          onSelecionarProduto={setProdutoDrawer}
          onVerMais={() => setAba('lista-completa')}
        />
      )}

      {aba === 'lista-completa' && (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
```

Note: a última linha do "Novo texto" (`<div className="grid grid-cols-1 lg:grid-cols-5 gap-5">`) intencionalmente NÃO fecha o JSX condicional ainda — isso é feito no Step 6, no fim do bloco.

- [ ] **Step 6: Fechar o bloco condicional da aba "Lista completa" e adicionar o drawer**

Texto atual (fim do arquivo):
```tsx
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

Novo texto:
```tsx
            )}
          </div>
        </div>
      </div>
      )}

      <ProdutoDrawer produto={produtoDrawer} onClose={() => setProdutoDrawer(null)} />
    </div>
  )
}
```

- [ ] **Step 7: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros. Se aparecer erro sobre `descricaoOriginal` não usado ou tipo de `Projeto` divergente, conferir que o import da Task 2 (`Projeto` de `./ProjetoMosaico`) tem exatamente os mesmos campos que `ProjetoWizard.tsx` já envia como `resultado` (nenhuma mudança esperada ali, já que a Task 1 só adicionou um campo a mais no JSON da API, e a Task 2 já espelha esse shape).

- [ ] **Step 8: Verificação manual do toggle de abas**

Run: `npm run dev` (background), depois via `agent-browser`:
1. Ir em `/projeto`, clicar num dos exemplos prontos (ex: "Preciso pintar sala e dois quartos, apartamento de 70m²")
2. Esperar o resultado carregar — confirmar que abre direto na aba "Visão geral" com o mosaico
3. Clicar em "Lista completa" — confirmar que aparece a lista de materiais + mapa + botões de WhatsApp/agendamento exatamente como antes
4. Clicar de volta em "Visão geral" — confirmar que os produtos selecionados na lista completa (se algum foi trocado) continuam refletidos no mosaico
5. Clicar numa foto no mosaico — confirmar que abre o `ProdutoDrawer` com os dados corretos do produto

Parar o servidor de dev ao final (mesmo cuidado de porta 3000 da Task 3, Step 5).

- [ ] **Step 9: Commit**

```bash
git add components/ListaDeCompras.tsx
git commit -m "feat: abas Visao geral (mosaico) e Lista completa no resultado do projeto guiado"
```

---

### Task 5: Verificação final ponta a ponta

**Files:** nenhum arquivo novo — esta task só executa a aplicação e confirma os cenários do documento de spec (`docs/superpowers/specs/2026-08-20-mosaico-projeto-guiado-design.md`, seção "Testes"). Se algum cenário falhar, corrigir no arquivo relevante (`app/api/projeto/route.ts`, `components/ProjetoMosaico.tsx` ou `components/ListaDeCompras.tsx`) antes de considerar a task concluída.

**Interfaces:**
- Consumes: fluxo completo já integrado nas Tasks 1-4
- Produces: nada novo

- [ ] **Step 1: Subir o servidor de dev**

Run: `npm run dev` (background). Confirmar porta 3000 respondendo antes de prosseguir (`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` deve retornar `200`).

- [ ] **Step 2: Cenário multi-cômodo**

Via `agent-browser`, em `/projeto`, usar o exemplo "Reforma completa da cozinha, troca de piso e azulejo" (ou digitar uma descrição própria que cite mais de um cômodo, ex: "Quero reformar a cozinha e o banheiro da minha casa").
Expected: mosaico mostra pelo menos 2 cards de cômodo diferentes (ex: "Cozinha" e algum outro citado), cada um com fotos de produto reais.

- [ ] **Step 3: Cenário cômodo único**

Usar o exemplo "Quero reformar meu banheiro pequeno com orçamento de R$ 3.000".
Expected: mosaico mostra 1 card só ("Banheiro" ou equivalente), grid não quebra com um único card (ocupa a largura disponível normalmente).

- [ ] **Step 4: Cenário sem cômodo claro (bucket "Geral")**

Usar o exemplo "Preciso trocar toda a parte elétrica de uma casa de 80m²".
Expected: aparece um card "Geral" (a IA não deveria conseguir associar um cômodo específico a itens de elétrica de casa inteira). Se a IA devolver cômodos específicos mesmo assim (ex: "Sala", "Quarto"), isso é aceitável — o requisito é que o fallback "Geral" funcione quando a IA de fato não identificar um cômodo, não que esse prompt específico sempre produza "Geral".

- [ ] **Step 5: Responsividade mobile**

Via `agent-browser set viewport` para 390×844 (mesmo viewport já usado no resto do projeto, ver `[[project-backlog]]`), repetir o cenário do Step 2.
Expected: cards de cômodo empilham em 1 coluna, fotos dentro do card continuam em grid de 3 colunas sem overflow horizontal, abas continuam clicáveis e legíveis.

- [ ] **Step 6: Modo escuro**

Voltar ao viewport padrão, ativar o modo escuro pelo `ThemeToggle` (botão sol/lua no `NavBar`, ver `[[project-backlog]]`) e repetir o cenário do Step 2.
Expected: cards de cômodo, anéis de prioridade e badge "Sem estoque" continuam legíveis (sem texto escuro sobre fundo escuro nem fundo branco "vazando") — o mosaico só usa `Card`/`Badge` e classes Tailwind (`bg-gray-100`, `text-gray-900` etc.) já cobertas pelos overrides `.dark` centralizados em `app/globals.css`, então não deveria precisar de nenhum ajuste novo; se algo estiver ilegível, adicionar a classe que falta seguindo o padrão existente nesse arquivo antes de prosseguir.

- [ ] **Step 7: Parar o servidor e confirmar porta livre**

```bash
netstat -ano | grep ":3000" | grep LISTENING
```
Se retornar algo, `taskkill //PID <pid> //F`. Expected ao final: nenhuma saída.

- [ ] **Step 8: Rodar build completo (não só tsc)**

Run: `npm run build`
Expected: build conclui sem erro (cobre qualquer problema que só apareça em build de produção, ex: componente Server/Client mal separado — não deveria haver nenhum aqui já que a Task 3 apagou o preview que usava Server Component, mas vale confirmar).

Depois do build: `rm -rf .next` e `npm run dev` de novo se for continuar testando manualmente (gotcha conhecido de cache misto entre build e dev, ver `[[project-dev-workflow]]`).
