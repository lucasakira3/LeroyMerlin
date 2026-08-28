import { NextRequest, NextResponse } from "next/server";
import { carregarProdutos } from "@/lib/produtos";
import { getInfoOferta } from "@/lib/ofertas";
import type { Produto } from "@/types/produto";

// Regex para validar formato de ID: LM- seguido de exatamente 4 dígitos
const ID_REGEX = /^LM-\d{4}$/;

type ProdutoPublico = Omit<Produto, "embedding" | "embedding_text">;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Validação: formato do ID deve ser LM-XXXX
    if (!ID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "ID inválido. O formato esperado é LM-XXXX (ex: LM-0042)." },
        { status: 400 },
      );
    }

    const produtos = await carregarProdutos();
    const produto = produtos.find((p) => p.id === id);

    if (!produto) {
      return NextResponse.json(
        { error: `Produto '${id}' não encontrado.` },
        { status: 404 },
      );
    }

    // Remove campos internos antes de expor na resposta
    const {
      embedding: _embedding,
      embedding_text: _embeddingText,
      ...produtoPublico
    }: Produto = produto;

    const info = getInfoOferta(produto.id, produto.preco);
    const resposta: ProdutoPublico = { ...produtoPublico, preco: info.precoComDesconto };

    return NextResponse.json(resposta, { status: 200 });
  } catch (error) {
    console.error("[GET /api/produto/[id]] Erro:", error);
    return NextResponse.json(
      { error: "Falha ao buscar produto. Tente novamente." },
      { status: 500 },
    );
  }
}
