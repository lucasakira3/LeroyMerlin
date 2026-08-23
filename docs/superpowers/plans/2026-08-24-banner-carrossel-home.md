# Carrossel de banner na home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o banner promocional único e estático da home por um carrossel de 4 slides com troca automática, cada um clicável levando pra uma tela real do app (incluindo abrir uma categoria, que não é uma rota de URL nesse projeto).

**Architecture:** Novo componente `components/BannerCarrossel.tsx`, autocontido (dados dos 4 slides, timer de auto-rotação, dots, lógica de clique) — recebe uma única prop (`onCategoriaClick`) do componente pai pra lidar com o único slide cuja ação não é navegação de URL. `app/page.tsx` troca o bloco de banner atual por esse componente.

**Tech Stack:** Next.js 14 App Router, React (client component), TypeScript, Tailwind CSS, `lucide-react`/`next/link` (já são dependências), sem framework de testes.

## Global Constraints

- 4 slides fixos no código (sem CMS/admin) — conteúdo exato definido na spec.
- Troca automática a cada 5000ms, pausa enquanto o mouse estiver sobre o banner, reinicia o timer a cada troca (manual ou automática).
- Slide 1 (categoria "Ferramentas") não navega por URL — chama a prop `onCategoriaClick` recebida do pai, já que não existe rota por categoria neste projeto (categorias são estado local em `app/page.tsx`).
- Slides 2-4 usam `<Link>` normal pras rotas reais `/projeto`, `/conta`, `/duvidas`.
- Clicar num dot nunca deve disparar a navegação/ação do slide.
- Sem framework de testes: verificação via `npx tsc --noEmit` + `agent-browser`.

---

### Task 1: Componente `BannerCarrossel.tsx`

**Files:**
- Create: `components/BannerCarrossel.tsx`
- Create temporário (apagado no final da task): `app/carrossel-preview-tmp/page.tsx`

**Interfaces:**
- Consumes: `getImagemCategoria` de `@/lib/categoriaImagens` (já existe)
- Produces (usado pela Task 2): `export default function BannerCarrossel({ onCategoriaClick }: { onCategoriaClick: (categoria: { slug: string; label: string }) => void }): JSX.Element`

