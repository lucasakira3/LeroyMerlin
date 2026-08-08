# Login de Cliente e Controle de Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar login de cliente (junto ao de funcionário, na mesma tela) que controla se o header mostra "Login" ou "Minha Conta", com logout disponível em Minha Conta.

**Architecture:** Um módulo `lib/clientAuth.ts` (mesmo padrão de `clientHistorico`/`clientFavoritos`) guarda o e-mail do cliente logado no `localStorage`. A tela de login ganha um toggle Funcionário/Cliente. `NavBar` e `/conta` leem esse estado — `NavBar` uma vez ao montar, `/conta` como guarda de acesso (redireciona se deslogado).

**Tech Stack:** Next.js 14 (App Router), TypeScript, React (client components), Tailwind CSS, lucide-react.

## Global Constraints

- Nenhum backend — tudo via `localStorage`, mesmo padrão dos módulos `lib/clientHistorico.ts` e `lib/clientFavoritos.ts` já existentes.
- Login de cliente aceita qualquer email/senha (simulado), igual ao de funcionário — nenhuma validação real.
- `NavBar` vive em `app/layout.tsx` (layout raiz) e não remonta em navegações internas — por isso login de cliente e logout usam `window.location.href` (recarga completa) em vez de `router.push`, para o header refletir o novo estado. Login de funcionário continua usando `router.push('/funcionario/dashboard')` (não muda).
- Aba padrão da tela de login: **Cliente**.
- `/conta` só renderiza conteúdo pra quem está logado como cliente; sem login, redireciona pra `/funcionario/login` sem mostrar o conteúdo protegido nem por um instante.
- O projeto não tem framework de testes — verificação via `npx tsc --noEmit`, um script `tsx` temporário (Task 1) e `agent-browser` (Tasks 2-5).

---

## Task 1: Módulo de autenticação local (`lib/clientAuth.ts`)

**Files:**
- Create: `lib/clientAuth.ts`

**Interfaces:**
- Produces: `loginUsuario(email: string): void`, `logoutUsuario(): void`, `getUsuarioLogado(): { email: string } | null`.

- [ ] **Step 1: Criar `lib/clientAuth.ts`**

```ts
const CHAVE = 'lm_usuario_logado'

interface UsuarioLogado {
  email: string
}

function ler(): UsuarioLogado | null {
  if (typeof window === 'undefined') return null
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return null
    const dados = JSON.parse(bruto)
    if (!dados || typeof dados.email !== 'string') return null
    return dados
  } catch {
    return null
  }
}

export function loginUsuario(email: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAVE, JSON.stringify({ email }))
}

export function logoutUsuario(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(CHAVE)
}

export function getUsuarioLogado(): UsuarioLogado | null {
  return ler()
}
```

- [ ] **Step 2: Criar script de verificação temporário `scripts/_verify-auth.ts`**

```ts
// Script de verificacao temporario - deletado no Step 4 deste task.
const store: Record<string, string> = {}
;(globalThis as any).localStorage = {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
}
;(globalThis as any).window = globalThis

import { loginUsuario, logoutUsuario, getUsuarioLogado } from '../lib/clientAuth'

function verificar(condicao: boolean, mensagem: string): void {
  if (!condicao) {
    throw new Error(`FALHOU: ${mensagem}`)
  }
}

verificar(getUsuarioLogado() === null, 'deveria comecar deslogado')

loginUsuario('cliente@teste.com')
const logado = getUsuarioLogado()
verificar(logado !== null, 'deveria estar logado apos loginUsuario')
verificar(logado?.email === 'cliente@teste.com', `email deveria ser cliente@teste.com, veio ${logado?.email}`)

logoutUsuario()
verificar(getUsuarioLogado() === null, 'deveria estar deslogado apos logoutUsuario')

console.log('OK: todas as verificacoes de auth passaram')
```

- [ ] **Step 3: Rodar o script de verificação**

