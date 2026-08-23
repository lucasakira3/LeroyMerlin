# Aba de notificações do usuário Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar visibilidade a três eventos reais que hoje acontecem silenciosamente no app (pedido confirmado, visita agendada, entrevista guiada respondida) via um sino com painel suspenso na `NavBar`, contando notificações não lidas por conta.

**Architecture:** Módulo de persistência `lib/clientNotificacoes.ts` (mapa por e-mail normalizado em `localStorage`, mesmo padrão de `lib/clientPerfil.ts`) + componente `components/NotificacoesBell.tsx` (sino com badge + painel, mesma pegada visual/reativa de `components/CarrinhoIcon.tsx`, via evento customizado `lm-notificacoes-change`) + inserção condicional na `NavBar` + três chamadas de uma linha (`adicionarNotificacao`) inseridas nos pontos onde os eventos já acontecem hoje.

**Tech Stack:** Next.js 14 App Router, React (client components), TypeScript, Tailwind CSS, `lucide-react` (já é dependência), `localStorage`, sem framework de testes.

## Global Constraints

- Notificações são só de eventos reais já existentes: pedido finalizado, agendamento confirmado (só se logado), entrevista guiada respondida. Nenhuma notificação simulada/fake.
- Mapa `Record<email normalizado, Notificacao[]>` em `localStorage`, chave `lm_notificacoes`, cap de 20 itens por e-mail, mais recente primeiro.
- Toda mutação dispara `window.dispatchEvent(new Event('lm-notificacoes-change'))`, mesmo padrão de `lm-carrinho-change`.
- Sino só aparece pra usuário logado (`getUsuarioLogado() !== null`) — a `NavBar` decide isso no JSX (`{logado && <NotificacoesBell />}`), o componente não assume sozinho que está logado.
- Badge do sino: mesma posição/tamanho do badge do `CarrinhoIcon` (`absolute -top-1 -right-1 min-w-[18px] h-[18px] ...`), mas `bg-red-500 text-white` (não o amarelo do carrinho).
- Agendamento continua funcionando normalmente pra visitante não logado — só não gera notificação nesse caso.
- Sem framework de testes: verificação via `npx tsc --noEmit` + `agent-browser`.

---

### Task 1: Módulo de persistência `lib/clientNotificacoes.ts`

**Files:**
- Create: `lib/clientNotificacoes.ts`

**Interfaces:**
- Consumes: nada
- Produces (usado pelas Tasks 2 e 4):
  - `export type TipoNotificacao = 'pedido' | 'agendamento' | 'entrevista'`
  - `export interface Notificacao { id: string; tipo: TipoNotificacao; titulo: string; mensagem: string; href: string; criadaEm: string; lida: boolean }`
  - `export function adicionarNotificacao(email: string, dados: Omit<Notificacao, 'id' | 'criadaEm' | 'lida'>): void`
  - `export function getNotificacoes(email: string): Notificacao[]`
  - `export function marcarComoLida(email: string, id: string): void`
  - `export function marcarTodasComoLidas(email: string): void`
  - `export function getQuantidadeNaoLida(email: string): number`

- [ ] **Step 1: Criar `lib/clientNotificacoes.ts`**

Mesmo padrão de `lib/clientPerfil.ts` (mapa por e-mail normalizado em `localStorage`). Toda escrita passa por `salvarMapa`, que já dispara o evento customizado — assim nenhuma função exportada precisa lembrar de disparar o evento individualmente:

