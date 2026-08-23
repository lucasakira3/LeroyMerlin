# Aba de notificações do usuário

## Contexto

Usuário pediu uma aba de notificações. Duas perguntas de escopo foram respondidas antes de desenhar a feature:

1. **Onde mora a notificação:** sino com painel suspenso na `NavBar`, não uma nova aba de topo nem uma seção dentro de "Minha Conta".
2. **Origem dos eventos:** só eventos reais que já acontecem nos fluxos mockados existentes do app — nada de notificações simuladas/fake (ex.: reposição de estoque fictícia).

Levantamento do código existente (via agente de exploração) confirmou: não existe hoje nenhum conceito de notificação persistente; `SuggestBanner`/`CompareToast` são toasts efêmeros em `sessionStorage`, sistema paralelo que não deve ser tocado; `Pedido` (`lib/clientPedidos.ts`) não tem campo de status, só o instante de finalização da compra é um evento utilizável; `clientHistorico.ts` é o precedente mais próximo de lista limitada e com timestamp (cap em 12, mais recente primeiro, mas não é por e-mail); `clientPerfil.ts`/`clientContas.ts` são o precedente de mapa por e-mail normalizado (`Record<email, T>`) que será seguido aqui; `CarrinhoIcon.tsx` é o precedente visual e de reatividade (badge de contagem, evento customizado `lm-carrinho-change`) a ser espelhado.

Três eventos reais foram identificados como gatilhos: pedido finalizado (`app/carrinho/page.tsx`), agendamento de visita confirmado (`components/AgendamentoForm.tsx`) e entrevista guiada respondida (`components/EntrevistaGuiada.tsx`).

**Achado ao escrever esta spec:** `AgendamentoForm` não exige login — é um formulário com campos próprios de nome/telefone/e-mail, usável por visitante. Diferente de pedido (exige `usuario` logado) e entrevista guiada (recebe `email` da conta logada), o agendamento não tem garantia de estar associado à conta logada no momento da confirmação. Ver decisão de escopo abaixo.

## Objetivo

Dar visibilidade a três eventos que hoje acontecem silenciosamente no app (pedido confirmado, visita agendada, entrevista respondida), via um sino na `NavBar` com contador de não lidas e painel de histórico, sem exigir nenhuma alteração de backend (tudo em `localStorage`, mesmo padrão já usado no projeto inteiro).

## Escopo

**Dentro do escopo:**
- Novo módulo `lib/clientNotificacoes.ts` — CRUD de notificações por e-mail em `localStorage`.
- Novo componente `components/NotificacoesBell.tsx` — ícone de sino com badge de não lidas + painel suspenso.
- Inserção do sino na `NavBar` (desktop e mobile), visível só para usuário logado.
- Três pontos de disparo real: pedido finalizado, agendamento confirmado (só se logado), entrevista guiada respondida.

**Fora do escopo:**
- Qualquer notificação simulada/fake (reposição de estoque, promoções, etc.) — explicitamente rejeitado pelo usuário.
- Notificações para o formulário de agendamento preenchido por visitante não logado (o agendamento em si continua funcionando normalmente pra visitante, só não gera notificação).
- Push notification real / service worker / notificação do navegador — é só uma lista dentro do app.
- Alterar `Pedido`, `Agendamento` ou `Perfil` para ganhar campo de status — os três eventos continuam sendo dados estáticos de um instante único, a notificação é uma entidade separada que só referencia esse instante.
- Tocar em `SuggestBanner`/`useSuggestAgent`/`TrackProduct`/`useProductTracker`/`CompareToast` — sistema de toast efêmero paralelo, não relacionado.

## `lib/clientNotificacoes.ts`

Mesmo padrão de `clientPerfil.ts`: mapa `Record<string, Notificacao[]>` em `localStorage` sob a chave `lm_notificacoes`, indexado por e-mail normalizado (`trim().toLowerCase()`).

