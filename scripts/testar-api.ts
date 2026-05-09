import path from "path";
import { config } from "dotenv";
config({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { console.error("Sem API key"); process.exit(1); }

  console.log("Testando embedding da query...");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: { parts: [{ text: "torneira para banheiro" }] } }),
    }
  );

  if (res.ok) {
    const data = await res.json();
    console.log(`✓ Funcionando! Embedding tem ${data.embedding.values.length} dimensões.`);
  } else {
    const err = await res.json();
    console.log(`✗ Erro ${res.status}: ${err.error?.message}`);
  }
}

main();
