# Redesign Visual (Identidade Leroy Merlin) Implementation Plan

> **For agentic workers:** Execute task-by-task in order. Tasks 1-5 create shared tokens/components and must land first — every later task depends on them. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernizar a UI do site (área do cliente + painel do funcionário) para um estilo clean/arejado, mantendo o verde de marca (`#00843d`), sem alterar nenhuma lógica de negócio.

**Architecture:** Camada de apresentação apenas. Um conjunto de design tokens (Tailwind) e 4 componentes-base novos (`Button`, `Card`, `Badge`, `PageHeader`) são criados primeiro; todas as páginas/telas existentes são então migradas para usá-los, uma a uma, sem tocar em lógica/estado/chamadas de API.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, lucide-react.

## Global Constraints

- Cor de marca `lm-green: #00843d` não muda de tom (só de uso/proporção).
- Nenhuma lógica, chamada de API, estado ou prop de dados é alterada em nenhum arquivo — apenas JSX de apresentação e classes.
- Nenhuma funcionalidade existente pode quebrar (busca semântica, busca por imagem, mapa da loja, chat, tour guiado, dashboard, agendamento).
- Cantos arredondados (`rounded-xl`/`rounded-2xl`) e sombra suave substituem o estilo de cantos retos/bordas duras usado hoje em `ProductCard`.
- Verificação de cada task é visual (dev server + screenshot via skill `agent-browser`), não teste automatizado — não há suíte de testes no projeto hoje.

---

## Task 1: Design tokens (Tailwind + CSS global)

**Files:**
- Modify: `tailwind.config.js`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: classes utilitárias `bg-lm-green`, `text-lm-green`, `bg-lm-yellow`, `text-lm-yellow`, `bg-lm-orange`, `text-lm-orange` (mantidas, mesmo valor hex), mais a escala `gray-50`...`gray-900` (padrão Tailwind, já disponível — sem mudança de config necessária), `shadow-soft` (nova, elevação padrão de card), `rounded-card` (nova, alias `1rem`).

- [ ] **Step 1: Atualizar `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'lm-green': '#00843d',
        'lm-yellow': '#ffd100',
        'lm-dark': '#1a1a1a',
        'lm-light': '#f5f5f5',
        'lm-orange': '#e87722',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '1rem',
      },
      boxShadow: {
        soft: '0 2px 12px -2px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 8px 24px -4px rgba(0, 0, 0, 0.10)',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Atualizar `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --lm-green: #00843d;
  --lm-yellow: #ffd100;
  --lm-dark: #1a1a1a;
  --lm-light: #f5f5f5;
  --lm-orange: #e87722;
}

* {
  box-sizing: border-box;
}

