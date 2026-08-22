# Entrevista guiada (perfil do cliente) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar uma "entrevista guiada" na aba Minha Conta — 5 perguntas fixas de múltipla escolha que traçam um perfil do cliente, salvo localmente, gerando sugestões determinísticas de produtos do catálogo real e de serviços do app (agendamento, tire dúvidas, projeto guiado).

**Architecture:** Perguntas e pontuação são 100% client-side/determinísticas (sem IA). Um novo tipo `Perfil` é persistido em `localStorage` por email (mesmo padrão de `clientContas.ts`). A pontuação de produtos roda no servidor (precisa do catálogo completo de 1000 produtos, que só é acessível via `carregarProdutos()`), numa nova rota `POST /api/perfil/sugestoes` que reaproveita a lógica pura de `lib/perfilSugestoes.ts`. Um novo componente `EntrevistaGuiada.tsx` (formulário de página única + resultado) é inserido no topo de `app/conta/page.tsx`.

**Tech Stack:** Next.js 14 App Router, React (client components), TypeScript, Tailwind CSS, sem framework de testes (verificação via `npx tsc --noEmit`, scripts `tsx` descartáveis, e `agent-browser`). Sem chamada de IA em nenhum ponto desta feature.

## Global Constraints

- Perguntas são fixas (não geradas por IA, não adaptativas) — 5 perguntas exatas definidas na spec.
- Motor de sugestão é 100% determinístico — nenhuma chamada ao Gemini nesta feature.
- Área selecionada é **filtro obrigatório** sobre `categoria` do produto (não apenas peso na pontuação) — só produtos de categorias relevantes às áreas escolhidas podem aparecer.
- Perfil respondido persiste em `localStorage` por email (mesmo padrão de `lib/clientContas.ts`), com opção de refazer (substitui o perfil salvo, não faz merge).
- Máximo 3 áreas selecionáveis por vez.
- A seção só aparece pra cliente logado, mesma regra de acesso do resto de `/conta`.
- Não alterar `SuggestBanner.tsx`, `useSuggestAgent.ts`, `useProductTracker.ts` (sistema de sugestão por comportamento, independente desta feature).
- Sem framework de testes: lógica pura verificada via script `tsx` temporário; UI verificada via `npx tsc --noEmit` + `agent-browser`.

---

### Task 1: Tipos e persistência do perfil

**Files:**
- Create: `types/perfil.ts`
- Create: `lib/clientPerfil.ts`

**Interfaces:**
- Consumes: nada
- Produces (usado pelas Tasks 2-5):
  - Tipos: `Moradia`, `Experiencia`, `Area`, `Orcamento`, `SustentabilidadePreferencia`, `Perfil`, `ServicoSugerido` (todos de `types/perfil.ts`)
  - `export function salvarPerfil(email: string, perfil: Perfil): void`
  - `export function getPerfil(email: string): Perfil | null`
  - `export function limparPerfil(email: string): void`

- [ ] **Step 1: Criar `types/perfil.ts`**

```ts
export type Moradia = 'Casa' | 'Apartamento' | 'Sítio ou chácara' | 'Comércio'

export type Experiencia = 'Iniciante' | 'Intermediário' | 'Avançado' | 'Prefiro contratar um profissional'

export type Area =
  | 'Cozinha' | 'Banheiro' | 'Quarto' | 'Sala'
  | 'Jardim ou área externa' | 'Elétrica' | 'Iluminação' | 'Pintura'

export type Orcamento = 'Até R$500' | 'R$500–2.000' | 'R$2.000–5.000' | 'Acima de R$5.000'

export type SustentabilidadePreferencia = 'Pouco importante' | 'Importante, mas não decisivo' | 'Muito importante'

export interface Perfil {
  moradia: Moradia
  experiencia: Experiencia
  areas: Area[]
  orcamento: Orcamento
  sustentabilidade: SustentabilidadePreferencia
  respondidoEm: string
}

export interface ServicoSugerido {
  titulo: string
  descricao: string
  href: string
}
```

- [ ] **Step 2: Criar `lib/clientPerfil.ts`**

Mesmo padrão de `lib/clientContas.ts` (mapa por email normalizado em `localStorage`):

```ts
import type { Perfil } from '@/types/perfil'

const CHAVE = 'lm_perfil_cliente'

type Mapa = Record<string, Perfil>

function normalizar(email: string): string {
  return email.trim().toLowerCase()
}

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

export function salvarPerfil(email: string, perfil: Perfil): void {
  const mapa = lerMapa()
  mapa[normalizar(email)] = perfil
  salvarMapa(mapa)
}

export function getPerfil(email: string): Perfil | null {
  return lerMapa()[normalizar(email)] ?? null
}

export function limparPerfil(email: string): void {
  const mapa = lerMapa()
  delete mapa[normalizar(email)]
  salvarMapa(mapa)
}
```

