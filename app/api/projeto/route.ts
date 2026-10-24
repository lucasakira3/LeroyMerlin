import { NextRequest, NextResponse } from "next/server";
import { casarMateriaisComCatalogo } from "@/lib/rag";
import { gerarProjetoIA } from "@/lib/projetoGuiado";

// Geração + matriz de fases + ancoragem no catálogo real vivem em lib/projetoGuiado.ts —
// extraído daqui em 2026-09-25 pra poder ser chamado também pelo harness de teste
// (scripts/testar-projeto-guiado.ts) sem precisar de um servidor rodando. Esta rota fica
// só com o que é de fato específico de ser uma rota HTTP: ler o body, tratar erro, e cruzar
// o resultado da IA com o catálogo (lib/rag.ts).
export async function POST(req: NextRequest) {
  try {
    const { descricao, comodos } = await req.json();
    if (!descricao?.trim()) {
      return NextResponse.json({ error: "Descreva seu projeto" }, { status: 400 });
    }

    const projeto = await gerarProjetoIA(descricao, comodos);

    // Cada material vira até 3 produtos reais, escolhidos por significado + palavras +
    // categoria (lib/rag.ts) — com busca por palavras de reserva se os vetores falharem.
    const resultados = await casarMateriaisComCatalogo(projeto.itens, 3);
    const itensComProduto = projeto.itens.map((item, i) => ({
      ...item,
      resultados: resultados[i],
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
