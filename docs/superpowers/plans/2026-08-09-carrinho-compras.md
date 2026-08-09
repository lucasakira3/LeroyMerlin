# Carrinho de Compras Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que o cliente monte um carrinho de produtos e finalize um pedido mockado (retirar na loja ou entrega em casa), com histórico de pedidos em "Minha Conta".

**Architecture:** Dois módulos de dados em `localStorage` (`lib/clientCarrinho.ts` para o carrinho global, `lib/clientPedidos.ts` para pedidos por email) + `components/CarrinhoIcon.tsx` (badge no header, sincronizado via evento customizado) + botão de adicionar no `ProdutoDrawer.tsx` + página `app/carrinho/page.tsx` (lista + checkout) + seção "Meus pedidos" em `app/conta/page.tsx`.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, `lucide-react`, `localStorage`, rota existente `/api/produto/[id]` para resolver produtos por ID.

## Global Constraints

- Sem chamadas de rede além da já existente `/api/produto/[id]` — nenhum pagamento real, nenhum cálculo de frete real.
- Todo `<input>`/`<textarea>`/`<select>` precisa de `bg-white` explícito (gotcha de dark mode do projeto).
- Carrinho funciona sem login; checkout (finalizar pedido) exige login.
- Quantidade no carrinho nunca pode passar do `estoque` do produto.
- Pedido confirmado guarda uma cópia (`nome`, `preco`) de cada item — não deve mudar se o produto mudar depois.
- A lista `LOJAS` já está duplicada em 4 componentes (`SearchSection.tsx`, `CategoriaView.tsx`, `ListaDeCompras.tsx`, `AgendamentoForm.tsx`) — o carrinho segue o mesmo padrão de cópia local, sem extrair módulo compartilhado (fora de escopo).

---

### Task 1: Módulo de dados `lib/clientCarrinho.ts`

**Files:**
- Create: `lib/clientCarrinho.ts`
- Test: script temporário `scratch-test-carrinho.ts` (escrito, rodado, apagado)

**Interfaces:**
- Consumes: nada
- Produces:
  - `interface CartItem { produtoId: string; quantidade: number }`
  - `getCarrinho(): CartItem[]`
  - `getQuantidadeTotal(): number`
  - `adicionarAoCarrinho(produtoId: string, quantidade?: number): void`
  - `atualizarQuantidade(produtoId: string, quantidade: number): void`
  - `removerDoCarrinho(produtoId: string): void`
  - `limparCarrinho(): void`
  - Evento DOM `'lm-carrinho-change'` disparado em toda mutação

- [ ] **Step 1: Criar `lib/clientCarrinho.ts`**

```ts
const CHAVE = 'lm_carrinho'

export interface CartItem {
  produtoId: string
  quantidade: number
}

function lerItens(): CartItem[] {
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

function salvarItens(itens: CartItem[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAVE, JSON.stringify(itens))
  window.dispatchEvent(new Event('lm-carrinho-change'))
}

export function getCarrinho(): CartItem[] {
  return lerItens()
}

export function getQuantidadeTotal(): number {
  return lerItens().reduce((soma, item) => soma + item.quantidade, 0)
}

export function adicionarAoCarrinho(produtoId: string, quantidade: number = 1): void {
  const itens = lerItens()
  const index = itens.findIndex(i => i.produtoId === produtoId)
  if (index === -1) {
    itens.push({ produtoId, quantidade })
  } else {
    itens[index] = { ...itens[index], quantidade: itens[index].quantidade + quantidade }
  }
  salvarItens(itens)
}

export function atualizarQuantidade(produtoId: string, quantidade: number): void {
  const itens = lerItens()
  if (quantidade <= 0) {
    salvarItens(itens.filter(i => i.produtoId !== produtoId))
    return
  }
  const index = itens.findIndex(i => i.produtoId === produtoId)
  if (index === -1) return
  itens[index] = { ...itens[index], quantidade }
  salvarItens(itens)
}

export function removerDoCarrinho(produtoId: string): void {
  const itens = lerItens()
  salvarItens(itens.filter(i => i.produtoId !== produtoId))
}

export function limparCarrinho(): void {
  salvarItens([])
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `lib/clientCarrinho.ts`

- [ ] **Step 3: Escrever script de verificação lógica temporário**

Create: `scratch-test-carrinho.ts` na raiz:

```ts
import { getCarrinho, getQuantidadeTotal, adicionarAoCarrinho, atualizarQuantidade, removerDoCarrinho, limparCarrinho } from './lib/clientCarrinho'

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

