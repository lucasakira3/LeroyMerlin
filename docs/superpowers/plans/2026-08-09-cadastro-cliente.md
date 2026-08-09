# Cadastro de Cliente Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cliente precisa se cadastrar (nome, email, senha) antes de conseguir logar — o login de cliente passa a validar contra contas cadastradas em vez de aceitar qualquer credencial.

**Architecture:** Novo módulo `lib/clientContas.ts` (registro de contas em `localStorage`) + `lib/clientAuth.ts` estendido com `nome` opcional + novo componente `components/ClienteAuthForm.tsx` (sub-modos login/cadastro) substituindo o form de cliente hoje embutido em `app/funcionario/login/page.tsx`.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, `lucide-react`, `localStorage`.

## Global Constraints

- Sem segurança real (sem hash de senha, sem tokens) — mesma postura de "auth simulada" já documentada no projeto.
- Email é normalizado (`trim().toLowerCase()`) em todas as operações de `lib/clientContas.ts` — login não é case-sensitive no email.
- A aba Funcionário não muda — continua aceitando qualquer credencial, sem cadastro.
- Sem recuperação de senha (fora de escopo).
- Todo `<input>` precisa de `bg-white`/`bg-gray-50` explícito conforme o padrão visual já usado no form de login existente (gotcha de dark mode do projeto).

---

### Task 1: Módulo `lib/clientContas.ts`

**Files:**
- Create: `lib/clientContas.ts`
- Test: script temporário `scratch-test-contas.ts` (escrito, rodado, apagado)

**Interfaces:**
- Consumes: nada
- Produces:
  - `interface ContaCliente { nome: string; senha: string; criadoEm: string }`
  - `contaExiste(email: string): boolean`
  - `criarConta(nome: string, email: string, senha: string): void`
  - `validarLogin(email: string, senha: string): 'ok' | 'nao_encontrada' | 'senha_incorreta'`
  - `getConta(email: string): ContaCliente | null`

- [ ] **Step 1: Criar `lib/clientContas.ts`**

```ts
const CHAVE = 'lm_contas_cliente'

export interface ContaCliente {
  nome: string
  senha: string
  criadoEm: string
}

type Mapa = Record<string, ContaCliente>

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

export function contaExiste(email: string): boolean {
  const mapa = lerMapa()
  return normalizar(email) in mapa
}

export function criarConta(nome: string, email: string, senha: string): void {
  const mapa = lerMapa()
  mapa[normalizar(email)] = { nome, senha, criadoEm: new Date().toISOString() }
  salvarMapa(mapa)
}

export function validarLogin(email: string, senha: string): 'ok' | 'nao_encontrada' | 'senha_incorreta' {
  const conta = lerMapa()[normalizar(email)]
  if (!conta) return 'nao_encontrada'
  if (conta.senha !== senha) return 'senha_incorreta'
  return 'ok'
}

export function getConta(email: string): ContaCliente | null {
  return lerMapa()[normalizar(email)] ?? null
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `lib/clientContas.ts`

- [ ] **Step 3: Escrever script de verificação lógica temporário**

Create: `scratch-test-contas.ts` na raiz:

```ts
import { contaExiste, criarConta, validarLogin, getConta } from './lib/clientContas'

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

assert(contaExiste('novo@x.com') === false, 'conta não existe antes de criar')
assert(validarLogin('novo@x.com', '123') === 'nao_encontrada', 'login sem conta retorna nao_encontrada')

criarConta('Maria', 'novo@x.com', 'senha123')
assert(contaExiste('novo@x.com') === true, 'conta existe depois de criar')
assert(contaExiste('NOVO@X.COM') === true, 'busca é case-insensitive')

assert(validarLogin('novo@x.com', 'errada') === 'senha_incorreta', 'senha errada retorna senha_incorreta')
assert(validarLogin('NOVO@X.COM', 'senha123') === 'ok', 'login correto (case-insensitive) retorna ok')

assert(getConta('novo@x.com')?.nome === 'Maria', 'getConta retorna o nome cadastrado')
assert(getConta('inexistente@x.com') === null, 'getConta de email não cadastrado retorna null')

