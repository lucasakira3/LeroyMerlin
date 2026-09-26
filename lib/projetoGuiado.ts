// Núcleo do Projeto Guiado — extraído de app/api/projeto/route.ts em 2026-09-25 pra poder
// ser chamado tanto pela rota quanto pelo harness de teste (scripts/testar-projeto-guiado.ts)
// sem precisar de um servidor Next rodando.
//
// Reescrito pra corrigir o problema reportado pela Leroy Merlin na banca de 21/09/2026:
// "peço reforma de banheiro, a IA só recomenda louça e revestimento, não ferramenta nem
// insumo". Três mudanças em relação à versão anterior (ver docs/backlog... não, ver o
// Artifact do backlog pós-banca, seção P0 — link só existe fora do repo, resumo aqui):
//   1. Teto de itens fixo (6-14) virou uma faixa por "escopo" que a própria IA declara,
//      validada e ajustada no fim (FAIXAS_ESCOPO abaixo).
//   2. O prompt ganhou uma matriz de 6 fases explícita (ver montarPromptSistema) em vez de
//      uma frase solta ("incluir ferramentas") — o modelo tem que considerar cada fase, não
//      só listar o óbvio que o cliente já citou.
//   3. O modelo passa a ver o catálogo de verdade: um resumo das categorias reais (gerado a
//      partir de data/produtos.json, nunca hardcoded) e, quando a descrição do cliente casa
//      com um dos kits curados (lib/kitsProjeto.ts), esse kit entra como referência pra
//      adaptar — não pra inventar do zero.
import { flashModel } from "@/lib/gemini";
import { carregarProdutos } from "@/lib/produtos";
import { escolherKitReferencia, formatarKitParaPrompt } from "@/lib/kitsProjeto";

export interface ItemProjetoIA {
  material: string;
  categoria: string;
  comodo: string;
  quantidade: string;
  prioridade: "essencial" | "recomendado" | "opcional";
  observacao: string;
  etapa_ordem: number;
  etapa_nome: string;
}

export type EscopoProjeto = "reparo" | "projeto_medio" | "projeto_amplo";

export interface ProjetoIA {
  titulo: string;
  resumo: string;
  orcamento_estimado: string;
  complexidade: string;
  dica_especialista: string;
  escopo: EscopoProjeto;
  itens: ItemProjetoIA[];
}

// Piso e teto de itens por escopo — calibrado contra os próprios kits curados de
// lib/kitsProjeto.ts (ver comentário ali: um "reparo de vazamento" tem 6 itens reais, uma
// "pintura de cômodo" completa tem ~10-13, uma "reforma de banheiro" cruzando 6 fases passa
// de 25). Três faixas, não duas, porque "um cômodo inteiro com um único foco" (pintura, um
// piso, uma elétrica) e "reforma cruzando várias frentes" (banheiro, cozinha) têm tamanhos
// bem diferentes na vida real — tratar os dois como "ambiente" faria a IA errar pra um lado
// ou pro outro. Exportado porque o harness de teste usa a mesma faixa pra decidir se uma
// resposta passou ou não (nunca duplicar esse número em dois lugares).
export const FAIXAS_ESCOPO: Record<EscopoProjeto, { min: number; max: number }> = {
  reparo: { min: 4, max: 10 },
  projeto_medio: { min: 10, max: 22 },
  projeto_amplo: { min: 20, max: 45 },
};

function inferirEscopo(quantidadeItens: number): EscopoProjeto {
  if (quantidadeItens <= 10) return "reparo";
  if (quantidadeItens <= 21) return "projeto_medio";
  return "projeto_amplo";
}

// Quantos produtos distintos existem por categoria no catálogo real — usado só pra montar
// o resumo injetado no prompt (nunca hardcoded à mão, sempre derivado do arquivo real, então
// nunca fica desatualizado se o catálogo mudar).
function montarResumoCategorias(produtos: Awaited<ReturnType<typeof carregarProdutos>>): string {
  const porCategoria = new Map<string, string[]>();
  for (const p of produtos) {
    const lista = porCategoria.get(p.categoria) ?? [];
    if (lista.length < 5) lista.push(p.produto);
    porCategoria.set(p.categoria, lista);
  }
  return Array.from(porCategoria.entries())
    .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
    .map(([categoria, exemplos]) => `- ${categoria}: ${exemplos.join(", ")}`)
    .join("\n");
}

