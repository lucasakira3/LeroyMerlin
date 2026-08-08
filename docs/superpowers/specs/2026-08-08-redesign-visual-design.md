# Redesign visual — identidade Leroy Merlin (design system + aplicação)

**Data:** 2026-08-08
**Status:** Aprovado, aguardando plano de implementação

## Contexto

O projeto é um MVP (FIAP Challenge 2026) de assistente de loja com IA para a Leroy Merlin, com duas frentes: área do cliente (busca, produto, projeto guiado, dúvidas, agendamento) e painel do funcionário (dashboard, clientes, produtos/estoque, chamados, login).

O design atual usa uma paleta de 5 cores fixas (`lm-green #00843d`, `lm-yellow #ffd100`, `lm-dark #1a1a1a`, `lm-light #f5f5f5`, `lm-orange #e87722`) definida em `tailwind.config.js` e `app/globals.css`, fonte Inter, e um estilo visual inconsistente entre áreas: o catálogo de produtos (`ProductCard`) usa um visual denso "estilo catálogo industrial" (cantos retos, texto pequeno, coluna de ID em mono), enquanto o painel do funcionário já usa cantos arredondados (`rounded-xl`) e mais espaçamento.

Não existe hoje nenhum componente-base compartilhado (Button, Card, Badge, PageHeader) — cada tela estiliza seus próprios elementos inline, o que gera inconsistência visual.

## Objetivo

Modernizar a identidade visual do site inteiro (área do cliente + painel do funcionário) para um estilo mais "clean e arejado" — mais espaço em branco, cards com sombra suave e cantos arredondados, tipografia maior e mais leve — mantendo a cor verde de marca (`#00843d`) como identidade reconhecível da Leroy Merlin, sem quebrar nenhuma funcionalidade existente (busca semântica, busca por imagem, mapa da loja, chat, tour guiado, dashboard, etc.).

## Decisões de design

### 1. Design tokens (`tailwind.config.js` + `app/globals.css`)

- **Verde de marca mantido**: `lm-green: #00843d` continua sendo a cor primária de ação/destaque (CTAs, preços, links ativos, ícones de localização). Não muda de tom.
- **Paleta neutra expandida**: adicionar uma escala de cinza completa (`gray-50` → `gray-900`) como base estrutural de fundo/texto/borda, substituindo o uso solto de `lm-dark`/`lm-light`/`gray-*` do Tailwind padrão que já aparece parcialmente no código.
- **Amarelo (`#ffd100`) e laranja (`#e87722`) viram acentos pontuais** — badges, indicadores de destaque — não mais usados como grandes blocos de fundo ou bordas estruturais.
- **Tipografia**: mantém Inter. Define escala de tamanho mais generosa para títulos (`text-2xl`/`text-3xl` com `font-semibold`/`font-light` em vez de tamanhos pequenos e densos).
- **Raio de borda**: padroniza em `rounded-xl`/`rounded-2xl` em cards, inputs e botões — remove o estilo de cantos retos "catálogo industrial" do `ProductCard`.
- **Sombras**: sombra suave e com blur maior como padrão de elevação de card (substitui bordas duras + `shadow-sm` atual por algo mais suave).

### 2. Componentes-base (novos ou reformados)

| Componente | Situação atual | Ação |
|---|---|---|
| `Button` | Não existe — cada tela estiliza inline | Criar componente único, com variantes (primário/secundário/destrutivo) |
| `Card` | Não existe — `ProductCard` e cards do dashboard estilizam cada um do seu jeito | Criar wrapper genérico reutilizado pelos cards existentes |
| `Badge` | `StockIndicator` e `SustainabilityBadge` já existem mas com visuais distintos entre si | Padronizar visual mantendo a lógica de cada um |
| `PageHeader` | Não existe — títulos de página são soltos em cada arquivo | Criar componente de título + descrição padronizado |
| `NavBar` (cliente) | Existe, funcional | Retrabalhar visual (mantém estrutura/lógica de tabs) |
| Sidebar do `FuncionarioLayout` | Existe, já parcialmente alinhada ao novo estilo (rounded-xl) | Ajustar para usar os novos tokens/componentes-base |

Nenhuma lógica de negócio, chamada de API ou estado é alterado — a mudança é inteiramente na camada de apresentação (JSX/classes).

### 3. Ordem de aplicação

1. Tokens globais (`tailwind.config.js`, `app/globals.css`) + componentes-base (`Button`, `Card`, `Badge`, `PageHeader`).
2. Área cliente, nesta ordem: `NavBar` → home/busca (`ProductCard`, `SearchBar`, `SearchSection`) → produto (`ProdutoDrawer`) → projeto guiado (`ProjetoWizard`, `ListaDeCompras`) → dúvidas (`DuvidasChat`) → agendamento (`AgendamentoForm`, `AgendamentosLista`).
3. Painel funcionário, nesta ordem: `FuncionarioLayout` (sidebar) → login → dashboard → clientes → produtos/estoque → chamados.

Cada página continua funcionando normalmente entre um passo e outro — a migração é incremental, não um "big bang".

### 4. Validação

Após cada bloco (tokens+base, cliente, funcionário), subir `npm run dev` localmente e usar a skill `agent-browser` para navegar pelas telas principais e tirar screenshots, conferindo visualmente antes de prosseguir para o próximo bloco. Sem alteração de lógica, não há necessidade de novos testes automatizados — a verificação é visual/manual.

## Fora de escopo

- Mudança de tom/paleta do verde de marca.
- Reescrita de lógica, chamadas de API, estado ou fluxo de dados de qualquer página.
- Novas funcionalidades.
- Redesign de conteúdo/copy (textos permanecem os mesmos, salvo ajustes triviais de rótulo exigidos pelo novo layout).