- [ ] **Step 1: Criar `components/BannerCarrossel.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getImagemCategoria } from '@/lib/categoriaImagens'

type AcaoSlide =
  | { tipo: 'link'; href: string }
  | { tipo: 'categoria'; slug: string; label: string }

interface Slide {
  badge: string
  badgeClasse: string
  titulo: string
  subtitulo: string
  categoria: string
  acao: AcaoSlide
}

const SLIDES: Slide[] = [
  {
    badge: 'OFERTA DA SEMANA',
    badgeClasse: 'bg-lm-yellow text-black',
    titulo: 'Até 30% off',
    subtitulo: 'em ferramentas elétricas selecionadas',
    categoria: 'Ferramentas',
    acao: { tipo: 'categoria', slug: 'ferramentas', label: 'Ferramentas' },
  },
  {
    badge: 'NOVIDADE',
    badgeClasse: 'bg-white text-lm-green',
    titulo: 'Projeto Guiado',
    subtitulo: 'Descreva sua reforma, a IA monta a lista completa de materiais',
    categoria: 'Construção',
    acao: { tipo: 'link', href: '/projeto' },
  },
  {
    badge: 'PRA VOCÊ',
    badgeClasse: 'bg-white text-lm-green',
    titulo: 'Entrevista guiada',
    subtitulo: 'Responda 5 perguntas e receba sugestões pensadas pra você',
    categoria: 'Decoração',
    acao: { tipo: 'link', href: '/conta' },
  },
  {
    badge: '24H',
    badgeClasse: 'bg-white text-lm-green',
    titulo: 'Tire suas dúvidas',
    subtitulo: 'Pergunte sobre materiais e técnicas antes de comprar, com a IA',
    categoria: 'Jardim',
    acao: { tipo: 'link', href: '/duvidas' },
  },
]

const INTERVALO_MS = 5000

interface BannerCarrosselProps {
  onCategoriaClick: (categoria: { slug: string; label: string }) => void
}

export default function BannerCarrossel({ onCategoriaClick }: BannerCarrosselProps) {
  const [slide, setSlide] = useState(0)
  const [pausado, setPausado] = useState(false)

  useEffect(() => {
    if (pausado) return
    const id = setInterval(() => {
      setSlide(s => (s + 1) % SLIDES.length)
    }, INTERVALO_MS)
    return () => clearInterval(id)
  }, [slide, pausado])

  const atual = SLIDES[slide]

  const conteudo = (
    <div className="relative h-full flex flex-col justify-center px-6 sm:px-10 max-w-xs sm:max-w-sm">
      <span className={`inline-block w-fit text-[10px] font-extrabold px-2.5 py-1 rounded-md mb-2 tracking-wide ${atual.badgeClasse}`}>
        {atual.badge}
      </span>
      <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">{atual.titulo}</h1>
      <p className="text-sm text-white/85 mt-1">{atual.subtitulo}</p>
    </div>
  )

  return (
    <div
      className="relative h-40 sm:h-44 mb-8 overflow-hidden rounded-card bg-gradient-to-r from-green-800 to-lm-green"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getImagemCategoria(atual.categoria)}
        alt=""
        className="absolute -right-4 -top-2 h-[120%] w-3/5 object-cover"
      />

      {atual.acao.tipo === 'link' ? (
        <Link href={atual.acao.href} className="block h-full">
          {conteudo}
        </Link>
      ) : (
        <div className="h-full cursor-pointer" onClick={() => onCategoriaClick({ slug: atual.acao.slug, label: atual.acao.label })}>
          {conteudo}
        </div>
      )}

      <div className="absolute bottom-3 left-6 sm:left-10 flex items-center gap-1.5 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSlide(i)}
            aria-label={`Slide ${i + 1}`}
            className={`rounded-full transition-all ${i === slide ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/30 hover:bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  )
}
```

Nota: os dots (`<button>`) são posicionados de forma absoluta como irmãos do `Link`/`div` clicável, não aninhados dentro dele — por isso um clique num dot nunca borbulha pro clique do slide (não precisa de `stopPropagation`, o navegador só despacha o clique pro elemento realmente clicado e seus ancestrais reais no DOM).

- [ ] **Step 2: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Criar página temporária de preview**

Criar `app/carrossel-preview-tmp/page.tsx` (nome sem underscore inicial — pasta com `_` é rota privada excluída do roteamento do Next.js App Router, já causou 404 numa feature anterior deste projeto):

```tsx
'use client'

import { useState } from 'react'
import BannerCarrossel from '@/components/BannerCarrossel'

