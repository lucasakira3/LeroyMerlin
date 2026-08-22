# Ícones de cômodo + seleção de cômodos no Projeto Guiado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um ícone por tipo de cômodo no mosaico do Projeto Guiado e deixar o cliente selecionar os cômodos do projeto antes de descrevê-lo, alimentando essa seleção como instrução explícita no prompt da IA.

**Architecture:** Um novo módulo `lib/comodoIcones.ts` centraliza a lista fixa de 8 cômodos e a função de lookup nome→ícone (mesmo padrão de match por palavra-chave já usado em `lib/marcas.ts`). `components/ProjetoWizard.tsx` ganha um passo anterior (seleção de cômodos, obrigatória) antes da tela de descrição livre que já existe. `app/api/projeto/route.ts` aceita os cômodos selecionados e injeta uma instrução extra na mesma chamada ao Gemini que já existe. `components/ProjetoMosaico.tsx` (já existe, do mosaico anterior) passa a mostrar o ícone no header de cada card.

**Tech Stack:** Next.js 14 App Router, React (client components), TypeScript, Tailwind CSS, `lucide-react` (já é dependência), Gemini 2.5 Flash (`lib/gemini.ts`), sem framework de testes (verificação via `npx tsc --noEmit`, scripts `tsx` descartáveis, e `agent-browser`).

## Global Constraints

- Lista de cômodos é fixa (8 opções: Cozinha, Banheiro, Quarto, Sala, Jardim ou Área externa, Garagem, Escritório, Casa toda / Geral) — sem campo de texto livre pra cômodo customizado.
- Seleção de cômodos é obrigatória (mínimo 1) antes de avançar pra tela de descrição.
- `comodos` é opcional no body de `POST /api/projeto` — se ausente ou vazio, o comportamento da rota deve ser idêntico ao de hoje (nenhuma instrução extra no prompt).
- Continua sendo uma única chamada ao `generateContent` — sem nova chamada de API, sem custo/latência extra.
- A lista `EXEMPLOS` do wizard não muda e não é filtrada pelos cômodos selecionados (fora de escopo).
- `getIconeComodo` é a única fonte de verdade pro mapeamento cômodo→ícone, usada tanto pelos chips do wizard quanto pelo header do card do mosaico.
- Sem framework de testes: verificação de lógica pura via script `tsx` temporário (escrito, rodado, apagado); verificação de UI via `npx tsc --noEmit` + `agent-browser`.

---

### Task 1: `lib/comodoIcones.ts` — lista de cômodos e ícones

**Files:**
- Create: `lib/comodoIcones.ts`

**Interfaces:**
- Consumes: `lucide-react` (já é dependência do projeto)
- Produces (usado pelas Tasks 3 e 4):
  - `export const COMODOS_DISPONIVEIS: readonly string[]` — os 8 nomes exatos de cômodo, nessa ordem: `'Cozinha'`, `'Banheiro'`, `'Quarto'`, `'Sala'`, `'Jardim ou Área externa'`, `'Garagem'`, `'Escritório'`, `'Casa toda / Geral'`
  - `export function getIconeComodo(comodo: string): LucideIcon` — resolve por palavra-chave (case-insensitive), cai em `LayoutGrid` se nada bater

- [ ] **Step 1: Criar o arquivo**

Criar `lib/comodoIcones.ts`:

```ts
import { ChefHat, Bath, BedDouble, Sofa, TreePine, Car, Briefcase, LayoutGrid, type LucideIcon } from 'lucide-react'

export const COMODOS_DISPONIVEIS = [
  'Cozinha',
  'Banheiro',
  'Quarto',
  'Sala',
  'Jardim ou Área externa',
  'Garagem',
  'Escritório',
  'Casa toda / Geral',
] as const

const ICONES_POR_COMODO: Record<string, LucideIcon> = {
  cozinha: ChefHat,
  banheiro: Bath,
  quarto: BedDouble,
  dormitorio: BedDouble,
  sala: Sofa,
  jardim: TreePine,
  varanda: TreePine,
  'área externa': TreePine,
  'area externa': TreePine,
  garagem: Car,
  escritorio: Briefcase,
  escritório: Briefcase,
}

export function getIconeComodo(comodo: string): LucideIcon {
  const lower = comodo.toLowerCase()
  const key = Object.keys(ICONES_POR_COMODO).find(k => lower.includes(k))
  return key ? ICONES_POR_COMODO[key] : LayoutGrid
}
```

- [ ] **Step 2: Escrever script temporário de verificação**

Criar `_tmp_comodo_icones.ts` na raiz do projeto:

