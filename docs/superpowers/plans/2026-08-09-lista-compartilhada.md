# Compartilhar Lista de Materiais por Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir copiar um link que, sem backend, reproduz a lista de materiais selecionada (mapa + itens) para qualquer pessoa que abrir, sem precisar de login.

**Architecture:** Módulo puro `lib/listaCompartilhada.ts` codifica/decodifica os dados na própria URL (base64). Módulo `lib/produtosCliente.ts` centraliza a resolução de produtos por ID via `/api/produto/[id]` (hoje duplicada em `/conta` e `/carrinho`). Novo botão em `ListaDeCompras.tsx` gera e copia o link. Nova rota `/lista` (server component + `Suspense`) decodifica o parâmetro e renderiza uma visão somente-leitura reaproveitando `StoreMap`.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, `lucide-react`, `next/navigation` (`useSearchParams`), Web Clipboard API.

## Global Constraints

- Sem persistência server-side — os dados da lista viajam inteiros na URL.
- `decodificarLista` nunca lança exceção — qualquer entrada inválida retorna `null`.
- IDs de produto que não existem mais na base são descartados silenciosamente (mesmo comportamento já usado para favoritos/histórico órfãos em `/conta`).
- `useSearchParams()` precisa estar dentro de um `<Suspense>` (exigência do Next.js App Router) para não quebrar `npm run build`.
- Sem botão "adicionar tudo ao carrinho" — o `StoreMap` já permite adicionar item a item (feature já existente).

---

### Task 1: Módulo `lib/listaCompartilhada.ts`

**Files:**
- Create: `lib/listaCompartilhada.ts`
- Test: script temporário `scratch-test-lista.ts` (escrito, rodado, apagado)

**Interfaces:**
- Consumes: nada
- Produces:
  - `interface ListaCompartilhadaDados { titulo: string; loja: string; produtoIds: string[] }`
  - `codificarLista(dados: ListaCompartilhadaDados): string`
  - `decodificarLista(codificado: string): ListaCompartilhadaDados | null`

- [ ] **Step 1: Criar `lib/listaCompartilhada.ts`**

```ts
export interface ListaCompartilhadaDados {
  titulo: string
  loja: string
  produtoIds: string[]
}

export function codificarLista(dados: ListaCompartilhadaDados): string {
  const json = JSON.stringify(dados)
  return btoa(unescape(encodeURIComponent(json)))
}

export function decodificarLista(codificado: string): ListaCompartilhadaDados | null {
  try {
    const json = decodeURIComponent(escape(atob(codificado)))
    const dados = JSON.parse(json)
    if (
      !dados ||
      typeof dados.titulo !== 'string' ||
      typeof dados.loja !== 'string' ||
      !Array.isArray(dados.produtoIds) ||
      !dados.produtoIds.every((id: unknown) => typeof id === 'string')
    ) {
      return null
    }
    return dados
  } catch {
    return null
  }
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `lib/listaCompartilhada.ts`

- [ ] **Step 3: Escrever script de verificação lógica temporário**

Create: `scratch-test-lista.ts` na raiz:

```ts
import { codificarLista, decodificarLista } from './lib/listaCompartilhada'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error('FALHOU: ' + msg)
  console.log('OK:', msg)
}

const original = { titulo: 'Reforma do banheiro', loja: 'Interlagos — São Paulo/SP', produtoIds: ['LM-0001', 'LM-0032'] }
const codificado = codificarLista(original)
const decodificado = decodificarLista(codificado)

assert(decodificado !== null, 'decodifica sem erro')
assert(decodificado?.titulo === original.titulo, 'título preservado (com acento)')
assert(decodificado?.loja === original.loja, 'loja preservada (com acento e travessão)')
assert(JSON.stringify(decodificado?.produtoIds) === JSON.stringify(original.produtoIds), 'produtoIds preservados')