export default function CarrosselPreviewPage() {
  const [ultimaCategoria, setUltimaCategoria] = useState<string | null>(null)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <BannerCarrossel onCategoriaClick={(c) => setUltimaCategoria(c.label)} />
      <p className="mt-4 text-sm text-gray-600">
        Última categoria clicada: {ultimaCategoria ?? '(nenhuma)'}
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Subir o servidor e conferir visualmente**

Run: `npm run dev` (background), poll em foreground com `curl` até `200` (não espere notificação de background pra isso — gotcha conhecido desta sessão). Verificar `netstat -ano | grep ":3000" | grep LISTENING` antes de subir e matar qualquer processo que já esteja escutando.

Via `agent-browser` em `http://localhost:3000/carrossel-preview-tmp`:
1. Confirmar que o slide 1 ("Até 30% off") aparece primeiro, com badge amarelo.
2. Esperar >5s sem mexer o mouse — confirmar que trocou pro slide 2 ("Projeto Guiado") sozinho.
3. Passar o mouse por cima do banner e deixar por >6s — confirmar que NÃO trocou de slide enquanto o mouse está em cima.
4. Tirar o mouse de cima — confirmar que a troca automática volta a acontecer.
5. Clicar num dot que não é o atual — confirmar que troca imediatamente pro slide certo, e que não volta a trocar sozinho nos primeiros ~4s seguintes (o timer reiniciou).
6. Navegar de volta pro slide 1 (via dot) e clicar no corpo do banner (não no dot) — confirmar que o texto "Última categoria clicada" abaixo do banner muda pra "Ferramentas", **sem** a página navegar de URL (a URL continua `/carrossel-preview-tmp`).
7. Navegar pro slide 2 (via dot) e clicar no corpo do banner — confirmar que a URL muda pra `/projeto` (navegação real).
8. Confirmar visualmente que os 4 slides têm imagens de fundo diferentes (Ferramentas/Construção/Decoração/Jardim).

Parar o servidor ao final. **Known gotcha:** `netstat -ano | grep ":3000" | grep LISTENING` — se algo aparecer, `taskkill //PID <pid> //F` (o `TaskStop` da task em si não mata sempre o processo filho no Windows).

- [ ] **Step 5: Apagar a página de preview temporária**

```bash
rm -rf app/carrossel-preview-tmp
```

- [ ] **Step 6: Rodar type-check final**

Run: `rm -rf .next && npx tsc --noEmit` (limpar `.next` porque o Next.js gera tipos de rota que ficam referenciando a pasta apagada — gotcha já conhecido neste projeto).
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add components/BannerCarrossel.tsx
git commit -m "feat: carrossel de banner com 4 slides na home"
```

---

### Task 2: Integração em `app/page.tsx`

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `BannerCarrossel` de `@/components/BannerCarrossel` (Task 1)
- Produces: nada novo

- [ ] **Step 1: Adicionar o import**

Texto atual (linhas 1-8):
```tsx
'use client'

import { useState } from 'react'
import SearchSection from '@/components/SearchSection'
import CategoriaView from '@/components/CategoriaView'
import Card from '@/components/ui/Card'
import { Grid2x2, Zap, Droplets, Hammer, Palette, Flower2, Lightbulb, BrickWall, Frame } from 'lucide-react'
import { getImagemCategoria } from '@/lib/categoriaImagens'
```

Novo texto:
```tsx
'use client'

import { useState } from 'react'
import SearchSection from '@/components/SearchSection'
import CategoriaView from '@/components/CategoriaView'
import BannerCarrossel from '@/components/BannerCarrossel'
import Card from '@/components/ui/Card'
import { Grid2x2, Zap, Droplets, Hammer, Palette, Flower2, Lightbulb, BrickWall, Frame } from 'lucide-react'
import { getImagemCategoria } from '@/lib/categoriaImagens'
```

- [ ] **Step 2: Substituir o bloco de banner estático pelo carrossel**

Texto atual:
```tsx
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
```

Novo texto:
```tsx
      {/* Banner promocional */}
      <BannerCarrossel onCategoriaClick={setCategoriaAtiva} />
```

- [ ] **Step 3: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros. `setCategoriaAtiva` (já existe na linha 23 do arquivo, `useState<{ slug: string; label: string } | null>`) deve type-checkar direto contra a prop `onCategoriaClick: (categoria: { slug: string; label: string }) => void` — um `Dispatch` que aceita um domínio mais amplo (`| null`) é atribuível a uma prop que espera um domínio mais estreito, então nenhum ajuste deveria ser necessário. Se o TypeScript reclamar mesmo assim, reportar como BLOCKED em vez de forçar um cast — pode indicar que a suposição de compatibilidade está errada.

- [ ] **Step 4: Verificação manual na home de verdade**

Run: `npm run dev` (background), poll em foreground até `200`. Confirmar porta livre antes de subir.

Via `agent-browser` em `/`:
1. Confirmar que o carrossel aparece no lugar do banner antigo, com o mesmo visual geral (altura, cantos arredondados, gradiente verde).
2. Esperar a troca automática acontecer pelo menos uma vez.
3. Clicar no slide 1 (ou navegar até ele via dot) e clicar no corpo do banner — confirmar que a `CategoriaView` de "Ferramentas" abre **dentro da própria home** (mesmo comportamento de clicar num card de categoria no grid abaixo), sem mudar a URL.
4. Voltar (botão de voltar da `CategoriaView`), navegar até o slide 2 via dot, clicar no corpo — confirmar que navega de verdade pra `/projeto`.
5. Confirmar que o resto da home (grid de categorias, busca, barra de estatísticas) continua funcionando normalmente, sem quebra de layout abaixo do carrossel.

Parar o servidor ao final, confirmar porta livre.

- [ ] **Step 5: Responsividade mobile e modo escuro**

Via `agent-browser`, repetir uma passada rápida em viewport 390×844 (chips/badge não vazam da tela, texto não corta) e em modo escuro (ativar via `ThemeToggle` no `NavBar`) — o carrossel usa cores fixas (gradiente verde, texto branco) independentes de tema, então deve continuar legível sem nenhum ajuste novo, mas confirme visualmente.

- [ ] **Step 6: Build de produção**

Run: `npm run build`
Expected: build conclui sem erro. Depois: `rm -rf .next`.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx
git commit -m "feat: integra carrossel de banner na home"
```
