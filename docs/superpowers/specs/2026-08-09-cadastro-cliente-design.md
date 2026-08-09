# Aba de cadastro do cliente

## Contexto

MVP local-only, auth simulada (documentado como intencional — não é produção real). Hoje `app/funcionario/login/page.tsx` tem um toggle segmentado Cliente/Funcionário; a aba Cliente aceita qualquer email/senha sem cadastro prévio, chamando `loginUsuario(email)` de `lib/clientAuth.ts` (que só guarda `{email}` em `localStorage`, chave `lm_usuario_logado`). Não existe nenhum registro de contas — "logar" e "existir" são a mesma coisa hoje.

## Objetivo

Cliente precisa se cadastrar (nome, email, senha) antes de conseguir logar. O login de cliente passa a validar contra as contas cadastradas.

## Escopo

**Dentro do escopo:**
- Novo módulo `lib/clientContas.ts`: registro de contas de cliente em `localStorage`.
- `lib/clientAuth.ts`: `UsuarioLogado` ganha `nome?: string`; `loginUsuario` aceita `(email, nome?)`.
- Novo componente `components/ClienteAuthForm.tsx`: sub-modos login/cadastro dentro da aba Cliente da tela `app/funcionario/login/page.tsx`.
- `/conta`: saudação usa o nome quando disponível.

**Fora do escopo:**
- Qualquer segurança real (hash de senha, tokens, expiração de sessão) — mesma postura de "auth simulada" já documentada no projeto.
- A aba Funcionário — continua aceitando qualquer credencial, sem cadastro.
- Recuperação de senha ("Esqueceu sua senha?" já existe como link decorativo, sem função — não é alterado).
- Edição de conta/senha depois de criada.

## Módulo de dados: `lib/clientContas.ts`

Mesmo padrão defensivo dos demais módulos `lib/client*.ts` (`try/catch`, no-op em SSR).

- Chave: `lm_contas_cliente`
- Formato: `Record<string /* email normalizado */, ContaCliente>`
  ```ts
  interface ContaCliente {
    nome: string
    senha: string
    criadoEm: string // ISO timestamp
  }
  ```
- Email é normalizado (`trim().toLowerCase()`) antes de usar como chave, em todas as funções — login não deve ser case-sensitive no email.

Funções:
- `contaExiste(email: string): boolean`
- `criarConta(nome: string, email: string, senha: string): void` — upsert simples (chamador já garante via `contaExiste` que não existe antes de chamar; a função em si não repete essa checagem, mantendo-a de responsabilidade única)
- `validarLogin(email: string, senha: string): 'ok' | 'nao_encontrada' | 'senha_incorreta'` — retorna um resultado tipado em vez de boolean, para o formulário poder diferenciar as duas mensagens de erro
- `getConta(email: string): ContaCliente | null`

## `lib/clientAuth.ts`

- `interface UsuarioLogado { email: string; nome?: string }` — passa a ser exportada (hoje não é).
- `loginUsuario(email: string, nome?: string): void` — grava `{ email, nome }` (nome fica `undefined` se omitido, ex: login de funcionário continua não passando nome).
- `getUsuarioLogado`, `logoutUsuario`: sem mudança de assinatura.

## Componente `components/ClienteAuthForm.tsx`

Recebe nenhuma prop (autocontido, como os outros componentes client-side do projeto). Estado interno:
- `modo: 'login' | 'cadastro'`
- Campos do form (`nome`, `email`, `senha`, `confirmarSenha` — `confirmarSenha` só usado em modo cadastro)
- `erro: string | null`
- `loading: boolean`

**Modo login:** campos email + senha (mesmo visual que o form atual de `app/funcionario/login/page.tsx` — ícone, placeholder, estilo). Ao submeter, chama `validarLogin`:
- `'nao_encontrada'` → `erro = 'Não encontramos uma conta com esse email.'` (mensagem inclui, no JSX, um link clicável para trocar pro modo cadastro)
- `'senha_incorreta'` → `erro = 'Senha incorreta.'`
- `'ok'` → `loginUsuario(email, conta.nome)`, redireciona pra home (`window.location.href = '/'`, mesmo comportamento atual)

**Modo cadastro:** campos nome + email + senha + confirmar senha. Ao submeter:
- `senha !== confirmarSenha` → `erro = 'As senhas não coincidem.'`
- `contaExiste(email)` → `erro = 'Já existe uma conta com esse email. Faça login.'`
- senão: `criarConta(nome, email, senha)`, depois `loginUsuario(email, nome)`, redireciona pra home (cadastro já loga automaticamente, sem exigir um segundo passo de login)

Link no rodapé do form alterna `modo` (`'Não tem conta? Cadastre-se'` ↔ `'Já tem conta? Entrar'`), limpando `erro` ao trocar.

## `app/funcionario/login/page.tsx`

Quando `tipo === 'cliente'`, renderiza `<ClienteAuthForm />` no lugar do form de email/senha atual. O toggle Cliente/Funcionário, o cabeçalho com logo, e o form da aba Funcionário permanecem exatamente como estão hoje (`handleLogin` da aba funcionário não muda).

## `app/conta/page.tsx`

A linha `description={\`Olá, ${usuario.email}\`}` passa a usar o nome quando presente: `` `Olá, ${usuario.nome ?? usuario.email}` ``. O tipo local do estado `usuario` (`useState<{ email: string } | null>`) passa a incluir `nome?: string` (ou importa `UsuarioLogado` de `lib/clientAuth.ts`, agora exportado).

## Tratamento de erros

`lib/clientContas.ts` segue o mesmo padrão defensivo dos outros módulos — leitura corrompida de `localStorage` retorna `{}` (sem contas), nunca lança. Um cliente com senha esquecida não tem nenhum caminho de recuperação (fora de escopo) — a única saída é criar uma nova conta com outro email, aceitável para este MVP.

## Testes

Sem framework de testes (convenção do projeto). Verificação via:
- `npx tsc --noEmit`
- Script `tsx` temporário para `lib/clientContas.ts` (criar conta, login com senha certa/errada, email não cadastrado, normalização de maiúsculas/minúsculas)
- Navegação real via `agent-browser`: tentar logar sem conta (erro "não encontramos"), cadastrar uma conta nova, confirmar login automático e saudação com nome em `/conta`, deslogar e logar de novo com a mesma conta, tentar cadastrar com o mesmo email de novo (erro), tentar senha errada (erro), confirmar que a aba Funcionário continua funcionando sem cadastro, testar em modo claro e escuro
