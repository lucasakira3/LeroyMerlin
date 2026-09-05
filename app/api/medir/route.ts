import { NextRequest, NextResponse } from "next/server";
import { flashModel } from "@/lib/gemini";
import { getObjetoReferencia, type MedicaoResponse } from "@/lib/medir";

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const FALLBACK: MedicaoResponse = {
  identificado: false,
  largura_cm: null,
  altura_cm: null,
  area_m2: null,
  explicacao: "Não conseguimos identificar bem a foto. Confirme que o objeto de referência está visível inteiro, ao lado do que você quer medir.",
};

function extrairJson(texto: string): Partial<MedicaoResponse> {
  const limpo = texto.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(limpo);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { image?: string; mimeType?: string; referenciaId?: string };
    const { image, mimeType = "image/jpeg", referenciaId } = body;

    if (!image || image.trim().length === 0) {
      return NextResponse.json(
        { error: "O campo 'image' é obrigatório (base64 sem prefixo data:image/)." },
        { status: 400 },
      );
    }

    const referencia = referenciaId ? getObjetoReferencia(referenciaId) : undefined;
    if (!referencia) {
      return NextResponse.json({ error: "Objeto de referência inválido." }, { status: 400 });
    }

    const imageSizeBytes = Buffer.byteLength(image, "base64");
    if (imageSizeBytes > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "A imagem excede o tamanho máximo permitido de 4MB." },
        { status: 400 },
      );
    }

    const validMime = ALLOWED_MIME_TYPES.includes(mimeType) ? mimeType : "image/jpeg";

    const prompt =
      "Você é um assistente que estima medidas a partir de fotos, pra ajudar clientes de uma loja de " +
      "construção e reforma a saber quanto material comprar. Você NÃO tem acesso a sensor de profundidade " +
      "— a única forma de estimar tamanho real é comparando com um objeto de referência de tamanho " +
      "conhecido que está na mesma foto.\n\n" +
      `Objeto de referência nesta foto: ${referencia.label}, que mede exatamente ` +
      `${referencia.larguraCm}cm × ${referencia.alturaCm}cm.\n\n` +
      "Encontre esse objeto de referência na imagem e use o tamanho dele em pixels como escala pra " +
      "estimar a largura e a altura REAIS (em centímetros) da principal superfície ou objeto que aparece " +
      "ao lado dele na foto (ex: uma parede, um piso, um vão de janela). Responda APENAS com um JSON " +
      "válido (sem markdown, sem texto fora do JSON), no formato exato:\n" +
      "{\n" +
      '  "identificado": true,\n' +
      '  "largura_cm": 120,\n' +
      '  "altura_cm": 80,\n' +
      '  "explicacao": "Frase curta em português explicando o que foi medido e um lembrete de que é uma estimativa"\n' +
      "}\n\n" +
      "Regras:\n" +
      `- Se não conseguir identificar claramente o objeto de referência (${referencia.label}) na foto, ou não houver ` +
      'nada relevante pra medir ao lado dele, responda "identificado": false, "largura_cm": null, "altura_cm": null ' +
      'e explique o que falta na "explicacao" (ex: pedir pra reposicionar o objeto de referência, afastar mais a câmera).\n' +
      "- Números em centímetros, arredondados, sem unidade no valor (só o número).\n" +
      "- Seja conservador: essa é uma estimativa visual aproximada, não uma medição de precisão — nunca aparente mais certeza do que a foto permite.";

    const result = await flashModel.generateContent([
      prompt,
      { inlineData: { mimeType: validMime, data: image } },
    ]);

    const texto = result.response.text().trim();

    let bruto: Partial<MedicaoResponse>;
    try {
      bruto = extrairJson(texto);
    } catch (parseError) {
      console.error("[POST /api/medir] Falha ao interpretar resposta da IA:", parseError);
      return NextResponse.json(FALLBACK);
    }

    if (!bruto.identificado || typeof bruto.largura_cm !== "number" || typeof bruto.altura_cm !== "number") {
      return NextResponse.json({
        identificado: false,
        largura_cm: null,
        altura_cm: null,
        area_m2: null,
        explicacao: bruto.explicacao?.trim() || FALLBACK.explicacao,
      } satisfies MedicaoResponse);
    }

    const larguraCm = Math.round(bruto.largura_cm);
    const alturaCm = Math.round(bruto.altura_cm);
    const areaM2 = Math.round(((larguraCm * alturaCm) / 10000) * 100) / 100;

    const resposta: MedicaoResponse = {
      identificado: true,
      largura_cm: larguraCm,
      altura_cm: alturaCm,
      area_m2: areaM2,
      explicacao: bruto.explicacao?.trim() || "",
    };

    return NextResponse.json(resposta);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[POST /api/medir] Erro:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