console.log('Todos os testes passaram.')
```

- [ ] **Step 4: Rodar e verificar saída**

Run: `npx tsx scratch-test-contas.ts`
Expected: todas as linhas `OK:` impressas, terminando em `Todos os testes passaram.`

- [ ] **Step 5: Apagar o script temporário**

Run: `rm scratch-test-contas.ts`

- [ ] **Step 6: Commit**

```bash
git add lib/clientContas.ts
git commit -m "feat: modulo de contas de cliente (cadastro/login)"
```

---

### Task 2: Estender `lib/clientAuth.ts` com `nome`

**Files:**
- Modify: `lib/clientAuth.ts`

**Interfaces:**
- Consumes: nada
- Produces:
  - `export interface UsuarioLogado { email: string; nome?: string }` (agora exportada)
  - `loginUsuario(email: string, nome?: string): void`

- [ ] **Step 1: Editar `lib/clientAuth.ts`**

Trocar:

```ts
interface UsuarioLogado {
  email: string
}
```

por:

```ts
export interface UsuarioLogado {
  email: string
  nome?: string
}
```

Trocar:

```ts
export function loginUsuario(email: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAVE, JSON.stringify({ email }))
}
```

por:

```ts
export function loginUsuario(email: string, nome?: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAVE, JSON.stringify({ email, nome }))
}
```

A função `ler()` já valida só `typeof dados.email === 'string'` — não precisa de mudança, `nome` é opcional e passa por ela sem validação extra (se ausente ou de tipo errado num dado antigo, o consumidor trata como `undefined` via `?.`).

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros relacionados a `lib/clientAuth.ts` (chamadas existentes de `loginUsuario(email)` continuam válidas, já que `nome` é opcional)

- [ ] **Step 3: Commit**

```bash
git add lib/clientAuth.ts
git commit -m "feat: adiciona nome opcional ao usuario logado"
```

---

### Task 3: Componente `components/ClienteAuthForm.tsx`

**Files:**
- Create: `components/ClienteAuthForm.tsx`

**Interfaces:**
- Consumes:
  - `contaExiste`, `criarConta`, `validarLogin`, `getConta` de `lib/clientContas.ts` (Task 1)
  - `loginUsuario` de `lib/clientAuth.ts` (Task 2)
- Produces: `<ClienteAuthForm />` — componente default export, sem props, autocontido

- [ ] **Step 1: Criar `components/ClienteAuthForm.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { KeyRound, Mail, User, ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import { contaExiste, criarConta, validarLogin, getConta } from '@/lib/clientContas'
import { loginUsuario } from '@/lib/clientAuth'

type Modo = 'login' | 'cadastro'

export default function ClienteAuthForm() {
  const [modo, setModo] = useState<Modo>('login')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function trocarModo(novoModo: Modo) {
    setModo(novoModo)
    setErro(null)
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      const resultado = validarLogin(email, senha)
      if (resultado === 'nao_encontrada') {
        setErro('Não encontramos uma conta com esse email.')
        setLoading(false)
        return
      }
      if (resultado === 'senha_incorreta') {
        setErro('Senha incorreta.')
        setLoading(false)
        return
      }
      const conta = getConta(email)
      loginUsuario(email, conta?.nome)
      window.location.href = '/'
    }, 1000)
  }

  function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }
    if (contaExiste(email)) {
      setErro('Já existe uma conta com esse email. Faça login.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      criarConta(nome, email, senha)
      loginUsuario(email, nome)
      window.location.href = '/'
    }, 1000)
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-gray-900">
          {modo === 'login' ? 'Entrar como Cliente' : 'Criar conta'}
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          {modo === 'login' ? 'Acesse para favoritar produtos e ver seu histórico' : 'Leva menos de um minuto'}
        </p>
      </div>

      <form onSubmit={modo === 'login' ? handleLogin : handleCadastro} className="space-y-5">
        {modo === 'cadastro' && (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Nome</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lm-green/30 focus:border-lm-green outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="Seu nome"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">E-mail</label>
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
              placeholder="seuemail@exemplo.com"
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
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lm-green/30 focus:border-lm-green outline-none transition-all bg-gray-50 focus:bg-white"
              placeholder="••••••••"
            />
          </div>
        </div>

        {modo === 'cadastro' && (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirmar senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound size={18} className="text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lm-green/30 focus:border-lm-green outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="••••••••"
              />
            </div>
          </div>
        )}

        {erro && (
          <p className="text-sm text-red-600 text-center">
            {erro}
            {modo === 'login' && erro.startsWith('Não encontramos') && (
              <>
                {' '}
                <button type="button" onClick={() => trocarModo('cadastro')} className="font-semibold underline">
                  Cadastre-se
                </button>
              </>
            )}
          </p>
        )}

        <Button type="submit" variant="primary" disabled={loading} className="w-full mt-2">
          {loading ? 'Enviando...' : modo === 'login' ? 'Entrar no Sistema' : 'Criar conta'}
          {!loading && <ArrowRight size={18} />}
        </Button>
      </form>

      <div className="mt-6 text-center">
        {modo === 'login' ? (
          <button type="button" onClick={() => trocarModo('cadastro')} className="text-sm font-medium text-lm-green hover:underline">
            Não tem conta? Cadastre-se
          </button>
        ) : (
          <button type="button" onClick={() => trocarModo('login')} className="text-sm font-medium text-lm-green hover:underline">
            Já tem conta? Entrar
          </button>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `components/ClienteAuthForm.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/ClienteAuthForm.tsx
git commit -m "feat: componente de login/cadastro do cliente"
```

---

### Task 4: Integrar `ClienteAuthForm` em `app/funcionario/login/page.tsx`

**Files:**
- Modify: `app/funcionario/login/page.tsx`

**Interfaces:**
- Consumes: `<ClienteAuthForm />` de `components/ClienteAuthForm.tsx` (Task 3)
- Produces: nada novo

- [ ] **Step 1: Importar o componente**

Adicionar ao bloco de imports:

```tsx
import ClienteAuthForm from '@/components/ClienteAuthForm'
```

- [ ] **Step 2: Substituir o bloco de título + form quando `tipo === 'cliente'`**

O arquivo hoje renderiza, incondicionalmente (para os dois tipos), o bloco:

```tsx
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-gray-900">{textos.titulo}</h1>
            <p className="text-gray-500 text-sm mt-2">{textos.descricao}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* ...campos de email e senha... */}
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
```

Envolver esse bloco inteiro (do `<div className="text-center mb-8">` até o `<div className="mt-6 text-center">` com o link "Esqueceu sua senha?", ambos inclusive) numa condicional, mostrando `<ClienteAuthForm />` no lugar quando `tipo === 'cliente'`:

```tsx
          {tipo === 'cliente' ? (
            <ClienteAuthForm />
          ) : (
            <>
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
            </>
          )}
```

Isso mantém o form da aba Funcionário byte-a-byte idêntico ao que já existe hoje (mesmos `email`/`password`/`handleLogin` do componente `LoginFuncionario`), só movido para dentro do ramo `else`. O ramo `tipo === 'cliente'` agora delega inteiramente pro `ClienteAuthForm`, que tem seu próprio estado interno — os estados `email`/`password` do componente pai (`LoginFuncionario`) deixam de ser lidos/escritos pela aba Cliente, mas continuam existindo e sendo usados pela aba Funcionário sem alteração.

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `app/funcionario/login/page.tsx`

- [ ] **Step 4: Commit**

```bash
git add app/funcionario/login/page.tsx
git commit -m "feat: integra cadastro/login de cliente na tela de login"
```

---

### Task 5: Saudação com nome em `app/conta/page.tsx`

**Files:**
- Modify: `app/conta/page.tsx`

**Interfaces:**
- Consumes: `type UsuarioLogado` de `lib/clientAuth.ts` (Task 2)
- Produces: nada novo

- [ ] **Step 1: Importar o tipo exportado**

Trocar:

```ts
import { getUsuarioLogado, logoutUsuario } from '@/lib/clientAuth'
```

por:

```ts
import { getUsuarioLogado, logoutUsuario, type UsuarioLogado } from '@/lib/clientAuth'
```

- [ ] **Step 2: Atualizar o tipo do estado `usuario`**

Trocar:

```ts
const [usuario, setUsuario] = useState<{ email: string } | null>(null)
```

por:

```ts
const [usuario, setUsuario] = useState<UsuarioLogado | null>(null)
```

- [ ] **Step 3: Atualizar a saudação no JSX**

Trocar:

```tsx
          description={`Olá, ${usuario.email}`}
```

por:

```tsx
          description={`Olá, ${usuario.nome ?? usuario.email}`}
```

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 5: Commit**

```bash
git add app/conta/page.tsx
git commit -m "feat: saudacao com nome em Minha Conta"
```

---

### Task 6: Verificação manual end-to-end

**Files:** nenhum

**Interfaces:**
- Consumes: app rodando localmente (`npm run dev`)
- Produces: confirmação visual do fluxo completo

- [ ] **Step 1: Subir o dev server limpo**

Run: `rm -rf .next && npm run dev` (em background)

- [ ] **Step 2: Tentar logar sem conta**

Via `agent-browser`: ir em `/funcionario/login`, aba Cliente (padrão), tentar logar com um email que não existe. Confirmar erro "Não encontramos uma conta com esse email." com o link "Cadastre-se" clicável.

- [ ] **Step 3: Cadastrar uma conta**

Clicar "Não tem conta? Cadastre-se" (ou o link do erro), preencher nome/email/senha/confirmar senha, enviar. Confirmar login automático (redireciona pra home) e que o header mostra "Minha Conta".

- [ ] **Step 4: Confirmar saudação com nome**

Ir em `/conta`, confirmar que a descrição mostra "Olá, {nome}" (não o email).

- [ ] **Step 5: Deslogar e logar de novo**

Clicar "Sair", voltar em `/funcionario/login`, logar com o mesmo email/senha cadastrados. Confirmar sucesso.

- [ ] **Step 6: Testar senha errada**

Deslogar, tentar logar com o email cadastrado e senha errada. Confirmar erro "Senha incorreta." (sem o link de cadastro nesse caso).

- [ ] **Step 7: Testar cadastro duplicado**

Ir pro modo cadastro, tentar cadastrar de novo com o mesmo email. Confirmar erro "Já existe uma conta com esse email. Faça login."

- [ ] **Step 8: Confirmar que a aba Funcionário não mudou**

Trocar pra aba Funcionário, logar com qualquer email/senha, confirmar que continua indo direto pro dashboard sem exigir cadastro.

- [ ] **Step 9: Modo escuro**

Repetir os modos login e cadastro em dark mode, conferir contraste dos inputs e da mensagem de erro.