```ts
export type TipoNotificacao = 'pedido' | 'agendamento' | 'entrevista'

export interface Notificacao {
  id: string
  tipo: TipoNotificacao
  titulo: string
  mensagem: string
  href: string
  criadaEm: string // ISO
  lida: boolean
}
```

Funções exportadas:
- `adicionarNotificacao(email: string, dados: Omit<Notificacao, 'id' | 'criadaEm' | 'lida'>): void` — gera `id` (`crypto.randomUUID()`), `criadaEm` (`new Date().toISOString()`), `lida: false`; insere no início da lista do e-mail; corta a lista em 20 itens (mesmo raciocínio de cap do `clientHistorico.ts`, só que por e-mail); salva; dispara `window.dispatchEvent(new Event('lm-notificacoes-change'))`.
- `getNotificacoes(email: string): Notificacao[]` — retorna a lista do e-mail (`[]` se não existir), já na ordem mais recente primeiro (ordem de inserção do array).
- `marcarComoLida(email: string, id: string): void` — seta `lida: true` na notificação de `id` correspondente; salva; dispara o evento.
- `marcarTodasComoLidas(email: string): void` — seta `lida: true` em todas; salva; dispara o evento.
- `getQuantidadeNaoLida(email: string): number` — `getNotificacoes(email).filter(n => !n.lida).length`.

Leitura/escrita do `localStorage` segue exatamente o mesmo formato defensivo de `clientPerfil.ts` (`try/catch` no parse, `typeof window === 'undefined'` guard, valida `!Array.isArray` e `typeof === 'object'` antes de aceitar o JSON salvo).

## `components/NotificacoesBell.tsx`

`'use client'`. Mesma pegada visual de `CarrinhoIcon.tsx` (botão 40×40, `rounded-xl`, `text-white/80 hover:text-white hover:bg-white/10`), mas:
- É um `<button>` (não `<Link>`) que alterna `const [aberto, setAberto] = useState(false)`.
- Ícone `Bell` do `lucide-react`, `size={19}`.
- Badge de não lidas: mesma posição/tamanho do badge do carrinho (`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full ... text-[10px] font-bold flex items-center justify-center`), mas `bg-red-500 text-white` (em vez do amarelo do carrinho) para diferenciar visualmente "alerta" de "contagem de itens". Mostra `quantidade > 9 ? '9+' : quantidade`; não renderiza se `quantidade === 0`.
- Estado: `useEffect` inicial lê `getUsuarioLogado()` e, se houver, chama `getNotificacoes(email)` e `getQuantidadeNaoLida(email)`; escuta `lm-notificacoes-change` (mesmo padrão do `CarrinhoIcon` com `lm-carrinho-change`) pra re-sincronizar quando outra parte do app adicionar uma notificação.
- Painel suspenso (`aberto === true`): `absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 z-50`. Cabeçalho com "Notificações" + botão "Marcar todas como lidas" (só aparece se houver alguma não lida, chama `marcarTodasComoLidas`). Lista: cada item é um `<Link href={n.href}>` com `onClick` chamando `marcarComoLida(email, n.id)` e fechando o painel (`setAberto(false)`); não lidas com fundo `bg-lm-green/5` e uma bolinha verde à esquerda, lidas com fundo branco; mostra `titulo`, `mensagem`, e tempo relativo (função local simples tipo "há 2h"/"há 3d", sem dependência nova). Estado vazio: texto centralizado "Nenhuma notificação por enquanto" quando a lista é `[]`.
- Fecha ao clicar fora (`useEffect` com listener de `mousedown` em `document`, checando `ref` do container, mesmo padrão comum de dropdown já implícito no projeto) e ao apertar `Escape`.
- Só é renderizado pelo componente pai (`NavBar`) quando `logado === true` — o próprio `NotificacoesBell` não decide isso, é condicional no JSX do `NavBar`, mesmo padrão do bloco `{logado ? <Link href="/conta">...</Link> : <Link href="/funcionario/login">...</Link>}` já existente.

## Integração na `NavBar`

