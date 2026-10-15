import type { ChamadoMobile } from "@/types/mobile";
import { tokenDispositivo } from "./store";

export async function notificarChamado(
  chamado: ChamadoMobile,
): Promise<string | null> {
  try {
    const token = await tokenDispositivo(chamado.sessaoId);
    if (!token)
      return "Visitante sem push registrado; a atualização está disponível dentro do app.";
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        "Content-Type": "application/json",
        ...(process.env.EXPO_ACCESS_TOKEN
          ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        to: token,
        title:
          chamado.status === "atendido"
            ? "Atendimento concluído"
            : "Um especialista está indo até você",
        body: chamado.mensagem,
        sound: "default",
        channelId: "atendimento",
        data: { url: "/atendimento", chamadoId: chamado.id },
      }),
    });
    if (!response.ok)
      return "Chamado atualizado, mas o serviço de push não aceitou o envio.";
    const result = await response.json();
    if (result.data?.status !== "ok")
      return "Chamado atualizado, mas o push falhou. Confira as credenciais do aplicativo.";
    // Ticket aceito não significa entrega garantida. O painel não afirma que foi recebido.
    return null;
  } catch {
    return "Chamado atualizado; não foi possível enviar o push agora.";
  }
}
