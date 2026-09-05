import { NextRequest, NextResponse } from "next/server";
import { flashModel } from "@/lib/gemini";
import { carregarProdutos } from "@/lib/produtos";
import type { CompatibilidadeResponse } from "@/types/produto";

const ID_REGEX = /^LM-\d{4}$/;
const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const FALLBACK: CompatibilidadeResponse = {
  imagem_reconhecida: false,
  veredito: null,
  explicacao: "Não conseguimos analisar bem esta foto. Tente uma imagem mais próxima e com boa luz.",
};

function extrairJson(texto: string): Partial<CompatibilidadeResponse> {
  const limpo = texto.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(limpo);
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id } = await params;

    if (!ID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "ID inválido. O formato esperado é LM-XXXX (ex: LM-0042)." },
        { status: 400 },
      );
    }

    const produtos = await carregarProdutos();
    const produto = produtos.find((p) => p.id === id);
    if (!produto) {
      return NextResponse.json({ error: `Produto '${id}' não encontrado.` }, { status: 404 });
    }

    const body = (await request.json()) as { image?: string; mimeType?: string };
    const { image, mimeType = "image/jpeg" } = body;

    if (!image || image.trim().length === 0) {
      return NextResponse.json(
        { error: "O campo 'image' é obrigatório (base64 sem prefixo data:image/)." },
        { status: 400 },
      );
    }

    const imageSizeBytes = Buffer.byteLength(image, "base64");
    if (imageSizeBytes > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "A imagem excede o tamanho máximo permitido de 4MB." },
        { status: 400 },
      );
    }

    const validMime = ALLOWED_MIME_TYPES.includes(mimeType) ? mimeType : "image/jpeg";

    // O prompt dá à IA o produto específico que o cliente já está olhando no popup (não
    // um produto genérico da categoria) — a pergunta real do cliente é sempre "ESSE aqui
    // serve no que eu tenho em casa?", não "que produto da categoria serve?".
    const prompt =
      "Você é um especialista da Leroy Merlin Brasil em compatibilidade de materiais de construção " +
      "e reforma. O cliente está considerando comprar o seguinte produto:\n\n" +
      `Produto: ${produto.produto}\n` +
      `Categoria: ${produto.categoria}\n` +
      `Especificações técnicas: ${produto.especificacoes || "não informadas"}\n\n` +
      "A imagem em anexo mostra o local, peça ou instalação existente onde o cliente pretende usar " +
      "esse produto (ex: uma pia, um vaso sanitário, uma tomada, um piso). Avalie se o produto acima " +
      "é fisicamente compatível com o que aparece na imagem (encaixe, medida aparente, padrão de " +
      "instalação, tipo de conexão) e responda APENAS com um JSON válido (sem markdown, sem texto " +
      "fora do JSON), no formato exato:\n" +
      "{\n" +
      '  "imagem_reconhecida": true,\n' +
      '  "veredito": "sim" | "nao" | "talvez",\n' +
      '  "explicacao": "Explicação curta e direta em português do Brasil, 1 a 3 frases, sem jargão técnico, ' +
      "explicando o motivo do veredito e o que o cliente deve conferir antes de comprar\"\n" +
      "}\n\n" +
      "Regras:\n" +
      '- Se a imagem não mostrar nada analisável (foto borrada, ambiente genérico, produto errado), ' +
      'responda "imagem_reconhecida": false, "veredito": null e explique isso na "explicacao".\n' +
      '- Use "talvez" sempre que a compatibilidade depender de uma medida exata que não dá pra confirmar só ' +
      "pela foto (ex: diâmetro de rosca, voltagem) — nesse caso, diga na explicação exatamente o que o " +
      "cliente precisa medir ou verificar antes de comprar.\n" +
      "- Nunca invente uma certeza que a foto não permite. Seja honesto sobre a limitação de avaliar por imagem.";

    const result = await flashModel.generateContent([
      prompt,
      { inlineData: { mimeType: validMime, data: image } },
    ]);

    const texto = result.response.text().trim();

    let bruto: Partial<CompatibilidadeResponse>;
    try {
      bruto = extrairJson(texto);
    } catch (parseError) {
      console.error("[POST /api/produto/[id]/compatibilidade] Falha ao interpretar resposta da IA:", parseError);
      return NextResponse.json(FALLBACK);
    }

    const resposta: CompatibilidadeResponse = {
      imagem_reconhecida: bruto.imagem_reconhecida ?? false,
      veredito: bruto.imagem_reconhecida ? (bruto.veredito ?? null) : null,
      explicacao: bruto.explicacao?.trim() || FALLBACK.explicacao,
    };

    return NextResponse.json(resposta);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[POST /api/produto/[id]/compatibilidade] Erro:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