```ts
export type TipoNotificacao = 'pedido' | 'agendamento' | 'entrevista'

export interface Notificacao {
  id: string
  tipo: TipoNotificacao
  titulo: string
  mensagem: string
  href: string
  criadaEm: string
  lida: boolean
}

const CHAVE = 'lm_notificacoes'
const LIMITE = 20

type Mapa = Record<string, Notificacao[]>

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
  window.dispatchEvent(new Event('lm-notificacoes-change'))
}

export function adicionarNotificacao(email: string, dados: Omit<Notificacao, 'id' | 'criadaEm' | 'lida'>): void {
  const mapa = lerMapa()
  const chave = normalizar(email)
  const lista = mapa[chave] ?? []
  const notificacao: Notificacao = {
    ...dados,
    id: crypto.randomUUID(),
    criadaEm: new Date().toISOString(),
    lida: false,
  }
  mapa[chave] = [notificacao, ...lista].slice(0, LIMITE)
  salvarMapa(mapa)
}

export function getNotificacoes(email: string): Notificacao[] {
  return lerMapa()[normalizar(email)] ?? []
}

export function marcarComoLida(email: string, id: string): void {
  const mapa = lerMapa()
  const chave = normalizar(email)
  const lista = mapa[chave] ?? []
  mapa[chave] = lista.map(n => (n.id === id ? { ...n, lida: true } : n))
  salvarMapa(mapa)
}

export function marcarTodasComoLidas(email: string): void {
  const mapa = lerMapa()
  const chave = normalizar(email)
  const lista = mapa[chave] ?? []
  mapa[chave] = lista.map(n => ({ ...n, lida: true }))
  salvarMapa(mapa)
}

export function getQuantidadeNaoLida(email: string): number {
  return getNotificacoes(email).filter(n => !n.lida).length
}
```

- [ ] **Step 2: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add lib/clientNotificacoes.ts
git commit -m "feat: persistencia local de notificacoes por conta"
```

---

### Task 2: Componente `NotificacoesBell.tsx`

**Files:**
- Create: `components/NotificacoesBell.tsx`
- Create temporário (apagado no final da task): `app/notificacoes-preview-tmp/page.tsx`

**Interfaces:**
- Consumes: `getUsuarioLogado` de `@/lib/clientAuth` (já existe); `getNotificacoes`, `getQuantidadeNaoLida`, `marcarComoLida`, `marcarTodasComoLidas`, `type Notificacao` de `@/lib/clientNotificacoes` (Task 1)
- Produces (usado pela Task 3): `export default function NotificacoesBell(): JSX.Element | null`

- [ ] **Step 1: Criar `components/NotificacoesBell.tsx`**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { getUsuarioLogado } from '@/lib/clientAuth'
import {
  getNotificacoes,
  getQuantidadeNaoLida,
  marcarComoLida,
  marcarTodasComoLidas,
  type Notificacao,
} from '@/lib/clientNotificacoes'

function tempoRelativo(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `há ${diffMin}min`
  const horas = Math.floor(diffMin / 60)
  if (horas < 24) return `há ${horas}h`
  return `há ${Math.floor(horas / 24)}d`
}

export default function NotificacoesBell() {
  const [email, setEmail] = useState<string | null>(null)
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [quantidade, setQuantidade] = useState(0)
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setEmail(getUsuarioLogado()?.email ?? null)
  }, [])

  useEffect(() => {
    if (!email) return
    const emailAtual = email
    const atualizar = () => {
      setNotificacoes(getNotificacoes(emailAtual))
      setQuantidade(getQuantidadeNaoLida(emailAtual))
    }
    atualizar()
    window.addEventListener('lm-notificacoes-change', atualizar)
    return () => window.removeEventListener('lm-notificacoes-change', atualizar)
  }, [email])

  useEffect(() => {
    if (!aberto) return
    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    function aoApertarTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberto(false)
    }
    document.addEventListener('mousedown', aoClicarFora)
    document.addEventListener('keydown', aoApertarTecla)
    return () => {
      document.removeEventListener('mousedown', aoClicarFora)
      document.removeEventListener('keydown', aoApertarTecla)
    }
  }, [aberto])

  if (!email) return null
  const emailAtual = email

  function abrirNotificacao(n: Notificacao) {
    marcarComoLida(emailAtual, n.id)
    setAberto(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setAberto(v => !v)}
        aria-label={`Notificações${quantidade > 0 ? ` (${quantidade} não lidas)` : ''}`}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
      >
        <Bell size={19} />
        {quantidade > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {quantidade > 9 ? '9+' : quantidade}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-bold text-lm-dark">Notificações</span>
            {quantidade > 0 && (
              <button
                type="button"
                onClick={() => marcarTodasComoLidas(emailAtual)}
                className="text-xs font-semibold text-lm-green hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {notificacoes.length === 0 ? (
            <p className="px-4 py-8 text-sm text-gray-400 text-center">Nenhuma notificação por enquanto</p>
          ) : (
            <ul>
              {notificacoes.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    onClick={() => abrirNotificacao(n)}
                    className={`flex items-start gap-2 px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors ${
                      n.lida ? 'bg-white' : 'bg-lm-green/5'
                    }`}
                  >
                    {!n.lida && <span className="w-1.5 h-1.5 rounded-full bg-lm-green mt-1.5 flex-shrink-0" />}
                    <div className={n.lida ? 'pl-3.5' : ''}>
                      <p className="text-xs font-semibold text-lm-dark">{n.titulo}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.mensagem}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{tempoRelativo(n.criadaEm)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
```