- [ ] **Step 3: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add types/perfil.ts lib/clientPerfil.ts
git commit -m "feat: tipos e persistencia local do perfil da entrevista guiada"
```

---

### Task 2: Motor de sugestão (funções puras)

**Files:**
- Create: `lib/perfilSugestoes.ts`

**Interfaces:**
- Consumes: `Perfil`, `Area`, `Experiencia`, `Orcamento`, `ServicoSugerido` de `@/types/perfil` (Task 1); `Produto`, `Complexidade` de `@/types/produto` (já existe)
- Produces (usado pela Task 3):
  - `export const AREA_PARA_CATEGORIAS: Record<Area, string[]>`
  - `export const EXPERIENCIA_PARA_COMPLEXIDADE: Record<Experiencia, Complexidade[]>`
  - `export const ORCAMENTO_PARA_FAIXA: Record<Orcamento, [number, number]>`
  - `export function pontuarProduto(produto: Produto, perfil: Perfil): number`
  - `export function sugerirServicos(perfil: Perfil): ServicoSugerido[]`

- [ ] **Step 1: Criar `lib/perfilSugestoes.ts`**

```ts
import type { Perfil, Area, Experiencia, Orcamento, ServicoSugerido } from '@/types/perfil'
import type { Produto, Complexidade } from '@/types/produto'

export const AREA_PARA_CATEGORIAS: Record<Area, string[]> = {
  'Cozinha': ['Pisos e Cerâmica', 'Hidráulica', 'Elétrica', 'Iluminação'],
  'Banheiro': ['Banheiro', 'Hidráulica', 'Pisos e Cerâmica'],
  'Quarto': ['Decoração', 'Iluminação', 'Pintura'],
  'Sala': ['Decoração', 'Iluminação', 'Pintura'],
  'Jardim ou área externa': ['Jardim', 'Construção'],
  'Elétrica': ['Elétrica', 'Ferramentas'],
  'Iluminação': ['Iluminação'],
  'Pintura': ['Pintura'],
}

export const EXPERIENCIA_PARA_COMPLEXIDADE: Record<Experiencia, Complexidade[]> = {
  'Iniciante': ['Baixa', 'DIY'],
  'Intermediário': ['Baixa', 'DIY', 'Média'],
  'Avançado': ['Média', 'Alta', 'Profissional', 'Especialista'],
  'Prefiro contratar um profissional': ['Baixa', 'DIY', 'Média'],
}

export const ORCAMENTO_PARA_FAIXA: Record<Orcamento, [number, number]> = {
  'Até R$500': [0, 500],
  'R$500–2.000': [500, 2000],
  'R$2.000–5.000': [2000, 5000],
  'Acima de R$5.000': [5000, Infinity],
}

export function pontuarProduto(produto: Produto, perfil: Perfil): number {
  let pontos = 0
  if (EXPERIENCIA_PARA_COMPLEXIDADE[perfil.experiencia].includes(produto.complexidade)) pontos += 2
  const [min, max] = ORCAMENTO_PARA_FAIXA[perfil.orcamento]
  if (produto.preco >= min && produto.preco <= max) pontos += 1
  if (perfil.sustentabilidade === 'Muito importante' && (produto.sustentabilidade === 'Prata' || produto.sustentabilidade === 'Ouro')) pontos += 1
  if (produto.estoque > 0) pontos += 1
  return pontos
}

export function sugerirServicos(perfil: Perfil): ServicoSugerido[] {
  const servicos: ServicoSugerido[] = []
  if (perfil.experiencia === 'Prefiro contratar um profissional') {
    servicos.push({
      titulo: 'Agendar visita com especialista',
      descricao: 'Um consultor avalia seu projeto pessoalmente, sem custo.',
      href: '/agendamento',
    })
  }
  if (perfil.experiencia === 'Iniciante') {
    servicos.push({
      titulo: 'Tire suas dúvidas com a IA',
      descricao: 'Pergunte sobre materiais e técnicas antes de comprar.',
      href: '/duvidas',
    })
  }
  if (perfil.areas.length >= 2) {
    servicos.push({
      titulo: 'Monte um Projeto Guiado',
      descricao: 'Lista de materiais completa pra reformar mais de um cômodo de uma vez.',
      href: '/projeto',
    })
  }
  return servicos
}
```

- [ ] **Step 2: Escrever script temporário de verificação**

Criar `_tmp_perfil_sugestoes.ts` na raiz do projeto:

```ts
import { pontuarProduto, sugerirServicos } from './lib/perfilSugestoes'
import type { Produto } from './types/produto'
import type { Perfil } from './types/perfil'