Run: `npx tsx scripts/_verify-auth.ts`
Expected: imprime `OK: todas as verificacoes de auth passaram`, sem `Error: FALHOU`.

- [ ] **Step 4: Apagar o script temporário e verificar tipos**

Run: `rm scripts/_verify-auth.ts && npx tsc --noEmit`
Expected: nenhum erro de tipo.

- [ ] **Step 5: Commit**

```bash
git add lib/clientAuth.ts
git commit -m "feat: modulo de autenticacao local do cliente"
```

---

## Task 2: Toggle Funcionário/Cliente na tela de login

**Files:**
- Modify: `app/funcionario/login/page.tsx` (reescrita completa)

**Interfaces:**
- Consumes: `loginUsuario` (Task 1).
- Não altera a rota (`/funcionario/login` continua sendo a URL, agora com dois modos).

- [ ] **Step 1: Reescrever `app/funcionario/login/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, Mail, ArrowRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { loginUsuario } from '@/lib/clientAuth'

type TipoLogin = 'funcionario' | 'cliente'

const TEXTOS: Record<TipoLogin, { titulo: string; descricao: string; labelEmail: string; placeholderEmail: string }> = {
  cliente: {
    titulo: 'Entrar como Cliente',
    descricao: 'Acesse para favoritar produtos e ver seu histórico',
    labelEmail: 'E-mail',
    placeholderEmail: 'seuemail@exemplo.com',
  },
  funcionario: {
    titulo: 'Portal do Funcionário',
    descricao: 'Acesse com suas credenciais corporativas',
    labelEmail: 'E-mail Corporativo',
    placeholderEmail: 'nome.sobrenome@leroymerlin.com.br',
  },
}

export default function LoginFuncionario() {
  const router = useRouter()
  const [tipo, setTipo] = useState<TipoLogin>('cliente')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const textos = TEXTOS[tipo]

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simular delay de rede
    setTimeout(() => {
      if (tipo === 'funcionario') {
        setLoading(false)
        router.push('/funcionario/dashboard')
        return
      }
      loginUsuario(email)
      window.location.href = '/'
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-lm-green -skew-y-6 transform origin-top-left -z-10" />

      <Card className="w-full max-w-md relative z-10" padding="none">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/leroy-logo.png" alt="Leroy Merlin" className="h-12 w-auto object-contain" />
            </Link>
          </div>

          <div className="flex rounded-xl bg-gray-100 p-1 mb-8">
            <button
              type="button"
              onClick={() => setTipo('cliente')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tipo === 'cliente' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cliente
            </button>
            <button
              type="button"
              onClick={() => setTipo('funcionario')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tipo === 'funcionario' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Funcionário
            </button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-gray-900">{textos.titulo}</h1>
            <p className="text-gray-500 text-sm mt-2">{textos.descricao}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">{textos.labelEmail}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lm-green/30 focus:border-lm-green outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder={textos.placeholderEmail}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound size={18} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lm-green/30 focus:border-lm-green outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" disabled={loading} className="w-full mt-2">
              {loading ? 'Autenticando...' : 'Entrar no Sistema'}
              {!loading && <ArrowRight size={18} />}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a href="#" className="text-sm font-medium text-lm-green hover:underline">
              Esqueceu sua senha?
            </a>
          </div>
        </div>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: nenhum erro.

- [ ] **Step 3: Verificar visualmente com `agent-browser`**

Com o servidor de dev rodando em `http://localhost:3000`, navegue até `/funcionario/login`. Confirme:
- A aba "Cliente" vem selecionada por padrão, com o título "Entrar como Cliente".
- Clicar em "Funcionário" troca o título pra "Portal do Funcionário" e o placeholder do e-mail.
- Login no modo Cliente (qualquer email/senha) redireciona pra `http://localhost:3000/` (a URL muda pra raiz).
- Login no modo Funcionário continua indo pra `/funcionario/dashboard`, como antes.

