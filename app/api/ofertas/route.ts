import { NextRequest, NextResponse } from "next/server";
import { carregarProdutos } from "@/lib/produtos";
import { getInfoOferta } from "@/lib/ofertas";
import { CATEGORIA_TERMOS } from "@/lib/categorias";

export async function GET(req: NextRequest) {
  const categoriaSlug = req.nextUrl.searchParams.get("categoria");
  const termos = categoriaSlug ? (CATEGORIA_TERMOS[categoriaSlug] ?? []) : [];

  const produtos = await carregarProdutos();
  const produtosFiltrados =
    termos.length === 0
      ? produtos
      : produtos.filter((p) => termos.some((t) => p.categoria.toLowerCase().includes(t)));

  const comOferta = produtosFiltrados
    .map(({ embedding: _e, embedding_text: _et, ...rest }) => {
      const info = getInfoOferta(rest.id, rest.preco);
      if (!info.emOferta) return null;
      return {
        ...rest,
        preco: info.precoComDesconto,
        precoOriginal: info.precoOriginal,
        percentualDesconto: info.percentualDesconto,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => b.percentualDesconto - a.percentualDesconto);

  return NextResponse.json(comOferta);
}
