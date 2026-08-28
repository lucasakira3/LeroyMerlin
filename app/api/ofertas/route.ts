import { NextResponse } from "next/server";
import { carregarProdutos } from "@/lib/produtos";
import { getInfoOferta } from "@/lib/ofertas";

export async function GET() {
  const produtos = await carregarProdutos();

  const comOferta = produtos
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