Nota sobre `const emailAtual = email` logo após o `if (!email) return null`: mesmo ajuste já usado em `components/BannerCarrossel.tsx` desta base de código — narrowing de `email` (`string | null`) não sobrevive de forma confiável dentro das closures dos handlers (`abrirNotificacao`, `onClick` do "marcar todas") sem extrair pra uma constante local antes de defini-los.

- [ ] **Step 2: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Criar página temporária de preview**

Criar `app/notificacoes-preview-tmp/page.tsx` (nome sem underscore inicial — pasta com `_` é rota privada excluída do roteamento do Next.js App Router):

```tsx
'use client'

import { useEffect } from 'react'
import NotificacoesBell from '@/components/NotificacoesBell'
import { loginUsuario } from '@/lib/clientAuth'
import { adicionarNotificacao } from '@/lib/clientNotificacoes'

const EMAIL_TESTE = 'preview@teste.com'

export default function NotificacoesPreviewPage() {
  useEffect(() => {
    loginUsuario(EMAIL_TESTE, 'Preview')
  }, [])

  function seedUma() {
    adicionarNotificacao(EMAIL_TESTE, {
      tipo: 'pedido',
      titulo: 'Pedido confirmado',
      mensagem: 'Pedido #1234 confirmado com sucesso.',
      href: '/conta',
    })
  }

  return (
    <div className="p-10 bg-lm-green min-h-screen flex justify-end">
      <div>
        <NotificacoesBell />
        <button type="button" onClick={seedUma} className="mt-4 block bg-white px-3 py-2 rounded text-sm">
          Adicionar notificação de teste
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Subir o servidor e conferir visualmente**

Run: `npm run dev` (background), poll em foreground com `curl` até `200` (não espere notificação de background — gotcha conhecido desta sessão). Verificar `netstat -ano | grep ":3000" | grep LISTENING` antes de subir e matar qualquer processo que já esteja escutando.

Via `agent-browser` em `http://localhost:3000/notificacoes-preview-tmp`:
1. Confirmar que o sino aparece sem badge (nenhuma notificação ainda) e o painel, ao abrir, mostra "Nenhuma notificação por enquanto".
2. Clicar 2x em "Adicionar notificação de teste" — confirmar que o badge aparece e mostra "2" **sem precisar recarregar a página** (reatividade via `lm-notificacoes-change`).
3. Abrir o painel — confirmar as 2 notificações aparecem, mais recente no topo, com fundo verde claro e bolinha (não lidas).
4. Clicar numa notificação — confirmar que ela navega pra `/conta` (href da notificação de teste) e que, ao voltar pra `/notificacoes-preview-tmp` e reabrir o painel, aquela notificação aparece lida (fundo branco, sem bolinha) e o badge mostra "1".
5. Adicionar mais 1 (total 3 no armazenamento, 2 lidas + 1 não lida), abrir o painel, clicar "Marcar todas como lidas" — confirmar que o badge desaparece e as 3 aparecem com fundo branco.
6. Abrir o painel de novo e clicar fora dele (fora do container do sino) — confirmar que o painel fecha.
7. Abrir o painel e apertar Escape — confirmar que o painel fecha.
8. Via `agent-browser eval` (ou equivalente), rodar `localStorage.removeItem('lm_usuario_logado')` e recarregar a página — confirmar que o sino **não** é renderizado (retorna `null`).
9. Repetir uma checagem rápida em viewport mobile (390×844) — painel não deve vazar da tela.

