# Ícones de cômodo + seleção de cômodos no Projeto Guiado

## Contexto

Depois do mosaico visual do Projeto Guiado (`[[project-backlog]]`, spec `2026-08-20-mosaico-projeto-guiado-design.md`), o usuário pediu mais dois elementos visuais na mesma tela:

1. Um ícone por tipo de cômodo nos cards do mosaico (`components/ProjetoMosaico.tsx`), em vez de só o nome em texto.
2. Deixar o usuário selecionar os cômodos do projeto **antes** de escrever a descrição livre em `components/ProjetoWizard.tsx` — hoje esse componente é uma tela única (hero + textarea + exemplos), sem nenhum passo anterior.

As duas coisas compartilham a mesma peça central: um mapa "nome de cômodo → ícone", já que `comodo` é texto livre gerado pela IA (`app/api/projeto/route.ts`), não um enum fixo. `lib/marcas.ts` já resolve um problema parecido (mapear `categoria` pra uma marca) com um `Object.keys(MAPA).find(k => lower.includes(k))` — mesmo padrão será reaproveitado aqui.

## Objetivo

Dar mais identidade visual ao mosaico (ícone por cômodo) e tornar o agrupamento por cômodo mais confiável, deixando o cliente indicar os cômodos do projeto antes de descrevê-lo — essa indicação vira uma instrução explícita no prompt da IA, reduzindo a dependência de a IA "adivinhar" certo o campo `comodo` só a partir do texto livre.

## Escopo

**Dentro do escopo:**
- `lib/comodoIcones.ts` (novo): mapa de 8 cômodos (Cozinha, Banheiro, Quarto, Sala, Jardim/Área externa, Garagem, Escritório, Casa toda/Geral) para ícones `lucide-react`, com função de lookup por palavra-chave.
- `components/ProjetoMosaico.tsx`: ícone ao lado do nome do cômodo no header de cada card.
- `components/ProjetoWizard.tsx`: novo passo antes da descrição — grid de 8 chips (seleção múltipla, obrigatório 1+) — e um recap read-only + botão voltar no passo da descrição.
- `app/api/projeto/route.ts`: aceita `comodos?: string[]` no body do POST; quando presente, acrescenta uma instrução ao Gemini pra usar esses nomes exatos no campo `comodo`.

**Fora do escopo:**
- Mudar a lista `EXEMPLOS` pra filtrar por cômodo selecionado — os exemplos continuam genéricos, independentes da seleção.
- Validar no backend que os itens retornados pela IA realmente batem com os cômodos selecionados — é uma instrução no prompt, não uma restrição garantida em código (a IA ainda decide `comodo` por item, com fallback "Geral" como já existe).
- Mudar o mosaico além do ícone (isso já foi feito na spec anterior).
- Cômodo customizado por texto livre (decidido: só lista fixa de 8).

## `lib/comodoIcones.ts` (novo)

```ts
import { ChefHat, Bath, BedDouble, Sofa, TreePine, Car, Briefcase, LayoutGrid, type LucideIcon } from 'lucide-react'

export const COMODOS_DISPONIVEIS = [
  'Cozinha', 'Banheiro', 'Quarto', 'Sala', 'Jardim ou Área externa', 'Garagem', 'Escritório', 'Casa toda / Geral',
] as const

const ICONES_POR_COMODO: Record<string, LucideIcon> = {
  cozinha: ChefHat,
  banheiro: Bath,
  quarto: BedDouble,
  dormitorio: BedDouble,
  sala: Sofa,
  jardim: TreePine,
  varanda: TreePine,
  'área externa': TreePine,
  'area externa': TreePine,
  garagem: Car,
  escritorio: Briefcase,
  escritório: Briefcase,
}

export function getIconeComodo(comodo: string): LucideIcon {
  const lower = comodo.toLowerCase()
  const key = Object.keys(ICONES_POR_COMODO).find(k => lower.includes(k))
  return key ? ICONES_POR_COMODO[key] : LayoutGrid
}
```

`COMODOS_DISPONIVEIS` é a lista fixa usada pelos chips do wizard (item abaixo). `getIconeComodo` é usada tanto pelo wizard quanto pelo mosaico — mesma função, uma só fonte de verdade. "Casa toda / Geral" cai no fallback `LayoutGrid` naturalmente (nenhuma palavra-chave dele bate com as demais entradas do mapa).

