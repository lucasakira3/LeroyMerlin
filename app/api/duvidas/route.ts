import { NextRequest, NextResponse } from "next/server";
import { flashModel } from "@/lib/gemini";

const SYSTEM_PROMPT = `Você é um especialista da Leroy Merlin Brasil, com profundo conhecimento em
materiais de construção, reforma, decoração, ferramentas, elétrica, hidráulica, jardim e todos os
produtos vendidos nas lojas.

Responda de forma direta, prática e amigável. Quando relevante:
- Indique o corredor ou seção da loja onde o produto pode ser encontrado
- Dê dicas de instalação ou uso
- Sugira produtos relacionados ou complementares
- Informe sobre nível de complexidade (DIY ou requer profissional)

Mantenha as respostas em português do Brasil, concisas (máx 4 parágrafos) e focadas na necessidade do cliente.
Se não souber algo específico, diga honestamente e oriente o cliente a buscar um vendedor especialista na loja.`;

export async function POST(request: NextRequest) {
  try {
    const { pergunta, contexto } = await request.json();

    if (!pergunta?.trim()) {
      return NextResponse.json({ error: "Pergunta não pode ser vazia" }, { status: 400 });
    }

    const mensagemUsuario = contexto
      ? `Contexto do produto:\n${contexto}\n\nPergunta do cliente: ${pergunta}`
      : `Pergunta do cliente: ${pergunta}`;

    const result = await flashModel.generateContent([
      SYSTEM_PROMPT,
      mensagemUsuario,
    ]);

    const resposta = result.response.text().trim();

    return NextResponse.json({ resposta });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[POST /api/duvidas] Erro:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
