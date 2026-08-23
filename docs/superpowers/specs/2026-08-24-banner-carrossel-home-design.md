# Carrossel de banner na home

## Contexto

Usuário pediu pra deixar a tela inicial mais chamativa/visual, pedindo referência no site oficial da Leroy Merlin. O site principal (`leroymerlin.com.br`) tem proteção anti-bot forte e bloqueou acesso automatizado em todas as rotas testadas (`/`, `/eletrica`) — não insisti em contornar. Consegui referência parcial via `blog.leroymerlin.com.br` (fundo claro, CTAs em laranja, tipografia bold, cards com foto grande dominando, pouca decoração) combinada com conhecimento geral da identidade visual do grupo (banners promocionais grandes/rotativos, grade de categorias com fotos reais).

Da lista de opções levantadas com o usuário, a escolhida foi: transformar o banner promocional único e estático de `app/page.tsx` (linhas 39-53) num carrossel rotativo — mais dinamismo na primeira dobra da home, aproveitando pra dar visibilidade às features de IA do app (Projeto Guiado, Entrevista Guiada, Tire Dúvidas) que hoje não aparecem em lugar nenhum da home.

`components/TourGuiado.tsx` já tem a única lógica de slides/dots do projeto (navegação manual, sem auto-rotação) — usado como referência de estilo pros dots, não reaproveitado diretamente (é um modal de onboarding, não um componente exportável de carrossel).

## Objetivo

Trocar o banner estático por um carrossel de 4 slides com troca automática, cada slide clicável levando o cliente pra uma tela real do app, dando mais peso visual à home e mais visibilidade cruzada às features já construídas.

## Escopo

**Dentro do escopo:**
- Novo componente `components/BannerCarrossel.tsx`, extraído e expandido do banner atual.
- 4 slides fixos (conteúdo definido abaixo), troca automática a cada 5s, pausa ao passar o mouse, dots clicáveis pra navegação manual.
- `app/page.tsx` passa a renderizar `<BannerCarrossel />` no lugar do bloco de banner atual (linhas 39-53).

**Fora do escopo:**
- Mudanças na grade de categorias, card de busca ou barra de estatísticas (fora do que foi pedido nesta rodada).
- Slides configuráveis via CMS/admin — conteúdo fixo no código, mesmo padrão de "dados estáticos no componente" já usado em `ProjetoWizard.tsx` (`EXEMPLOS`) e `TourGuiado.tsx`.
- Swipe touch/gestos — troca só por auto-rotação ou clique nos dots (mouse/toque no dot funciona igual em mobile, só não há arrastar o slide).

## Conteúdo dos 4 slides

**Importante, achado ao escrever esta spec:** não existe rota `/ferramentas` (nem rota por categoria nenhuma) — categorias só são navegáveis por estado local (`categoriaAtiva`) dentro do próprio componente `Home` em `app/page.tsx`, não por URL. Os slides 2-4 apontam pra rotas reais (`<Link>` normal). O slide 1 (categoria) precisa de um mecanismo diferente: `BannerCarrossel` recebe uma prop opcional `onCategoriaClick?: (categoria: { slug: string; label: string }) => void`, que `Home` passa como `() => setCategoriaAtiva({ slug: 'ferramentas', label: 'Ferramentas' })`. Cada slide tem uma `acao` de um dos dois tipos:

```ts
type AcaoSlide =
  | { tipo: 'link'; href: string }
  | { tipo: 'categoria'; slug: string; label: string }
```

| # | Badge | Título | Subtítulo | Categoria (imagem de fundo) | Ação |
|---|---|---|---|---|---|
| 1 | OFERTA DA SEMANA (`bg-lm-yellow text-black`) | Até 30% off | em ferramentas elétricas selecionadas | Ferramentas | `{ tipo: 'categoria', slug: 'ferramentas', label: 'Ferramentas' }` |
| 2 | NOVIDADE (`bg-white text-lm-green`) | Projeto Guiado | Descreva sua reforma, a IA monta a lista completa de materiais | Construção | `{ tipo: 'link', href: '/projeto' }` |
| 3 | PRA VOCÊ (`bg-white text-lm-green`) | Entrevista guiada | Responda 5 perguntas e receba sugestões pensadas pra você | Decoração | `{ tipo: 'link', href: '/conta' }` |
| 4 | 24H (`bg-white text-lm-green`) | Tire suas dúvidas | Pergunte sobre materiais e técnicas antes de comprar, com a IA | Jardim | `{ tipo: 'link', href: '/duvidas' }` |