Parar o servidor ao final, confirmar porta livre.

- [ ] **Step 5: Apagar a página de preview temporária**

```bash
rm -rf app/notificacoes-preview-tmp
```

- [ ] **Step 6: Rodar type-check final**

Run: `rm -rf .next && npx tsc --noEmit` (limpar `.next` porque o Next.js gera tipos de rota que ficam referenciando a pasta apagada — gotcha já conhecido neste projeto).
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add components/NotificacoesBell.tsx
git commit -m "feat: componente de sino de notificacoes com painel suspenso"
```

---

### Task 3: Integração na `NavBar`

**Files:**
- Modify: `components/NavBar.tsx`

**Interfaces:**
- Consumes: `NotificacoesBell` de `@/components/NotificacoesBell` (Task 2); `logado` já existe como estado local do componente `NavBar`
- Produces: nada novo

- [ ] **Step 1: Adicionar o import**

Texto atual (linha 9):
```tsx
import CarrinhoIcon from './CarrinhoIcon'
```

Novo texto:
```tsx
import CarrinhoIcon from './CarrinhoIcon'
import NotificacoesBell from './NotificacoesBell'
```

- [ ] **Step 2: Inserir o sino no bloco desktop**

Texto atual (linhas 69-70):
```tsx
          <CarrinhoIcon />
          <ThemeToggle />
```

Novo texto:
```tsx
          <CarrinhoIcon />
          {logado && <NotificacoesBell />}
          <ThemeToggle />
```

- [ ] **Step 3: Inserir o sino no bloco mobile**

Texto atual (linhas 126-130):
```tsx
          <div className="flex items-center justify-between gap-3 pt-3 mt-2 border-t border-white/15">
            <div className="flex items-center gap-2">
              <CarrinhoIcon />
              <ThemeToggle />
            </div>
```

Novo texto:
```tsx
          <div className="flex items-center justify-between gap-3 pt-3 mt-2 border-t border-white/15">
            <div className="flex items-center gap-2">
              <CarrinhoIcon />
              {logado && <NotificacoesBell />}
              <ThemeToggle />
            </div>
