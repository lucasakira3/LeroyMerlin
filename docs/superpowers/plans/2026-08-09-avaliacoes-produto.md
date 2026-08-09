# Avaliações de Produto (0-5 estrelas) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que o cliente logado avalie um produto com nota de 0 a 5 estrelas + comentário opcional, e que qualquer visitante veja a média e a lista de avaliações, dentro do `ProdutoDrawer`.

**Architecture:** Módulo de dados `lib/clientAvaliacoes.ts` (localStorage, mesmo padrão de `lib/clientFavoritos.ts`) + widget reutilizável `components/ui/StarRating.tsx` + seção autocontida `components/AvaliacoesProduto.tsx` integrada ao `ProdutoDrawer.tsx`.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, `lucide-react` (ícone `Star`), `localStorage` para persistência. Sem framework de testes (convenção do projeto) — verificação via `npx tsc --noEmit`, script `tsx` temporário e navegação manual com `agent-browser`.

## Global Constraints

- Sem chamadas de rede/backend — tudo em `localStorage`, seguindo o padrão defensivo (`try/catch`, no-op em SSR) de `lib/clientFavoritos.ts` e `lib/clientHistorico.ts`.
- Todo `<input>`/`<textarea>` precisa de classe `bg-white` explícita (gotcha de dark mode deste projeto — sem isso o campo fica branco fixo no modo escuro).
- Uma avaliação por email por produto (upsert), não uma lista ilimitada por usuário.
- Nota é inteiro 0-5 (não 1-5).
- Fora de escopo: nota nos cards de busca/categoria, visão no painel do funcionário, moderação/exclusão.

---

### Task 1: Módulo de dados `lib/clientAvaliacoes.ts`

**Files:**
- Create: `lib/clientAvaliacoes.ts`
- Test: script temporário `scratch-test-avaliacoes.ts` na raiz do projeto (escrito, rodado, apagado — sem framework de testes neste projeto)

**Interfaces:**
- Consumes: nada (módulo raiz, sem dependências internas)
- Produces:
  - `interface Avaliacao { email: string; nota: number; comentario?: string; data: string }`
  - `getAvaliacoes(produtoId: string): Avaliacao[]`
  - `getAvaliacaoDoUsuario(produtoId: string, email: string): Avaliacao | null`
  - `salvarAvaliacao(produtoId: string, email: string, nota: number, comentario?: string): void`
  - `getMedia(produtoId: string): { media: number; total: number }`

- [ ] **Step 1: Criar `lib/clientAvaliacoes.ts`**

```ts
const CHAVE = 'lm_avaliacoes_produtos'

export interface Avaliacao {
  email: string
  nota: number
  comentario?: string
  data: string
}

type Mapa = Record<string, Avaliacao[]>

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

export function getAvaliacoes(produtoId: string): Avaliacao[] {
  const mapa = lerMapa()
  return mapa[produtoId] ?? []
}

export function getAvaliacaoDoUsuario(produtoId: string, email: string): Avaliacao | null {
  const avaliacoes = getAvaliacoes(produtoId)
  return avaliacoes.find(a => a.email === email) ?? null
}

export function salvarAvaliacao(produtoId: string, email: string, nota: number, comentario?: string): void {
  const mapa = lerMapa()
  const avaliacoes = mapa[produtoId] ?? []
  const notaClamp = Math.max(0, Math.min(5, Math.round(nota)))
  const nova: Avaliacao = { email, nota: notaClamp, comentario: comentario?.trim() || undefined, data: new Date().toISOString() }
  const index = avaliacoes.findIndex(a => a.email === email)
  if (index === -1) {
    avaliacoes.push(nova)
  } else {
    avaliacoes[index] = nova
  }
  mapa[produtoId] = avaliacoes
  salvarMapa(mapa)
}

export function getMedia(produtoId: string): { media: number; total: number } {
  const avaliacoes = getAvaliacoes(produtoId)
  if (avaliacoes.length === 0) return { media: 0, total: 0 }
  const soma = avaliacoes.reduce((acc, a) => acc + a.nota, 0)
  return { media: soma / avaliacoes.length, total: avaliacoes.length }
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `lib/clientAvaliacoes.ts`

- [ ] **Step 3: Escrever script de verificação lógica temporário**

Create: `scratch-test-avaliacoes.ts` na raiz (fora de `lib/`, para não virar parte do app):

```ts
import { salvarAvaliacao, getAvaliacoes, getAvaliacaoDoUsuario, getMedia } from './lib/clientAvaliacoes'

