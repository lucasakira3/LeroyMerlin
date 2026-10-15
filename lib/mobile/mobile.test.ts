import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { criarSessao, autenticarVisitante, autenticarEquipe } from "./auth";

vi.mock("@/lib/produtos", () => ({
  carregarProdutos: async () => [
    { id: "LM-0001", produto: "Furadeira", corredor: "Corredor 03" },
    { id: "LM-0002", produto: "Parafuso", corredor: "Corredor 04" },
  ],
}));
vi.mock("./push", () => ({ notificarChamado: vi.fn(async () => null) }));
let temp: string;
let routes: typeof import("../../app/api/mobile/chamados/route");
let team: typeof import("../../app/api/mobile/equipe/route");
const adminKey = "equipe-teste-chave-isolada-com-mais-de-32-caracteres";
function visitor(token: string, body?: unknown) {
  return new Request("http://localhost/api/mobile/chamados", {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
beforeAll(async () => {
  temp = await mkdtemp(path.join(tmpdir(), "leroy-mobile-test-"));
  vi.stubEnv(
    "MOBILE_SESSION_SECRET",
    "segredo-teste-aleatorio-com-mais-de-32-caracteres",
  );
  vi.stubEnv("MOBILE_ADMIN_KEY", adminKey);
  vi.stubEnv("MOBILE_STORAGE", "file");
  vi.stubEnv("SUPABASE_URL", "");
  vi.stubEnv("SUPABASE_SECRET_KEY", "");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  vi.spyOn(process, "cwd").mockReturnValue(temp);
  routes = await import("../../app/api/mobile/chamados/route");
  team = await import("../../app/api/mobile/equipe/route");
});
afterAll(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await rm(temp, { recursive: true, force: true });
});

describe("sessão mobile e autorização", () => {
  it("recusa token adulterado e chave da equipe incorreta", () => {
    const session = criarSessao("Visitante");
    expect(autenticarVisitante(visitor(session.token)).id).toBe(session.id);
    expect(() => autenticarVisitante(visitor(`${session.token}x`))).toThrow(
      "Sessão inválida",
    );
    expect(() => autenticarEquipe(new Request("http://localhost"))).toThrow(
      "Chave da equipe inválida",
    );
  });
  it("recusa sessões expiradas", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const session = criarSessao("Visitante");
    vi.mocked(Date.now).mockReturnValue(now + 8 * 24 * 60 * 60 * 1000);
    expect(() => autenticarVisitante(visitor(session.token))).toThrow(
      "Sessão expirada",
    );
    vi.mocked(Date.now).mockRestore();
  });
});
describe("atendimento entre dispositivos", () => {
  it("persiste o chamado, isola visitantes e permite atualização somente pela equipe", async () => {
    const alice = criarSessao("Alice");
    const bob = criarSessao("Bob");
    const created = await routes.POST(
      visitor(alice.token, {
        produtoId: "LM-0001",
        corredor: "inventado",
        clienteNome: "inventado",
      }),
    );
    expect(created.status).toBe(201);
    const chamado = await created.json();
    expect(chamado).toMatchObject({
      clienteNome: "Alice",
      corredor: "Corredor 03",
      status: "pendente",
    });
    const duplicate = await routes.POST(
      visitor(alice.token, { produtoId: "LM-0001" }),
    );
    expect((await duplicate.json()).id).toBe(chamado.id);
    expect(await (await routes.GET(visitor(bob.token))).json()).toEqual([]);
    const unauthorized = await team.PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: chamado.id, status: "atendido" }),
      }),
    );
    expect(unauthorized.status).toBe(401);
    const changed = await team.PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-mobile-admin-key": adminKey,
        },
        body: JSON.stringify({ id: chamado.id, status: "a_caminho" }),
      }),
    );
    expect(changed.status).toBe(200);
    const list = await (await routes.GET(visitor(alice.token))).json();
    expect(list[0].status).toBe("a_caminho");
  });
  it("recusa produto inexistente, JSON inválido e requisição sem sessão", async () => {
    expect((await routes.GET(new Request("http://localhost"))).status).toBe(
      401,
    );
    const session = criarSessao("Visitante");
    expect(
      (await routes.POST(visitor(session.token, { produtoId: "desconhecido" })))
        .status,
    ).toBe(404);
    const invalid = new Request("http://localhost", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.token}` },
      body: "{",
    });
    expect((await routes.POST(invalid)).status).toBe(400);
  });
});