`components/NavBar.tsx`:
- Linha 69 (bloco desktop): `<CarrinhoIcon />` seguido de `{logado && <NotificacoesBell />}`, antes de `<ThemeToggle />`.
- Linha 128 (bloco mobile, dentro de `<div className="flex items-center gap-2">`): mesmo padrão, `<CarrinhoIcon />` seguido de `{logado && <NotificacoesBell />}`.
- Import adicionado: `import NotificacoesBell from './NotificacoesBell'`.

## Pontos de disparo

**1. Pedido finalizado — `app/carrinho/page.tsx`, dentro de `confirmarPedido()`:**
Logo após `salvarPedido(usuario.email, pedido)` (linha 109), antes de `limparCarrinho()`:
```ts
adicionarNotificacao(usuario.email, {
  tipo: 'pedido',
  titulo: 'Pedido confirmado',
  mensagem: `Pedido #${pedido.numero} confirmado com sucesso.`,
  href: '/conta',
})
```
Import adicionado: `adicionarNotificacao` de `@/lib/clientNotificacoes`.

**2. Agendamento confirmado — `components/AgendamentoForm.tsx`, no `onClick` do botão "Confirmar visita":**
Logo após `salvarAgendamento({...})` (linha 295) e antes de `setConfirmado(true)` (linha 296), só dispara se houver usuário logado no momento:
```ts
const usuarioLogado = getUsuarioLogado()
if (usuarioLogado) {
  adicionarNotificacao(usuarioLogado.email, {
    tipo: 'agendamento',
    titulo: 'Visita agendada',
    mensagem: `Sua visita em ${form.loja} foi confirmada para ${form.data} às ${form.horario}.`,
    href: '/agendamento',
  })
}
```
Imports adicionados: `getUsuarioLogado` de `@/lib/clientAuth`, `adicionarNotificacao` de `@/lib/clientNotificacoes`. Isso é o único dos três pontos de disparo que consulta `getUsuarioLogado()` diretamente em vez de já ter o e-mail em escopo — necessário porque este formulário não exige login (ver Contexto).

**3. Entrevista guiada respondida — `components/EntrevistaGuiada.tsx`, dentro de `enviar()`:**
Logo após `salvarPerfil(email, perfil)` (linha 125), antes de `buscarSugestoes(perfil)`:
```ts
adicionarNotificacao(email, {
  tipo: 'entrevista',
  titulo: 'Perfil traçado',
  mensagem: 'Suas sugestões personalizadas já estão disponíveis.',
  href: '/conta',
})
```
Import adicionado: `adicionarNotificacao` de `@/lib/clientNotificacoes`. `email` já é uma prop existente do componente, mesma variável já usada em `salvarPerfil(email, perfil)`.

## Dark mode

O painel do sino usa fundo branco/texto escuro fixo (`bg-white`, `text-gray-...`), igual ao padrão de outros dropdowns/cards do projeto que não têm override `.dark` dedicado ainda — mesmo tratamento que o resto da área "Minha Conta" recebe hoje. Não está no escopo desta feature introduzir dark mode onde ele não existe; se o projeto tiver overrides `.dark` genéricos para `bg-white`/`text-gray-*` (a verificar na implementação, mesmo componente de card usado em outras telas), o painel os herda automaticamente.

## Testes

Sem framework de testes automatizados no projeto. Verificação: `npx tsc --noEmit`; navegação manual via `agent-browser` cobrindo — badge aparece com contagem correta após cada um dos três eventos (finalizar pedido, confirmar agendamento logado, responder entrevista guiada), badge não aparece pra usuário deslogado, clicar no sino abre o painel com a notificação mais recente no topo, clicar numa notificação marca como lida (badge decrementa) e navega pro `href` certo, "marcar todas como lidas" zera o badge, painel fecha ao clicar fora e ao apertar Escape, agendamento por visitante deslogado não gera notificação (nem quebra o fluxo de agendamento em si), estado vazio aparece pra conta sem nenhuma notificação ainda, mobile (390×844).