```

- [ ] **Step 4: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Verificação manual com login real**

Run: `npm run dev` (background), poll em foreground até `200`. Confirmar porta livre antes de subir.

Via `agent-browser`:
1. Em `/`, deslogado: confirmar que o sino **não** aparece na `NavBar` (só carrinho + tema + botão "Login").
2. Ir em `/funcionario/login`, selecionar a aba "Cliente", entrar com um e-mail de teste (ex: `notif@teste.com`) e senha qualquer — confirmar redirecionamento pra `/`.
3. Confirmar que o sino agora aparece na `NavBar` (entre carrinho e tema), sem badge (conta nova, sem notificações ainda).
4. Clicar no sino — confirmar que o painel abre mostrando "Nenhuma notificação por enquanto".
5. Redimensionar pra 390×844 (mobile), abrir o menu hambúrguer — confirmar que o sino aparece também na área utilitária do menu mobile, ao lado do carrinho.
6. Fazer logout (mesmo fluxo já existente pra sair da conta) — confirmar que o sino some de novo.

Parar o servidor ao final, confirmar porta livre.

- [ ] **Step 6: Commit**

```bash
git add components/NavBar.tsx
git commit -m "feat: adiciona sino de notificacoes na navbar"
```

---

### Task 4: Três pontos de disparo real

**Files:**
- Modify: `app/carrinho/page.tsx:10,109`
- Modify: `components/AgendamentoForm.tsx:1-7,282-300`
- Modify: `components/EntrevistaGuiada.tsx:1-11,125`

**Interfaces:**
- Consumes: `adicionarNotificacao` de `@/lib/clientNotificacoes` (Task 1); `getUsuarioLogado` de `@/lib/clientAuth` (já existe)
- Produces: nada novo

- [ ] **Step 1: Pedido finalizado — `app/carrinho/page.tsx`**

Texto atual (linha 10):
```tsx
import { salvarPedido, gerarNumeroPedido, type Pedido, type ItemPedido } from '@/lib/clientPedidos'
```

Novo texto:
```tsx
import { salvarPedido, gerarNumeroPedido, type Pedido, type ItemPedido } from '@/lib/clientPedidos'
import { adicionarNotificacao } from '@/lib/clientNotificacoes'
```

Texto atual (linhas 109-112):
```tsx
    salvarPedido(usuario.email, pedido)
    limparCarrinho()
    clearProductHistory()
    setPedidoConfirmado(pedido)
```

Novo texto:
```tsx
    salvarPedido(usuario.email, pedido)
    adicionarNotificacao(usuario.email, {
      tipo: 'pedido',
      titulo: 'Pedido confirmado',
      mensagem: `Pedido #${pedido.numero} confirmado com sucesso.`,
      href: '/conta',
    })
    limparCarrinho()
    clearProductHistory()
    setPedidoConfirmado(pedido)
```

- [ ] **Step 2: Agendamento confirmado — `components/AgendamentoForm.tsx`**

Texto atual (linhas 1-7):
```tsx
'use client'

import { useState } from 'react'
import { CalendarCheck, CheckCircle2, ChevronRight } from 'lucide-react'
import { salvarAgendamento } from './AgendamentosLista'
import Button from './ui/Button'
import Card from './ui/Card'
```

Novo texto:
```tsx
'use client'

import { useState } from 'react'
import { CalendarCheck, CheckCircle2, ChevronRight } from 'lucide-react'
import { salvarAgendamento } from './AgendamentosLista'
import { getUsuarioLogado } from '@/lib/clientAuth'
import { adicionarNotificacao } from '@/lib/clientNotificacoes'
import Button from './ui/Button'
import Card from './ui/Card'
```

Texto atual (linhas 282-300):
```tsx
            <Button
              disabled={!form.nome || (!form.telefone && !form.email)}
              onClick={() => {
                salvarAgendamento({
                  servico: form.servico,
                  servicoLabel: servicos.find(s => s.id === form.servico)?.label ?? form.servico,
                  loja: form.loja,
                  data: form.data,
                  horario: form.horario,
                  nome: form.nome,
                  telefone: form.telefone,
                  email: form.email,
                  observacao: form.observacao,
                })
                setConfirmado(true)
                setTimeout(() => onConfirmado?.(), 2000)
              }}
              className="flex-1 h-12"
            >
```

Novo texto:
```tsx
            <Button
              disabled={!form.nome || (!form.telefone && !form.email)}
              onClick={() => {
                salvarAgendamento({
                  servico: form.servico,
                  servicoLabel: servicos.find(s => s.id === form.servico)?.label ?? form.servico,
                  loja: form.loja,
                  data: form.data,
                  horario: form.horario,
                  nome: form.nome,
                  telefone: form.telefone,
                  email: form.email,
                  observacao: form.observacao,
                })
                const usuarioLogado = getUsuarioLogado()
                if (usuarioLogado) {
                  adicionarNotificacao(usuarioLogado.email, {
                    tipo: 'agendamento',
                    titulo: 'Visita agendada',
                    mensagem: `Sua visita em ${form.loja} foi confirmada para ${form.data} às ${form.horario}.`,
                    href: '/agendamento',
                  })
                }
                setConfirmado(true)
                setTimeout(() => onConfirmado?.(), 2000)
              }}
              className="flex-1 h-12"
            >
