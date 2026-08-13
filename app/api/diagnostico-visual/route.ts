import { NextRequest, NextResponse } from "next/server";
import { flashModel } from "@/lib/gemini";
import { buscarProdutos } from "@/lib/search";
import type {
  DiagnosticoItem,
  DiagnosticoVisualResponse,
  SearchResult,
} from "@/types/produto";

// Diferente do /api/vision (que identifica QUAL produto está na foto), este prompt
// pede à IA para diagnosticar O PROBLEMA mostrado na foto e sugerir termos de busca
// específicos — o cliente não precisa saber o nome técnico de nada.
const DIAGNOSTICO_PROMPT =
  "Você é um especialista da Leroy Merlin Brasil em diagnosticar problemas domésticos, de reforma " +
  "e manutenção a partir de fotos. O cliente não sabe o nome técnico do problema nem do produto que " +
  "precisa — ele só tem uma foto do problema (ex: um cano vazando, uma parede rachada, um cômodo " +
  "bagunçado). Sua tarefa NÃO é identificar um produto na imagem, e sim diagnosticar o que está " +
  "errado e indicar quais produtos ajudam a resolver.\n\n" +
  "Responda APENAS com um JSON válido (sem markdown, sem texto fora do JSON), no formato exato:\n" +
  "{\n" +
  '  "problema_identificado": true,\n' +
  '  "diagnostico": "Explicação simples e direta do problema, em português do Brasil, em 1 a 2 frases, como se estivesse falando com alguém sem conhecimento técnico. Ex: \'Parece um vazamento na conexão da torneira, provavelmente por desgaste do vedante.\'",\n' +
  '  "itens_sugeridos": [\n' +
  '    { "nome_busca": "Nome específico e buscável do produto, ex: Vedante para torneira", "motivo": "Por que esse item ajuda a resolver o problema, em poucas palavras" }\n' +
  "  ]\n" +
  "}\n\n" +
  "Regras:\n" +
  "- Se a imagem não mostrar claramente um problema de casa, reforma, hidráulica, elétrica, estrutura " +
  'ou jardim, responda com "problema_identificado": false, "diagnostico": "Não conseguimos identificar ' +
  'bem o problema nesta foto. Pode descrever com suas palavras o que está acontecendo?" e "itens_sugeridos": [].\n' +
  '- Gere entre 2 e 5 itens sugeridos, específicos e buscáveis (ex: "Fita veda-rosca 18mm", nunca apenas "fita").\n' +
  "- Sugira apenas produtos de construção, reforma, hidráulica, elétrica, jardim, pintura ou ferramentas " +
  "— o tipo de produto vendido pela Leroy Merlin.\n" +
  "- Se o problema envolver risco grave (estrutura comprometida, fiação de alta tensão, vazamento de gás), " +
  'inclua um alerta recomendando um profissional dentro do campo "diagnostico", mas ainda assim sugira ' +
  "os itens básicos relevantes se houver.";

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const FALLBACK_DIAGNOSTICO =
  "Não conseguimos identificar bem o problema nesta foto. Pode descrever com suas palavras o que está acontecendo?";

const RESULTADOS_POR_ITEM = 2;
const MAX_ITENS_SUGERIDOS = 5;
const MAX_RESULTADOS_TOTAL = 10;

interface DiagnosticoBruto {
  problema_identificado?: boolean;
  diagnostico?: string;
  itens_sugeridos?: Array<{ nome_busca?: string; motivo?: string }>;
}

function extrairJson(texto: string): DiagnosticoBruto {
  const limpo = texto.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(limpo);
}

function respostaSemProblema(diagnostico: string): DiagnosticoVisualResponse {
  return {
    problema_identificado: false,
    diagnostico,
    itens_sugeridos: [],
    resultados: [],
    total: 0,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { image?: string; mimeType?: string };
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
      DIAGNOSTICO_PROMPT,
      { inlineData: { mimeType: validMime, data: image } },
    ]);

    const texto = result.response.text().trim();

    let diagnosticoBruto: DiagnosticoBruto;
    try {
      diagnosticoBruto = extrairJson(texto);
    } catch (parseError) {
      console.error("[POST /api/diagnostico-visual] Falha ao interpretar resposta da IA:", parseError);
      return NextResponse.json(respostaSemProblema(FALLBACK_DIAGNOSTICO));
    }

    if (!diagnosticoBruto.problema_identificado) {
      return NextResponse.json(
        respostaSemProblema(diagnosticoBruto.diagnostico?.trim() || FALLBACK_DIAGNOSTICO)
      );
    }

    // Cruza cada termo sugerido pela IA com o catálogo real via busca semântica já existente —
    // o diagnóstico da IA é texto livre, mas os produtos recomendados precisam existir de verdade.
    const itensBrutos = Array.isArray(diagnosticoBruto.itens_sugeridos)
      ? diagnosticoBruto.itens_sugeridos.slice(0, MAX_ITENS_SUGERIDOS)
      : [];

    const itensSugeridos: DiagnosticoItem[] = [];
    for (const item of itensBrutos) {
      const nomeBusca = item.nome_busca?.trim();
      if (!nomeBusca) continue;

      const resultadosItem = await buscarProdutos(nomeBusca, RESULTADOS_POR_ITEM);
      itensSugeridos.push({
        nome_busca: nomeBusca,
        motivo: item.motivo?.trim() || "",
        resultados: resultadosItem,
      });
    }

    // Achata e remove duplicatas para alimentar o mapa da loja, do mesmo jeito que qualquer
    // outra busca (texto ou imagem de produto) já faz.
    const resultados: SearchResult[] = [];
    const idsVistos = new Set<string>();
    for (const item of itensSugeridos) {
      for (const r of item.resultados) {
        if (!idsVistos.has(r.produto.id)) {
          idsVistos.add(r.produto.id);
          resultados.push(r);
        }
      }
    }

    const response: DiagnosticoVisualResponse = {
      problema_identificado: true,
      diagnostico: diagnosticoBruto.diagnostico?.trim() || "",
      itens_sugeridos: itensSugeridos,
      resultados: resultados.slice(0, MAX_RESULTADOS_TOTAL),
      total: resultados.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[POST /api/diagnostico-visual] Erro:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
