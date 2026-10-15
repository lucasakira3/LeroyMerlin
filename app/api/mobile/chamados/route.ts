import { randomUUID } from "node:crypto";
import {
  autenticarVisitante,
  lerBody,
  MobileError,
  respostaErro,
  texto,
} from "@/lib/mobile/auth";
import { listarChamados, salvarChamado } from "@/lib/mobile/store";
import { carregarProdutos } from "@/lib/produtos";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    return Response.json(
      await listarChamados(autenticarVisitante(request).id),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return respostaErro(error);
  }
}
export async function POST(request: Request) {
  try {
    const sessao = autenticarVisitante(request);
    const body = await lerBody(request);
    const produtoId = texto(body.produtoId, 80, "Produto");
    const produto = (await carregarProdutos()).find((p) => p.id === produtoId);
    if (!produto) throw new MobileError("Produto não encontrado.", 404);
    const anteriores = await listarChamados(sessao.id);
    const existente = anteriores.find(
      (c) => c.produtoId === produtoId && c.status !== "atendido",
    );
    if (existente) return Response.json(existente);
    if (anteriores.filter((c) => c.status !== "atendido").length >= 3)
      throw new MobileError(
        "Você já tem três pedidos de ajuda em aberto.",
        429,
      );
    const agora = new Date().toISOString();
    const chamado = await salvarChamado({
      id: randomUUID(),
      sessaoId: sessao.id,
      clienteNome: sessao.nome,
      produtoId,
      produtoNome: produto.produto,
      corredor: produto.corredor,
      status: "pendente",
      mensagem: "Seu pedido de ajuda chegou à equipe.",
      criadoEm: agora,
      atualizadoEm: agora,
    });
    return Response.json(chamado, { status: 201 });
  } catch (error) {
    return respostaErro(error);
  }
}
