import { NextRequest, NextResponse } from "next/server";
import { carregarProdutos } from "@/lib/produtos";

const MAPA: Record<string, string[]> = {
  ferramentas: ["ferramentas", "máquinas", "manutenção", "equipamentos"],
  eletrica:    ["elétrica", "eletrica", "energia", "fios", "cabos"],
  hidraulica:  ["hidráulica", "hidraulica", "banheiro", "encanamento", "sanitário", "tubulação"],
  pintura:     ["pintura", "tinta", "acabamento", "verniz", "massa"],
  jardim:      ["jardim", "planta", "exterior", "paisag", "biofílica", "flores"],
  iluminacao:  ["iluminação", "iluminacao", "luminária", "led", "lâmpada"],
  construcao:  ["construção", "material de construção", "madeira", "cimento", "concreto", "tijolos"],
  decoracao:   ["decoração", "decoracao", "decorativo", "enfeite"],
  todos:       [],
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const produtos = await carregarProdutos();
  const termos = MAPA[params.slug] ?? [];

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