- [ ] **Step 4: Commit**

```bash
git add "app/funcionario/login/page.tsx"
git commit -m "feat: toggle funcionario/cliente na tela de login"
```

---

## Task 3: `NavBar` mostra "Login" ou "Minha Conta" conforme o estado

**Files:**
- Modify: `components/NavBar.tsx`

**Interfaces:**
- Consumes: `getUsuarioLogado` (Task 1).
- Não altera as 4 abas fixas nem a prop-less assinatura do componente `NavBar`.

- [ ] **Step 1: Reescrever `components/NavBar.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, MessageCircleQuestion, CalendarCheck, Sparkles, LogIn, User } from 'lucide-react'
import { getUsuarioLogado } from '@/lib/clientAuth'

const tabs = [
  { href: '/', label: 'Buscar Produtos', icon: Search },
  { href: '/projeto', label: 'Projeto Guiado', icon: Sparkles },
  { href: '/duvidas', label: 'Tire Dúvidas', icon: MessageCircleQuestion },
  { href: '/agendamento', label: 'Agendar Visita', icon: CalendarCheck },
]

export default function NavBar() {
  const pathname = usePathname()
  const [logado, setLogado] = useState(false)

  useEffect(() => {
    setLogado(getUsuarioLogado() !== null)
  }, [])

  if (pathname.startsWith('/funcionario')) return null;

  return (
    <header className="bg-lm-green shadow-md">
      <div className="px-6 flex items-center justify-between h-16">

        {/* Logo — esquerda */}
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/leroy-logo.png"
            alt="Leroy Merlin"
            className="h-10 w-auto object-contain"
          />
        </Link>

        {/* Tabs + login/conta — direita */}
        <div className="flex items-center gap-3 h-full">
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

          {logado ? (
            <Link
              href="/conta"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === '/conta'
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
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

      </div>
    </header>
  )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: nenhum erro.

- [ ] **Step 3: Verificar visualmente com `agent-browser`**

Com o `localStorage` limpo (deslogado), abra a home e confirme que só o botão "Login" aparece (sem "Minha Conta"). Faça login no modo Cliente em `/funcionario/login`; após o redirecionamento pra home, confirme que agora só "Minha Conta" aparece (sem "Login").

- [ ] **Step 4: Commit**

```bash
git add components/NavBar.tsx
git commit -m "feat: header mostra Login ou Minha Conta conforme login do cliente"
```

---

## Task 4: Proteção e logout na página `/conta`

**Files:**
- Modify: `app/conta/page.tsx`

**Interfaces:**
- Consumes: `getUsuarioLogado`, `logoutUsuario` (Task 1).
- `SecaoProdutos` e `buscarProdutos` (já existentes no arquivo) não mudam.

- [ ] **Step 1: Reescrever `app/conta/page.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import ProductCard from '@/components/ProductCard'
import { getFavoritosIds } from '@/lib/clientFavoritos'
import { getHistoricoIds } from '@/lib/clientHistorico'
import { getUsuarioLogado, logoutUsuario } from '@/lib/clientAuth'
import type { SearchResult } from '@/types/produto'

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