function montarPromptSistema(resumoCategorias: string, kitTexto: string | null): string {
  return `Você é um especialista sênior da Leroy Merlin Brasil com 15 anos de experiência em projetos de reforma e construção.

O cliente vai descrever um projeto. Sua tarefa é gerar uma lista COMPLETA e realista de materiais necessários — não só o óbvio que ele mencionou, mas tudo que um profissional levaria em conta.

Categorias que a loja realmente vende (use como lembrete de que existem, mesmo que o cliente não as tenha citado):
${resumoCategorias}

${kitTexto ? `${kitTexto}\n\nUse essa lista de referência como base: adapte ao pedido específico do cliente (remova o que genuinamente não se aplica ao caso dele, ajuste quantidade, adicione o que for específico), mas não deixe de cobrir uma fase só porque o cliente não a mencionou explicitamente — ela normalmente se aplica mesmo assim.\n` : ""}
Antes de gerar a lista final, percorra mentalmente estas 6 fases para o projeto descrito — pule uma fase só se ela genuinamente não se aplica, nunca porque o cliente não a mencionou:
1. Remoção e preparo (demolição, proteção, EPI)
2. Estrutura — hidráulica e elétrica (tubo, conexão, fiação, disjuntor)
3. Revestimento (piso, parede, argamassa, rejunte, impermeabilizante)
4. Louças, metais e acessórios (se aplicável ao ambiente)
5. Pintura e acabamento
6. Ferramentas e insumos transversais (o que serve para o projeto inteiro, não uma fase só)

Responda APENAS com um JSON válido (sem markdown, sem texto fora do JSON):

{
  "titulo": "Nome curto do projeto",
  "resumo": "O que será feito em 1-2 frases",
  "orcamento_estimado": "Faixa estimada ex: R$ 1.500 – R$ 3.000",
  "complexidade": "DIY ou Profissional",
  "dica_especialista": "Uma dica valiosa que o cliente provavelmente não sabe",
  "escopo": "reparo, projeto_medio ou projeto_amplo — ver definição abaixo",
  "itens": [
    {
      "material": "Nome exato do produto para buscar no estoque",
      "categoria": "categoria geral ex: Hidráulica, Pintura, Ferramentas",
      "comodo": "Cômodo ou área da casa onde este item é usado, ex: Cozinha, Banheiro, Área externa",
      "quantidade": "ex: 2 un., 5L, 12m²",
      "prioridade": "essencial",
      "observacao": "dica rápida de uso",
      "etapa_ordem": 1,
      "etapa_nome": "Nome curto da fase do projeto em que este item é usado, ex: Remoção e preparo"
    }
  ]
}

Regras:
- "escopo" é obrigatório e define quantos itens a lista deve ter — seja honesto sobre o tamanho real do projeto, não miniaturize:
  - "reparo": conserto pontual, uma peça ou um problema específico → 4 a 10 itens
  - "projeto_medio": um cômodo inteiro com um foco principal, ex. pintura, troca de piso, elétrica de um cômodo → 10 a 22 itens
  - "projeto_amplo": reforma cruzando várias frentes (ex. banheiro ou cozinha completos, hidráulica + elétrica + revestimento + louças) ou múltiplos ambientes → 20 a 45 itens
- Materiais específicos e buscáveis (ex: "Rejunte Branco 1kg", não apenas "rejunte")
- SEMPRE inclua as ferramentas necessárias para o trabalho, mesmo que o cliente não tenha pedido — elas fazem parte da fase 6 acima e não são opcionais de considerar
- prioridade pode ser: essencial, recomendado, opcional
- comodo é obrigatório em todos os itens. Se o projeto não menciona um cômodo específico para aquele item (ex: elétrica da casa toda, ferramentas gerais que servem para o projeto inteiro), use exatamente "Geral"
- Focar em produtos que a Leroy Merlin vende
- Organize os itens em etapas cronológicas do projeto, reaproveitando as 6 fases acima como guia (adapte os nomes ao projeto específico do cliente, não deixe genérico). Use "etapa_ordem" (número sequencial a partir de 1, itens da mesma fase compartilham o mesmo número) e "etapa_nome" em TODOS os itens. Um "reparo" pode ter só 1 ou 2 etapas; um projeto "amplo" normalmente passa pelas 6.`;
}

async function chamarEParsear(mensagens: string[]): Promise<ProjetoIA> {
  const result = await flashModel.generateContent(mensagens);
  const texto = result.response.text().trim();
  const jsonStr = texto.replace(/```json\n?|\n?```/g, "").trim();
  const projeto = JSON.parse(jsonStr) as ProjetoIA;

  if (!Array.isArray(projeto.itens)) {
    throw new Error("Resposta da IA sem a lista de itens esperada");
  }
  if (!FAIXAS_ESCOPO[projeto.escopo]) {
    // A IA às vezes esquece o campo ou escreve algo fora do enum — nunca falha por isso,
    // só infere a partir do tamanho real da lista que ela devolveu.
    projeto.escopo = inferirEscopo(projeto.itens.length);
  }
  return projeto;
}