```

Nota: este é o único dos três pontos que consulta `getUsuarioLogado()` diretamente em vez de já ter o e-mail em escopo — `AgendamentoForm` não exige login (tem seus próprios campos de nome/telefone/e-mail), então a notificação só dispara se houver uma conta logada no momento da confirmação; o agendamento em si continua funcionando normalmente pra visitante sem conta.

- [ ] **Step 3: Entrevista guiada respondida — `components/EntrevistaGuiada.tsx`**

Texto atual (linha 9):
```tsx
import { getPerfil, salvarPerfil } from '@/lib/clientPerfil'
```

Novo texto:
```tsx
import { getPerfil, salvarPerfil } from '@/lib/clientPerfil'
import { adicionarNotificacao } from '@/lib/clientNotificacoes'
```

Texto atual (linhas 115-127):
```tsx
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
```

Novo texto:
```tsx
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
    adicionarNotificacao(email, {
      tipo: 'entrevista',
      titulo: 'Perfil traçado',
      mensagem: 'Suas sugestões personalizadas já estão disponíveis.',
      href: '/conta',
    })
    buscarSugestoes(perfil)
  }
```

- [ ] **Step 4: Rodar type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Verificação ponta a ponta dos três gatilhos**

Run: `npm run dev` (background), poll em foreground até `200`. Confirmar porta livre antes de subir.

Via `agent-browser`, logado com um e-mail de teste (via `/funcionario/login`, aba Cliente):

1. **Pedido:** adicionar um produto ao carrinho, ir em `/carrinho`, completar o fluxo de checkout até confirmar o pedido — depois, abrir o sino na `NavBar` (sem sair da página, ou navegando pra `/`) e confirmar que aparece uma notificação "Pedido confirmado" com o número do pedido na mensagem, e o badge mostra "1" (ou mais, se já havia outras).
2. **Agendamento (logado):** ir em `/agendamento`, preencher e confirmar uma visita — voltar pra qualquer página com `NavBar` e confirmar que uma notificação "Visita agendada" aparece no sino, com loja/data/horário na mensagem.
3. **Agendamento (deslogado):** fazer logout, ir em `/agendamento`, preencher (usando o campo de e-mail do próprio formulário) e confirmar uma visita — confirmar que o agendamento é salvo normalmente (aparece em "Meus Agendamentos") e que, como não há sino visível (deslogado), não há nada pra checar visualmente; fazer login de novo com a mesma conta de teste do passo 1-2 e confirmar que o contador de notificações **não** aumentou por causa desse agendamento de visitante.
4. **Entrevista guiada:** logado, ir em `/conta`, abrir a entrevista guiada, responder as 5 perguntas e enviar — confirmar que uma notificação "Perfil traçado" aparece no sino.
5. Clicar em cada uma das notificações geradas acima e confirmar que cada uma navega pro `href` esperado (`/conta` pras duas primeiras... conferir: pedido → `/conta`, agendamento → `/agendamento`, entrevista → `/conta`) e fica marcada como lida.

Parar o servidor ao final, confirmar porta livre.

- [ ] **Step 6: Build de produção**

Run: `npm run build`
Expected: build conclui sem erro. Depois: `rm -rf .next`.

- [ ] **Step 7: Commit**

```bash
git add app/carrinho/page.tsx components/AgendamentoForm.tsx components/EntrevistaGuiada.tsx
git commit -m "feat: dispara notificacoes reais em pedido, agendamento e entrevista guiada"
```