```ts
import { getIconeComodo, COMODOS_DISPONIVEIS } from './lib/comodoIcones'
import { ChefHat, Bath, BedDouble, Sofa, TreePine, Car, Briefcase, LayoutGrid } from 'lucide-react'

const esperadoPorComodo: Record<string, unknown> = {
  'Cozinha': ChefHat,
  'Banheiro': Bath,
  'Quarto': BedDouble,
  'Sala': Sofa,
  'Jardim ou Área externa': TreePine,
  'Garagem': Car,
  'Escritório': Briefcase,
  'Casa toda / Geral': LayoutGrid,
}

for (const comodo of COMODOS_DISPONIVEIS) {
  const icone = getIconeComodo(comodo)
  console.assert(
    icone === esperadoPorComodo[comodo],
    `FALHOU: "${comodo}" deveria resolver pro icone esperado`
  )
}

console.assert(getIconeComodo('cozinha') === ChefHat, 'FALHOU: lowercase "cozinha"')
console.assert(getIconeComodo('BANHEIRO') === Bath, 'FALHOU: uppercase "BANHEIRO"')
console.assert(getIconeComodo('area externa') === TreePine, 'FALHOU: "area externa" sem acento')
console.assert(getIconeComodo('Reforma da Área Externa') === TreePine, 'FALHOU: frase contendo "área externa"')
console.assert(getIconeComodo('Escritorio') === Briefcase, 'FALHOU: "Escritorio" sem acento')
console.assert(getIconeComodo('Sótão') === LayoutGrid, 'FALHOU: comodo desconhecido deveria cair no fallback LayoutGrid')
console.assert(getIconeComodo('Geral') === LayoutGrid, 'FALHOU: "Geral" isolado (sem bater com nenhuma palavra-chave) deveria cair no fallback')

console.log('Todos os testes passaram (se não apareceu nenhuma linha "FALHOU" acima).')
```

- [ ] **Step 3: Rodar o script e verificar que passa**

Run: `npx tsx _tmp_comodo_icones.ts`
Expected: só a linha `Todos os testes passaram (se não apareceu nenhuma linha "FALHOU" acima).` — nenhuma linha começando com `FALHOU`.

- [ ] **Step 4: Apagar o script temporário**

```bash
rm _tmp_comodo_icones.ts
```

