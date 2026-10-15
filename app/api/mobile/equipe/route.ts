import {
  autenticarEquipe,
  lerBody,
  MobileError,
  respostaErro,
  texto,
} from "@/lib/mobile/auth";
import { atualizarChamado, listarChamados } from "@/lib/mobile/store";
import { notificarChamado } from "@/lib/mobile/push";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    autenticarEquipe(request);
    return Response.json(await listarChamados(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return respostaErro(error);
  }
}
export async function PATCH(request: Request) {
  try {
    autenticarEquipe(request);
    const body = await lerBody(request);
    const id = texto(body.id, 80, "Chamado");
    if (body.status !== "a_caminho" && body.status !== "atendido")
      throw new MobileError("Status inválido.");
    const mensagem = texto(
      body.mensagem ??
        (body.status === "atendido"
          ? "Seu atendimento foi concluído. Obrigado!"
          : "Um especialista está indo até você. Aguarde no corredor."),
      500,
      "Mensagem",
    );
    const chamado = await atualizarChamado(id, body.status, mensagem);
    const avisoPush = await notificarChamado(chamado);
    return Response.json({ chamado, avisoPush });
  } catch (error) {
    return respostaErro(error);
  }
}
