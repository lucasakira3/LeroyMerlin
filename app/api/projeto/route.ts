import { NextRequest, NextResponse } from "next/server";
import { flashModel } from "@/lib/gemini";
import { carregarProdutos } from "@/lib/produtos";

const PROMPT_SISTEMA = `Você é um especialista sênior da Leroy Merlin Brasil com 15 anos de experiência em projetos de reforma e construção.

O cliente vai descrever um projeto. Sua tarefa é gerar uma lista completa e realista de materiais necessários.

Responda APENAS com um JSON válido (sem markdown, sem texto fora do JSON):

{
  "titulo": "Nome curto do projeto",
  "resumo": "O que será feito em 1-2 frases",
  "orcamento_estimado": "Faixa estimada ex: R$ 1.500 – R$ 3.000",
  "complexidade": "DIY ou Profissional",
  "dica_especialista": "Uma dica valiosa que o cliente provavelmente não sabe",
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
- Entre 6 e 14 itens por projeto
- Materiais específicos e buscáveis (ex: "Rejunte Branco 1kg", não apenas "rejunte")
- Incluir ferramentas necessárias
- prioridade pode ser: essencial, recomendado, opcional
- comodo é obrigatório em todos os itens. Se o projeto não menciona um cômodo específico para aquele item (ex: elétrica da casa toda, ferramentas gerais que servem para o projeto inteiro), use exatamente "Geral"
- Focar em produtos que a Leroy Merlin vende
- Organize os itens em etapas cronológicas do projeto (ex: para uma reforma: 1 remoção/preparo, 2 hidráulica/elétrica, 3 acabamento, 4 pintura/detalhes). Use "etapa_ordem" (número sequencial a partir de 1, itens da mesma fase compartilham o mesmo número) e "etapa_nome" (nome curto e específico para o projeto do cliente, não genérico) em TODOS os itens. Projetos simples podem ter só 1 ou 2 etapas.`;

function buscaTextoSimples(produtos: Awaited<ReturnType<typeof carregarProdutos>>, query: string, limit = 1) {
  const termos = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  return produtos
    .map(p => {
      const hay = `${p.produto} ${p.categoria} ${p.tags.join(" ")}`.toLowerCase();
      const score = termos.filter(t => hay.includes(t)).length / termos.length;
      return { produto: p, score };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.produto.estoque > 0 ? 1 : 0) - (a.produto.estoque > 0 ? 1 : 0);
    })
    .slice(0, limit)
    .map(({ produto: { embedding: _e, embedding_text: _et, ...p }, score }) => ({ produto: p, score }));
}

export async function POST(req: NextRequest) {
  try {
    const { descricao, comodos } = await req.json();
    if (!descricao?.trim()) {
      return NextResponse.json({ error: "Descreva seu projeto" }, { status: 400 });
    }

    const mensagens: string[] = [PROMPT_SISTEMA];
    if (Array.isArray(comodos) && comodos.length > 0) {
      mensagens.push(
        `O cliente indicou que o projeto envolve os seguintes cômodos: ${comodos.join(", ")}. ` +
        `Use exatamente esses nomes no campo "comodo" dos itens que pertencerem a um deles. ` +
        `Para "Casa toda / Geral" ou itens que não pertencem a nenhum cômodo específico, use "Geral".`
      );
    }
    mensagens.push(`Projeto do cliente: ${descricao}`);

    const result = await flashModel.generateContent(mensagens);

    const texto = result.response.text().trim();
    const jsonStr = texto.replace(/```json\n?|\n?```/g, "").trim();
    const projeto = JSON.parse(jsonStr);

    const produtos = await carregarProdutos();
    const itensComProduto = projeto.itens.map((item: any) => ({
      ...item,
      resultados: buscaTextoSimples(produtos, item.material, 3),
    }));

    return NextResponse.json({ ...projeto, itens: itensComProduto });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[POST /api/projeto]", msg);
    return NextResponse.json(
      { error: "Não foi possível analisar o projeto. Tente novamente." },
      { status: 500 }
    );
  }
}
