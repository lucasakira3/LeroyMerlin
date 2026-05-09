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
      "quantidade": "ex: 2 un., 5L, 12m²",
      "prioridade": "essencial",
      "observacao": "dica rápida de uso"
    }
  ]
}

Regras:
- Entre 6 e 14 itens por projeto
- Materiais específicos e buscáveis (ex: "Rejunte Branco 1kg", não apenas "rejunte")
- Incluir ferramentas necessárias
- prioridade pode ser: essencial, recomendado, opcional
- Focar em produtos que a Leroy Merlin vende`;

function buscaTextoSimples(produtos: Awaited<ReturnType<typeof carregarProdutos>>, query: string, limit = 1) {
  const termos = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  return produtos
    .map(p => {
      const hay = `${p.produto} ${p.categoria} ${p.tags.join(" ")}`.toLowerCase();
      const score = termos.filter(t => hay.includes(t)).length / termos.length;
      return { produto: p, score };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ produto: { embedding: _e, embedding_text: _et, ...p }, score }) => ({ produto: p, score }));
}

export async function POST(req: NextRequest) {
  try {
    const { descricao } = await req.json();
    if (!descricao?.trim()) {
      return NextResponse.json({ error: "Descreva seu projeto" }, { status: 400 });
    }

    // 1. Gemini analisa o projeto e gera lista de materiais
    const result = await flashModel.generateContent([
      PROMPT_SISTEMA,
      `Projeto do cliente: ${descricao}`,
    ]);

    const texto = result.response.text().trim();
    const jsonStr = texto.replace(/```json\n?|\n?```/g, "").trim();
    const projeto = JSON.parse(jsonStr);

    // 2. Para cada item, busca o produto mais próximo na base
    const produtos = await carregarProdutos();
    const itensComProduto = projeto.itens.map((item: any) => ({
      ...item,
      resultados: buscaTextoSimples(produtos, item.material, 3),
    }));

    return NextResponse.json({ ...projeto, itens: itensComProduto });
  } catch (err) {
    console.error("[POST /api/projeto]", err);
    return NextResponse.json(
      { error: "Não foi possível analisar o projeto. Tente novamente." },
      { status: 500 }
    );
  }
}
