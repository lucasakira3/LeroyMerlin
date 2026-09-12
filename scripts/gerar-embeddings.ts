import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });

const PRODUTOS_PATH = path.join(process.cwd(), "data", "produtos.json");
const EMBEDDINGS_PATH = path.join(process.cwd(), "data", "embeddings.json");
const DELAY_MS = 650;      // 650ms = ~92 req/min, dentro do limite free (100 rpm)
const SALVAR_A_CADA = 50;
const CASAS_DECIMAIS = 6;  // mesma precisão usada na migração que separou embeddings.json

interface ProdutoLean {
  id: string;
  produto: string;
  pergunta: string;
  resposta_ia: string;
  embedding_text: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function arredondar(vetor: number[]): number[] {
  const fator = 10 ** CASAS_DECIMAIS;
  return vetor.map((v) => Math.round(v * fator) / fator);
}

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

  // data/produtos.json não tem mais `embedding` (ver [[project-backlog]] — o vetor sozinho
  // era ~98% do peso do arquivo antigo) — só lido aqui pelo texto a embeddar. O vetor em si
  // vive em data/embeddings.json, um mapa `{ id: number[] }` separado, arredondado a 6 casas
  // decimais (cosseno não perde precisão perceptível, e cada casa a menos economiza espaço).
  const raw = readFileSync(PRODUTOS_PATH, "utf-8");
  const cleaned = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
  const produtos = JSON.parse(cleaned) as ProdutoLean[];

  let embeddings: Record<string, number[]> = {};
  if (existsSync(EMBEDDINGS_PATH)) {
    embeddings = JSON.parse(readFileSync(EMBEDDINGS_PATH, "utf-8"));
  }

  const pendentes = produtos.filter((p) => !embeddings[p.id] || embeddings[p.id].length === 0);
  const total = produtos.length;

  console.log(`Total: ${total} | Pendentes: ${pendentes.length} | ~${Math.ceil(pendentes.length * DELAY_MS / 60000)} min\n`);

  if (pendentes.length === 0) {
    console.log("Todos os produtos já têm embedding.");
    return;
  }

  let processados = 0;

  for (let i = 0; i < produtos.length; i++) {
    const p = produtos[i];
    if (embeddings[p.id]?.length > 0) continue;

    const num = String(i + 1).padStart(String(total).length, "0");
    process.stdout.write(`[${num}/${total}] ${p.id}... `);

    try {
      const texto = p.embedding_text || `${p.produto} — ${p.pergunta} ${p.resposta_ia}`;
      embeddings[p.id] = arredondar(await gerarEmbedding(apiKey, texto));
      processados++;
      process.stdout.write("✓\n");
    } catch (e) {
      process.stdout.write(`✗ ${e}\n`);
    }

    await sleep(DELAY_MS);

    if (processados > 0 && processados % SALVAR_A_CADA === 0) {
      writeFileSync(EMBEDDINGS_PATH, JSON.stringify(embeddings), "utf-8");
      console.log(`  → ${processados} salvos`);
    }
  }

  writeFileSync(EMBEDDINGS_PATH, JSON.stringify(embeddings), "utf-8");
  console.log(`\nConcluído: ${processados} embeddings gerados.`);
}

main().catch(console.error);
