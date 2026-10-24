import type { Produto } from "@/types/produto";

// Formato que o Google recomenda pro gemini-embedding-2 em busca — esse modelo não aceita o
// campo task_type, a instrução vai no próprio texto (https://ai.google.dev/gemini-api/docs/embeddings):
//   - a pergunta do cliente: "task: search result | query: <pergunta>" (comoBusca);
//   - cada produto: "title: <nome> | text: <descrição>" (textoDoProdutoParaVetor).
// Os DOIS lados precisam seguir o formato, senão as notas não se comparam. Adotado em
// 24/10/2026: antes os vetores eram só "nome — pergunta-exemplo", sem formato, e "cortar
// azulejo" trazia telha, "lâmpada econômica" trazia pendente, "cola para madeira" trazia
// tinta spray. As notas subiram ~0.05 com o formato; os limites que dependem delas
// (lib/rag.ts, CalculadoraMateriais, alternativa sem estoque) foram recalibrados juntos.
export function comoBusca(consulta: string): string {
  return `task: search result | query: ${consulta}`;
}

export function textoDoProdutoParaVetor(
  p: Pick<Produto, "produto" | "categoria" | "pergunta" | "resposta_ia" | "tags">
): string {
  return `title: ${p.produto} | text: ${p.categoria}. ${p.pergunta} ${p.resposta_ia} Palavras-chave: ${p.tags.join(", ")}.`;
}

// Usa API v1beta com body correto (sem campo "model" no body — apenas na URL)
export async function gerarEmbedding(texto: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: texto }] },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `Erro HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.embedding.values as number[];
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}
