# Entrevista guiada (perfil do cliente) em Minha Conta

## Contexto

Usuário pediu uma nova feature: uma "entrevista guiada" dentro da aba Minha Conta (`app/conta/page.tsx`), onde o cliente responde perguntas pra traçar um perfil, e a partir desse perfil o app sugere produtos e serviços da Leroy Merlin. Hoje `/conta` não tem nenhum conceito de perfil/preferência — só `nome`/`email` (`lib/clientAuth.ts`) e três seções empilhadas (Pedidos, Favoritos, Vistos recentemente).

Decisões já validadas com o usuário:
- Perguntas são **fixas, de múltipla escolha** (sem IA gerando perguntas dinamicamente) — mais previsível, sem custo/latência de API nessa etapa.
- Sugestão de produto é **regra determinística** (sem chamada ao Gemini) — o app já teve instabilidade real do Gemini nesta mesma sessão (503 "high demand"), então uma feature de personalização não deveria depender de um serviço externo instável.
- Entra como **novo card/seção na própria página `/conta`**, não uma rota separada.
- Perfil **fica salvo** (localStorage, por email, mesmo padrão de `clientContas.ts`/`clientFavoritos.ts`) com opção de refazer.

## Objetivo

Dar ao cliente uma forma rápida e opcional de dizer o que ele precisa (tipo de moradia, experiência com reforma, áreas de interesse, orçamento, prioridade de sustentabilidade) e receber de volta uma lista de produtos relevantes do catálogo real + sugestões de outras telas do app (agendamento, tire dúvidas, projeto guiado) que fazem sentido pro perfil dele.

## Escopo

**Dentro do escopo:**
- `types/perfil.ts` (novo): tipos `Perfil`, `Moradia`, `Experiencia`, `Area`, `Orcamento`, `SustentabilidadePreferencia`, `ServicoSugerido`.
- `lib/clientPerfil.ts` (novo): persistência do perfil respondido em localStorage, por email (`salvarPerfil`, `getPerfil`, `limparPerfil`).
- `lib/perfilSugestoes.ts` (novo): funções puras de pontuação/filtro (`AREA_PARA_CATEGORIAS`, `EXPERIENCIA_PARA_COMPLEXIDADE`, `ORCAMENTO_PARA_FAIXA`, `pontuarProduto`, `sugerirServicos`).
- `app/api/perfil/sugestoes/route.ts` (novo): recebe o `Perfil`, roda a pontuação sobre `carregarProdutos()` (servidor, mesmo padrão de `app/api/projeto/route.ts`), devolve produtos + serviços sugeridos.
- `components/EntrevistaGuiada.tsx` (novo): formulário de página única (5 perguntas) + tela de resultado (grid de produtos reaproveitando `ProductCard` + cards de serviço), tudo no mesmo componente.
- `app/conta/page.tsx`: nova seção "Entrevista guiada" antes de "Meus pedidos".

**Fora do escopo:**
- Perguntas geradas por IA ou adaptativas.
- Sugestão via Gemini/embeddings.
- Editar respostas individualmente (refazer = responder tudo de novo, substitui o perfil salvo).
- Qualquer mudança em `SuggestBanner.tsx`/`useSuggestAgent.ts`/`useProductTracker.ts` (sistema de sugestão por comportamento de navegação, já existe e é independente disso).
- Login: a seção só aparece pra cliente logado, mesma regra de acesso que o resto de `/conta` já tem (redireciona pra login se não estiver logado).

## Tipos (`types/perfil.ts`)

```ts
export type Moradia = 'Casa' | 'Apartamento' | 'Sítio ou chácara' | 'Comércio'
export type Experiencia = 'Iniciante' | 'Intermediário' | 'Avançado' | 'Prefiro contratar um profissional'
export type Area =
  | 'Cozinha' | 'Banheiro' | 'Quarto' | 'Sala'
  | 'Jardim ou área externa' | 'Elétrica' | 'Iluminação' | 'Pintura'
export type Orcamento = 'Até R$500' | 'R$500–2.000' | 'R$2.000–5.000' | 'Acima de R$5.000'
export type SustentabilidadePreferencia = 'Pouco importante' | 'Importante, mas não decisivo' | 'Muito importante'

export interface Perfil {
  moradia: Moradia
  experiencia: Experiencia
  areas: Area[]           // 1 a 3 selecionadas
  orcamento: Orcamento
  sustentabilidade: SustentabilidadePreferencia
  respondidoEm: string    // ISO date
}

export interface ServicoSugerido {
  titulo: string
  descricao: string
  href: string
}
```

