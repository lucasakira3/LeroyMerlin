# Login de cliente e controle de header

**Data:** 2026-08-08
**Status:** Aprovado, aguardando plano de implementação

## Contexto

Hoje `/funcionario/login` só tem login de funcionário (simulado, aceita qualquer credencial), levando pro dashboard. O header da área do cliente (`NavBar`) sempre mostra tanto os 4 links de navegação quanto um botão "Login" (pro portal do funcionário) e a aba "Minha Conta" (`/conta`, implementada no bloco anterior de personalização) — sem nenhuma noção de "cliente logado".

## Objetivo

Adicionar um segundo tipo de login — "Cliente" — na mesma tela, sem backend, e usar esse estado pra controlar a visibilidade de "Login" vs. "Minha Conta" no header, incluindo logout a partir da página Minha Conta.

## Decisões de design

### 1. Armazenamento — `lib/clientAuth.ts`

Mesmo padrão dos módulos `lib/clientHistorico.ts` / `lib/clientFavoritos.ts` já existentes: leitura/escrita direta no `localStorage`, com guard `typeof window === 'undefined'`.

- Chave: `lm_usuario_logado`.
- Formato armazenado: `{ email: string }` (JSON) quando logado; chave ausente quando deslogado.
- `loginUsuario(email: string): void` — salva `{ email }`.
- `logoutUsuario(): void` — remove a chave.
- `getUsuarioLogado(): { email: string } | null`.

### 2. Tela de login (`app/funcionario/login/page.tsx`) — mesma URL, dois modos

- Um toggle no topo do card (dois botões/abas: "Funcionário" e "Cliente") controla um estado `tipo: 'funcionario' | 'cliente'`.
- **Aba padrão ao carregar a página: Cliente** — é o destino do botão "Login" do header do cliente, que é o caminho mais comum.
- Os campos do formulário (e-mail + senha) são os mesmos nas duas abas — só o título ("Portal do Funcionário" vs. "Entrar como Cliente") e o comportamento do submit mudam.
- Submit no modo **Funcionário**: comportamento inalterado — simula delay, `router.push('/funcionario/dashboard')`.
- Submit no modo **Cliente**: simula delay, chama `loginUsuario(email)`, depois `window.location.href = '/'` (recarga completa — ver justificativa técnica abaixo).

**Por que recarga completa em vez de navegação SPA:** o `NavBar` vive em `app/layout.tsx` (layout raiz), que não remonta em navegações internas do Next.js — só o conteúdo da página troca. Se o login apenas gravasse o `localStorage` e navegasse via `router.push`, o header não atualizizaria sozinho (ficaria mostrando "Login" mesmo já logado) até um reload manual. Usar `window.location.href` nos dois pontos que mudam esse estado (login de cliente e logout) força o `NavBar` a remontar e ler o estado atual. Login de funcionário não precisa disso — o dashboard é uma área separada, sem o `NavBar` do cliente.

### 3. `NavBar` — elemento condicional à direita

- Os 4 links fixos (Buscar Produtos, Projeto Guiado, Tire Dúvidas, Agendar Visita) continuam sempre visíveis, sem mudança.
- O elemento à direita passa a ser condicional, checado uma vez via `useEffect` ao montar (suficiente, já que login/logout agora força reload):
  - `getUsuarioLogado()` retorna um usuário → mostra o link "Minha Conta" (mesmo visual/posição de hoje).
  - Retorna `null` → mostra o botão "Login" (mesmo visual/posição de hoje).
- Nunca mostra os dois ao mesmo tempo.

### 4. Página `/conta` — proteção + logout

- Ao montar, verifica `getUsuarioLogado()`:
  - Se `null`: redireciona (`router.push`) pra `/funcionario/login` — a página não renderiza o conteúdo protegido nesse caso (nem por um instante).
  - Se houver usuário: guarda no estado e renderiza normalmente.
- O `PageHeader` existente no topo da página passa a receber:
  - `description`: `Olá, {email}` (substitui a descrição genérica atual).
  - `action`: um botão "Sair" (`Button variant="ghost"`, ícone `LogOut`) que chama `logoutUsuario()` e depois `window.location.href = '/'`.
- O restante da página (seções de Favoritos/Vistos recentemente) não muda.

## Fora de escopo

- Qualquer validação real de credenciais (login de cliente continua aceitando qualquer email/senha, igual ao de funcionário).
- Cadastro de novo usuário.
- Persistência entre dispositivos/navegadores — é só `localStorage` local, igual ao resto da personalização.
- Login de funcionário afetar o header do cliente de alguma forma — os dois estados de auth (funcionário/cliente) são independentes.
