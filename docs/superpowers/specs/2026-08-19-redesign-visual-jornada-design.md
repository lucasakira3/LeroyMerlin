# Redesign visual da jornada de compra

## Contexto

O coordenador do desafio (FIAP) avaliou o projeto e reclamou que está "muito texto texto e pouco visual" — quer algo com a cara do site oficial da Leroy Merlin. Auditoria do código confirmou a causa: **nenhum produto tem imagem**. `data/produtos.json` (317 itens, 9 categorias: Ferramentas, Elétrica, Hidráulica, Iluminação, Jardim, Pisos e Cerâmica, Banheiro, Pintura, Construção) só tem campos de texto/número. `ProductCard.tsx`, `CategoriaView.tsx`, `SearchSection.tsx`, `ProdutoDrawer.tsx`, `app/comparar/page.tsx` e `app/carrinho/page.tsx` renderizam tudo em texto + ícone. A home (`app/page.tsx`) é um grid de botões com ícone (`lucide-react`) + um card de busca + 3 números — nenhuma imagem grande em lugar nenhum.

O header (`NavBar.tsx`) já usa o verde oficial (`lm-green` = `#00843d`) e o logo real; `tailwind.config.js` já define `lm-yellow`/`lm-orange` — a paleta de marca já existe, só não é usada de forma visual (fotos, banners, hierarquia).

Não há verba/tempo pra fotografar os 317 produtos, então o caminho é imagem **por categoria** (9 fotos), não por produto individual. Decisão validada com o usuário: curadoria manual de fotos reais do Wikimedia Commons (licença livre, sem API key), não Unsplash/Pexels ao vivo — evita mais uma API key pra gerenciar/vazar (ver `[[feedback-no-claude-coauthor]]`-style histórico do projeto com a `GEMINI_API_KEY` exposta) e uma dependência de rede em runtime.

Direções visuais e o card de produto foram validados com o usuário via mockup no companion de brainstorming (fotos reais conferidas uma a uma, ver histórico da conversa) — aprovado: banner promocional fixo estilo "vitrine" na home, categorias como tiles com foto, card de produto vertical grande e imersivo (foto grande, corredor/carrinho como badge sobre a foto).

## Objetivo

Dar peso visual real à jornada de compra do cliente (home → navegar categoria/buscar → ver produto → comparar/carrinho), usando fotografia real por categoria, sem tocar em backend/dados nem no painel do funcionário.

## Escopo

**Dentro do escopo:**
- `lib/categoriaImagens.ts`: mapa estático `categoria → caminho da imagem local`.
- 9 imagens curadas do Wikimedia Commons, baixadas para `public/categorias/*.jpg`.
- Home (`app/page.tsx`): banner fixo no topo + grid de categorias com foto (substitui os botões de ícone atuais).
- Componente único `components/ProductCard.tsx` (formato "vertical imersivo") reusado em `CategoriaView.tsx`, `SearchSection.tsx`, `app/comparar/page.tsx`, `app/carrinho/page.tsx` (versão compacta) e `StoreMap.tsx` (versão compacta).
- `ProdutoDrawer.tsx`: foto da categoria em destaque no topo do drawer.
- Dark mode: chrome dos novos componentes (cards, badges, banner) segue a paleta `.dark` existente; fotos não mudam entre temas.

**Fora do escopo:**
- Painel do funcionário (`app/funcionario/**`) — continua como está, tabelas/dashboard não fazem parte da queixa.
- Foto por produto individual — só por categoria.
- Qualquer promoção/preço real atrelado ao banner — o banner é decorativo/estático, não lê nenhum dado de promoção (não existe backend de promoções).
- Carrossel/rotação de banners — um banner fixo só.
- Novas categorias no grid de navegação da home — continua mostrando as mesmas 7 categorias + "Todos" que já existem hoje (`app/page.tsx`); "Pisos e Cerâmica" e "Banheiro" ganham imagem no mapa (pra aparecer corretas em cards/drawer/comparador) mas não viram um botão novo no grid da home.

## Sistema de imagens: `lib/categoriaImagens.ts`

Mapa `Record<string, { src: string; credito?: string }>` com as 9 chaves exatas de `produto.categoria` (`Ferramentas`, `Elétrica`, `Hidráulica`, `Iluminação`, `Jardim`, `Pisos e Cerâmica`, `Banheiro`, `Pintura`, `Construção`). Função `getImagemCategoria(categoria: string): string` retorna o `src`; se a categoria não bater com nenhuma chave (defensivo, não deve acontecer com os dados atuais), retorna um fallback neutro (`public/categorias/_fallback.jpg`, pode reaproveitar a foto de "Ferramentas") em vez de quebrar o layout.

Imagens já pesquisadas e conferidas visualmente nesta sessão (baixar em resolução maior que os 500px do mockup, ~1200px de largura, pra não pixelizar no banner/hero):
- **Ferramentas**: `Cordless_Power_Drill_(49253538983).jpg`
- **Elétrica**: `Electrical_Outlet.jpg`
- **Hidráulica**: `Kupferfittings_4062.jpg`
- **Jardim**: `Flower_nursery_or_garden,_located_in_a_hilly_area,_with_many_potted_plants_arranged_on_tiered_shelves.jpg`
- **Pintura**: `Paint_roller_4.jpg`
- **Iluminação**: `Philips_LED_bulbs.jpg`

