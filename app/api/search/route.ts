import { NextRequest, NextResponse } from "next/server";
import { buscarProdutos } from "@/lib/search";
import type { SearchRequest, SearchResponse } from "@/types/produto";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as SearchRequest;
    const { query, limit = 5 } = body;

    // Validação: query não pode ser vazia
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "O campo 'query' é obrigatório e não pode estar vazio." },
        { status: 400 }
      );
    }

    // Normaliza limit: mínimo 1, máximo 20
    const limitNormalizado = Math.min(Math.max(1, limit), 20);

    const resultados = await buscarProdutos(query.trim(), limitNormalizado);

    const response: SearchResponse = {
      resultados,
      total: resultados.length,
      query_processada: query.trim(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[POST /api/search] Erro:", error);
    return NextResponse.json(
      { error: "Falha ao processar a busca. Tente novamente." },
      { status: 500 }
    );
  }
}