## `lib/clientPerfil.ts`

Mesmo formato de `lib/clientContas.ts` (mapa `Record<email normalizado, Perfil>` em `localStorage`, chave `lm_perfil_cliente`):

```ts
export function salvarPerfil(email: string, perfil: Perfil): void
export function getPerfil(email: string): Perfil | null
export function limparPerfil(email: string): void
```

## `lib/perfilSugestoes.ts` — regras de pontuação

```ts
export const AREA_PARA_CATEGORIAS: Record<Area, string[]> = {
  'Cozinha': ['Pisos e Cerâmica', 'Hidráulica', 'Elétrica', 'Iluminação'],
  'Banheiro': ['Banheiro', 'Hidráulica', 'Pisos e Cerâmica'],
  'Quarto': ['Decoração', 'Iluminação', 'Pintura'],
  'Sala': ['Decoração', 'Iluminação', 'Pintura'],
  'Jardim ou área externa': ['Jardim', 'Construção'],
  'Elétrica': ['Elétrica', 'Ferramentas'],
  'Iluminação': ['Iluminação'],
  'Pintura': ['Pintura'],
}

export const EXPERIENCIA_PARA_COMPLEXIDADE: Record<Experiencia, Complexidade[]> = {
  'Iniciante': ['Baixa', 'DIY'],
  'Intermediário': ['Baixa', 'DIY', 'Média'],
  'Avançado': ['Média', 'Alta', 'Profissional', 'Especialista'],
  'Prefiro contratar um profissional': ['Baixa', 'DIY', 'Média'],
}

export const ORCAMENTO_PARA_FAIXA: Record<Orcamento, [number, number]> = {
  'Até R$500': [0, 500],
  'R$500–2.000': [500, 2000],
  'R$2.000–5.000': [2000, 5000],
  'Acima de R$5.000': [5000, Infinity],
}

export function pontuarProduto(produto: Produto, perfil: Perfil): number {
  let pontos = 0
  if (EXPERIENCIA_PARA_COMPLEXIDADE[perfil.experiencia].includes(produto.complexidade)) pontos += 2
  const [min, max] = ORCAMENTO_PARA_FAIXA[perfil.orcamento]
  if (produto.preco >= min && produto.preco <= max) pontos += 1
  if (perfil.sustentabilidade === 'Muito importante' && (produto.sustentabilidade === 'Prata' || produto.sustentabilidade === 'Ouro')) pontos += 1
  if (produto.estoque > 0) pontos += 1
  return pontos
}

export function sugerirServicos(perfil: Perfil): ServicoSugerido[] {
  const servicos: ServicoSugerido[] = []
  if (perfil.experiencia === 'Prefiro contratar um profissional') {
    servicos.push({ titulo: 'Agendar visita com especialista', descricao: 'Um consultor avalia seu projeto pessoalmente, sem custo.', href: '/agendamento' })
  }
  if (perfil.experiencia === 'Iniciante') {
    servicos.push({ titulo: 'Tire suas dúvidas com a IA', descricao: 'Pergunte sobre materiais e técnicas antes de comprar.', href: '/duvidas' })
  }
  if (perfil.areas.length >= 2) {
    servicos.push({ titulo: 'Monte um Projeto Guiado', descricao: 'Lista de materiais completa pra reformar mais de um cômodo de uma vez.', href: '/projeto' })
  }
  return servicos
}
```

**Nota:** `categoria` **não** entra em `pontuarProduto` — a filtragem por área é um filtro obrigatório aplicado antes de pontuar (ver rota abaixo), não um critério de pontuação. Isso evita que um produto totalmente fora do interesse do cliente apareça só por pontuar bem nos outros critérios.

## `app/api/perfil/sugestoes/route.ts`

Mesmo padrão de tratamento de erro/estrutura de `app/api/projeto/route.ts`, mas sem nenhuma chamada de IA:

