import type {
  ProdutoMobile,
  ProjetoMobile,
  SessaoMobile,
  ChamadoMobile,
} from "../../types/mobile";
import type {
  SearchResponse,
  VisionResponse,
  DiagnosticoVisualResponse,
} from "../../types/produto";
import demo from "./data/catalogo-demo.json";

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(
  /\/$/,
  "",
);
export const catalogoDemo = demo as ProdutoMobile[];
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}
export async function request<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string;
    timeout?: number;
  } = {},
): Promise<T> {
  if (!API_URL)
    throw new ApiError(
      "O servidor ainda não foi configurado. Você pode explorar o catálogo offline.",
    );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout ?? 25000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    });
    const data = await response.json();
    if (!response.ok)
      throw new ApiError(
        data.error ?? "Não foi possível concluir a solicitação.",
        response.status,
      );
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Não conseguimos conectar ao servidor. Confira sua conexão e tente novamente.",
    );
  } finally {
    clearTimeout(timer);
  }
}
export const api = {
  buscar: (query: string) =>
    request<SearchResponse>("/api/search", {
      method: "POST",
      body: { query, limit: 12 },
    }),
  produto: (id: string) =>
    request<ProdutoMobile>(`/api/produto/${encodeURIComponent(id)}`),
  foto: (image: string, problema: boolean) =>
    request<VisionResponse | DiagnosticoVisualResponse>(
      problema ? "/api/diagnostico-visual" : "/api/vision",
      {
        method: "POST",
        body: { image, mimeType: "image/jpeg" },
        timeout: 60000,
      },
    ),
  projeto: (descricao: string) =>
    request<ProjetoMobile>("/api/projeto", {
      method: "POST",
      body: { descricao },
      timeout: 90000,
    }),
  sessao: (nome: string) =>
    request<SessaoMobile>("/api/mobile/sessao", {
      method: "POST",
      body: { nome },
    }),
  chamados: (token: string) =>
    request<ChamadoMobile[]>("/api/mobile/chamados", { token }),
  ajuda: (produtoId: string, token: string) =>
    request<ChamadoMobile>("/api/mobile/chamados", {
      method: "POST",
      body: { produtoId },
      token,
    }),
};
export function mensagemErro(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Algo deu errado. Tente novamente.";
}
export function buscaOffline(query: string): ProdutoMobile[] {
  const normalize = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return catalogoDemo.filter((p) =>
    words.every((word) =>
      normalize(`${p.produto} ${p.categoria} ${p.tags.join(" ")}`).includes(
        word,
      ),
    ),
  );
}
