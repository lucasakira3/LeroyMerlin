import { readFile } from "fs/promises";
import path from "path";
import type { Produto } from "@/types/produto";

let cache: Produto[] | null = null;

export async function carregarProdutos(): Promise<Produto[]> {
  if (cache !== null) {
    return cache;
  }

  const filePath = path.join(process.cwd(), "data", "produtos.json");
  const raw = await readFile(filePath, "utf-8");
  // Remove BOM (byte-order mark) que o Windows pode adicionar ao JSON
  const cleaned = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
  const dados = JSON.parse(cleaned) as Produto[];

  cache = dados;
  return cache;
}