function produtoFake(overrides: Partial<Produto>): Produto {
  return {
    id: 'LM-TEST',
    categoria: 'Ferramentas',
    produto: 'Produto teste',
    pergunta: '',
    resposta_ia: '',
    corredor: 'Corredor 01',
    corredor_normalizado: 'corredor-01',
    complexidade: 'DIY',
    especificacoes: '',
    tags: [],
    estoque: 5,
    preco: 100,
    sustentabilidade: 'N/A',
    embedding: [],
    embedding_text: '',
    ...overrides,
  }
}

function perfilFake(overrides: Partial<Perfil>): Perfil {
  return {
    moradia: 'Apartamento',
    experiencia: 'Intermediário',
    areas: ['Cozinha'],
    orcamento: 'R$500–2.000',
    sustentabilidade: 'Importante, mas não decisivo',
    respondidoEm: new Date().toISOString(),
    ...overrides,
  }
}

// Teste 1: experiencia compativel soma 2
const p1 = perfilFake({ experiencia: 'Iniciante' })
const prod1 = produtoFake({ complexidade: 'DIY', preco: 999999, sustentabilidade: 'N/A', estoque: 0 })
console.assert(pontuarProduto(prod1, p1) === 2, `FALHOU teste 1: esperado 2, obtido ${pontuarProduto(prod1, p1)}`)

// Teste 2: experiencia incompativel nao soma, mas orcamento+estoque somam
const prod2 = produtoFake({ complexidade: 'Especialista', preco: 800, sustentabilidade: 'N/A', estoque: 3 })
console.assert(pontuarProduto(prod2, p1) === 2, `FALHOU teste 2: esperado 2 (1 orcamento + 1 estoque), obtido ${pontuarProduto(prod2, p1)}`)

// Teste 3: todos os criterios batem = 2+1+1+1 = 5
const p3 = perfilFake({ experiencia: 'Avançado', sustentabilidade: 'Muito importante', orcamento: 'R$2.000–5.000' })
const prod3 = produtoFake({ complexidade: 'Alta', preco: 3000, sustentabilidade: 'Ouro', estoque: 10 })
console.assert(pontuarProduto(prod3, p3) === 5, `FALHOU teste 3: esperado 5, obtido ${pontuarProduto(prod3, p3)}`)

// Teste 4: sustentabilidade so soma se o perfil marcou "Muito importante"
const p4 = perfilFake({ sustentabilidade: 'Pouco importante' })
const prod4 = produtoFake({ complexidade: 'Baixa', preco: 100, sustentabilidade: 'Ouro', estoque: 1 })
console.assert(pontuarProduto(prod4, p4) === 2 + 1 + 1, `FALHOU teste 4: esperado 4 (sem bonus sustentabilidade), obtido ${pontuarProduto(prod4, p4)}`)

// Teste 5: sugerirServicos - "prefiro contratar" -> agendamento
const s1 = sugerirServicos(perfilFake({ experiencia: 'Prefiro contratar um profissional', areas: ['Cozinha'] }))
console.assert(s1.some(s => s.href === '/agendamento'), 'FALHOU teste 5: deveria sugerir /agendamento')
console.assert(!s1.some(s => s.href === '/duvidas'), 'FALHOU teste 5b: nao deveria sugerir /duvidas')

// Teste 6: sugerirServicos - "Iniciante" -> duvidas
const s2 = sugerirServicos(perfilFake({ experiencia: 'Iniciante', areas: ['Cozinha'] }))
console.assert(s2.some(s => s.href === '/duvidas'), 'FALHOU teste 6: deveria sugerir /duvidas')

// Teste 7: sugerirServicos - 2+ areas -> projeto guiado
const s3 = sugerirServicos(perfilFake({ areas: ['Cozinha', 'Banheiro'] }))
console.assert(s3.some(s => s.href === '/projeto'), 'FALHOU teste 7: deveria sugerir /projeto com 2+ areas')

// Teste 8: sugerirServicos - 1 area, experiencia Intermediario -> nenhum servico
const s4 = sugerirServicos(perfilFake({ areas: ['Cozinha'], experiencia: 'Intermediário' }))
console.assert(s4.length === 0, `FALHOU teste 8: esperado 0 servicos, obtido ${s4.length}`)