function SecaoProdutos({
  titulo,
  ids,
  mensagemVazia,
}: {
  titulo: string
  ids: string[]
  mensagemVazia: string
}) {
  const [produtos, setProdutos] = useState<SearchResult[] | null>(null)

  useEffect(() => {
    let cancelado = false
    if (ids.length === 0) {
      setProdutos([])
      return
    }
    buscarProdutos(ids).then((resultado) => {
      if (!cancelado) setProdutos(resultado)
    })
    return () => {
      cancelado = true
    }
  }, [ids])

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{titulo}</h2>
      {produtos === null && (
        <div className="flex items-center justify-center py-14">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-lm-green border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Carregando...</p>
          </div>
        </div>
      )}
      {produtos !== null && produtos.length === 0 && (
        <p className="text-sm text-gray-500 py-6">{mensagemVazia}</p>
      )}
      {produtos !== null && produtos.length > 0 && (
        <div className="space-y-3">
          {produtos.map((resultado) => (
            <ProductCard key={resultado.produto.id} result={resultado} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function ContaPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<{ email: string } | null>(null)
  const [favoritosIds, setFavoritosIds] = useState<string[]>([])
  const [historicoIds, setHistoricoIds] = useState<string[]>([])

  useEffect(() => {
    const usuarioLogado = getUsuarioLogado()
    if (!usuarioLogado) {
      router.push('/funcionario/login')
      return
    }
    setUsuario(usuarioLogado)
    setFavoritosIds(getFavoritosIds())
    setHistoricoIds(getHistoricoIds())
  }, [router])

  const handleSair = () => {
    logoutUsuario()
    window.location.href = '/'
  }

  if (!usuario) {
    return null
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <PageHeader
          title="Minha Conta"
          description={`Olá, ${usuario.email}`}
          action={
            <Button variant="ghost" size="sm" onClick={handleSair}>
              <LogOut size={16} />
              Sair
            </Button>
          }
        />
        <SecaoProdutos
          titulo="Favoritos"
          ids={favoritosIds}
          mensagemVazia="Você ainda não favoritou nenhum produto."
        />
        <SecaoProdutos
          titulo="Vistos recentemente"
          ids={historicoIds}
          mensagemVazia="Nenhum produto visitado ainda — suas buscas vão aparecer aqui."
        />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: nenhum erro.

- [ ] **Step 3: Verificar visualmente com `agent-browser`**

Com `localStorage` limpo (deslogado), acesse `http://localhost:3000/conta` diretamente pela URL — confirme que é redirecionado pra `/funcionario/login` sem ver o conteúdo de favoritos/histórico. Faça login como Cliente, confirme que `/conta` mostra "Olá, {email digitado}" no topo e o botão "Sair". Clique em "Sair" e confirme: volta pra home, e o header volta a mostrar "Login" em vez de "Minha Conta".

- [ ] **Step 4: Commit**

```bash
git add app/conta/page.tsx
git commit -m "feat: protecao de acesso e logout na pagina Minha Conta"
```

---

## Task 5: Verificação final ponta-a-ponta

**Files:**
- (nenhum arquivo novo — task de verificação)

**Interfaces:**
- N/A

- [ ] **Step 1: Checagem de tipos completa**

Run: `npx tsc --noEmit`
Expected: nenhum erro.

- [ ] **Step 2: Build de produção**

Run: `npm run build`
Expected: build completa sem erros.

- [ ] **Step 3: Fluxo completo via `agent-browser`**

Com o servidor de dev limpo rodando (se o `.next/` tiver sido tocado pelo build do Step 2, apague `.next/` e reinicie `npm run dev` antes deste passo):
1. `localStorage` limpo. Abra a home — só "Login" aparece no header.
2. Acesse `/conta` direto pela URL — redireciona pro login.
3. Na tela de login, confirme que abre na aba "Cliente". Faça login com um e-mail de teste.
4. De volta na home, confirme que agora só "Minha Conta" aparece no header (sem "Login").
5. Visite 1 produto e favorite ele (fluxo do bloco de personalização anterior).
6. Clique em "Minha Conta" — confirme "Olá, {email}" no topo, o produto favoritado e visitado aparecendo nas seções.
7. Clique em "Sair" — confirme volta pra home com "Login" no header de novo.
8. Acesse `/funcionario/login`, mude pra aba "Funcionário", faça login — confirme que ainda vai pro dashboard normalmente (fluxo de funcionário intacto).

Expected: todo o fluxo funciona sem erro de console, nenhuma outra funcionalidade do site é afetada.

- [ ] **Step 4: Commit final (se houver ajustes de última hora)**

```bash
git add -A
git commit -m "fix: ajustes finais do login de cliente"
```