// Chamada principal do Projeto Guiado: monta o prompt com ancoragem no catálogo real +
// kit de referência (se algum casar com a descrição), chama a IA, e faz UM retry de
// qualidade (não de erro transitório — isso já é tratado dentro de flashModel via
// lib/gemini.ts) se a resposta veio claramente abaixo do piso esperado pro escopo que a
// própria IA declarou. Um retry só, nunca um loop — custo de API é real mesmo no que já
// existe, e depois de uma instrução explícita de "cubra o que faltou" a segunda tentativa
// tende a melhorar; insistir mais que isso tem retorno decrescente.
export async function gerarProjetoIA(descricao: string, comodos?: string[]): Promise<ProjetoIA> {
  const produtos = await carregarProdutos();
  const resumoCategorias = montarResumoCategorias(produtos);
  const kit = escolherKitReferencia(descricao);
  const kitTexto = kit ? formatarKitParaPrompt(kit) : null;

  const mensagens: string[] = [montarPromptSistema(resumoCategorias, kitTexto)];
  if (Array.isArray(comodos) && comodos.length > 0) {
    mensagens.push(
      `O cliente indicou que o projeto envolve os seguintes cômodos: ${comodos.join(", ")}. ` +
        `Use exatamente esses nomes no campo "comodo" dos itens que pertencerem a um deles. ` +
        `Para "Casa toda / Geral" ou itens que não pertencem a nenhum cômodo específico, use "Geral".`
    );
  }
  mensagens.push(`Projeto do cliente: ${descricao}`);

  let projeto = await chamarEParsear(mensagens);
  const piso = FAIXAS_ESCOPO[projeto.escopo].min;

  if (projeto.itens.length < piso) {
    try {
      const mensagensRetry = [
        ...mensagens,
        `Sua resposta anterior tinha apenas ${projeto.itens.length} itens, abaixo do esperado ` +
          `para um projeto "${projeto.escopo}" (mínimo ${piso}). Revise usando as 6 fases indicadas ` +
          `no início — provavelmente faltou cobrir ferramentas, elétrica, hidráulica ou pintura. ` +
          `Responda de novo com o JSON completo, mais abrangente.`,
      ];
      const projetoRevisado = await chamarEParsear(mensagensRetry);
      if (projetoRevisado.itens.length > projeto.itens.length) {
        projeto = projetoRevisado;
      }
    } catch {
      // Retry de qualidade é um bônus, não um requisito — se ele falhar (erro de rede,
      // JSON malformado na segunda tentativa), fica valendo a primeira resposta, que já é
      // uma resposta válida, só mais curta que o ideal.
    }
  }

  return projeto;
}

// Fallback quando a busca textual não acha nada com confiança suficiente — mesma ideia de
// lib/search.ts (fração de termos da query batendo no texto do produto), usada aqui porque a
// IA já devolve o "material" como texto curto e específico (ex: "Rejunte Branco 1kg"), não
// precisa de embedding pra isso, e evita uma chamada de API por item da lista gerada.
//
// Corte de score mínimo (2026-09-18): sem ele, um item cujo catálogo não tem nada parecido
// ainda assim recebia "o menos pior" resultado — ex.: "Desempenadeira Dentada Aço 8x8mm"
// batendo em "Vaso Retangular 60cm para Varanda" a score 0.25, numa reforma de cozinha.
// Calibrado contra o catálogo real: scores ≥0.34 seguem sendo o mesmo produto/categoria
// pedido; abaixo disso vira coincidência de palavra solta.
const SCORE_MINIMO = 0.34;

export function buscaTextoSimples(
  produtos: Awaited<ReturnType<typeof carregarProdutos>>,
  query: string,
  limit = 1
) {
  const termos = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  return produtos
    .map((p) => {
      const hay = `${p.produto} ${p.categoria} ${p.tags.join(" ")}`.toLowerCase();
      const score = termos.filter((t) => hay.includes(t)).length / termos.length;
      return { produto: p, score };
    })
    .filter((r) => r.score >= SCORE_MINIMO)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.produto.estoque > 0 ? 1 : 0) - (a.produto.estoque > 0 ? 1 : 0);
    })
    .slice(0, limit)
    .map(({ produto: { embedding: _e, embedding_text: _et, ...p }, score }) => ({ produto: p, score }));
}