console.log('Todos os testes passaram (se não apareceu nenhuma linha "FALHOU" acima).')
```

- [ ] **Step 3: Rodar o script e verificar que passa**

Run: `npx tsx _tmp_perfil_sugestoes.ts`
Expected: só a linha `Todos os testes passaram (se não apareceu nenhuma linha "FALHOU" acima).` — nenhuma linha começando com `FALHOU`.

- [ ] **Step 4: Apagar o script temporário**

```bash
rm _tmp_perfil_sugestoes.ts
```

- [ ] **Step 5: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add lib/perfilSugestoes.ts
git commit -m "feat: motor deterministico de pontuacao e sugestao de servicos do perfil"
```

---

### Task 3: Rota de API `/api/perfil/sugestoes`

**Files:**
- Create: `app/api/perfil/sugestoes/route.ts`

**Interfaces:**
- Consumes: `AREA_PARA_CATEGORIAS`, `pontuarProduto`, `sugerirServicos` de `@/lib/perfilSugestoes` (Task 2); `Perfil` de `@/types/perfil` (Task 1); `carregarProdutos` de `@/lib/produtos` (já existe)
- Produces (usado pela Task 4): `POST /api/perfil/sugestoes` — body `{ perfil: Perfil }`, resposta `{ produtos: SearchResult[]; servicos: ServicoSugerido[] }` ou `{ error: string }` (status 500)

- [ ] **Step 1: Criar `app/api/perfil/sugestoes/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { carregarProdutos } from "@/lib/produtos";
import { AREA_PARA_CATEGORIAS, pontuarProduto, sugerirServicos } from "@/lib/perfilSugestoes";
import type { Perfil } from "@/types/perfil";

const MAX_SUGESTOES = 12;

export async function POST(req: NextRequest) {
  try {
    const { perfil } = (await req.json()) as { perfil: Perfil };
    const produtos = await carregarProdutos();

    const categoriasRelevantes = perfil.areas.flatMap((a) => AREA_PARA_CATEGORIAS[a] ?? []);
    const candidatos = produtos.filter((p) => categoriasRelevantes.includes(p.categoria));

    const porArea = new Map(
      perfil.areas.map((area) => [
        area,
        candidatos
          .filter((p) => AREA_PARA_CATEGORIAS[area].includes(p.categoria))
          .map((p) => ({ produto: p, pontos: pontuarProduto(p, perfil) }))
          .sort((a, b) => b.pontos - a.pontos),
      ])
    );

    const selecionados: { produto: Awaited<ReturnType<typeof carregarProdutos>>[number]; pontos: number }[] = [];
    const vistos = new Set<string>();
    let progresso = true;
    while (selecionados.length < MAX_SUGESTOES && progresso) {
      progresso = false;
      for (const area of perfil.areas) {
        const lista = porArea.get(area) ?? [];
        const proximo = lista.find((x) => !vistos.has(x.produto.id));
        if (proximo) {
          vistos.add(proximo.produto.id);
          selecionados.push(proximo);
          progresso = true;
          if (selecionados.length >= MAX_SUGESTOES) break;
        }
      }
    }

    const produtosResposta = selecionados.map(({ produto, pontos }) => {
      const { embedding: _e, embedding_text: _et, ...resto } = produto;
      return { produto: resto, score: pontos };
    });

    return NextResponse.json({ produtos: produtosResposta, servicos: sugerirServicos(perfil) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[POST /api/perfil/sugestoes]", msg);
    return NextResponse.json(
      { error: "Não foi possível gerar sugestões. Tente novamente." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Verificação manual da rota**

Run: `npm run dev` (background), poll com `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --max-time 3` em foreground até `200` (não espere por notificação de task em background pra isso).

Depois, teste a rota diretamente:
```bash
curl -s -X POST http://localhost:3000/api/perfil/sugestoes \
  -H "Content-Type: application/json" \
  -d '{"perfil":{"moradia":"Apartamento","experiencia":"Iniciante","areas":["Cozinha","Banheiro"],"orcamento":"R$500–2.000","sustentabilidade":"Muito importante","respondidoEm":"2026-08-23T00:00:00.000Z"}}'
```
Expected: JSON com `produtos` (array de até 12 itens, cada um com `produto.categoria` sendo "Pisos e Cerâmica", "Hidráulica", "Elétrica", "Iluminação" ou "Banheiro" — as categorias de Cozinha+Banheiro) e `servicos` (array contendo pelo menos os objetos com `href: "/duvidas"` e `href: "/projeto"`, já que o perfil de teste tem experiência "Iniciante" e 2 áreas).

Parar o servidor ao final. **Known gotcha:** `netstat -ano | grep ":3000" | grep LISTENING` — se algo aparecer, `taskkill //PID <pid> //F`.

