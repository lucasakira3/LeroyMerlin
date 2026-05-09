import path from "path";
import { config } from "dotenv";
config({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { console.error("GEMINI_API_KEY não configurada"); process.exit(1); }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  const data = await res.json();

  const embedding = (data.models || []).filter((m: any) =>
    m.supportedGenerationMethods?.includes("embedContent")
  );

  console.log("Modelos com suporte a embedContent:");
  embedding.forEach((m: any) => console.log(" -", m.name));
}

main();
