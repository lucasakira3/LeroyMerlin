import { NextRequest, NextResponse } from "next/server";
import { carregarProdutos } from "@/lib/produtos";
import { AREA_PARA_CATEGORIAS, pontuarProduto, sugerirServicos } from "@/lib/perfilSugestoes";
import type { Perfil } from "@/types/perfil";

const MAX_SUGESTOES = 12;

export async function POST(req: NextRequest) {
  try {
    const { perfil } = (await req.json()) as { perfil: Perfil };
    const produtos = await carregarProdutos();

    const categoriasRelevantes = perfil.areas.flatMap((a) => AREA_PARA_CATEGORIAS[a] ?? []);
    const candidatos = produtos.filter((p) => categoriasRelevantes.includes(p.categoria));

    const porArea = new Map(
      perfil.areas.map((area) => [
        area,
        candidatos
          .filter((p) => (AREA_PARA_CATEGORIAS[area] ?? []).includes(p.categoria))
          .map((p) => ({ produto: p, pontos: pontuarProduto(p, perfil) }))
          .sort((a, b) => b.pontos - a.pontos || b.produto.estoque - a.produto.estoque),
      ])
    );

    // Round-robin entre as áreas escolhidas (1 produto de cada área por volta) em vez de
    // simplesmente pegar os top-N por pontuação — sem isso, uma área com muitos produtos
    // bem pontuados dominaria as 12 sugestões e áreas com poucos produtos ficariam de fora,
    // mesmo o cliente tendo pedido as duas. `progresso` para o loop quando nenhuma área
    // tem mais produto novo pra oferecer (evita loop infinito com poucas áreas/produtos).
    const selecionados: { produto: Awaited<ReturnType<typeof carregarProdutos>>[number]; pontos: number }[] = [];
    const vistos = new Set<string>();
    let progresso = true;
    while (selecionados.length < MAX_SUGESTOES && progresso) {
      progresso = false;
      for (const area of perfil.areas) {
        const lista = porArea.get(area) ?? [];
        const proximo = lista.find((x) => !vistos.has(x.produto.id));
        if (proximo) {
          vistos.add(proximo.produto.id);
          selecionados.push(proximo);
          progresso = true;
          if (selecionados.length >= MAX_SUGESTOES) break;
        }
      }
    }

    const produtosResposta = selecionados.map(({ produto, pontos }) => {
      const { embedding: _e, embedding_text: _et, ...resto } = produto;
      return { produto: resto, score: pontos };
    });

    return NextResponse.json({ produtos: produtosResposta, servicos: sugerirServicos(perfil) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[POST /api/perfil/sugestoes]", msg);
    return NextResponse.json(
      { error: "Não foi possível gerar sugestões. Tente novamente." },
      { status: 500 }
    );
  }
}