- [ ] **Step 4: Commit**

```bash
git add app/api/perfil/sugestoes/route.ts
git commit -m "feat: rota de api para sugestoes de perfil da entrevista guiada"
```

---

### Task 4: Componente `EntrevistaGuiada.tsx`

**Files:**
- Create: `components/EntrevistaGuiada.tsx`
- Create temporário (apagado no final da task): `app/entrevista-preview-tmp/page.tsx`

**Interfaces:**
- Consumes: `salvarPerfil`, `getPerfil` de `@/lib/clientPerfil` (Task 1); `Perfil`, `Moradia`, `Experiencia`, `Area`, `Orcamento`, `SustentabilidadePreferencia`, `ServicoSugerido` de `@/types/perfil` (Task 1); `POST /api/perfil/sugestoes` (Task 3); `ProductCard` de `./ProductCard` (já existe); `Card`, `Button` de `./ui/Card`, `./ui/Button` (já existem)
- Produces (usado pela Task 5): `export default function EntrevistaGuiada({ email }: { email: string }): JSX.Element`

- [ ] **Step 1: Criar `components/EntrevistaGuiada.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, RotateCcw } from 'lucide-react'
import Card from './ui/Card'
import Button from './ui/Button'
import ProductCard from './ProductCard'
import { getPerfil, salvarPerfil } from '@/lib/clientPerfil'
import type { Perfil, Moradia, Experiencia, Area, Orcamento, SustentabilidadePreferencia, ServicoSugerido } from '@/types/perfil'
import type { SearchResult } from '@/types/produto'

const MORADIAS: Moradia[] = ['Casa', 'Apartamento', 'Sítio ou chácara', 'Comércio']
const EXPERIENCIAS: Experiencia[] = ['Iniciante', 'Intermediário', 'Avançado', 'Prefiro contratar um profissional']
const AREAS: Area[] = ['Cozinha', 'Banheiro', 'Quarto', 'Sala', 'Jardim ou área externa', 'Elétrica', 'Iluminação', 'Pintura']
const ORCAMENTOS: Orcamento[] = ['Até R$500', 'R$500–2.000', 'R$2.000–5.000', 'Acima de R$5.000']
const SUSTENTABILIDADES: SustentabilidadePreferencia[] = ['Pouco importante', 'Importante, mas não decisivo', 'Muito importante']

const MAX_AREAS = 3

interface ChipProps {
  label: string
  selecionado: boolean
  onClick: () => void
  disabled?: boolean
}

function Chip({ label, selecionado, onClick, disabled }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
        selecionado
          ? 'bg-lm-green text-white border-lm-green'
          : disabled
            ? 'bg-white text-gray-300 border-gray-100 cursor-not-allowed'
            : 'bg-white text-gray-500 border-gray-200 hover:border-lm-green/40'
      }`}
    >
      {label}
    </button>
  )
}

interface Resposta {
  moradia: Moradia | null
  experiencia: Experiencia | null
  areas: Area[]
  orcamento: Orcamento | null
  sustentabilidade: SustentabilidadePreferencia | null
}

const RESPOSTA_VAZIA: Resposta = {
  moradia: null,
  experiencia: null,
  areas: [],
  orcamento: null,
  sustentabilidade: null,
}

function respostaCompleta(r: Resposta): boolean {
  return !!(r.moradia && r.experiencia && r.areas.length > 0 && r.orcamento && r.sustentabilidade)
}