body {
  color: var(--lm-dark);
  background-color: #fafafa;
}
```

- [ ] **Step 3: Verificar que o app builda**

Run: `npm run dev` (deixar rodando em background) e abrir `http://localhost:3000`
Expected: página carrega sem erro de compilação Tailwind (cores/sombra novas reconhecidas).

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.js app/globals.css
git commit -m "style: novos design tokens (sombra suave, raio de card, fundo neutro)"
```

---

## Task 2: Componente `Button`

**Files:**
- Create: `components/ui/Button.tsx`

**Interfaces:**
- Produces: `Button` — `import Button from '@/components/ui/Button'`. Props: `variant?: 'primary' | 'secondary' | 'ghost' | 'danger'` (default `'primary'`), `size?: 'sm' | 'md'` (default `'md'`), mais todas as props nativas de `<button>` (`onClick`, `type`, `disabled`, `className`, etc.) via spread.

- [ ] **Step 1: Criar `components/ui/Button.tsx`**

```tsx
import { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-lm-green text-white hover:bg-lm-green/90',
  secondary: 'bg-white text-lm-green border border-lm-green/30 hover:bg-lm-green/5',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Verificar tipagem**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `components/ui/Button.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/ui/Button.tsx
git commit -m "feat: componente Button reutilizavel com variantes"
```

---

## Task 3: Componente `Card`

**Files:**
- Create: `components/ui/Card.tsx`

**Interfaces:**
- Produces: `Card` — `import Card from '@/components/ui/Card'`. Props: `padding?: 'none' | 'sm' | 'md'` (default `'md'`), `hoverable?: boolean` (default `false`), `className?: string`, `children`.

- [ ] **Step 1: Criar `components/ui/Card.tsx`**

```tsx
import { HTMLAttributes } from 'react'

type CardPadding = 'none' | 'sm' | 'md'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding
  hoverable?: boolean
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
}

export default function Card({
  padding = 'md',
  hoverable = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-card shadow-soft border border-gray-100 ${paddingClasses[padding]} ${
        hoverable ? 'transition-shadow hover:shadow-soft-lg' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Verificar tipagem**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `components/ui/Card.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/ui/Card.tsx
git commit -m "feat: componente Card reutilizavel"
```

---

## Task 4: Componente `Badge` + migração de `StockIndicator`/`SustainabilityBadge`

**Files:**
- Create: `components/ui/Badge.tsx`
- Modify: `components/StockIndicator.tsx`
- Modify: `components/SustainabilityBadge.tsx`

**Interfaces:**
- Consumes: nenhuma (base nova).
- Produces: `Badge` — `import Badge from '@/components/ui/Badge'`. Props: `tone?: 'green' | 'yellow' | 'orange' | 'red' | 'gray'` (default `'gray'`), `children`.
- `StockIndicator` e `SustainabilityBadge` mantêm sua assinatura de props atual (não descrita aqui pois não é alterada) — só o JSX interno passa a usar `Badge`.

- [ ] **Step 1: Criar `components/ui/Badge.tsx`**

```tsx
import { HTMLAttributes } from 'react'

type BadgeTone = 'green' | 'yellow' | 'orange' | 'red' | 'gray'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

const toneClasses: Record<BadgeTone, string> = {
  green: 'bg-lm-green/10 text-lm-green',
  yellow: 'bg-lm-yellow/20 text-yellow-800',
  orange: 'bg-lm-orange/10 text-lm-orange',
  red: 'bg-red-50 text-red-600',
  gray: 'bg-gray-100 text-gray-600',
}

export default function Badge({ tone = 'gray', className = '', children, ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 2: Ler `components/StockIndicator.tsx` e `components/SustainabilityBadge.tsx` atuais**

Run: abrir os dois arquivos e identificar a lógica condicional existente (ex: níveis de estoque, selo de sustentabilidade) — essa lógica é preservada, só o wrapper visual (`<span>`/`<div>` com classes manuais) é substituído por `<Badge tone="...">`.

- [ ] **Step 3: Migrar `StockIndicator.tsx` e `SustainabilityBadge.tsx` para usar `Badge`**

Substituir o elemento raiz de cada badge por `<Badge tone={...}>conteúdo</Badge>`, escolhendo o `tone` conforme o significado (ex: estoque baixo → `red`, estoque ok → `green`, selo sustentável → `green` ou `yellow` conforme a lógica atual do componente).

- [ ] **Step 4: Verificar visualmente**

Run: com `npm run dev` ativo, usar a skill `agent-browser` pra abrir `http://localhost:3000` e tirar screenshot da lista de produtos.
Expected: badges de estoque/sustentabilidade aparecem como pill arredondado colorido, sem erro de render.

- [ ] **Step 5: Commit**

```bash
git add components/ui/Badge.tsx components/StockIndicator.tsx components/SustainabilityBadge.tsx
git commit -m "feat: componente Badge e migracao de StockIndicator/SustainabilityBadge"
```

---

## Task 5: Componente `PageHeader`

**Files:**
- Create: `components/ui/PageHeader.tsx`

**Interfaces:**
- Produces: `PageHeader` — `import PageHeader from '@/components/ui/PageHeader'`. Props: `title: string`, `description?: string`, `action?: React.ReactNode` (slot opcional à direita, ex: um `Button`).

- [ ] **Step 1: Criar `components/ui/PageHeader.tsx`**

```tsx
import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Verificar tipagem**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `components/ui/PageHeader.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/ui/PageHeader.tsx
git commit -m "feat: componente PageHeader reutilizavel"
```

---

## Task 6: Restilizar `NavBar` (área cliente)

**Files:**
- Modify: `components/NavBar.tsx`

**Interfaces:**
- Consumes: nenhuma dos componentes-base (nav é estrutural, não usa Card/Button).
- Não altera props, rotas ou lógica de `pathname`/`usePathname`.

- [ ] **Step 1: Aplicar novo visual ao header**

Trocar o fundo sólido `style={{ backgroundColor: '#2d6a4f' }}` por `bg-lm-green` (token oficial, já que o hex hardcoded `#2d6a4f` diverge do token `lm-green #00843d`), manter `shadow-md`, e trocar o indicador de aba ativa de `border-b-2` reto por um "pill" arredondado de fundo (`bg-white/15 rounded-xl`) atrás do item ativo, mantendo os mesmos 4 tabs e ícones.

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, MessageCircleQuestion, CalendarCheck, Sparkles } from 'lucide-react'

const tabs = [
  { href: '/', label: 'Buscar Produtos', icon: Search },
  { href: '/projeto', label: 'Projeto Guiado', icon: Sparkles },
  { href: '/duvidas', label: 'Tire Dúvidas', icon: MessageCircleQuestion },
  { href: '/agendamento', label: 'Agendar Visita', icon: CalendarCheck },
]

export default function NavBar() {
  const pathname = usePathname()

  if (pathname.startsWith('/funcionario')) return null;

  return (
    <header className="bg-lm-green shadow-md">
      <div className="px-6 flex items-center justify-between h-16">

        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/leroy-logo.png"
            alt="Leroy Merlin"
            className="h-10 w-auto object-contain"
          />
        </Link>

        <nav className="flex items-center gap-1 h-full py-2.5">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 h-full rounded-xl text-sm font-medium transition-colors ${
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
    </header>
  )
}
```

- [ ] **Step 2: Verificar visualmente**

Run: com `npm run dev` ativo, `agent-browser` navega para `http://localhost:3000` e tira screenshot do header.
Expected: header verde `#00843d`, aba ativa com destaque em pill, os 4 links continuam navegando corretamente (clicar em cada um).

- [ ] **Step 3: Commit**

```bash
git add components/NavBar.tsx
git commit -m "style: redesign NavBar com pill de aba ativa e token de cor correto"
```

---

## Task 7: Restilizar home/busca (`ProductCard`, `ProductGrid`, `SearchBar`, `SearchSection`, `app/page.tsx`)

**Files:**
- Modify: `components/ProductCard.tsx`
- Modify: `components/ProductGrid.tsx`
- Modify: `components/SearchBar.tsx`
- Modify: `components/SearchSection.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `Card` (`components/ui/Card.tsx`), `Badge` (via `StockIndicator`/`SustainabilityBadge` já migrados na Task 4).
- Não altera `SearchResult`, `produto` types, nem lógica de busca/scoring.

- [ ] **Step 1: Reescrever `components/ProductCard.tsx` usando `Card`**

Substituir o estilo "catálogo industrial" (coluna de ID com borda reta, `bg-lm-green/5`) por um `Card hoverable` de cantos arredondados, mantendo os mesmos dados exibidos (ID, score, categoria, nome, corredor, preço, estoque, sustentabilidade):

```tsx
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import StockIndicator from './StockIndicator'
import SustainabilityBadge from './SustainabilityBadge'
import Card from './ui/Card'
import type { SearchResult } from '@/types/produto'

export default function ProductCard({ result }: { result: SearchResult }) {
  const { produto, score } = result

  return (
    <Link href={`/produto/${produto.id}`} className="block">
      <Card hoverable padding="none" className="overflow-hidden">
        <div className="flex items-stretch">
          <div className="bg-lm-green/5 px-3 py-3 flex flex-col items-center justify-center min-w-[64px]">
            <span className="text-[10px] text-gray-400 font-mono">{produto.id}</span>
            <span className="text-[10px] text-lm-green font-bold mt-1">
              {Math.round(score * 100)}%
            </span>
          </div>

          <div className="flex-1 px-4 py-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
              {produto.categoria}
            </p>
            <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-2">
              {produto.produto}
            </h3>

            <div className="flex items-center gap-1.5 text-lm-green mb-2">
              <MapPin size={13} strokeWidth={2.5} />
              <span className="text-sm font-bold">{produto.corredor}</span>
            </div>

            {'preco' in produto && (
              <p className="text-base font-bold text-gray-900 mb-2">
                {Number(produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            )}

            <div className="flex items-center justify-between">
              <StockIndicator estoque={produto.estoque} />
              <SustainabilityBadge sustentabilidade={produto.sustentabilidade} />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
```

- [ ] **Step 2: Ler `components/ProductGrid.tsx`, `components/SearchBar.tsx`, `components/SearchSection.tsx`, `app/page.tsx` atuais**

Run: abrir os 4 arquivos pra identificar a lógica existente (grid de resultados, estado do input de busca, upload de imagem, chamadas a `/api/search`) — nada disso muda.

- [ ] **Step 3: Aplicar tokens visuais nos 4 arquivos**

Em cada um, aplicar as mesmas regras mecânicas: qualquer container de card/resultado que hoje usa `border border-gray-200` reto vira `Card` (ou `rounded-card shadow-soft`); o input de busca (`SearchBar`) ganha `rounded-xl` e `focus:ring-2 focus:ring-lm-green/30` em vez de borda quadrada; espaçamento entre elementos (`gap-*`, `py-*`) aumenta um passo (ex: `gap-2` → `gap-3`, `py-2` → `py-3`) para reforçar o estilo arejado. Layout, grid de colunas e lógica de estado permanecem os mesmos.

- [ ] **Step 4: Verificar visualmente**

Run: com `npm run dev` ativo, `agent-browser` navega para `http://localhost:3000`, faz uma busca de teste (ex: "parafuso") e tira screenshot dos resultados.
Expected: grid de produtos com cards arredondados/sombra suave, busca continua retornando resultados normalmente.

- [ ] **Step 5: Commit**

```bash
git add components/ProductCard.tsx components/ProductGrid.tsx components/SearchBar.tsx components/SearchSection.tsx app/page.tsx
git commit -m "style: redesign home/busca com Card e tokens novos"
```

---

## Task 8: Restilizar página de produto (`app/produto/[id]/page.tsx`, `ProdutoDrawer`, `CorridorBadge`, `StoreMap`)

**Files:**
- Modify: `app/produto/[id]/page.tsx`
- Modify: `components/ProdutoDrawer.tsx`
- Modify: `components/CorridorBadge.tsx`
- Modify: `components/StoreMap.tsx`

**Interfaces:**
- Consumes: `Card`, `Badge`, `PageHeader`.
- Não altera roteamento, fetch de dados do produto (`app/api/produto/[id]/route.ts` não é tocado), nem a lógica de desenho do SVG do mapa em `StoreMap`.

- [ ] **Step 1: Ler os 4 arquivos atuais**

Run: abrir `app/produto/[id]/page.tsx`, `components/ProdutoDrawer.tsx`, `components/CorridorBadge.tsx`, `components/StoreMap.tsx` para mapear a estrutura JSX existente (o SVG interativo do `StoreMap` em si — corredores, pins — não é redesenhado nesta task; só o chrome ao redor: cards, badges, textos).

- [ ] **Step 2: Aplicar tokens visuais**

Envolver blocos de informação do produto em `Card`; `CorridorBadge` passa a usar `Badge tone="green"` mantendo o texto do corredor; título da página usa `PageHeader`; `ProdutoDrawer` (painel lateral/modal) ganha `rounded-card` nas bordas e `shadow-soft-lg`. Os pins/cores dentro do SVG do `StoreMap` continuam iguais — só o container externo (borda, sombra) do mapa ganha `rounded-card shadow-soft`.

- [ ] **Step 3: Verificar visualmente**

Run: com `npm run dev` ativo, `agent-browser` navega para uma página de produto existente (ex: `http://localhost:3000/produto/1`) e tira screenshot.
Expected: mapa da loja continua funcional (pins clicáveis, corredor destacado), card de informações com visual novo.

- [ ] **Step 4: Commit**

```bash
git add app/produto/[id]/page.tsx components/ProdutoDrawer.tsx components/CorridorBadge.tsx components/StoreMap.tsx
git commit -m "style: redesign pagina de produto, drawer e mapa da loja"
```

---

## Task 9: Restilizar projeto guiado (`app/projeto/page.tsx`, `ProjetoWizard`, `ListaDeCompras`)

**Files:**
- Modify: `app/projeto/page.tsx`
- Modify: `components/ProjetoWizard.tsx`
- Modify: `components/ListaDeCompras.tsx`

**Interfaces:**
- Consumes: `Card`, `Button`, `PageHeader`.
- Não altera a chamada a `app/api/projeto/route.ts` nem o fluxo de steps do wizard.

- [ ] **Step 1: Ler os 3 arquivos atuais**

Run: abrir os 3 arquivos pra identificar os steps do wizard e a estrutura da lista de materiais gerada.

- [ ] **Step 2: Aplicar tokens visuais**

Título da página via `PageHeader`; cada step do `ProjetoWizard` envolvido em `Card`; botões de avançar/voltar/gerar lista trocados por `Button` (`variant="primary"` para ação principal, `variant="ghost"` para voltar); itens da `ListaDeCompras` cada um em `Card padding="sm"` com `MapPin`/corredor destacado em `text-lm-green`, igual ao padrão do `ProductCard`.

- [ ] **Step 3: Verificar visualmente**

Run: com `npm run dev` ativo, `agent-browser` navega para `http://localhost:3000/projeto`, preenche um projeto de teste (ex: "instalar um chuveiro") e tira screenshot do resultado.
Expected: wizard funcional do início ao fim, lista de materiais final com visual consistente com os cards de produto.

- [ ] **Step 4: Commit**

```bash
git add app/projeto/page.tsx components/ProjetoWizard.tsx components/ListaDeCompras.tsx
git commit -m "style: redesign projeto guiado e lista de materiais"
```

---

## Task 10: Restilizar dúvidas (`app/duvidas/page.tsx`, `DuvidasChat`, `VoiceButton`)

**Files:**
- Modify: `app/duvidas/page.tsx`
- Modify: `components/DuvidasChat.tsx`
- Modify: `components/VoiceButton.tsx`

**Interfaces:**
- Consumes: `Card`, `Button`, `PageHeader`.
- Não altera a chamada a `app/api/duvidas/route.ts` nem o estado de mensagens do chat.

- [ ] **Step 1: Ler os 3 arquivos atuais**

Run: abrir os 3 arquivos pra identificar a estrutura de bolhas de mensagem (usuário vs. IA) e o botão de voz.

- [ ] **Step 2: Aplicar tokens visuais**

Container do chat em `Card padding="none"` com cantos arredondados; bolhas de mensagem do usuário em `bg-lm-green text-white rounded-2xl`, bolhas da IA em `bg-gray-100 text-gray-800 rounded-2xl`; input de envio com `rounded-xl`; `VoiceButton` (botão circular) usa cores do token (`bg-lm-green` ativo / `bg-gray-100` inativo) em vez de cor hardcoded, se houver.

- [ ] **Step 3: Verificar visualmente**

Run: com `npm run dev` ativo, `agent-browser` navega para `http://localhost:3000/duvidas`, envia uma pergunta de teste e tira screenshot.
Expected: chat responde normalmente, bolhas com visual novo e legível.

- [ ] **Step 4: Commit**

```bash
git add app/duvidas/page.tsx components/DuvidasChat.tsx components/VoiceButton.tsx
git commit -m "style: redesign chat de duvidas"
```

---

## Task 11: Restilizar agendamento (`app/agendamento/page.tsx`, `AgendamentoForm`, `AgendamentosLista`)

**Files:**
- Modify: `app/agendamento/page.tsx`
- Modify: `components/AgendamentoForm.tsx`
- Modify: `components/AgendamentosLista.tsx`

**Interfaces:**
- Consumes: `Card`, `Button`, `Badge`, `PageHeader`.
- Não altera validação de formulário nem o armazenamento dos agendamentos.

- [ ] **Step 1: Ler os 3 arquivos atuais**

Run: abrir os 3 arquivos pra identificar os campos do formulário e o formato de exibição dos agendamentos existentes.

- [ ] **Step 2: Aplicar tokens visuais**

Título via `PageHeader`; formulário dentro de `Card`, inputs com `rounded-xl border-gray-200 focus:ring-2 focus:ring-lm-green/30`; botão de confirmar agendamento via `Button`; cada item de `AgendamentosLista` em `Card padding="sm"` com status em `Badge` (ex: `tone="green"` para confirmado, `tone="yellow"` para pendente).

- [ ] **Step 3: Verificar visualmente**

Run: com `npm run dev` ativo, `agent-browser` navega para `http://localhost:3000/agendamento`, preenche e envia um agendamento de teste, tira screenshot.
Expected: agendamento é criado e aparece na lista, visual consistente com o resto do site.

- [ ] **Step 4: Commit**

```bash
git add app/agendamento/page.tsx components/AgendamentoForm.tsx components/AgendamentosLista.tsx
git commit -m "style: redesign agendamento"
```

---

## Task 12: Restilizar `FuncionarioLayout` (sidebar) e login

**Files:**
- Modify: `app/funcionario/layout.tsx`
- Modify: `app/funcionario/login/page.tsx`

**Interfaces:**
- Consumes: `Button`.
- Não altera a lógica de simulação de login (aceita qualquer email/senha) nem as rotas do menu.

- [ ] **Step 1: Atualizar `app/funcionario/layout.tsx`**

A sidebar já usa `rounded-xl`/`shadow-sm` (mais próxima do alvo). Ajustar: fundo do `<main>` de `bg-lm-light` (hex `#f5f5f5`) para `bg-gray-50` (consistente com o novo fundo global definido na Task 1), e aumentar o padding interno dos itens de menu (`px-4 py-3` → manter, já está adequado):

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Package, MessageSquare, LogOut } from 'lucide-react'

export default function FuncionarioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isLoginPage = pathname === '/funcionario/login'

  if (isLoginPage) {
    return <>{children}</>
  }

  const menuItems = [
    { href: '/funcionario/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/funcionario/clientes', icon: Users, label: 'Clientes' },
    { href: '/funcionario/produtos', icon: Package, label: 'Estoque / Produtos' },
    { href: '/funcionario/chamados', icon: MessageSquare, label: 'Chamados Chat' },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm z-10">
        <div className="p-6 flex justify-center border-b border-gray-100 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/leroy-logo.png" alt="Leroy Merlin" className="h-10 w-auto object-contain" />
        </div>
        <div className="px-6 pt-6 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
          Painel do Funcionário
        </div>
        <nav className="flex-1 px-4 py-2 space-y-1">
          {menuItems.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-lm-green/10 text-lm-green'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon size={18} className={active ? 'text-lm-green' : 'text-gray-400'} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <Link
            href="/funcionario/login"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Sair do Sistema
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50 relative">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Ler e atualizar `app/funcionario/login/page.tsx`**

Run: abrir o arquivo pra identificar o formulário de login atual. Aplicar: card central (`Card` com `max-w-md`) contendo logo, campos de email/senha com `rounded-xl`, botão de entrar via `Button` (`variant="primary"`, `className="w-full"`). Lógica de submit (aceitar qualquer credencial) não muda.

- [ ] **Step 3: Verificar visualmente**

Run: com `npm run dev` ativo, `agent-browser` navega para `http://localhost:3000/funcionario/login`, faz login de teste, confirma redirecionamento pro dashboard, tira screenshot da sidebar.
Expected: login continua aceitando qualquer credencial e redirecionando; sidebar com fundo neutro atualizado.

- [ ] **Step 4: Commit**

```bash
git add app/funcionario/layout.tsx app/funcionario/login/page.tsx
git commit -m "style: redesign sidebar do funcionario e tela de login"
```

---

## Task 13: Restilizar dashboard do funcionário (`app/funcionario/dashboard/page.tsx`)

**Files:**
- Modify: `app/funcionario/dashboard/page.tsx`

**Interfaces:**
- Consumes: `Card`, `Badge`, `PageHeader`.
- Não altera as métricas exibidas nem a fonte dos dados (mockados).

- [ ] **Step 1: Ler `app/funcionario/dashboard/page.tsx` atual**

Run: abrir o arquivo pra identificar os blocos de métrica (clientes ativos, alertas de estoque, atividades recentes) e como são renderizados hoje.

- [ ] **Step 2: Aplicar tokens visuais**

Título via `PageHeader`; cada bloco de métrica em `Card`, com o número em destaque (`text-3xl font-semibold text-gray-900`) e o rótulo abaixo (`text-sm text-gray-500`); alertas de estoque crítico usam `Badge tone="red"`; lista de atividades recentes em `Card padding="none"` com cada item separado por `border-b border-gray-100` (última linha sem borda).

- [ ] **Step 3: Verificar visualmente**

Run: com `npm run dev` ativo e logado no painel, `agent-browser` navega para `http://localhost:3000/funcionario/dashboard` e tira screenshot.
Expected: métricas e alertas continuam exibindo os mesmos dados, com visual de cards consistente.

- [ ] **Step 4: Commit**

```bash
git add app/funcionario/dashboard/page.tsx
git commit -m "style: redesign dashboard do funcionario"
```

---

## Task 14: Restilizar clientes (`app/funcionario/clientes/page.tsx`)

**Files:**
- Modify: `app/funcionario/clientes/page.tsx`

**Interfaces:**
- Consumes: `Card`, `Badge`, `PageHeader`.
- Não altera a tabela de dados nem filtros/busca existentes.

- [ ] **Step 1: Ler `app/funcionario/clientes/page.tsx` atual**

Run: abrir o arquivo pra identificar a estrutura da tabela e status de cliente exibidos.

- [ ] **Step 2: Aplicar tokens visuais**

Título via `PageHeader`; tabela envolvida em `Card padding="none"`, cabeçalho da tabela em `bg-gray-50 text-gray-500 text-xs uppercase`, linhas com `hover:bg-gray-50` e `border-b border-gray-100`; status do cliente exibido via `Badge` (tone conforme o status: ativo → `green`, inativo → `gray`, etc., mantendo os mesmos status já usados no código).

- [ ] **Step 3: Verificar visualmente**

Run: com `npm run dev` ativo e logado, `agent-browser` navega para `http://localhost:3000/funcionario/clientes` e tira screenshot.
Expected: tabela renderiza os mesmos clientes/dados, com visual atualizado.

- [ ] **Step 4: Commit**

```bash
git add app/funcionario/clientes/page.tsx
git commit -m "style: redesign tela de clientes"
```

---

## Task 15: Restilizar estoque/produtos (`app/funcionario/produtos/page.tsx`)

**Files:**
- Modify: `app/funcionario/produtos/page.tsx`

**Interfaces:**
- Consumes: `Card`, `Badge`, `Button`, `PageHeader`.
- Não altera a lógica de alteração de quantidade em estoque nem a adição de novos produtos.

- [ ] **Step 1: Ler `app/funcionario/produtos/page.tsx` atual**

Run: abrir o arquivo pra identificar os botões rápidos de alteração de quantidade, alertas de estoque baixo e o formulário/modal de adicionar produto.

- [ ] **Step 2: Aplicar tokens visuais**

Título via `PageHeader` com `action` = `Button` "Adicionar produto"; tabela/lista de produtos em `Card padding="none"`, mesmo padrão de `bg-gray-50` no cabeçalho da Task 14; botões de incrementar/decrementar quantidade viram `Button variant="ghost" size="sm"`; alerta de estoque baixo via `Badge tone="red"`.

- [ ] **Step 3: Verificar visualmente**

Run: com `npm run dev` ativo e logado, `agent-browser` navega para `http://localhost:3000/funcionario/produtos`, testa alterar a quantidade de um item, tira screenshot.
Expected: alteração de quantidade continua funcionando, alerta de estoque baixo aparece corretamente, visual atualizado.

- [ ] **Step 4: Commit**

```bash
git add app/funcionario/produtos/page.tsx
git commit -m "style: redesign tela de estoque/produtos"
```

---

## Task 16: Restilizar chamados (`app/funcionario/chamados/page.tsx`)

**Files:**
- Modify: `app/funcionario/chamados/page.tsx`

**Interfaces:**
- Consumes: `Card`, `Badge`, `PageHeader`.
- Não altera a lógica de atendimento/troca de mensagens.

- [ ] **Step 1: Ler `app/funcionario/chamados/page.tsx` atual**

Run: abrir o arquivo pra identificar a lista de chamados por setor e a interface de chat do funcionário.

- [ ] **Step 2: Aplicar tokens visuais**

Título via `PageHeader`; lista de chamados (coluna lateral) em itens `Card padding="sm" hoverable`, com setor exibido via `Badge`; painel de chat ativo segue o mesmo padrão de bolhas definido na Task 10 (`DuvidasChat`) para consistência entre o chat do cliente e o do funcionário.

- [ ] **Step 3: Verificar visualmente**

Run: com `npm run dev` ativo e logado, `agent-browser` navega para `http://localhost:3000/funcionario/chamados` e tira screenshot.
Expected: lista de chamados e chat continuam funcionais, visual consistente com o resto do painel.

- [ ] **Step 4: Commit**

```bash
git add app/funcionario/chamados/page.tsx
git commit -m "style: redesign tela de chamados"
```

---

## Task 17: Verificação final ponta-a-ponta

**Files:**
- (nenhum arquivo novo — task de verificação)

**Interfaces:**
- N/A

- [ ] **Step 1: Rodar checagem de tipos completa**

Run: `npx tsc --noEmit`
Expected: nenhum erro.

- [ ] **Step 2: Build de produção**

Run: `npm run build`
Expected: build completa sem erros.

- [ ] **Step 3: Passeio completo com `agent-browser`**

Navegar por todas as rotas (`/`, `/projeto`, `/duvidas`, `/agendamento`, `/produto/[id]`, `/funcionario/login`, `/funcionario/dashboard`, `/funcionario/clientes`, `/funcionario/produtos`, `/funcionario/chamados`) tirando screenshot de cada uma.
Expected: todas renderizam com o novo visual, nenhuma funcionalidade quebrada (busca, chat, wizard, mapa, login, CRUD de estoque).

- [ ] **Step 4: Commit final (se houver ajustes de última hora)**

```bash
git add -A
git commit -m "style: ajustes finais do redesign visual"
```
