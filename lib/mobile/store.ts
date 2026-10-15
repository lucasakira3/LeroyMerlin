import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { MobileError } from "./auth";
import type { ChamadoMobile, StatusAjudaMobile } from "@/types/mobile";

// Supabase é usado somente pelo servidor. RLS bloqueia o acesso público às tabelas.
// O arquivo é uma conveniência para UM processo de desenvolvimento, nunca produção.
interface LocalData {
  chamados: ChamadoMobile[];
  dispositivos: Record<string, string>;
}
const file = path.join(process.cwd(), ".mobile-data", "atendimento.json");
let queue: Promise<unknown> = Promise.resolve();

function useDatabase(): boolean {
  if (
    process.env.SUPABASE_URL &&
    (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
  )
    return true;
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.MOBILE_STORAGE === "file"
  )
    return false;
  throw new MobileError(
    "Configure o banco mobile no servidor. Em desenvolvimento, use MOBILE_STORAGE=file.",
    503,
  );
}

async function database<T>(
  table: string,
  query: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const key =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const response = await fetch(
    `${process.env.SUPABASE_URL!.replace(/\/$/, "")}/rest/v1/${table}${query}`,
    {
      method,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      headers: {
        apikey: key,
        // As chaves sb_secret não são JWTs. A autenticação delas usa apikey.
        ...(key.startsWith("sb_secret_")
          ? {}
          : { Authorization: `Bearer ${key}` }),
        "Content-Type": "application/json",
        Prefer: "return=representation,resolution=merge-duplicates",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );
  if (!response.ok)
    throw new MobileError(
      "Banco mobile indisponível. Confira as variáveis e execute o SQL de configuração.",
      503,
    );
  return (await response.json()) as T;
}

async function local<T>(
  operation: (data: LocalData) => T,
  write = false,
): Promise<T> {
  const task = queue.then(async () => {
    let data: LocalData;
    try {
      data = JSON.parse(await readFile(file, "utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      data = { chamados: [], dispositivos: {} };
    }
    const result = operation(data);
    if (write) {
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(`${file}.tmp`, JSON.stringify(data), "utf8");
      await rename(`${file}.tmp`, file);
    }
    return result;
  });
  queue = task.catch(() => undefined);
  return task;
}

export async function listarChamados(
  sessaoId?: string,
): Promise<ChamadoMobile[]> {
  if (useDatabase())
    return database(
      "mobile_chamados",
      `?select=*&order=criadoEm.desc&limit=100${sessaoId ? `&sessaoId=eq.${encodeURIComponent(sessaoId)}` : ""}`,
    );
  return local((data) =>
    data.chamados
      .filter((c) => !sessaoId || c.sessaoId === sessaoId)
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
      .slice(0, 100),
  );
}

export async function salvarChamado(
  chamado: ChamadoMobile,
): Promise<ChamadoMobile> {
  if (useDatabase()) {
    const result = await database<ChamadoMobile[]>(
      "mobile_chamados",
      "",
      "POST",
      chamado,
    );
    return result[0];
  }
  return local((data) => {
    data.chamados.push(chamado);
    return chamado;
  }, true);
}

export async function atualizarChamado(
  id: string,
  status: StatusAjudaMobile,
  mensagem: string,
): Promise<ChamadoMobile> {
  const changes = { status, mensagem, atualizadoEm: new Date().toISOString() };
  if (useDatabase()) {
    const result = await database<ChamadoMobile[]>(
      "mobile_chamados",
      `?id=eq.${encodeURIComponent(id)}`,
      "PATCH",
      changes,
    );
    if (!result[0]) throw new MobileError("Chamado não encontrado.", 404);
    return result[0];
  }
  return local((data) => {
    const chamado = data.chamados.find((c) => c.id === id);
    if (!chamado) throw new MobileError("Chamado não encontrado.", 404);
    Object.assign(chamado, changes);
    return chamado;
  }, true);
}

export async function registrarDispositivo(
  sessaoId: string,
  token: string,
): Promise<void> {
  if (useDatabase()) {
    await database("mobile_dispositivos", "?on_conflict=sessaoId", "POST", {
      sessaoId,
      token,
    });
    return;
  }
  await local((data) => {
    data.dispositivos[sessaoId] = token;
  }, true);
}

export async function tokenDispositivo(
  sessaoId: string,
): Promise<string | null> {
  if (useDatabase()) {
    const result = await database<{ token: string }[]>(
      "mobile_dispositivos",
      `?sessaoId=eq.${encodeURIComponent(sessaoId)}&select=token`,
    );
    return result[0]?.token ?? null;
  }
  return local((data) => data.dispositivos[sessaoId] ?? null);
}
