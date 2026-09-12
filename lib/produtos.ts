import { readFile } from "fs/promises";
import path from "path";
import type { Produto } from "@/types/produto";

// Catálogo "enxuto": data/produtos.json não guarda mais `embedding` (ver [[project-backlog]]
// — o vetor sozinho era ~98% do peso do arquivo). `carregarProdutos()` é o que a maioria das
// rotas usa (categoria, preço, estoque etc.) e nunca precisou do vetor pra nada — devolve
// `embedding: []` pra manter o tipo `Produto` intacto sem custar o parse de ~27mb à toa em
// toda chamada de API. Cache em memória do módulo: o catálogo só é lido do disco uma vez por
// processo do servidor. Reseta sozinho quando o servidor reinicia (dev ou deploy).
let cache: Produto[] | null = null;

export async function carregarProdutos(): Promise<Produto[]> {
  if (cache !== null) {
    return cache;
  }

  const filePath = path.join(process.cwd(), "data", "produtos.json");
  const raw = await readFile(filePath, "utf-8");
  // Remove BOM (byte-order mark) que o Windows pode adicionar ao JSON
  const cleaned = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
  const dados = JSON.parse(cleaned) as Omit<Produto, "embedding">[];

  cache = dados.map((p) => ({ ...p, embedding: [] }));
  return cache;
}

let cacheComEmbeddings: Produto[] | null = null;

// Só pra quem de fato compara vetores — hoje só lib/search.ts (busca semântica) e
// /api/produto/[id]/alternativa (compara produto original x candidatos). Junta o catálogo
// enxuto acima com data/embeddings.json (arquivo separado, `{ id: number[] }`,
// arredondado a 6 casas decimais na geração — ver scripts/gerar-embeddings.ts). Cache
// próprio, não reaproveita o de carregarProdutos(): são objetos diferentes (embedding real
// vs `[]`), misturar os dois caches criaria uma referência compartilhada incorreta.
export async function carregarProdutosComEmbeddings(): Promise<Produto[]> {
  if (cacheComEmbeddings !== null) {
    return cacheComEmbeddings;
  }

  const produtos = await carregarProdutos();
  const embPath = path.join(process.cwd(), "data", "embeddings.json");
  const raw = await readFile(embPath, "utf-8");
  const cleaned = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
  const embeddings = JSON.parse(cleaned) as Record<string, number[]>;

  cacheComEmbeddings = produtos.map((p) => ({ ...p, embedding: embeddings[p.id] ?? [] }));
  return cacheComEmbeddings;
}