assert(decodificarLista('isso não é base64 válido!!!') === null, 'string inválida retorna null')
assert(decodificarLista(btoa(JSON.stringify({ titulo: 'x' }))) === null, 'JSON válido mas faltando campos retorna null')
assert(decodificarLista(btoa(JSON.stringify({ titulo: 'x', loja: 'y', produtoIds: 'não é array' }))) === null, 'produtoIds não-array retorna null')

console.log('Todos os testes passaram.')
```

- [ ] **Step 4: Rodar e verificar saída**

Run: `npx tsx scratch-test-lista.ts`
Expected: todas as linhas `OK:` impressas, terminando em `Todos os testes passaram.`

- [ ] **Step 5: Apagar o script temporário**

Run: `rm scratch-test-lista.ts`

- [ ] **Step 6: Commit**

```bash
git add lib/listaCompartilhada.ts
git commit -m "feat: modulo de codificacao/decodificacao de lista compartilhada"
```

---

### Task 2: Módulo `lib/produtosCliente.ts` e refatoração de `/conta` e `/carrinho`

**Files:**
- Create: `lib/produtosCliente.ts`
- Modify: `app/conta/page.tsx`
- Modify: `app/carrinho/page.tsx`

**Interfaces:**
- Consumes: rota existente `GET /api/produto/[id]`, `type SearchResult` de `@/types/produto`
- Produces:
  - `type ProdutoResolvido = SearchResult['produto']`
  - `buscarProdutosPorIds(ids: string[]): Promise<ProdutoResolvido[]>`

- [ ] **Step 1: Criar `lib/produtosCliente.ts`**

```ts
import type { SearchResult } from '@/types/produto'

export type ProdutoResolvido = SearchResult['produto']

export async function buscarProdutosPorIds(ids: string[]): Promise<ProdutoResolvido[]> {
  const respostas = await Promise.all(
    ids.map(async (id) => {
      const resposta = await fetch(`/api/produto/${id}`)
      if (!resposta.ok) return null
      return (await resposta.json()) as ProdutoResolvido
    })
  )
  return respostas.filter((p): p is ProdutoResolvido => p !== null)
}
```

- [ ] **Step 2: Atualizar `app/conta/page.tsx` para usar o módulo compartilhado**

Substituir a função local `buscarProdutos` (que hoje faz `fetch` diretamente) por uma que delega ao módulo compartilhado. Trocar:

```ts
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
```

por:

```ts
async function buscarProdutos(ids: string[]): Promise<SearchResult[]> {
  const produtos = await buscarProdutosPorIds(ids)
  return produtos.map((produto) => ({ produto, score: 1 }))
}
```

E adicionar o import no topo do arquivo (junto aos demais imports de `@/lib/...`):

```ts
import { buscarProdutosPorIds } from '@/lib/produtosCliente'
```

- [ ] **Step 3: Atualizar `app/carrinho/page.tsx` para usar o módulo compartilhado**

Remover o `type ProdutoResolvido = SearchResult['produto']` local e a função `buscarProdutos` que faz `fetch` diretamente:

```ts
type ProdutoResolvido = SearchResult['produto']