- [ ] **Step 5: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add lib/comodoIcones.ts
git commit -m "feat: mapa de icones por comodo para o projeto guiado"
```

---

### Task 2: `app/api/projeto/route.ts` — receber os cômodos selecionados

**Files:**
- Modify: `app/api/projeto/route.ts:57-67`

**Interfaces:**
- Consumes: nada novo
- Produces: `POST /api/projeto` aceita um campo opcional `comodos?: string[]` no body, além do `descricao` já existente

- [ ] **Step 1: Editar o início do handler `POST`**

Texto atual:
```ts
export async function POST(req: NextRequest) {
  try {
    const { descricao } = await req.json();
    if (!descricao?.trim()) {
      return NextResponse.json({ error: "Descreva seu projeto" }, { status: 400 });
    }

    const result = await flashModel.generateContent([
      PROMPT_SISTEMA,
      `Projeto do cliente: ${descricao}`,
    ]);
```

Novo texto:
```ts
export async function POST(req: NextRequest) {
  try {
    const { descricao, comodos } = await req.json();
    if (!descricao?.trim()) {
      return NextResponse.json({ error: "Descreva seu projeto" }, { status: 400 });
    }

    const mensagens: string[] = [PROMPT_SISTEMA];
    if (Array.isArray(comodos) && comodos.length > 0) {
      mensagens.push(
        `O cliente indicou que o projeto envolve os seguintes cômodos: ${comodos.join(", ")}. ` +
        `Use exatamente esses nomes no campo "comodo" dos itens que pertencerem a um deles. ` +
        `Para "Casa toda / Geral" ou itens que não pertencem a nenhum cômodo específico, use "Geral".`
      );
    }
    mensagens.push(`Projeto do cliente: ${descricao}`);

    const result = await flashModel.generateContent(mensagens);
```

- [ ] **Step 2: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add app/api/projeto/route.ts
git commit -m "feat: aceita comodos selecionados e reforca no prompt do projeto guiado"
```

---

### Task 3: `components/ProjetoWizard.tsx` — passo de seleção de cômodos

**Files:**
- Modify: `components/ProjetoWizard.tsx`

**Interfaces:**
- Consumes: `COMODOS_DISPONIVEIS`, `getIconeComodo` de `@/lib/comodoIcones` (Task 1); `POST /api/projeto` aceitando `comodos` (Task 2)
- Produces: nada novo (é uma tela, não uma interface consumida por outro arquivo)

- [ ] **Step 1: Atualizar os imports**

Texto atual (linhas 1-7):
```tsx
'use client'

import { useState, useRef } from 'react'
import { Mic, MicOff, Sparkles, Send, RotateCcw } from 'lucide-react'
import ListaDeCompras from './ListaDeCompras'
import Card from './ui/Card'
import Button from './ui/Button'
```

Novo texto:
```tsx
'use client'

import { useState, useRef } from 'react'
import { Mic, MicOff, Sparkles, Send, RotateCcw, ArrowLeft } from 'lucide-react'
import ListaDeCompras from './ListaDeCompras'
import Card from './ui/Card'
import Button from './ui/Button'
import { COMODOS_DISPONIVEIS, getIconeComodo } from '@/lib/comodoIcones'
```

- [ ] **Step 2: Adicionar o estado do passo do wizard e dos cômodos selecionados**

Texto atual:
```tsx
export default function ProjetoWizard() {
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)
  const [etapa, setEtapa] = useState('')
  const [resultado, setResultado] = useState<any>(null)
  const [erro, setErro] = useState('')
  const [ouvindo, setOuvindo] = useState(false)
  const recRef = useRef<SpeechRecognition | null>(null)
```

Novo texto:
```tsx
export default function ProjetoWizard() {
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)
  const [etapa, setEtapa] = useState('')
  const [resultado, setResultado] = useState<any>(null)
  const [erro, setErro] = useState('')
  const [ouvindo, setOuvindo] = useState(false)
  const recRef = useRef<SpeechRecognition | null>(null)
  const [etapaWizard, setEtapaWizard] = useState<'comodos' | 'descricao'>('comodos')
  const [comodosSelecionados, setComodosSelecionados] = useState<Set<string>>(new Set())

  function toggleComodo(comodo: string) {
    setComodosSelecionados(prev => {
      const next = new Set(prev)
      next.has(comodo) ? next.delete(comodo) : next.add(comodo)
      return next
    })
  }
```

- [ ] **Step 3: Mandar os cômodos selecionados na chamada da API**

Texto atual:
```tsx
      const res = await fetch('/api/projeto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: texto }),
      })
```

Novo texto:
```tsx
      const res = await fetch('/api/projeto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: texto, comodos: Array.from(comodosSelecionados) }),
      })
```

- [ ] **Step 4: Resetar o wizard no botão "Novo projeto"**

Texto atual:
```tsx
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setResultado(null); setDescricao('') }}
          className="mb-5"
        >
          <RotateCcw size={14} /> Novo projeto
        </Button>
```

Novo texto:
```tsx
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setResultado(null)
            setDescricao('')
            setEtapaWizard('comodos')
            setComodosSelecionados(new Set())
          }}
          className="mb-5"
        >
          <RotateCcw size={14} /> Novo projeto
        </Button>
```

- [ ] **Step 5: Substituir o `return` final por dois passos (cômodos e descrição)**

Texto atual (o `return` final do componente, depois do bloco `if (resultado) { ... }`):
```tsx
  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-lm-green/10 text-lm-green border border-lm-green/20 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
          <Sparkles size={14} /> Powered by Gemini AI
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Descreva seu projeto
        </h2>
        <p className="text-gray-500 text-sm">
          A IA analisa o que você precisa e monta a lista completa de materiais com os corredores da loja.
        </p>
      </div>

      {/* Input principal */}
      <Card className="mb-5 focus-within:ring-2 focus-within:ring-lm-green/30 transition-shadow">
```

Novo texto:
```tsx
  if (etapaWizard === 'comodos') {
    return (
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-lm-green/10 text-lm-green border border-lm-green/20 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Sparkles size={14} /> Powered by Gemini AI
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Quais cômodos você vai reformar?
          </h2>
          <p className="text-gray-500 text-sm">
            Selecione um ou mais cômodos — isso ajuda a IA a organizar sua lista de materiais por área da casa.
          </p>
        </div>

        <Card className="mb-5">
          <div className="flex flex-wrap gap-2 justify-center">
            {COMODOS_DISPONIVEIS.map(comodo => {
              const Icone = getIconeComodo(comodo)
              const selecionado = comodosSelecionados.has(comodo)
              return (
                <button
                  key={comodo}
                  onClick={() => toggleComodo(comodo)}
                  className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-full border transition-colors ${
                    selecionado
                      ? 'bg-lm-green text-white border-lm-green'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-lm-green/40'
                  }`}
                >
                  <Icone size={15} />
                  {comodo}
                </button>
              )
            })}
          </div>
        </Card>

        <div className="flex justify-center">
          <Button
            variant="primary"
            onClick={() => setEtapaWizard('descricao')}
            disabled={comodosSelecionados.size === 0}
          >
            Continuar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-lm-green/10 text-lm-green border border-lm-green/20 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
          <Sparkles size={14} /> Powered by Gemini AI
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Descreva seu projeto
        </h2>
        <p className="text-gray-500 text-sm">
          A IA analisa o que você precisa e monta a lista completa de materiais com os corredores da loja.
        </p>
      </div>

      {/* Recap dos cômodos + voltar */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <button
          onClick={() => setEtapaWizard('comodos')}
          className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-lm-green transition-colors flex-shrink-0"
        >
          <ArrowLeft size={13} /> Voltar
        </button>
        <div className="flex flex-wrap gap-1.5 justify-end">
          {Array.from(comodosSelecionados).map(comodo => {
            const Icone = getIconeComodo(comodo)
            return (
              <span
                key={comodo}
                className="flex items-center gap-1 text-[11px] font-semibold text-lm-green bg-lm-green/10 border border-lm-green/20 px-2.5 py-1 rounded-full"
              >
                <Icone size={12} />
                {comodo}
              </span>
            )
          })}
        </div>
      </div>

      {/* Input principal */}
      <Card className="mb-5 focus-within:ring-2 focus-within:ring-lm-green/30 transition-shadow">
```

Note: o restante do arquivo a partir daqui (o `<textarea>`, o botão de voz, "Analisar projeto", o bloco de Loading, o de Erro e o de Exemplos, até o fechamento final `</div>\n  )\n}`) **não muda** — só o trecho acima (hero + o que vem antes do `<Card>` de input) foi substituído pelos dois `return`s.

- [ ] **Step 6: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 7: Verificação manual do novo passo**

Run: `npm run dev` (background), confirmar porta 3000 respondendo (`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` → `200`) antes de prosseguir.

Via `agent-browser`, em `/projeto`:
1. Confirmar que a tela inicial mostra "Quais cômodos você vai reformar?" com 8 chips (Cozinha, Banheiro, Quarto, Sala, Jardim ou Área externa, Garagem, Escritório, Casa toda / Geral), cada um com ícone.
2. Confirmar que o botão "Continuar" está desabilitado sem nenhum chip marcado.
3. Marcar "Cozinha" e "Banheiro", confirmar que os dois ficam com o estilo ativo (fundo verde) e o botão "Continuar" habilita.
4. Clicar "Continuar" — confirmar que a tela muda pra "Descreva seu projeto", com um recap mostrando os chips "Cozinha" e "Banheiro" (com ícone) no canto e um link "Voltar".
5. Clicar "Voltar" — confirmar que volta pro passo de cômodos com Cozinha e Banheiro ainda marcados (seleção preservada).
6. Clicar "Continuar" de novo, escrever uma descrição (ex: "Reforma completa da cozinha e do banheiro") e clicar "Analisar projeto" — confirmar que o resultado carrega normalmente (mosaico + abas, já existentes de antes).
7. Clicar "Novo projeto" no resultado — confirmar que volta direto pro passo de cômodos, SEM nenhum chip marcado (seleção resetada).

Parar o servidor de dev ao final. **Known gotcha:** `netstat -ano | grep ":3000" | grep LISTENING` — se algo aparecer, `taskkill //PID <pid> //F`.