// Simula localStorage em ambiente Node
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

assert(getMedia('LM-1').total === 0, 'produto sem avaliações tem total 0')

salvarAvaliacao('LM-1', 'a@x.com', 4, 'Bom produto')
salvarAvaliacao('LM-1', 'b@x.com', 0)
assert(getAvaliacoes('LM-1').length === 2, 'duas avaliações distintas de emails diferentes')
assert(getMedia('LM-1').media === 2, 'média de 4 e 0 é 2')

salvarAvaliacao('LM-1', 'a@x.com', 5, 'Mudei de ideia')
assert(getAvaliacoes('LM-1').length === 2, 'upsert não duplica avaliação do mesmo email')
assert(getAvaliacaoDoUsuario('LM-1', 'a@x.com')?.nota === 5, 'nota atualizada pelo upsert')
assert(getAvaliacaoDoUsuario('LM-1', 'a@x.com')?.comentario === 'Mudei de ideia', 'comentário atualizado')

salvarAvaliacao('LM-1', 'c@x.com', 7)
assert(getAvaliacaoDoUsuario('LM-1', 'c@x.com')?.nota === 5, 'nota é clampada em 5 no máximo')

console.log('Todos os testes passaram.')
```

- [ ] **Step 4: Rodar e verificar saída**

Run: `npx tsx scratch-test-avaliacoes.ts`
Expected: todas as linhas `OK:` impressas, terminando em `Todos os testes passaram.`, sem exceção lançada

- [ ] **Step 5: Apagar o script temporário**

Run: `rm scratch-test-avaliacoes.ts` (ou `Remove-Item scratch-test-avaliacoes.ts` no PowerShell)

- [ ] **Step 6: Commit**

```bash
git add lib/clientAvaliacoes.ts
git commit -m "feat: modulo de dados para avaliacoes de produto"
```

---

### Task 2: Widget `components/ui/StarRating.tsx`

**Files:**
- Create: `components/ui/StarRating.tsx`

**Interfaces:**
- Consumes: ícone `Star` de `lucide-react`
- Produces: `<StarRating value={number} onChange?={(n: number) => void} size?={number} />` — componente default export

- [ ] **Step 1: Criar `components/ui/StarRating.tsx`**

```tsx
'use client'

import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange?: (nota: number) => void
  size?: number
}