async function buscarProdutos(ids: string[]): Promise<Record<string, ProdutoResolvido>> {
  const respostas = await Promise.all(
    ids.map(async (id) => {
      const resposta = await fetch(`/api/produto/${id}`)
      if (!resposta.ok) return null
      const produto = await resposta.json()
      return produto as ProdutoResolvido
    })
  )
  const mapa: Record<string, ProdutoResolvido> = {}
  for (const p of respostas) {
    if (p) mapa[p.id] = p
  }
  return mapa
}
```

Substituir por:

```ts
async function buscarProdutos(ids: string[]): Promise<Record<string, ProdutoResolvido>> {
  const produtos = await buscarProdutosPorIds(ids)
  const mapa: Record<string, ProdutoResolvido> = {}
  for (const p of produtos) mapa[p.id] = p
  return mapa
}
```

E trocar o import de `type SearchResult` (que ainda é necessário para outros usos no arquivo) para também importar do módulo compartilhado:

```ts
import { buscarProdutosPorIds, type ProdutoResolvido } from '@/lib/produtosCliente'
```

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros relacionados a `lib/produtosCliente.ts`, `app/conta/page.tsx` ou `app/carrinho/page.tsx`

- [ ] **Step 5: Commit**

```bash
git add lib/produtosCliente.ts app/conta/page.tsx app/carrinho/page.tsx
git commit -m "refactor: extrai resolucao de produtos por ID para lib/produtosCliente"
```

---

### Task 3: Botão "Copiar link" em `ListaDeCompras.tsx`

**Files:**
- Modify: `components/ListaDeCompras.tsx`

**Interfaces:**
- Consumes: `codificarLista` de `lib/listaCompartilhada.ts` (Task 1)
- Produces: nada novo

- [ ] **Step 1: Adicionar import**

`Share2` já está importado em `components/ListaDeCompras.tsx` (linha 4) mas não é usado em nenhum lugar do arquivo — vai ser reaproveitado no novo botão. Adicionar apenas:

```tsx
import { codificarLista } from '@/lib/listaCompartilhada'
```

- [ ] **Step 2: Adicionar estado de feedback**

Junto aos outros `useState` no início do componente (perto de `const [mapaAberto, setMapaAberto] = useState(false)`):

```tsx
  const [linkCopiado, setLinkCopiado] = useState(false)
```

- [ ] **Step 3: Adicionar a função de copiar link**

Logo após a função `compartilharWhatsApp` existente:

```tsx
  async function copiarLink() {
    const url = `${window.location.origin}/lista?d=${encodeURIComponent(
      codificarLista({ titulo: projeto.titulo, loja, produtoIds: mapResultados.map(r => r.produto.id) })
    )}`
    await navigator.clipboard.writeText(url)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 1500)
  }