- [ ] **Step 8: Commit**

```bash
git add components/ProjetoWizard.tsx
git commit -m "feat: passo de selecao de comodos antes da descricao no projeto guiado"
```

---

### Task 4: `components/ProjetoMosaico.tsx` — ícone no header do card

**Files:**
- Modify: `components/ProjetoMosaico.tsx`

**Interfaces:**
- Consumes: `getIconeComodo` de `@/lib/comodoIcones` (Task 1)
- Produces: nada novo

- [ ] **Step 1: Adicionar o import**

Texto atual:
```tsx
import type { SearchResult } from '@/types/produto'
import { getImagemCategoria } from '@/lib/categoriaImagens'
import Badge from './ui/Badge'
import Card from './ui/Card'
```

Novo texto:
```tsx
import type { SearchResult } from '@/types/produto'
import { getImagemCategoria } from '@/lib/categoriaImagens'
import { getIconeComodo } from '@/lib/comodoIcones'
import Badge from './ui/Badge'
import Card from './ui/Card'
```

- [ ] **Step 2: Calcular o ícone e usá-lo no header do card**

Texto atual:
```tsx
      {gruposComProdutos.map(grupo => {
        const visiveis = grupo.produtosUnicos.slice(0, MAX_FOTOS_VISIVEIS)
        const restantes = grupo.produtosUnicos.length - visiveis.length

        return (
          <Card
            key={grupo.comodo}
            padding="sm"
            className={gruposComProdutos.length === 1 ? 'sm:col-span-2 lg:col-span-3' : ''}
          >
            <p className="text-sm font-bold text-gray-900 mb-3">{grupo.comodo}</p>
```