export default function EntrevistaGuiada({ email }: { email: string }) {
  const [modo, setModo] = useState<'convite' | 'formulario' | 'carregando' | 'resultado'>('convite')
  const [resposta, setResposta] = useState<Resposta>(RESPOSTA_VAZIA)
  const [produtos, setProdutos] = useState<SearchResult[]>([])
  const [servicos, setServicos] = useState<ServicoSugerido[]>([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    const perfil = getPerfil(email)
    if (perfil) {
      buscarSugestoes(perfil)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  async function buscarSugestoes(perfil: Perfil) {
    setModo('carregando')
    setErro('')
    try {
      const res = await fetch('/api/perfil/sugestoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfil }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setProdutos(data.produtos)
      setServicos(data.servicos)
      setModo('resultado')
    } catch (e: any) {
      setErro(e.message || 'Não foi possível gerar sugestões.')
      setModo('resultado')
    }
  }

  function toggleArea(area: Area) {
    setResposta(prev => {
      const jaSelecionada = prev.areas.includes(area)
      if (jaSelecionada) return { ...prev, areas: prev.areas.filter(a => a !== area) }
      if (prev.areas.length >= MAX_AREAS) return prev
      return { ...prev, areas: [...prev.areas, area] }
    })
  }

  function enviar() {
    if (!respostaCompleta(resposta)) return
    const perfil: Perfil = {
      moradia: resposta.moradia!,
      experiencia: resposta.experiencia!,
      areas: resposta.areas,
      orcamento: resposta.orcamento!,
      sustentabilidade: resposta.sustentabilidade!,
      respondidoEm: new Date().toISOString(),
    }
    salvarPerfil(email, perfil)
    buscarSugestoes(perfil)
  }

  function refazer() {
    setResposta(RESPOSTA_VAZIA)
    setModo('formulario')
  }

  if (modo === 'convite') {
    return (
      <Card className="bg-lm-green/5 border-lm-green/20">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-lm-green" />
          <h2 className="text-sm font-bold text-gray-900">Entrevista guiada</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Responda 5 perguntas rápidas e receba sugestões de produtos e serviços pensadas pra você.
        </p>
        <Button variant="primary" size="sm" onClick={() => setModo('formulario')}>
          Começar entrevista
        </Button>
      </Card>
    )
  }

  if (modo === 'formulario') {
    return (
      <Card>
        <h2 className="text-sm font-bold text-gray-900 mb-4">Entrevista guiada</h2>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Qual é o seu tipo de moradia?</p>
            <div className="flex flex-wrap gap-2">
              {MORADIAS.map(m => (
                <Chip key={m} label={m} selecionado={resposta.moradia === m} onClick={() => setResposta(prev => ({ ...prev, moradia: m }))} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Qual seu nível de experiência com reforma/manutenção?</p>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCIAS.map(e => (
                <Chip key={e} label={e} selecionado={resposta.experiencia === e} onClick={() => setResposta(prev => ({ ...prev, experiencia: e }))} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Quais áreas você mais quer melhorar agora? (até 3)</p>
            <div className="flex flex-wrap gap-2">
              {AREAS.map(a => (
                <Chip
                  key={a}
                  label={a}
                  selecionado={resposta.areas.includes(a)}
                  onClick={() => toggleArea(a)}
                  disabled={!resposta.areas.includes(a) && resposta.areas.length >= MAX_AREAS}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Qual sua faixa de orçamento típica pra um projeto?</p>
            <div className="flex flex-wrap gap-2">
              {ORCAMENTOS.map(o => (
                <Chip key={o} label={o} selecionado={resposta.orcamento === o} onClick={() => setResposta(prev => ({ ...prev, orcamento: o }))} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">O quanto sustentabilidade pesa nas suas escolhas?</p>
            <div className="flex flex-wrap gap-2">
              {SUSTENTABILIDADES.map(s => (
                <Chip key={s} label={s} selecionado={resposta.sustentabilidade === s} onClick={() => setResposta(prev => ({ ...prev, sustentabilidade: s }))} />
              ))}
            </div>
          </div>
        </div>

        <Button variant="primary" className="mt-5 w-full" onClick={enviar} disabled={!respostaCompleta(resposta)}>
          Ver sugestões
        </Button>
      </Card>
    )
  }

  if (modo === 'carregando') {
    return (
      <Card className="text-center">
        <div className="flex justify-center mb-3">
          <div className="w-10 h-10 border-4 border-lm-green/20 border-t-lm-green rounded-full animate-spin" />
        </div>
        <p className="text-sm font-semibold text-gray-900">Montando suas sugestões...</p>
      </Card>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Sugestões pra você</h2>
        <Button variant="ghost" size="sm" onClick={refazer}>
          <RotateCcw size={14} /> Refazer entrevista
        </Button>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 mb-4">{erro}</div>
      )}

      {!erro && servicos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {servicos.map(s => (
            <Link
              key={s.href}
              href={s.href}
              className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-lm-green/40 transition-colors"
            >
              <p className="text-sm font-semibold text-gray-900">{s.titulo}</p>
              <p className="text-xs text-gray-500 mt-1">{s.descricao}</p>
            </Link>
          ))}
        </div>
      )}

      {!erro && produtos.length === 0 && (
        <p className="text-sm text-gray-500 py-6">
          Nenhum produto encontrado pro seu perfil ainda — tente outras áreas na próxima entrevista.
        </p>
      )}

      {!erro && produtos.length > 0 && (
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
}
```

- [ ] **Step 2: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Criar página temporária de preview**

Criar `app/entrevista-preview-tmp/page.tsx` (nome sem underscore inicial — pastas com `_` são excluídas do roteamento do Next.js App Router e dariam 404):

```tsx
'use client'

import EntrevistaGuiada from '@/components/EntrevistaGuiada'

export default function EntrevistaPreviewPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <EntrevistaGuiada email="preview@teste.com" />
    </div>
  )
}
```

- [ ] **Step 4: Subir o servidor e conferir visualmente**

Run: `npm run dev` (background), poll em foreground com `curl` até `200` (não espere notificação de background pra isso — causa travamento conhecido nesta sessão).

Via `agent-browser` em `http://localhost:3000/entrevista-preview-tmp`:
1. Confirmar que aparece o card de convite "Entrevista guiada" com botão "Começar entrevista".
2. Clicar — confirmar que aparecem as 5 perguntas, cada uma com os chips corretos.
3. Confirmar que "Ver sugestões" está desabilitado com o formulário vazio.
4. Marcar 4 áreas em sequência — confirmar que a 4ª não marca (chips não selecionados ficam desabilitados/acinzentados depois de 3 marcadas) e que desmarcar uma libera espaço pra marcar outra.
5. Responder todas as 5 perguntas (moradia, experiência, 2 áreas, orçamento, sustentabilidade) e clicar "Ver sugestões" — confirmar que mostra "Montando suas sugestões..." e depois a tela de resultado com cards de serviço (se aplicável à combinação escolhida) e grid de produtos cujas categorias batem com as áreas escolhidas.
6. Clicar numa foto de produto — confirmar que navega pra `/produto/[id]` normalmente (comportamento já existente do `ProductCard`, não deveria quebrar).
7. Voltar, clicar "Refazer entrevista" — confirmar que volta pro formulário vazio.
8. Recarregar a página (F5) sem responder de novo — confirmar que carrega direto a tela de resultado (perfil persistiu em localStorage) em vez do convite inicial.

Parar o servidor ao final. **Known gotcha:** `netstat -ano | grep ":3000" | grep LISTENING` — se algo aparecer, `taskkill //PID <pid> //F`.

- [ ] **Step 5: Apagar a página de preview temporária**

```bash
rm -rf app/entrevista-preview-tmp
```

- [ ] **Step 6: Rodar type-check final**

Run: `rm -rf .next && npx tsc --noEmit` (o `.next` precisa ser limpo porque o Next.js gera tipos de rota em `.next/types/` que ficam referenciando a pasta apagada — gotcha já conhecido neste projeto).
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add components/EntrevistaGuiada.tsx
git commit -m "feat: componente da entrevista guiada com formulario e resultado"
```

---

### Task 5: Integração em `app/conta/page.tsx`

**Files:**
- Modify: `app/conta/page.tsx`

**Interfaces:**
- Consumes: `EntrevistaGuiada` de `@/components/EntrevistaGuiada` (Task 4)
- Produces: nada novo

- [ ] **Step 1: Adicionar o import**

Texto atual (linhas 1-16):
```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Package } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import ProductCard from '@/components/ProductCard'
import ProductCardSkeleton from '@/components/ProductCardSkeleton'
import Pagination from '@/components/ui/Pagination'
import { getFavoritosIds } from '@/lib/clientFavoritos'
import { getHistoricoIds } from '@/lib/clientHistorico'
import { getUsuarioLogado, logoutUsuario, type UsuarioLogado } from '@/lib/clientAuth'
import { getPedidos, type Pedido } from '@/lib/clientPedidos'
import { buscarProdutosPorIds } from '@/lib/produtosCliente'
import type { SearchResult } from '@/types/produto'
```

Novo texto:
```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Package } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import ProductCard from '@/components/ProductCard'
import ProductCardSkeleton from '@/components/ProductCardSkeleton'
import Pagination from '@/components/ui/Pagination'
import EntrevistaGuiada from '@/components/EntrevistaGuiada'
import { getFavoritosIds } from '@/lib/clientFavoritos'
import { getHistoricoIds } from '@/lib/clientHistorico'
import { getUsuarioLogado, logoutUsuario, type UsuarioLogado } from '@/lib/clientAuth'
import { getPedidos, type Pedido } from '@/lib/clientPedidos'
import { buscarProdutosPorIds } from '@/lib/produtosCliente'
import type { SearchResult } from '@/types/produto'
```

- [ ] **Step 2: Inserir o componente entre o header e "Meus pedidos"**

Texto atual:
```tsx
        <PageHeader
          title="Minha Conta"
          description={`Olá, ${usuario.nome ?? usuario.email}`}
          action={
            <Button variant="ghost" size="sm" onClick={handleSair}>
              <LogOut size={16} />
              Sair
            </Button>
          }
        />
        <SecaoPedidos pedidos={pedidos} />
```

Novo texto:
```tsx
        <PageHeader
          title="Minha Conta"
          description={`Olá, ${usuario.nome ?? usuario.email}`}
          action={
            <Button variant="ghost" size="sm" onClick={handleSair}>
              <LogOut size={16} />
              Sair
            </Button>
          }
        />
        <EntrevistaGuiada email={usuario.email} />
        <SecaoPedidos pedidos={pedidos} />
```

- [ ] **Step 3: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Verificação manual com login real**

Run: `npm run dev` (background), poll em foreground até `200`.

Via `agent-browser`:
1. Ir em `/funcionario/login`, cadastrar um cliente novo (ou logar com um já existente) — usar a aba Cliente.
2. Confirmar que `/conta` carrega e mostra "Olá, {nome}" seguido do card "Entrevista guiada" (convite), antes de "Meus pedidos".
3. Responder a entrevista completa e confirmar que as sugestões aparecem entre o cabeçalho e "Meus pedidos" — sem quebrar o layout das seções existentes (Pedidos/Favoritos/Vistos recentemente continuam normais abaixo).
4. Fazer logout e login de novo com o mesmo usuário — confirmar que o perfil respondido persistiu (mostra direto o resultado, não o convite).

Parar o servidor ao final. **Known gotcha:** verificar porta 3000 livre depois.

- [ ] **Step 5: Commit**

```bash
git add app/conta/page.tsx
git commit -m "feat: integra entrevista guiada na pagina Minha Conta"
```

---

### Task 6: Verificação final ponta a ponta

**Files:** nenhum arquivo novo — executa a aplicação e confirma os cenários da spec (`docs/superpowers/specs/2026-08-23-entrevista-guiada-design.md`, seção "Testes"). Se algum cenário falhar, corrigir no arquivo relevante antes de considerar a task concluída.

**Interfaces:**
- Consumes: fluxo completo integrado nas Tasks 1-5
- Produces: nada novo

- [ ] **Step 1: Subir o servidor**

Run: `npm run dev` (background), poll em foreground até `200`.

- [ ] **Step 2: Cenário de área única com poucas categorias**

Via `agent-browser`, logado como cliente, responder a entrevista escolhendo só a área "Iluminação" (a única área cujo mapeamento em `AREA_PARA_CATEGORIAS` tem uma única categoria — `['Iluminação']` — então é o caso realista de menor variedade de candidatos).
Expected: a lista de produtos aparece, todos de categoria "Iluminação", grid renderiza corretamente mesmo com menos de 12 itens (sem colunas quebradas ou espaços vazios estranhos).

**Nota:** como a área é um filtro por categoria (não por orçamento/experiência, que só pontuam), a mensagem "Nenhum produto encontrado" do componente é uma defesa pra um caso que não deve acontecer com o catálogo atual (todas as 10 categorias têm ~100 produtos). Não force esse estado artificialmente — só confirme por leitura do código (`components/EntrevistaGuiada.tsx`, branch `produtos.length === 0`) que o texto existe e não quebra o layout se algum dia `candidatos` vier vazio (ex: categoria mapeada com nome errado, ou catálogo futuro sem produtos numa categoria).

- [ ] **Step 3: Cenário serviços combinados**

Responder com experiência "Prefiro contratar um profissional" e 3 áreas selecionadas.
Expected: aparecem os 2 cards de serviço juntos — "Agendar visita com especialista" (`/agendamento`) e "Monte um Projeto Guiado" (`/projeto`) — e clicar em cada um navega pra rota correta sem erro 404.

- [ ] **Step 4: Responsividade mobile (390×844)**

Repetir o cenário do Step 3 (ou similar) nesse viewport.
Expected: os grupos de chips quebram linha sem overflow horizontal, os cards de serviço empilham em 1 coluna, o grid de produtos cai pra 2 colunas — sem elementos cortados.

- [ ] **Step 5: Modo escuro**

Ativar via `ThemeToggle` no `NavBar`, repetir o cenário do Step 3.
Expected: chips (ativos, inativos, desabilitados), card de convite, cards de serviço e grid de produtos continuam legíveis, sem fundo branco vazando.

- [ ] **Step 6: Parar o servidor e confirmar porta livre**

```bash
netstat -ano | grep ":3000" | grep LISTENING
```
Se retornar algo, `taskkill //PID <pid> //F`.

- [ ] **Step 7: Build de produção**

Run: `npm run build`
Expected: build conclui sem erro. Depois: `rm -rf .next` (gotcha conhecido de cache misto entre build e dev).
