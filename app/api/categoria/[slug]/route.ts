import { NextRequest, NextResponse } from "next/server";
import { carregarProdutos } from "@/lib/produtos";
import { CATEGORIA_TERMOS } from "@/lib/categorias";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const produtos = await carregarProdutos();
  const termos = CATEGORIA_TERMOS[params.slug] ?? [];

  const filtrados =
    termos.length === 0
      ? produtos
      : produtos.filter((p) =>
          termos.some((t) => p.categoria.toLowerCase().includes(t))
        );

  const resultado = filtrados.slice(0, 300).map(
    ({ embedding: _e, embedding_text: _et, ...rest }) => rest
  );

  return NextResponse.json(resultado);
}