assert(getCarrinho().length === 0, 'carrinho começa vazio')
assert(getQuantidadeTotal() === 0, 'quantidade total começa em 0')

adicionarAoCarrinho('LM-0001')
assert(getCarrinho().length === 1, 'adiciona um item')
assert(getCarrinho()[0].quantidade === 1, 'quantidade padrão é 1')

adicionarAoCarrinho('LM-0001')
assert(getCarrinho().length === 1, 'adicionar de novo não duplica item')
assert(getCarrinho()[0].quantidade === 2, 'adicionar de novo soma quantidade')

adicionarAoCarrinho('LM-0002', 3)
assert(getQuantidadeTotal() === 5, 'quantidade total soma todos os itens (2 + 3)')

atualizarQuantidade('LM-0001', 5)
assert(getCarrinho().find(i => i.produtoId === 'LM-0001')?.quantidade === 5, 'atualizarQuantidade define valor exato')

atualizarQuantidade('LM-0001', 0)
assert(getCarrinho().find(i => i.produtoId === 'LM-0001') === undefined, 'quantidade 0 remove o item')

removerDoCarrinho('LM-0002')
assert(getCarrinho().length === 0, 'removerDoCarrinho remove o item')

adicionarAoCarrinho('LM-0003')
limparCarrinho()
assert(getCarrinho().length === 0, 'limparCarrinho esvazia tudo')

console.log('Todos os testes passaram.')
```

- [ ] **Step 4: Rodar e verificar saída**

Run: `npx tsx scratch-test-carrinho.ts`
Expected: todas as linhas `OK:` impressas, terminando em `Todos os testes passaram.`

- [ ] **Step 5: Apagar o script temporário**

Run: `rm scratch-test-carrinho.ts`

- [ ] **Step 6: Commit**

```bash
git add lib/clientCarrinho.ts
git commit -m "feat: modulo de dados para carrinho de compras"
```

---

### Task 2: Módulo de dados `lib/clientPedidos.ts`

**Files:**
- Create: `lib/clientPedidos.ts`
- Test: script temporário `scratch-test-pedidos.ts` (escrito, rodado, apagado)

**Interfaces:**
- Consumes: nada
- Produces:
  - `interface ItemPedido { produtoId: string; nome: string; preco: number; quantidade: number }`
  - `interface Pedido { numero: string; data: string; itens: ItemPedido[]; metodo: 'retirada' | 'entrega'; loja?: string; endereco?: string; total: number }`
  - `getPedidos(email: string): Pedido[]`
  - `salvarPedido(email: string, pedido: Pedido): void`
  - `gerarNumeroPedido(): string`

- [ ] **Step 1: Criar `lib/clientPedidos.ts`**

```ts
const CHAVE = 'lm_pedidos_cliente'

export interface ItemPedido {
  produtoId: string
  nome: string
  preco: number
  quantidade: number
}

export interface Pedido {
  numero: string
  data: string
  itens: ItemPedido[]
  metodo: 'retirada' | 'entrega'
  loja?: string
  endereco?: string
  total: number
}

type Mapa = Record<string, Pedido[]>

function lerMapa(): Mapa {
  if (typeof window === 'undefined') return {}
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return {}
    const dados = JSON.parse(bruto)
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return {}
    return dados
  } catch {
    return {}
  }
}

function salvarMapa(mapa: Mapa): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAVE, JSON.stringify(mapa))
}

