import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { SessaoMobile } from "@/types/mobile";

export class MobileError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

function secret(): string {
  const value = process.env.MOBILE_SESSION_SECRET;
  if (!value || value.length < 32)
    throw new MobileError(
      "Configure MOBILE_SESSION_SECRET com pelo menos 32 caracteres no servidor.",
      503,
    );
  return value;
}

function equal(a: string, b: string): boolean {
  const first = Buffer.from(a);
  const second = Buffer.from(b);
  return first.length === second.length && timingSafeEqual(first, second);
}

export function criarSessao(nome: string): SessaoMobile {
  const id = randomUUID();
  const expiraEm = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ id, nome, expiraEm })).toString(
    "base64url",
  );
  const signature = createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
  return { id, nome, expiraEm, token: `${payload}.${signature}` };
}

export function autenticarVisitante(
  request: Request,
): Omit<SessaoMobile, "token"> {
  const token =
    request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const parts = token.split(".");
  if (parts.length !== 2)
    throw new MobileError("Entre novamente como visitante.", 401);
  const expected = createHmac("sha256", secret())
    .update(parts[0])
    .digest("base64url");
  if (!equal(parts[1], expected))
    throw new MobileError("Sessão inválida.", 401);
  try {
    const data = JSON.parse(
      Buffer.from(parts[0], "base64url").toString(),
    ) as Omit<SessaoMobile, "token">;
    if (
      !data.id ||
      typeof data.nome !== "string" ||
      typeof data.expiraEm !== "number" ||
      data.expiraEm < Date.now()
    )
      throw new Error();
    return data;
  } catch {
    throw new MobileError(
      "Sessão expirada. Entre novamente como visitante.",
      401,
    );
  }
}

export function autenticarEquipe(request: Request): void {
  const configured = process.env.MOBILE_ADMIN_KEY;
  if (!configured || configured.length < 32)
    throw new MobileError("Configure MOBILE_ADMIN_KEY no servidor.", 503);
  if (!equal(request.headers.get("x-mobile-admin-key") ?? "", configured))
    throw new MobileError("Chave da equipe inválida.", 401);
}

export async function lerBody(
  request: Request,
): Promise<Record<string, unknown>> {
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 8192)
    throw new MobileError("Requisição muito grande.", 413);
  try {
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error();
    return body;
  } catch {
    throw new MobileError("JSON inválido.");
  }
}

export function texto(value: unknown, max: number, label: string): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new MobileError(`${label} inválido.`);
  return value.trim();
}

export function respostaErro(error: unknown): Response {
  if (error instanceof MobileError)
    return Response.json({ error: error.message }, { status: error.status });
  console.error(
    "[mobile]",
    error instanceof Error ? error.message : "Erro inesperado",
  );
  return Response.json(
    { error: "Não foi possível concluir. Tente novamente." },
    { status: 500 },
  );
}