Novo texto:
```tsx
      {gruposComProdutos.map(grupo => {
        const visiveis = grupo.produtosUnicos.slice(0, MAX_FOTOS_VISIVEIS)
        const restantes = grupo.produtosUnicos.length - visiveis.length
        const IconeComodo = getIconeComodo(grupo.comodo)

        return (
          <Card
            key={grupo.comodo}
            padding="sm"
            className={gruposComProdutos.length === 1 ? 'sm:col-span-2 lg:col-span-3' : ''}
          >
            <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
              <IconeComodo size={15} className="text-lm-green flex-shrink-0" />
              {grupo.comodo}
            </p>
```

- [ ] **Step 3: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add components/ProjetoMosaico.tsx
git commit -m "feat: icone de comodo no header do card do mosaico"
```

---

### Task 5: Verificação final ponta a ponta

**Files:** nenhum arquivo novo — executa a aplicação e confirma os cenários da spec (`docs/superpowers/specs/2026-08-21-comodos-projeto-guiado-design.md`, seção "Testes"). Se algum cenário falhar, corrigir no arquivo relevante (`lib/comodoIcones.ts`, `app/api/projeto/route.ts`, `components/ProjetoWizard.tsx` ou `components/ProjetoMosaico.tsx`) antes de considerar a task concluída.

**Interfaces:**
- Consumes: fluxo completo integrado nas Tasks 1-4
- Produces: nada novo

- [ ] **Step 1: Subir o servidor de dev**

Run: `npm run dev` (background). Confirmar porta 3000 respondendo (`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` → `200`).

- [ ] **Step 2: Fluxo completo com múltiplos cômodos e verificação dos ícones no mosaico**

Via `agent-browser`, em `/projeto`: marcar "Cozinha" e "Banheiro", continuar, descrever "Quero reformar a cozinha e o banheiro da minha casa" e analisar.
Expected: o mosaico mostra cards de cômodo com ícone de talher/panela (`ChefHat`) pro card "Cozinha" (ou nome equivalente que a IA usar) e ícone de banheira (`Bath`) pro card "Banheiro" — confirmar visualmente que os ícones batem com o tipo de cômodo, não estão genéricos (`LayoutGrid`) pra esses dois.

- [ ] **Step 3: Cômodo "Casa toda / Geral"**

Marcar só "Casa toda / Geral", continuar, descrever "Preciso trocar toda a parte elétrica de uma casa de 80m²" e analisar.
Expected: o mosaico mostra um card cujo nome de cômodo é (ou contém) "Geral", com o ícone `LayoutGrid`.

- [ ] **Step 4: Responsividade mobile (390×844)**

Repetir o cenário do Step 2 nesse viewport (`agent-browser set viewport`).
Expected: os 8 chips do passo de seleção quebram linha corretamente sem overflow horizontal; o recap de cômodos + botão "Voltar" no passo de descrição não quebram o layout; os cards do mosaico com ícone continuam legíveis em 1 coluna.

- [ ] **Step 5: Modo escuro**

Ativar via `ThemeToggle` no `NavBar`, repetir o cenário do Step 2.
Expected: chips (ativos e inativos), recap de cômodos e ícones nos cards do mosaico continuam legíveis, sem fundo branco vazando (mesma cobertura de overrides `.dark` já usada pelo resto do app, ver `[[project-dev-workflow]]`).

- [ ] **Step 6: Parar o servidor e confirmar porta livre**

```bash
netstat -ano | grep ":3000" | grep LISTENING
```
Se retornar algo, `taskkill //PID <pid> //F`. Expected ao final: nenhuma saída.

- [ ] **Step 7: Build de produção**

Run: `npm run build`
Expected: build conclui sem erro. Depois: `rm -rf .next` (gotcha conhecido de cache misto entre build e dev, ver `[[project-dev-workflow]]`).