```

- [ ] **Step 4: Adicionar o botão no JSX**

No bloco `<div className="flex-shrink-0 flex flex-col gap-2 items-end">`, logo depois do botão `onClick={compartilharWhatsApp}` (fecha em `</button>` seguido de `</div>` que fecha esse container):

```tsx
            <button
              onClick={compartilharWhatsApp}
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-black text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              {/* WhatsApp icon */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Compartilhar lista
            </button>
            <button
              onClick={copiarLink}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              <Share2 size={14} />
              {linkCopiado ? 'Link copiado ✓' : 'Copiar link'}
            </button>
```

- [ ] **Step 5: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `components/ListaDeCompras.tsx`

- [ ] **Step 6: Commit**

```bash
git add components/ListaDeCompras.tsx
git commit -m "feat: botao de copiar link compartilhavel na lista de materiais"
```

---

### Task 4: Página `/lista`

**Files:**
- Create: `components/ListaCompartilhadaView.tsx`
- Create: `app/lista/page.tsx`

**Interfaces:**
- Consumes:
  - `decodificarLista` de `lib/listaCompartilhada.ts` (Task 1)
  - `buscarProdutosPorIds`, `type ProdutoResolvido` de `lib/produtosCliente.ts` (Task 2)
  - `StoreMap` de `components/StoreMap.tsx` (já existente, prop `resultados: SearchResult[]`, `loja: string`, `totalEstimado?: number`, sem `onSelect`)
  - `PageHeader` de `components/ui/PageHeader`, `Button` de `components/ui/Button`, `Card` de `components/ui/Card`
- Produces: rota `/lista`

- [ ] **Step 1: Criar `components/ListaCompartilhadaView.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import StoreMap from '@/components/StoreMap'
import { decodificarLista } from '@/lib/listaCompartilhada'
import { buscarProdutosPorIds } from '@/lib/produtosCliente'
import type { SearchResult } from '@/types/produto'

export default function ListaCompartilhadaView() {
  const searchParams = useSearchParams()
  const d = searchParams.get('d')

  const [carregando, setCarregando] = useState(true)
  const [resultados, setResultados] = useState<SearchResult[]>([])
  const dados = d ? decodificarLista(d) : null

  useEffect(() => {
    if (!dados) {
      setCarregando(false)
      return
    }
    buscarProdutosPorIds(dados.produtoIds).then((produtos) => {
      setResultados(produtos.map((produto) => ({ produto, score: 1 })))
      setCarregando(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d])

  if (!dados) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-xl mx-auto px-4 py-10">
          <Card className="text-center">
            <p className="text-sm text-gray-600 mb-4">Este link parece inválido ou incompleto.</p>
            <Link href="/"><Button variant="primary">Ir para a home</Button></Link>
          </Card>
        </div>
      </main>
    )
  }

  const totalEstimado = resultados.reduce((soma, r) => soma + r.produto.preco, 0)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <PageHeader title={dados.titulo} description={dados.loja} />

        <Card className="mb-5 flex items-start gap-2 bg-lm-green/5 border-lm-green/20">
          <ShoppingBag size={15} className="text-lm-green flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600">
            Lista de materiais compartilhada por um cliente Leroy Merlin — clique num produto no mapa para localizá-lo ou adicione ao seu carrinho.
          </p>
        </Card>

        {carregando && <p className="text-sm text-gray-400">Carregando...</p>}

        {!carregando && resultados.length === 0 && (
          <Card className="text-center py-10">
            <p className="text-sm text-gray-500">Os produtos desta lista não estão mais disponíveis.</p>
          </Card>
        )}

        {!carregando && resultados.length > 0 && (
          <StoreMap resultados={resultados} loja={dados.loja} totalEstimado={totalEstimado} />
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Criar `app/lista/page.tsx`**

```tsx
import { Suspense } from 'react'
import ListaCompartilhadaView from '@/components/ListaCompartilhadaView'

export default function ListaCompartilhadaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ListaCompartilhadaView />
    </Suspense>
  )
}
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `components/ListaCompartilhadaView.tsx` ou `app/lista/page.tsx`

- [ ] **Step 4: Commit**

```bash
git add components/ListaCompartilhadaView.tsx app/lista/page.tsx
git commit -m "feat: pagina de lista de materiais compartilhada por link"
```

---

### Task 5: Verificação manual end-to-end

**Files:** nenhum

**Interfaces:**
- Consumes: app rodando localmente (`npm run dev`)
- Produces: confirmação visual do fluxo completo

- [ ] **Step 1: Subir o dev server limpo**

Run: `rm -rf .next && npm run dev` (em background)

- [ ] **Step 2: Gerar uma lista e copiar o link**

Via `agent-browser`: ir em "Projeto Guiado", descrever um projeto simples, esperar a lista de materiais ser gerada, clicar "Copiar link", confirmar feedback "Link copiado ✓". Ler o valor copiado via `navigator.clipboard.readText()` (ou capturar a URL construída via `eval` inspecionando o estado, já que o clipboard real pode não estar acessível no ambiente do agente — alternativa: interceptar chamando a função `codificarLista` diretamente no console com os mesmos dados para reconstruir a URL).

- [ ] **Step 3: Abrir o link como "outra pessoa"**

Abrir a URL copiada em uma nova sessão do `agent-browser` (`--session outra-pessoa`, sem estado de login) e confirmar que o título, loja, mapa e lista de produtos aparecem corretamente.

- [ ] **Step 4: Adicionar item ao carrinho a partir da página compartilhada**

Clicar no botão de carrinho de um item na legenda (já existente no `StoreMap`), confirmar que o contador do ícone no header dessa sessão vai para 1.

- [ ] **Step 5: Testar link inválido**

Abrir `/lista` sem parâmetro `d` e `/lista?d=abcnaoehbase64valido`, confirmar a mensagem "Este link parece inválido ou incompleto." em ambos os casos, sem crash/erro no console.

- [ ] **Step 6: Modo escuro**

Repetir a visualização da página `/lista` com uma lista válida em dark mode, conferir contraste do card informativo e do `StoreMap`.

- [ ] **Step 7: Confirmar que `/conta` e `/carrinho` continuam funcionando após a refatoração da Task 2**

Repetir rapidamente: favoritos/histórico em `/conta` carregam normalmente; itens no `/carrinho` continuam resolvendo produto, quantidade e checkout sem regressão.
