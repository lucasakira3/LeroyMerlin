import {
  autenticarVisitante,
  lerBody,
  MobileError,
  respostaErro,
  texto,
} from "@/lib/mobile/auth";
import { registrarDispositivo } from "@/lib/mobile/store";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const sessao = autenticarVisitante(request);
    const body = await lerBody(request);
    const token = texto(body.token, 250, "Token");
    if (!/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/.test(token))
      throw new MobileError("Token de push inválido.");
    await registrarDispositivo(sessao.id, token);
    return Response.json({ ok: true });
  } catch (error) {
    return respostaErro(error);
  }
}