```ts
const MAX_SUGESTOES = 12

export async function POST(req: NextRequest) {
  try {
    const { perfil } = await req.json() as { perfil: Perfil }
    const produtos = await carregarProdutos()

    const categoriasRelevantes = perfil.areas.flatMap(a => AREA_PARA_CATEGORIAS[a] ?? [])
    const candidatos = produtos.filter(p => categoriasRelevantes.includes(p.categoria))

    const porArea = new Map(
      perfil.areas.map(area => [
        area,
        candidatos
          .filter(p => AREA_PARA_CATEGORIAS[area].includes(p.categoria))
          .map(p => ({ produto: p, pontos: pontuarProduto(p, perfil) }))
          .sort((a, b) => b.pontos - a.pontos),
      ])
    )

    // round-robin entre areas selecionadas, ate MAX_SUGESTOES, sem repetir produto
    const selecionados: { produto: typeof produtos[number]; pontos: number }[] = []
    const vistos = new Set<string>()
    let progresso = true
    while (selecionados.length < MAX_SUGESTOES && progresso) {
      progresso = false
      for (const area of perfil.areas) {
        const lista = porArea.get(area) ?? []
        const proximo = lista.find(x => !vistos.has(x.produto.id))
        if (proximo) {
          vistos.add(proximo.produto.id)
          selecionados.push(proximo)
          progresso = true
          if (selecionados.length >= MAX_SUGESTOES) break
        }
      }
    }

    const produtosResposta = selecionados.map(({ produto, pontos }) => ({
      produto: (({ embedding, embedding_text, ...resto }) => resto)(produto),
      score: pontos,
    }))

    return NextResponse.json({ produtos: produtosResposta, servicos: sugerirServicos(perfil) })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido"
    console.error("[POST /api/perfil/sugestoes]", msg)
    return NextResponse.json({ error: "Não foi possível gerar sugestões. Tente novamente." }, { status: 500 })
  }
}
```

Se `candidatos` ficar vazio pra alguma área (categoria sem produto em estoque, por exemplo), essa área simplesmente não contribui produtos ao round-robin — não é um erro, a lista final só fica menor. Se `selecionados` ficar totalmente vazio, o front mostra uma mensagem em vez de grid vazio (ver componente abaixo).

## `components/EntrevistaGuiada.tsx`

Componente único, dois modos internos (`'formulario' | 'resultado'`, decidido por já ter `getPerfil(usuario.email)` ao montar ou não):

- **Convite** (perfil ainda não respondido): card compacto "Descubra sugestões pra você" + botão "Começar entrevista" que troca pro modo formulário.
- **Formulário**: as 5 perguntas em sequência na mesma tela (não é wizard passo-a-passo — todas visíveis, scroll normal), cada uma como um grupo de chips (reaproveitando o estilo de chip já usado em `ProjetoWizard.tsx`/`CategoriaView.tsx`: `text-xs px-3 py-1 rounded-full border transition-colors`, seleção única exceto a pergunta de áreas que é múltipla, até 3 — desabilita novos cliques quando já tem 3 marcadas). Botão "Ver sugestões" desabilitado até as 5 perguntas terem resposta. Ao submeter: `salvarPerfil(email, perfil)`, `fetch('/api/perfil/sugestoes', { method: 'POST', body: JSON.stringify({ perfil }) })`, mostra loading simples (reaproveita o spinner já usado em `SecaoProdutos`), troca pro modo resultado.
- **Resultado** (perfil já respondido, ou logo após responder): mostra os cards de serviço sugeridos no topo (se houver), depois o grid de produtos (`ProductCard`, mesmo grid 2/3/4 colunas de `SecaoProdutos`) — ou uma mensagem "Nenhum produto encontrado pro seu perfil ainda, tente outras áreas" se a lista vier vazia. Botão "Refazer entrevista" volta pro modo formulário com os campos zerados (não pré-preenchidos com a resposta anterior — simplicidade, já que a pessoa pode ter mudado de ideia).

## `app/conta/page.tsx`

Uma linha nova, `<EntrevistaGuiada email={usuario.email} />`, inserida entre `<PageHeader ... />` e `<SecaoPedidos ... />` — primeira coisa que o cliente vê depois do cabeçalho.

## Dark mode

Segue a convenção já estabelecida: chips usam as mesmas classes (`bg-white`, `text-gray-500`, `border-gray-200`, ativo `bg-lm-green`/`text-white`) já cobertas pelos overrides `.dark` existentes — mesmo padrão validado nas duas specs anteriores desta sessão (mosaico e cômodos), nenhum ajuste novo necessário.

## Testes

Sem framework de testes (`[[project-dev-workflow]]`). Verificação: `npx tsc --noEmit`; script `tsx` descartável testando `pontuarProduto` (produtos sintéticos cobrindo cada combinação de experiência/orçamento/sustentabilidade) e `sugerirServicos` (as 3 regras) isoladamente, sem precisar de servidor; navegação manual via `agent-browser` cobrindo: responder a entrevista pela primeira vez, ver sugestões batendo com as áreas escolhidas, refazer, persistência ao recarregar a página, caso de zero produtos encontrados (perfil com combinação rara), mobile e dark mode.