export function getPedidos(email: string): Pedido[] {
  const mapa = lerMapa()
  const pedidos = mapa[email] ?? []
  return [...pedidos].sort((a, b) => b.data.localeCompare(a.data))
}

export function salvarPedido(email: string, pedido: Pedido): void {
  const mapa = lerMapa()
  const pedidos = mapa[email] ?? []
  pedidos.push(pedido)
  mapa[email] = pedidos
  salvarMapa(mapa)
}

export function gerarNumeroPedido(): string {
  return 'LM' + Date.now().toString(36).toUpperCase()
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `lib/clientPedidos.ts`

- [ ] **Step 3: Escrever script de verificação lógica temporário**

Create: `scratch-test-pedidos.ts` na raiz:

```ts
import { getPedidos, salvarPedido, gerarNumeroPedido, type Pedido } from './lib/clientPedidos'

const store: Record<string, string> = {}
;(globalThis as any).window = {
  localStorage: {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
  },
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error('FALHOU: ' + msg)
  console.log('OK:', msg)
}

assert(getPedidos('a@x.com').length === 0, 'sem pedidos inicialmente')

const numero1 = gerarNumeroPedido()
const pedido1: Pedido = {
  numero: numero1,
  data: '2026-08-09T10:00:00.000Z',
  itens: [{ produtoId: 'LM-0001', nome: 'Furadeira', preco: 100, quantidade: 2 }],
  metodo: 'retirada',
  loja: 'Interlagos — São Paulo/SP',
  total: 200,
}
salvarPedido('a@x.com', pedido1)
assert(getPedidos('a@x.com').length === 1, 'salva um pedido')
assert(getPedidos('b@x.com').length === 0, 'pedidos são isolados por email')

const pedido2: Pedido = {
  numero: gerarNumeroPedido(),
  data: '2026-08-09T12:00:00.000Z',
  itens: [{ produtoId: 'LM-0002', nome: 'Martelo', preco: 30, quantidade: 1 }],
  metodo: 'entrega',
  endereco: 'Rua Teste, 123',
  total: 30,
}
salvarPedido('a@x.com', pedido2)
assert(getPedidos('a@x.com').length === 2, 'acumula pedidos do mesmo email')
assert(getPedidos('a@x.com')[0].numero === pedido2.numero, 'mais recente primeiro')

console.log('Todos os testes passaram.')
```

- [ ] **Step 4: Rodar e verificar saída**

Run: `npx tsx scratch-test-pedidos.ts`
Expected: todas as linhas `OK:` impressas, terminando em `Todos os testes passaram.`

- [ ] **Step 5: Apagar o script temporário**

Run: `rm scratch-test-pedidos.ts`

- [ ] **Step 6: Commit**

```bash
git add lib/clientPedidos.ts
git commit -m "feat: modulo de dados para pedidos do cliente"
```

---

### Task 3: `components/CarrinhoIcon.tsx` e integração no `NavBar.tsx`

**Files:**
- Create: `components/CarrinhoIcon.tsx`
- Modify: `components/NavBar.tsx`

**Interfaces:**
- Consumes: `getQuantidadeTotal()` de `lib/clientCarrinho.ts` (Task 1), evento `'lm-carrinho-change'`
- Produces: `<CarrinhoIcon />` — componente default export, sem props

- [ ] **Step 1: Criar `components/CarrinhoIcon.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { getQuantidadeTotal } from '@/lib/clientCarrinho'

export default function CarrinhoIcon() {
  const [quantidade, setQuantidade] = useState(0)

  useEffect(() => {
    setQuantidade(getQuantidadeTotal())
    const atualizar = () => setQuantidade(getQuantidadeTotal())
    window.addEventListener('lm-carrinho-change', atualizar)
    return () => window.removeEventListener('lm-carrinho-change', atualizar)
  }, [])

  return (
    <Link
      href="/carrinho"
      className="relative flex items-center justify-center w-10 h-10 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
      aria-label={`Carrinho${quantidade > 0 ? ` (${quantidade} ${quantidade === 1 ? 'item' : 'itens'})` : ''}`}
    >
      <ShoppingCart size={19} />
      {quantidade > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-lm-yellow text-black text-[10px] font-bold flex items-center justify-center">
          {quantidade > 99 ? '99+' : quantidade}
        </span>
      )}
    </Link>
  )
}
```

- [ ] **Step 2: Integrar no bloco desktop do `NavBar.tsx`**

Em `components/NavBar.tsx`, adicionar o import junto com `ThemeToggle`:

```tsx
import CarrinhoIcon from './CarrinhoIcon'
```

Inserir `<CarrinhoIcon />` logo antes de `<ThemeToggle />` no bloco desktop (linha com `<ThemeToggle />` dentro de `hidden md:flex items-center gap-3 h-full`):

```tsx
          <CarrinhoIcon />
          <ThemeToggle />
```

- [ ] **Step 3: Integrar no bloco mobile do `NavBar.tsx`**

No menu mobile, o bloco atual é:

```tsx
          <div className="flex items-center justify-between gap-3 pt-3 mt-2 border-t border-white/15">
            <ThemeToggle />
            {logado ? (
              <Link
                href="/conta"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === '/conta' ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <User size={15} />
                Minha Conta
              </Link>
            ) : (
              <Link
                href="/funcionario/login"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-500 shadow-soft hover:bg-green-400 transition-colors"
              >
                <LogIn size={15} />
                Login
              </Link>
            )}
          </div>
```

Substituir apenas a primeira linha interna (`<ThemeToggle />`) por `<ThemeToggle />` agrupado com `<CarrinhoIcon />`, mantendo o resto idêntico:

```tsx
          <div className="flex items-center justify-between gap-3 pt-3 mt-2 border-t border-white/15">
            <div className="flex items-center gap-2">
              <CarrinhoIcon />
              <ThemeToggle />
            </div>
            {logado ? (
              <Link
                href="/conta"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === '/conta' ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <User size={15} />
                Minha Conta
              </Link>
            ) : (
              <Link
                href="/funcionario/login"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-500 shadow-soft hover:bg-green-400 transition-colors"
              >
                <LogIn size={15} />
                Login
              </Link>
            )}
          </div>
```

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 5: Commit**

```bash
git add components/CarrinhoIcon.tsx components/NavBar.tsx
git commit -m "feat: icone de carrinho com contador no header"
```

---

### Task 4: Botão "Adicionar ao carrinho" no `ProdutoDrawer.tsx`

**Files:**
- Modify: `components/ProdutoDrawer.tsx`

**Interfaces:**
- Consumes: `adicionarAoCarrinho(produtoId: string, quantidade?: number)` de `lib/clientCarrinho.ts` (Task 1)
- Produces: nada novo

- [ ] **Step 1: Importar dependências**

Em `components/ProdutoDrawer.tsx`, adicionar ao bloco de imports:

```tsx
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'
```

E adicionar `ShoppingCart` à lista de ícones já importada de `lucide-react` (linha 4):

```tsx
import { X, MapPin, Tag, Zap, Leaf, Package, BadgeCheck, SendHorizonal, Bot, Heart, ShoppingCart } from 'lucide-react'
```

- [ ] **Step 2: Adicionar estado de feedback**

Dentro de `DrawerContent`, junto aos outros `useState` (perto de `const [favorito, setFavorito] = useState(false)`):

```tsx
  const [adicionado, setAdicionado] = useState(false)
```

E resetar esse estado no `useEffect` que já roda ao trocar de produto (o que já contém `setFavorito(isFavorito(produto.id))`):

```tsx
  useEffect(() => {
    setMensagens([])
    setInputChat('')
    setFavorito(isFavorito(produto.id))
    setAdicionado(false)
    addAoHistorico(produto.id)
  }, [produto.id])
```

- [ ] **Step 3: Adicionar a função de clique**

Logo após a função `enviarPergunta` (ou em qualquer ponto do corpo de `DrawerContent`):

```tsx
  function handleAdicionarCarrinho() {
    adicionarAoCarrinho(produto.id)
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 1500)
  }
```

- [ ] **Step 4: Adicionar o botão na seção de preço/localização**

No bloco `{/* Preço + Localização */}` (`<div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4">`), adicionar o botão logo abaixo do preço, dentro do primeiro `<div>`:

```tsx
        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wide">Preço</p>
            {precoStr
              ? <p className="text-2xl font-black text-lm-green">{precoStr}</p>
              : <p className="text-sm text-gray-400 italic">Consultar loja</p>
            }
            <button
              onClick={handleAdicionarCarrinho}
              disabled={produto.estoque === 0}
              className="mt-2 flex items-center gap-1.5 bg-lm-green text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={13} />
              {adicionado ? 'Adicionado ✓' : 'Adicionar ao carrinho'}
            </button>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Localização</p>
            <div className="flex items-center gap-1.5 text-lm-green justify-end">
              <MapPin size={14} strokeWidth={2.5} />
              <span className="text-base font-bold">{produto.corredor}</span>
            </div>
          </div>
        </div>
```

- [ ] **Step 5: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 6: Commit**

```bash
git add components/ProdutoDrawer.tsx
git commit -m "feat: botao de adicionar ao carrinho no drawer de produto"
```

---

### Task 5: Página `app/carrinho/page.tsx`

**Files:**
- Create: `app/carrinho/page.tsx`

**Interfaces:**
- Consumes:
  - `getCarrinho`, `atualizarQuantidade`, `removerDoCarrinho`, `limparCarrinho`, `type CartItem` de `lib/clientCarrinho.ts` (Task 1)
  - `salvarPedido`, `gerarNumeroPedido`, `type Pedido`, `type ItemPedido` de `lib/clientPedidos.ts` (Task 2)
  - `getUsuarioLogado` de `lib/clientAuth.ts`
  - `type SearchResult` de `@/types/produto`
  - `Button` de `components/ui/Button`, `PageHeader` de `components/ui/PageHeader`, `Card` de `components/ui/Card`
- Produces: rota `/carrinho`

- [ ] **Step 1: Criar `app/carrinho/page.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingCart, MapPin, CheckCircle2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { getCarrinho, atualizarQuantidade, removerDoCarrinho, limparCarrinho, type CartItem } from '@/lib/clientCarrinho'
import { salvarPedido, gerarNumeroPedido, type Pedido, type ItemPedido } from '@/lib/clientPedidos'
import { getUsuarioLogado } from '@/lib/clientAuth'
import type { SearchResult } from '@/types/produto'

const LOJAS = [
  'Interlagos — São Paulo/SP',
  'Osasco — Osasco/SP',
  'Aricanduva — São Paulo/SP',
  'Santo André — Santo André/SP',
  'Guarulhos — Guarulhos/SP',
  'Campinas — Campinas/SP',
  'Alphaville — Barueri/SP',
  'São Bernardo do Campo — SBC/SP',
  'Sorocaba — Sorocaba/SP',
  'Belo Horizonte Norte — BH/MG',
  'Barra da Tijuca — Rio de Janeiro/RJ',
  'Curitiba — Curitiba/PR',
  'Porto Alegre — Porto Alegre/RS',
  'Brasília — DF',
  'Goiânia — Goiânia/GO',
]

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

export default function CarrinhoPage() {
  const [itens, setItens] = useState<CartItem[]>([])
  const [produtos, setProdutos] = useState<Record<string, ProdutoResolvido> | null>(null)
  const [usuario, setUsuario] = useState<{ email: string } | null>(null)
  const [metodo, setMetodo] = useState<'retirada' | 'entrega'>('retirada')
  const [loja, setLoja] = useState(LOJAS[0])
  const [endereco, setEndereco] = useState('')
  const [pedidoConfirmado, setPedidoConfirmado] = useState<Pedido | null>(null)

  useEffect(() => {
    setUsuario(getUsuarioLogado())
    const carrinho = getCarrinho()
    setItens(carrinho)
    if (carrinho.length === 0) {
      setProdutos({})
      return
    }
    buscarProdutos(carrinho.map(i => i.produtoId)).then(setProdutos)
  }, [])

  function recarregarCarrinho() {
    setItens(getCarrinho())
  }

  function mudarQuantidade(produtoId: string, delta: number) {
    const item = itens.find(i => i.produtoId === produtoId)
    const produto = produtos?.[produtoId]
    if (!item || !produto) return
    const nova = Math.min(item.quantidade + delta, produto.estoque)
    atualizarQuantidade(produtoId, Math.max(0, nova))
    recarregarCarrinho()
  }

  function remover(produtoId: string) {
    removerDoCarrinho(produtoId)
    recarregarCarrinho()
  }

  const itensResolvidos = produtos
    ? itens
        .map(item => ({ item, produto: produtos[item.produtoId] }))
        .filter((x): x is { item: CartItem; produto: ProdutoResolvido } => x.produto !== undefined)
    : []

  const total = itensResolvidos.reduce((soma, { item, produto }) => soma + (produto.preco ?? 0) * item.quantidade, 0)

  function confirmarPedido() {
    if (!usuario) return
    if (metodo === 'retirada' && !loja) return
    if (metodo === 'entrega' && !endereco.trim()) return

    const itensPedido: ItemPedido[] = itensResolvidos.map(({ item, produto }) => ({
      produtoId: produto.id,
      nome: produto.produto,
      preco: produto.preco,
      quantidade: item.quantidade,
    }))

    const pedido: Pedido = {
      numero: gerarNumeroPedido(),
      data: new Date().toISOString(),
      itens: itensPedido,
      metodo,
      loja: metodo === 'retirada' ? loja : undefined,
      endereco: metodo === 'entrega' ? endereco.trim() : undefined,
      total,
    }

    salvarPedido(usuario.email, pedido)
    limparCarrinho()
    setPedidoConfirmado(pedido)
  }

  if (pedidoConfirmado) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-xl mx-auto px-4 py-10">
          <Card className="text-center">
            <CheckCircle2 size={40} className="text-lm-green mx-auto mb-3" />
            <h1 className="text-xl font-bold text-gray-900 mb-1">Pedido confirmado!</h1>
            <p className="text-sm text-gray-500 mb-4">Número do pedido: <span className="font-mono font-semibold text-gray-700">{pedidoConfirmado.numero}</span></p>

            <div className="text-left bg-gray-50 rounded-xl p-4 mb-4 space-y-1.5">
              {pedidoConfirmado.itens.map(i => (
                <div key={i.produtoId} className="flex justify-between text-sm">
                  <span className="text-gray-600">{i.quantidade}× {i.nome}</span>
                  <span className="font-medium text-gray-900">
                    {(i.preco * i.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-sm">
                <span>Total</span>
                <span>{pedidoConfirmado.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-6">
              {pedidoConfirmado.metodo === 'retirada'
                ? `Retirada em: ${pedidoConfirmado.loja}`
                : `Entrega em: ${pedidoConfirmado.endereco}`}
            </p>

            <div className="flex gap-3 justify-center">
              <Link href="/conta"><Button variant="secondary">Ver meus pedidos</Button></Link>
              <Link href="/"><Button variant="primary">Continuar comprando</Button></Link>
            </div>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <PageHeader title="Carrinho" description={itens.length > 0 ? `${itens.length} ${itens.length === 1 ? 'item' : 'itens'}` : undefined} />

        {produtos === null && <p className="text-sm text-gray-400">Carregando...</p>}

        {produtos !== null && itensResolvidos.length === 0 && (
          <Card className="text-center py-10">
            <ShoppingCart size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">Seu carrinho está vazio.</p>
            <Link href="/"><Button variant="primary">Ver produtos</Button></Link>
          </Card>
        )}

        {itensResolvidos.length > 0 && (
          <>
            <div className="space-y-3 mb-6">
              {itensResolvidos.map(({ item, produto }) => (
                <Card key={produto.id} padding="sm" className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{produto.produto}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-lm-green font-bold">
                        <MapPin size={10} /> {produto.corredor}
                      </span>
                      <span className="text-xs text-gray-400">{produto.estoque} disp.</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => mudarQuantidade(produto.id, -1)}
                      className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                      aria-label="Diminuir quantidade"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-medium w-5 text-center">{item.quantidade}</span>
                    <button
                      onClick={() => mudarQuantidade(produto.id, 1)}
                      disabled={item.quantidade >= produto.estoque}
                      className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <span className="text-sm font-bold text-gray-900 w-20 text-right flex-shrink-0">
                    {(produto.preco * item.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>

                  <button
                    onClick={() => remover(produto.id)}
                    className="text-gray-300 hover:text-red-500 flex-shrink-0"
                    aria-label="Remover do carrinho"
                  >
                    <Trash2 size={16} />
                  </button>
                </Card>
              ))}
            </div>

            <Card className="mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <span className="text-xl font-black text-lm-green">
                  {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </Card>

            {!usuario && (
              <Card className="text-center">
                <p className="text-sm text-gray-600 mb-3">Faça login para finalizar o pedido.</p>
                <Link href="/funcionario/login"><Button variant="primary">Fazer login</Button></Link>
              </Card>
            )}

            {usuario && (
              <Card>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Finalizar pedido</h3>

                <div className="flex rounded-xl bg-gray-100 p-1 mb-4">
                  <button
                    type="button"
                    onClick={() => setMetodo('retirada')}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      metodo === 'retirada' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Retirar na loja
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodo('entrega')}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      metodo === 'entrega' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Entrega em casa
                  </button>
                </div>

                {metodo === 'retirada' ? (
                  <select
                    value={loja}
                    onChange={e => setLoja(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lm-green/30 bg-white mb-4"
                  >
                    {LOJAS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                ) : (
                  <textarea
                    value={endereco}
                    onChange={e => setEndereco(e.target.value)}
                    placeholder="Endereço completo (rua, número, bairro, cidade)"
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lm-green/30 resize-none bg-white mb-4"
                  />
                )}

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={confirmarPedido}
                  disabled={metodo === 'entrega' && !endereco.trim()}
                >
                  Confirmar pedido
                </Button>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `app/carrinho/page.tsx`

- [ ] **Step 3: Commit**

```bash
git add app/carrinho/page.tsx
git commit -m "feat: pagina de carrinho e checkout mockado"
```

---

### Task 6: Seção "Meus pedidos" em `app/conta/page.tsx`

**Files:**
- Modify: `app/conta/page.tsx`

**Interfaces:**
- Consumes: `getPedidos(email: string): Pedido[]` de `lib/clientPedidos.ts` (Task 2)
- Produces: nada novo

- [ ] **Step 1: Importar dependências**

Em `app/conta/page.tsx`, adicionar ao bloco de imports:

```tsx
import { getPedidos, type Pedido } from '@/lib/clientPedidos'
import { Package } from 'lucide-react'
```

- [ ] **Step 2: Criar o componente `SecaoPedidos`**

Adicionar logo após a função `SecaoProdutos` existente (antes de `export default function ContaPage`):

```tsx
function SecaoPedidos({ pedidos }: { pedidos: Pedido[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Meus pedidos</h2>
      {pedidos.length === 0 && (
        <p className="text-sm text-gray-500 py-6">Você ainda não fez nenhum pedido.</p>
      )}
      {pedidos.length > 0 && (
        <div className="space-y-3">
          {pedidos.map(pedido => (
            <div key={pedido.numero} className="bg-white rounded-card shadow-soft border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package size={15} className="text-lm-green" />
                  <span className="font-mono text-sm font-semibold text-gray-900">{pedido.numero}</span>
                </div>
                <span className="text-xs text-gray-400">{new Date(pedido.data).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="space-y-1 mb-2">
                {pedido.itens.map(item => (
                  <p key={item.produtoId} className="text-sm text-gray-600">
                    {item.quantidade}× {item.nome}
                  </p>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {pedido.metodo === 'retirada' ? `Retirada: ${pedido.loja}` : `Entrega: ${pedido.endereco}`}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {pedido.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 3: Adicionar estado e carregamento**

No componente `ContaPage`, adicionar o estado junto aos outros:

```tsx
  const [pedidos, setPedidos] = useState<Pedido[]>([])
```

No `useEffect` que já carrega favoritos/histórico, adicionar:

```tsx
  useEffect(() => {
    const usuarioLogado = getUsuarioLogado()
    if (!usuarioLogado) {
      router.push('/funcionario/login')
      return
    }
    setUsuario(usuarioLogado)
    setFavoritosIds(getFavoritosIds())
    setHistoricoIds(getHistoricoIds())
    setPedidos(getPedidos(usuarioLogado.email))
  }, [router])
```

- [ ] **Step 4: Renderizar a seção**

No JSX de `ContaPage`, adicionar `<SecaoPedidos pedidos={pedidos} />` logo após `<PageHeader ... />` e antes de `<SecaoProdutos titulo="Favoritos" ... />`:

```tsx
        <PageHeader ... />
        <SecaoPedidos pedidos={pedidos} />
        <SecaoProdutos
          titulo="Favoritos"
          ...
```

- [ ] **Step 5: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 6: Commit**

```bash
git add app/conta/page.tsx
git commit -m "feat: secao de pedidos em Minha Conta"
```

---

### Task 7: Verificação manual end-to-end

**Files:** nenhum

**Interfaces:**
- Consumes: app rodando localmente (`npm run dev`)
- Produces: confirmação visual do fluxo completo, dois temas

- [ ] **Step 1: Subir o dev server limpo**

Run: `rm -rf .next && npm run dev` (em background)

- [ ] **Step 2: Adicionar ao carrinho deslogado**

Via `agent-browser`: abrir um produto no drawer, clicar "Adicionar ao carrinho", confirmar feedback "Adicionado ✓" e que o contador do ícone no header vai para 1 sem recarregar a página.

- [ ] **Step 3: Ajustar quantidade no carrinho**

Abrir `/carrinho`, aumentar a quantidade do item (verificar que o botão `+` desabilita ao atingir o estoque), diminuir até remover, adicionar de novo pelo botão de lixeira/drawer.

- [ ] **Step 4: Bloqueio de checkout deslogado**

Com item no carrinho e deslogado, confirmar que aparece "Faça login para finalizar o pedido" em vez do formulário.

- [ ] **Step 5: Checkout logado — retirada**

Fazer login, voltar ao carrinho, escolher "Retirar na loja", selecionar uma loja, clicar "Confirmar pedido". Confirmar tela de sucesso com número do pedido, itens, total e "Retirada em: ...".

- [ ] **Step 6: Checkout logado — entrega**

Adicionar outro item ao carrinho, ir para `/carrinho`, escolher "Entrega em casa", preencher endereço, confirmar. Verificar que o botão fica desabilitado com endereço vazio e habilita ao preencher.

- [ ] **Step 7: Histórico em Minha Conta**

Ir para `/conta`, confirmar que os dois pedidos aparecem na seção "Meus pedidos" com número, itens, método e total corretos, mais recente primeiro.

- [ ] **Step 8: Modo escuro**

Repetir a visualização do carrinho com itens e do formulário de checkout (ambos os métodos) em dark mode, conferir que `<select>`/`<textarea>` não ficam brancos fixos e que o contador do ícone tem contraste legível.

- [ ] **Step 9: Screenshot final**

Via `agent-browser`, capturar `/carrinho` com itens e o painel de confirmação de pedido, em claro e escuro.
