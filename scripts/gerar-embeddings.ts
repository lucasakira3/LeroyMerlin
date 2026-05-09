import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });

import type { Produto } from "../types/produto";

const PRODUTOS_PATH = path.join(process.cwd(), "data", "produtos.json");
const DELAY_MS = 650;      // 650ms = ~92 req/min, dentro do limite free (100 rpm)
const SALVAR_A_CADA = 50;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function gerarEmbedding(apiKey: string, texto: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: { parts: [{ text: texto }] } }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.embedding.values as number[];
}

async function main(): Promise<void> {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY não configurada em .env.local");
    process.exit(1);
  }
  const apiKey = process.env.GEMINI_API_KEY;

  const raw = readFileSync(PRODUTOS_PATH, "utf-8");
  const cleaned = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
  const produtos = JSON.parse(cleaned) as Produto[];

  const pendentes = produtos.filter((p) => !p.embedding || p.embedding.length === 0);
  const total = produtos.length;

  console.log(`Total: ${total} | Pendentes: ${pendentes.length} | ~${Math.ceil(pendentes.length * DELAY_MS / 60000)} min\n`);

  if (pendentes.length === 0) {
    console.log("Todos os produtos já têm embedding.");
    return;
  }

  let processados = 0;

  for (let i = 0; i < produtos.length; i++) {
    const p = produtos[i];
    if (p.embedding && p.embedding.length > 0) continue;

    const num = String(i + 1).padStart(String(total).length, "0");
    process.stdout.write(`[${num}/${total}] ${p.id}... `);

    try {
      const texto = p.embedding_text || `${p.produto} — ${p.pergunta} ${p.resposta_ia}`;
      produtos[i] = { ...p, embedding: await gerarEmbedding(apiKey, texto) };
      processados++;
      process.stdout.write("✓\n");
    } catch (e) {
      process.stdout.write(`✗ ${e}\n`);
    }

    await sleep(DELAY_MS);

    if (processados > 0 && processados % SALVAR_A_CADA === 0) {
      writeFileSync(PRODUTOS_PATH, JSON.stringify(produtos, null, 2), "utf-8");
      console.log(`  → ${processados} salvos`);
    }
  }

  writeFileSync(PRODUTOS_PATH, JSON.stringify(produtos, null, 2), "utf-8");
  console.log(`\nConcluído: ${processados} embeddings gerados.`);
}

main().catch(console.error);