(A categoria da imagem é só o pano de fundo decorativo bleeding à direita, mesmo tratamento visual do banner atual — não precisa ilustrar literalmente o slide, ver `getImagemCategoria` já usado hoje com `'Ferramentas'` fixo sem relação direta ao conteúdo textual.)

## `components/BannerCarrossel.tsx`

- `'use client'`, mantém a mesma estrutura visual do banner atual (`h-40 sm:h-44`, `rounded-card`, `bg-gradient-to-r from-green-800 to-lm-green`, foto com `object-cover` sangrando à direita, badge + título + subtítulo à esquerda) — só o conteúdo variável por slide muda.
- Estado: `const [slide, setSlide] = useState(0)`, `const [pausado, setPausado] = useState(false)`.
- `useEffect` com `setInterval(5000)` avançando `slide` ciclicamente (`(s + 1) % SLIDES.length`), só quando `!pausado`; `clearInterval` no cleanup. Reinicia o timer sempre que `slide` muda (efeito depende de `[slide, pausado]`) pra um clique manual num dot não ser imediatamente sobrescrito pela próxima troca automática.
- `onMouseEnter`/`onMouseLeave` no container alternam `pausado`.
- O card inteiro é clicável, navegando conforme a `acao` do slide atual: se `tipo === 'link'`, o conteúdo fica dentro de um `<Link href={acao.href}>`; se `tipo === 'categoria'`, um `<div onClick={...}>` chamando a prop `onCategoriaClick(acao)` recebida do componente pai (sem `<Link>`, já que não há navegação de URL nesse caso). Os dots ficam fora dessa área clicável (`stopPropagation` no clique do dot, mesmo padrão já usado em botões dentro de card clicável em `CategoriaView.tsx`/`StoreMap.tsx`).
- Dots: pequena barra de bolinhas no canto inferior esquerdo do banner (sobre a imagem, com leve sombra/contraste), estilo similar ao `Dots` de `TourGuiado.tsx` (ativo = pílula mais larga, inativo = bolinha pequena) mas em tom que combine com o fundo verde do banner (ex: ativo branco sólido, inativo `bg-white/30`).

## `app/page.tsx`

Bloco `{/* Banner promocional */}` (linhas 39-53) substituído por `<BannerCarrossel onCategoriaClick={setCategoriaAtiva} />` — `setCategoriaAtiva` já existe no componente `Home` (linha 23) com a assinatura exata que a prop espera (`{ slug: string; label: string } | null`, compatível por estrutura mesmo aceitando `null` a mais). Import de `getImagemCategoria` continua necessário no arquivo (ainda usado no grid de categorias logo abaixo), nada mais muda nessa página.

## Dark mode

O carrossel usa cores fixas (gradiente verde escuro, texto branco) já independentes de tema — mesmo raciocínio do banner atual, que já funciona igual em ambos os temas hoje (não está na lista de elementos com override `.dark`, e não precisa, porque não usa nenhuma classe `bg-white`/`text-gray-*` que os overrides tocam). O único elemento novo a conferir é o dot inativo `bg-white/30`, que deve continuar visível em ambos os temas por ser translúcido sobre um fundo que já é escuro por natureza (gradiente verde, não afetado pelo tema).

## Testes

Sem framework de testes. Verificação: `npx tsc --noEmit`; navegação manual via `agent-browser` cobrindo — troca automática ocorre (aguardar >5s, confirmar slide mudou), passar o mouse por cima pausa a troca, clicar num dot troca imediatamente pro slide certo e não é revertido pela troca automática logo em seguida, clicar no corpo do slide 1 (categoria) abre a `CategoriaView` de Ferramentas dentro da própria home (sem navegar de URL), clicar no corpo dos slides 2-4 navega pra `/projeto`/`/conta`/`/duvidas` respectivamente, clicar num dot não dispara nem a navegação nem a abertura de categoria, mobile (390×844) e modo escuro.
