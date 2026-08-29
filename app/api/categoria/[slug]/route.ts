import { NextRequest, NextResponse } from "next/server";
import { carregarProdutos } from "@/lib/produtos";
import { CATEGORIA_TERMOS } from "@/lib/categorias";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const produtos = await carregarProdutos();
  const { slug } = await params;
  // slug desconhecido (ou "todos") cai em `[]` -> nenhum filtro aplicado, devolve o
  // catálogo inteiro em vez de dar 404 ou lista vazia. Decisão deliberada, não omissão.
  const termos = CATEGORIA_TERMOS[slug] ?? [];

  const filtrados =
    termos.length === 0
      ? produtos
      : produtos.filter((p) =>
          termos.some((t) => p.categoria.toLowerCase().includes(t)),
        );

  const resultado = filtrados
    .slice(0, 300)
    .map(({ embedding: _e, embedding_text: _et, ...rest }) => rest);

  return NextResponse.json(resultado);
}
