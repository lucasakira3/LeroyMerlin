import { NextRequest, NextResponse } from "next/server";
import { flashModel } from "@/lib/gemini";
import { buscarProdutos } from "@/lib/search";
import type { VisionRequest, VisionResponse } from "@/types/produto";

// Prompt fixo para identificação de produto Leroy Merlin via imagem
const VISION_PROMPT =
  "Você é um assistente especializado em produtos de construção e reforma da Leroy Merlin. " +
  "Analise a imagem fornecida e identifique o produto mostrado. " +
  "Responda com uma descrição objetiva em 1 a 2 frases em português, focando no tipo de produto, " +
  "material e uso principal (ex: 'Torneira de bica alta em inox para pia de cozinha'). " +
  "Se não conseguir identificar nenhum produto de construção ou reforma, responda exatamente: " +
  "'Produto não identificado'.";

// Limite de tamanho da imagem em base64: ~4MB em bytes
const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as VisionRequest & { mimeType?: string };
    const { image, mimeType = "image/jpeg" } = body;

    // Validação: imagem é obrigatória
    if (!image || image.trim().length === 0) {
      return NextResponse.json(
        { error: "O campo 'image' é obrigatório (base64 sem prefixo data:image/)." },
        { status: 400 }
      );
    }

    // Validação: tamanho máximo de 4MB
    const imageSizeBytes = Buffer.byteLength(image, "base64");
    if (imageSizeBytes > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "A imagem excede o tamanho máximo permitido de 4MB." },
        { status: 400 }
      );
    }

    // Envia imagem ao Gemini Flash Vision com o prompt de identificação
    const result = await flashModel.generateContent([
      VISION_PROMPT,
      {
        inlineData: {
          mimeType,
          data: image,
        },
      },
    ]);

    const descricaoIdentificada =
      result.response.text().trim() || "Produto não identificado";

    // Se o modelo não identificou produto, retorna resposta vazia sem busca
    if (descricaoIdentificada === "Produto não identificado") {
      const response: VisionResponse = {
        descricao_identificada: "Produto não identificado",
        resultados: [],
        total: 0,
      };
      return NextResponse.json(response, { status: 200 });
    }

    // Busca produtos semanticamente similares à descrição identificada
    const resultados = await buscarProdutos(descricaoIdentificada, 5);

    const response: VisionResponse = {
      descricao_identificada: descricaoIdentificada,
      resultados,
      total: resultados.length,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[POST /api/vision] Erro:", error);
    return NextResponse.json(
      { error: "Falha ao processar a imagem. Tente novamente." },
      { status: 500 }
    );
  }
}