export default function StarRating({ value, onChange, size = 16 }: StarRatingProps) {
  const interativo = onChange !== undefined
  const arredondado = Math.round(value)

  return (
    <div className={`flex items-center gap-0.5 ${interativo ? '' : 'pointer-events-none'}`} role={interativo ? 'radiogroup' : undefined} aria-label={interativo ? 'Selecionar nota de 0 a 5 estrelas' : `Nota: ${value.toFixed(1)} de 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={!interativo}
          onClick={() => onChange?.(value === i ? 0 : i)}
          aria-label={`${i} estrela${i > 1 ? 's' : ''}`}
          aria-pressed={interativo ? arredondado === i : undefined}
          className={interativo ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            size={size}
            className={i <= arredondado ? 'fill-lm-yellow text-lm-yellow' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `components/ui/StarRating.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/ui/StarRating.tsx
git commit -m "feat: componente StarRating reutilizavel"
```

---

### Task 3: Seção `components/AvaliacoesProduto.tsx`

**Files:**
- Create: `components/AvaliacoesProduto.tsx`

**Interfaces:**
- Consumes:
  - `getUsuarioLogado(): { email: string } | null` de `lib/clientAuth.ts`
  - `getAvaliacoes`, `getAvaliacaoDoUsuario`, `salvarAvaliacao`, `Avaliacao` de `lib/clientAvaliacoes.ts` (Task 1) — `getMedia` fica disponível no módulo mas a média é recalculada localmente a partir do state `avaliacoes` para refletir mudanças sem reler o `localStorage`
  - `StarRating` de `components/ui/StarRating.tsx` (Task 2)
- Produces: `<AvaliacoesProduto produtoId={string} />` — componente default export, autocontido

- [ ] **Step 1: Criar `components/AvaliacoesProduto.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { getUsuarioLogado } from '@/lib/clientAuth'
import { getAvaliacoes, getAvaliacaoDoUsuario, salvarAvaliacao, type Avaliacao } from '@/lib/clientAvaliacoes'
import StarRating from './ui/StarRating'

function mascararEmail(email: string): string {
  const [nome, dominio] = email.split('@')
  if (!dominio) return email
  return `${nome.slice(0, 3)}***@${dominio}`
}

export default function AvaliacoesProduto({ produtoId }: { produtoId: string }) {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [usuario, setUsuario] = useState<{ email: string } | null>(null)
  const [notaForm, setNotaForm] = useState(0)
  const [comentarioForm, setComentarioForm] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    const logado = getUsuarioLogado()
    setUsuario(logado)
    setAvaliacoes(getAvaliacoes(produtoId))

    if (logado) {
      const existente = getAvaliacaoDoUsuario(produtoId, logado.email)
      setNotaForm(existente?.nota ?? 0)
      setComentarioForm(existente?.comentario ?? '')
    } else {
      setNotaForm(0)
      setComentarioForm('')
    }
  }, [produtoId])

  const { media, total } = (() => {
    if (avaliacoes.length === 0) return { media: 0, total: 0 }
    const soma = avaliacoes.reduce((acc, a) => acc + a.nota, 0)
    return { media: soma / avaliacoes.length, total: avaliacoes.length }
  })()

  const jaAvaliou = usuario ? avaliacoes.some(a => a.email === usuario.email) : false

  function enviar() {
    if (!usuario || enviando) return
    setEnviando(true)
    salvarAvaliacao(produtoId, usuario.email, notaForm, comentarioForm)
    setAvaliacoes(getAvaliacoes(produtoId))
    setEnviando(false)
  }

  const ordenadas = [...avaliacoes].sort((a, b) => b.data.localeCompare(a.data))

  return (
    <div className="px-5 py-4 border-b border-gray-100">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
        Avaliações
      </h3>

      <div className="flex items-center gap-2 mb-4">
        <StarRating value={media} size={18} />
        {total > 0 ? (
          <span className="text-sm text-gray-600">{media.toFixed(1)} · {total} avaliação{total > 1 ? 'ões' : ''}</span>
        ) : (
          <span className="text-sm text-gray-400 italic">Seja o primeiro a avaliar este produto</span>
        )}
      </div>

      {!usuario && (
        <p className="text-xs text-gray-400 italic mb-4">Faça login para avaliar este produto.</p>
      )}

      {usuario && (
        <div className="mb-4 p-3 rounded-xl bg-gray-50 flex flex-col gap-2">
          <StarRating value={notaForm} onChange={setNotaForm} size={22} />
          <textarea
            value={comentarioForm}
            onChange={e => setComentarioForm(e.target.value)}
            placeholder="Comentário (opcional)"
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lm-green/30 resize-none bg-white"
          />
          <button
            onClick={enviar}
            disabled={enviando}
            className="self-start px-4 py-1.5 rounded-lg bg-lm-green text-white text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {jaAvaliou ? 'Atualizar avaliação' : 'Enviar avaliação'}
          </button>
        </div>
      )}

      {ordenadas.length > 0 && (
        <div className="space-y-3">
          {ordenadas.map((a, i) => (
            <div key={i} className="border-t border-gray-100 pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <StarRating value={a.nota} size={13} />
                <span className="text-[11px] text-gray-400">{new Date(a.data).toLocaleDateString('pt-BR')}</span>
              </div>
              {a.comentario && <p className="text-sm text-gray-600 leading-relaxed mb-1">{a.comentario}</p>}
              <p className="text-[11px] text-gray-400">{mascararEmail(a.email)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `components/AvaliacoesProduto.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/AvaliacoesProduto.tsx
git commit -m "feat: secao de avaliacoes de produto"
```

---

### Task 4: Integrar no `ProdutoDrawer.tsx`

**Files:**
- Modify: `components/ProdutoDrawer.tsx`

**Interfaces:**
- Consumes: `<AvaliacoesProduto produtoId={string} />` de `components/AvaliacoesProduto.tsx` (Task 3)
- Produces: nada novo (integração final)

- [ ] **Step 1: Importar o componente**

Em `components/ProdutoDrawer.tsx`, adicionar ao bloco de imports (perto da linha 7, junto com `addAoHistorico`):

```tsx
import AvaliacoesProduto from './AvaliacoesProduto'
```

- [ ] **Step 2: Inserir a seção no drawer**

Em `components/ProdutoDrawer.tsx`, logo após o bloco de badges (Estoque/Complexidade/Sustentabilidade, que termina na linha 210 com `</div>`) e antes do bloco "O que o especialista diz" (linha 213 `{produto.resposta_ia && (`), inserir:

```tsx
        <AvaliacoesProduto produtoId={produto.id} />

```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 4: Commit**

```bash
git add components/ProdutoDrawer.tsx
git commit -m "feat: integra avaliacoes de produto ao drawer"
```

---

### Task 5: Verificação manual end-to-end

**Files:** nenhum (apenas verificação, sem alteração de código)

**Interfaces:**
- Consumes: app rodando localmente (`npm run dev`)
- Produces: confirmação visual de que a feature funciona nos dois temas e nos dois estados de login

- [ ] **Step 1: Subir o dev server limpo**

Run: `rm -rf .next && npm run dev` (conforme gotcha de cache do `.next` deste projeto — rodar em background)

- [ ] **Step 2: Verificar fluxo deslogado**

Via `agent-browser`: navegar até a home, abrir um produto (via busca ou categoria) para abrir o `ProdutoDrawer`, confirmar que a seção "Avaliações" aparece com o aviso "Faça login para avaliar este produto" e sem formulário.

- [ ] **Step 3: Verificar fluxo logado — criar avaliação**

Fazer login como cliente (`/funcionario/login`, toggle Cliente, qualquer email/senha), abrir o mesmo produto, selecionar uma nota (ex: 4 estrelas), escrever um comentário, clicar "Enviar avaliação". Confirmar que a média/lista atualiza imediatamente e a avaliação aparece na lista abaixo com email mascarado.

- [ ] **Step 4: Verificar edição**

Fechar e reabrir o drawer do mesmo produto (ou trocar de produto e voltar). Confirmar que o formulário já vem preenchido com a nota/comentário salvos e o botão mostra "Atualizar avaliação". Alterar a nota e reenviar; confirmar que não duplica entrada na lista.

- [ ] **Step 5: Verificar nota 0**

Clicar na estrela já selecionada para zerar a nota, enviar, confirmar que salva nota 0 (nenhuma estrela preenchida) sem erro.

- [ ] **Step 6: Verificar modo escuro**

Alternar o `ThemeToggle` para dark mode com o drawer de avaliações aberto (form preenchido). Confirmar que o textarea não fica com fundo branco fixo e que o texto/ícones têm contraste legível.

- [ ] **Step 7: Screenshot final**

Via `agent-browser`, tirar screenshot da seção de avaliações preenchida (claro e escuro) para conferência visual.
