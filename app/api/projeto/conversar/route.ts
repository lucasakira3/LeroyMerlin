import { NextRequest, NextResponse } from "next/server";
import { casarMateriaisComCatalogo } from "@/lib/rag";
import {
  conversarProjetoIA,
  type MensagemConversaProjeto,
  type ProjetoIA,
} from "@/lib/projetoGuiado";

// Rota da conversa do Projeto Guiado (2026-09-27) — substitui o antigo fluxo de "uma
// descrição, uma resposta" de /api/projeto (mantida intacta só pro harness de teste, ver
// scripts/testar-projeto-guiado.ts). Cobre as duas pontas da conversa com a mesma rota:
// antes de gerar (a IA pode devolver uma pergunta em vez da lista) e depois de gerada
// (o cliente pode perguntar ou pedir mudança) — ver conversarProjetoIA em lib/projetoGuiado.ts
// pra saber por que é uma função só.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const historico: MensagemConversaProjeto[] = body.historico;
    const comodos: string[] | undefined = body.comodos;
    const projetoAtual: ProjetoIA | undefined = body.projetoAtual;

    if (!Array.isArray(historico) || historico.length === 0) {
      return NextResponse.json({ error: "Conversa vazia" }, { status: 400 });
    }

    const resposta = await conversarProjetoIA(historico, comodos, projetoAtual);

    // Só "resultado" e "atualizacao" trazem itens de material — precisam ser cruzados com o
    // catálogo real pra virar produtos buscáveis (mesmo passo que /api/projeto já fazia).
    if (resposta.tipo === "resultado" || resposta.tipo === "atualizacao") {
      // Casamento por significado + palavras + categoria (lib/rag.ts), uma chamada de vetores
      // pra lista toda; materiais já vistos saem do cache e não gastam cota de novo.
      const resultados = await casarMateriaisComCatalogo(resposta.itens, 3);
      const itensComProduto = resposta.itens.map((item, i) => ({
        ...item,
        resultados: resultados[i],
      }));
      return NextResponse.json({ ...resposta, itens: itensComProduto });
    }

    return NextResponse.json(resposta);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[POST /api/projeto/conversar]", msg);
    return NextResponse.json(
      { error: "Não foi possível processar sua mensagem. Tente novamente." },
      { status: 500 }
    );
  }
}
