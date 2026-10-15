import { criarSessao, lerBody, respostaErro, texto } from "@/lib/mobile/auth";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await lerBody(request);
    return Response.json(criarSessao(texto(body.nome, 60, "Nome")), {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return respostaErro(error);
  }
}
