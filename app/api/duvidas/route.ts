import { NextRequest, NextResponse } from "next/server";
import { flashModel } from "@/lib/gemini";
import { produtosDaLojaPara } from "@/lib/rag";
import type { SearchResult } from "@/types/produto";

type ProdutoDaLoja = SearchResult["produto"];

// RAG (lib/rag.ts): antes de chamar a IA, a pergunta vira uma busca por significado no
// catálogo e os produtos achados vão junto no prompt, com corredor, preço e estoque reais.
// Sem isso o modelo respondia "procure no corredor de elétrica" ou citava marcas e preços
// que a loja não tem — o prompt antigo pedia o corredor sem dar o corredor.
const SYSTEM_PROMPT = `Você é um especialista da Leroy Merlin Brasil, com profundo conhecimento em
materiais de construção, reforma, decoração, ferramentas, elétrica, hidráulica, jardim e todos os
produtos vendidos nas lojas.

Junto com a pergunta você recebe <produtos_da_loja>: os produtos do catálogo desta loja mais
parecidos com a pergunta, cada um com código, categoria, corredor, preço e estoque reais.

Regras sobre produtos (obrigatórias):
- Quando indicar um produto, use só os de <produtos_da_loja>, com o nome e o corredor exatamente como estão lá (o código é interno, não mostre ao cliente).
- Nunca invente produto, marca, código, corredor, preço ou estoque. Se citar preço ou estoque, use o da lista.
- A lista vem de uma busca automática e pode trazer itens sem relação com a pergunta: ignore esses. Cite no máximo 3 produtos.
- Se um produto útil estiver "sem estoque", avise e sugira outro da lista, se houver.
- Se a lista não tiver o que o cliente precisa, diga que não encontrou no catálogo da loja e oriente a falar com um vendedor — não indique corredor nesse caso.
- O cliente não vê <produtos_da_loja>: nunca fale em "lista"; fale "aqui na loja" ou "no nosso catálogo".

Fora isso, responda com o seu conhecimento geral: como instalar ou usar, cuidados, se dá pra fazer
sozinho ou se requer profissional, e o que mais vai precisar.

Responda em português do Brasil, de forma direta, prática e amigável, concisa (máx 4 parágrafos).
Se não souber algo específico, diga honestamente e oriente o cliente a buscar um vendedor especialista na loja.`;

function respostaSemIA(produtos: ProdutoDaLoja[]): string {
  if (produtos.length === 0) {
    return "Nosso especialista virtual está indisponível agora. Fale com um vendedor da loja, ele te ajuda rapidinho.";
  }
  const linhas = produtos.slice(0, 3).map((p) =>
    `- **${p.produto}** — ${p.corredor}, ${p.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}${p.estoque > 0 ? "" : " (sem estoque)"}`
  );
  return [
    "Nosso especialista virtual está indisponível agora, mas encontrei estes produtos na loja que podem ajudar:",
    linhas.join("\n"),
    "Para tirar a dúvida com detalhes, fale com um vendedor da loja.",
  ].join("\n\n");
}

export async function POST(request: NextRequest) {
  try {
    const { pergunta, contexto } = await request.json();

    if (!pergunta?.trim()) {
      return NextResponse.json({ error: "Pergunta não pode ser vazia" }, { status: 400 });
    }

    // No "Pergunte sobre este produto" a pergunta costuma não dizer o produto ("serve pra
    // parede de gesso?") — o nome dele entra na busca pra achar ele mesmo e os complementares.
    const produtoDaFicha = typeof contexto === "string" ? contexto.match(/^Produto: (.+)$/m)?.[1] : undefined;
    const catalogo = await produtosDaLojaPara(produtoDaFicha ? `${produtoDaFicha} — ${pergunta}` : pergunta, 8);

    const mensagemUsuario = [
      `<produtos_da_loja>\n${catalogo.texto}\n</produtos_da_loja>`,
      contexto ? `Contexto do produto que o cliente está vendo:\n${contexto}` : "",
      `Pergunta do cliente: ${pergunta}`,
    ].filter(Boolean).join("\n\n");

    const produtos = catalogo.produtos.map((p) => p.id);
    try {
      const result = await flashModel.generateContent([
        SYSTEM_PROMPT,
        mensagemUsuario,
      ]);
      return NextResponse.json({ resposta: result.response.text().trim(), produtos });
    } catch (erroDaIA) {
      // IA fora do ar (cota diária do Gemini, rede): em vez da mensagem de erro crua do Google,
      // responde com o que a busca achou no catálogo — continua útil pro cliente na loja.
      console.error("[POST /api/duvidas] IA indisponível:", erroDaIA instanceof Error ? erroDaIA.message : erroDaIA);
      return NextResponse.json({ resposta: respostaSemIA(catalogo.produtos), produtos, semIA: true });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[POST /api/duvidas] Erro:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