Ainda faltam (buscar e conferir do mesmo jeito antes de baixar, mesmo processo: buscar por palavra-chave na API de busca do Wikimedia Commons, checar visualmente antes de usar):
- **Pisos e Cerâmica**
- **Banheiro**
- **Construção**

Todas as imagens do Wikimedia Commons têm licença livre (CC/domínio público) — suficiente para um MVP acadêmico; não é necessário texto de atribuição visível na UI, mas os nomes de arquivo/fonte ficam comentados em `categoriaImagens.ts` pra rastreabilidade.

## Home (`app/page.tsx`)

**Banner** (novo, topo da página, acima do grid de categorias): fundo `bg-lm-green` com gradiente, foto de uma categoria em destaque posicionada à direita (mesmo tratamento visual do mockup aprovado — `object-cover`, sem distorcer), selo amarelo (`bg-lm-yellow`) "Oferta da semana" + texto curto estático. Sem link/CTA real — é decoração, não abre nada específico (ou, se fizer sentido na implementação, pode linkar pra categoria da foto usada, à critério de quem implementar, mas não é requisito).

**Grid de categorias**: mesmas 8 entradas de `CATEGORIAS` (`app/page.tsx`) — troca o botão `ícone + cor` por um tile com a foto de `categoriaImagens.ts` como fundo (`object-cover`) + gradiente escuro na base + label em branco por cima, mesmo padrão do mockup aprovado. A entrada `"todos"` (que não é uma categoria real de produto) mantém o tratamento atual de ícone/cor — não tem foto associada.

**Card de busca inteligente**: sem mudança, continua onde está.

## Componente `components/ProductCard.tsx`

Hoje esse componente existe mas está órfão (não é usado por `CategoriaView.tsx`/`SearchSection.tsx`, que têm sua própria renderização de card inline). Este redesign consolida: todo lugar que hoje desenha um card de produto inline passa a usar este componente único.

Formato aprovado (variante "vertical imersivo"):
- Foto da categoria (`getImagemCategoria(produto.categoria)`) ocupando o topo do card, `object-cover`, cantos arredondados (`rounded-card` já existe em `tailwind.config.js`).
- Badge do corredor (`bg-lm-green`, texto branco) sobreposto no canto inferior-esquerdo da foto.
- Botão/ícone de carrinho circular sobreposto no canto superior-direito da foto (mesmo comportamento de "Adicionar ao carrinho" + feedback de check já usado em `StoreMap.tsx`/`CategoriaView.tsx`, com `stopPropagation`).
- Abaixo da foto: nome do produto, preço em destaque, indicador de estoque (`StockIndicator`, componente já existente).
- Mantém `SustainabilityBadge` e o score de relevância (%) quando vier de busca — reposicionados como badges pequenos, não como texto solto.

Variante **compacta** (usada em `app/carrinho/page.tsx` e na lista do `StoreMap.tsx`, onde o espaço é menor/lista vertical): mesmo componente com uma prop `compact` — miniatura da foto à esquerda (~64px) em vez do formato vertical grande, texto ao lado. Evita duplicar lógica de imagem/preço/estoque em dois componentes diferentes.

**Nota sobre `CategoriaView.tsx`**: hoje o card ali tem dois cliques aninhados — clicar no corpo do card seleciona o produto pro mapa/comparador, um botão "Detalhes" interno abre o drawer. Ao trocar pelo `ProductCard` consolidado, essa distinção precisa ser preservada (o card recebe a seleção como `onClick` do container, o botão "Detalhes"/nome do produto como link separado por cima da foto) — não simplificar pra um clique único só, senão quebra o fluxo de seleção múltipla pro mapa que já existe.

`app/comparar/page.tsx` usa a foto da categoria no topo de cada coluna (mesmo tratamento do card vertical), acima dos dados já comparados hoje (preço, estoque, complexidade etc.) — não muda a estrutura de comparação existente, só adiciona a foto.

## `components/ProdutoDrawer.tsx`

Foto da categoria (`getImagemCategoria`) como hero no topo do drawer, acima do nome/preço — mesmo tratamento visual do card (`object-cover`, cantos arredondados no topo do drawer). Resto do drawer (especificações, chat IA, avaliações, botões de ação) mantém a estrutura atual, só ganha a imagem em cima.

## Dark mode

Fotos não têm variante dark (são fotos). Todo o chrome novo (badges, gradiente do banner, bordas de card) usa as classes/paleta `.dark` já centralizadas em `app/globals.css`, seguindo o padrão já estabelecido no projeto (nenhuma cor nova hardcoded fora do sistema existente).

## Tratamento de erros

Imagens são estáticas locais (`public/categorias/*.jpg`), servidas pelo Next.js — não há chamada de rede em runtime, então não há estado de erro de carregamento a tratar além do fallback de categoria desconhecida já descrito em `getImagemCategoria`.

## Testes

Sem framework de testes (convenção do projeto). Verificação via:
- `npx tsc --noEmit`
- `npm run build` (o projeto já tem uma página com `useSearchParams`, então build precisa continuar passando)
- Navegação real via `agent-browser`: home (banner + grid de categorias), buscar um produto e abrir o drawer, navegar por categoria, adicionar ao carrinho pelo card, abrir `/carrinho`, montar uma comparação em `/comparar` — tudo em modo claro e escuro, desktop e mobile (390×844, seguindo o padrão já usado na auditoria de responsividade anterior).