## `components/ProjetoWizard.tsx`

**Novo estado:**
```ts
const [etapaWizard, setEtapaWizard] = useState<'comodos' | 'descricao'>('comodos')
const [comodosSelecionados, setComodosSelecionados] = useState<Set<string>>(new Set())
```

**Novo passo `'comodos'`** (renderizado no lugar da tela atual quando `etapaWizard === 'comodos'` e `!resultado`): mesmo hero atual ("Descreva seu projeto" vira algo como "Quais cômodos você vai reformar?"), seguido de um grid de chips — um por item de `COMODOS_DISPONIVEIS`, cada chip com o ícone de `getIconeComodo` + o nome, toggle de seleção (adiciona/remove do `Set`), mesmo estilo visual dos chips de filtro já usados em `components/CategoriaView.tsx` (`text-xs px-3 py-1 rounded-full border transition-colors`, ativo = `bg-lm-green text-white border-lm-green`, inativo = `bg-white text-gray-500 border-gray-200 hover:border-lm-green/40`) adaptado pra chip maior com ícone. Botão "Continuar" (`disabled={comodosSelecionados.size === 0}`) avança pra `setEtapaWizard('descricao')`.

**Passo `'descricao'`** (o que hoje é a tela única do componente): ganha, acima do textarea, uma linha com "← Voltar" (`onClick={() => setEtapaWizard('comodos')}`, não limpa a seleção) e um recap read-only dos cômodos escolhidos (mesmos chips, sem `onClick`, só pra lembrar o que foi marcado).

**`analisar`** passa a mandar os cômodos:
```ts
body: JSON.stringify({ descricao: texto, comodos: Array.from(comodosSelecionados) }),
```

**Reset do "Novo projeto"** (`onClick` do botão no bloco `if (resultado)`) ganha `setEtapaWizard('comodos')` e `setComodosSelecionados(new Set())`, além do que já limpa hoje (`setResultado(null); setDescricao('')`).

## `app/api/projeto/route.ts`

```ts
const { descricao, comodos } = await req.json();
if (!descricao?.trim()) {
  return NextResponse.json({ error: "Descreva seu projeto" }, { status: 400 });
}

const mensagens = [PROMPT_SISTEMA];
if (Array.isArray(comodos) && comodos.length > 0) {
  mensagens.push(
    `O cliente indicou que o projeto envolve os seguintes cômodos: ${comodos.join(", ")}. ` +
    `Use exatamente esses nomes no campo "comodo" dos itens que pertencerem a um deles. ` +
    `Para "Casa toda / Geral" ou itens que não pertencem a nenhum cômodo específico, use "Geral".`
  );
}
mensagens.push(`Projeto do cliente: ${descricao}`);

const result = await flashModel.generateContent(mensagens);
```

Continua sendo uma única chamada ao `generateContent` (agora com um array de 2 ou 3 strings em vez de sempre 2) — sem custo/latência extra. `comodos` é opcional no body — se ausente ou vazio, o comportamento é idêntico ao de hoje (nenhuma instrução extra), então a rota continua funcionando para qualquer chamador que não mande esse campo.

## `components/ProjetoMosaico.tsx`

No header de cada card (linha do `<p className="text-sm font-bold text-gray-900 mb-3">{grupo.comodo}</p>`), acrescentar o ícone antes do texto:
```tsx
const Icone = getIconeComodo(grupo.comodo)
// ...
<p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
  <Icone size={15} className="text-lm-green flex-shrink-0" />
  {grupo.comodo}
</p>
```

## Dark mode

Chips seguem o mesmo padrão de classes já cobertas pelos overrides globais (`bg-white`, `text-gray-500`, `border-gray-200`) — nenhum ajuste novo necessário, mesmo raciocínio validado na spec do mosaico.

## Testes

Sem framework de testes (`[[project-dev-workflow]]`). Verificação: `npx tsc --noEmit`, script `tsx` descartável pra conferir `getIconeComodo` contra os 8 nomes de `COMODOS_DISPONIVEIS` + variações de case/hífen, e navegação manual via `agent-browser` cobrindo: selecionar 1 cômodo e continuar, selecionar vários, tentar continuar sem marcar nenhum (botão desabilitado), voltar do passo de descrição sem perder a seleção, "Novo projeto" reseta pro passo de cômodos, resultado real da IA mostra ícones corretos nos cards do mosaico batendo com os cômodos selecionados.
