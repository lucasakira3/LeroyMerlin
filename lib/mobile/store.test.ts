import { afterEach, describe, expect, it, vi } from "vitest";
import { listarChamados } from "./store";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("autenticação do backend no Supabase", () => {
  it("usa a chave secreta moderna em apikey, sem enviá-la como JWT", async () => {
    vi.stubEnv("SUPABASE_URL", "https://projeto-teste.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_chave_ficticia_do_teste");
    const fetchMock = vi.fn(async () => Response.json([]));
    vi.stubGlobal("fetch", fetchMock);
    await listarChamados("visitante-teste");
    const [url, options] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toContain("sessaoId=eq.visitante-teste");
    const headers = new Headers(options.headers);
    expect(headers.get("apikey")).toBe("sb_secret_chave_ficticia_do_teste");
    expect(headers.has("Authorization")).toBe(false);
  });
  it("preserva o suporte à chave JWT legada", async () => {
    vi.stubEnv("SUPABASE_URL", "https://projeto-teste.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "jwt-ficticio-do-teste");
    const fetchMock = vi.fn(async () => Response.json([]));
    vi.stubGlobal("fetch", fetchMock);
    await listarChamados();
    const [, options] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(new Headers(options.headers).get("Authorization")).toBe(
      "Bearer jwt-ficticio-do-teste",
    );
  });
  it("recusa armazenamento local em produção quando o banco não está configurado", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MOBILE_STORAGE", "file");
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    await expect(listarChamados()).rejects.toMatchObject({ status: 503 });
  });
});
