import { NextRequest, NextResponse } from "next/server";
import { flashModel } from "@/lib/gemini";
import { buscarProdutos } from "@/lib/search";
import type { VisionRequest, VisionResponse } from "@/types/produto";

const VISION_PROMPT =
  "Você é um assistente especializado em produtos de construção e reforma da Leroy Merlin. " +
  "Analise a imagem fornecida e identifique o produto mostrado. " +
  "Responda com uma descrição objetiva em 1 a 2 frases em português, focando no tipo de produto, " +
  "material e uso principal (ex: 'Torneira de bica alta em inox para pia de cozinha'). " +
  "Se não conseguir identificar nenhum produto de construção ou reforma, responda exatamente: " +
  "'Produto não identificado'.";

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as VisionRequest & { mimeType?: string };
    const { image, mimeType = "image/jpeg" } = body;

    if (!image || image.trim().length === 0) {
      return NextResponse.json(
        { error: "O campo 'image' é obrigatório (base64 sem prefixo data:image/)." },
        { status: 400 }
      );
    }

    const imageSizeBytes = Buffer.byteLength(image, "base64");
    if (imageSizeBytes > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "A imagem excede o tamanho máximo permitido de 4MB." },
        { status: 400 }
      );
    }

    const validMime = ALLOWED_MIME_TYPES.includes(mimeType) ? mimeType : "image/jpeg";

    const result = await flashModel.generateContent([
      VISION_PROMPT,
      { inlineData: { mimeType: validMime, data: image } },
    ]);

    const descricaoIdentificada = result.response.text().trim() || "Produto não identificado";

    if (descricaoIdentificada === "Produto não identificado") {
      const response: VisionResponse = {
        descricao_identificada: "Produto não identificado",
        resultados: [],
        total: 0,
      };
      return NextResponse.json(response);
    }

    const resultados = await buscarProdutos(descricaoIdentificada, 5);

    const response: VisionResponse = {
      descricao_identificada: descricaoIdentificada,
      resultados,
      total: resultados.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[POST /api/vision] Erro:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
