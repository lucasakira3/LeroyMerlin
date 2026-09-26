import { NextRequest, NextResponse } from "next/server";
import { carregarProdutos } from "@/lib/produtos";
import { gerarProjetoIA, buscaTextoSimples } from "@/lib/projetoGuiado";

// Geração + matriz de fases + ancoragem no catálogo real vivem em lib/projetoGuiado.ts —
// extraído daqui em 2026-09-25 pra poder ser chamado também pelo harness de teste
// (scripts/testar-projeto-guiado.ts) sem precisar de um servidor rodando. Esta rota fica
// só com o que é de fato específico de ser uma rota HTTP: ler o body, tratar erro, e cruzar
// o resultado da IA com o catálogo (que exige carregarProdutos()).
export async function POST(req: NextRequest) {
  try {
    const { descricao, comodos } = await req.json();
    if (!descricao?.trim()) {
      return NextResponse.json({ error: "Descreva seu projeto" }, { status: 400 });
    }

    const projeto = await gerarProjetoIA(descricao, comodos);

    const produtos = await carregarProdutos();
    const itensComProduto = projeto.itens.map((item) => ({
      ...item,
      resultados: buscaTextoSimples(produtos, item.material, 3),
    }));

    return NextResponse.json({ ...projeto, itens: itensComProduto });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[POST /api/projeto]", msg);
    return NextResponse.json(
      { error: "Não foi possível analisar o projeto. Tente novamente." },
      { status: 500 }
    );
  }
}
