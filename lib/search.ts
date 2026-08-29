import { gerarEmbedding, cosineSimilarity } from "./embeddings";
import { carregarProdutos } from "./produtos";
import type { Produto, SearchResult } from "@/types/produto";

// Fallback quando não há embeddings (cota da API esgotada, ou produto novo sem
// embedding ainda gerado): pontua por fração de termos da query encontrados nos
// campos de texto do produto — mais simples que busca semântica, mas não depende de rede.
function buscaTexto(produtos: Produto[], query: string, limit: number): SearchResult[] {
  const termos = query.toLowerCase().split(/\s+/).filter(Boolean);

  return produtos
    .map((produto) => {
      const haystack = [
        produto.produto,
        produto.categoria,
        produto.pergunta,
        produto.resposta_ia,
        produto.tags.join(" "),
        produto.corredor,
      ].join(" ").toLowerCase();

      const matches = termos.filter((t) => haystack.includes(t)).length;
      const score = matches / termos.length;

      const { embedding: _e, embedding_text: _et, ...produtoPublico } = produto;
      return { produto: produtoPublico, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(limit, 20));
}

// Ponto de entrada único da busca de produto usado por texto, imagem (vision) e
// diagnóstico visual — todos convergem pra cá depois de virar uma string de busca.
export async function buscarProdutos(
  query: string,
  limit: number
): Promise<SearchResult[]> {
  const produtos = await carregarProdutos();
  // Nem todo produto tem embedding real (alguns bateram no limite diário da API na geração
  // do catálogo) — filtra pra só considerar os que têm, senão a similaridade de coseno
  // comparando contra um vetor vazio distorceria o ranking.
  const produtosComEmbedding = produtos.filter((p) => p.embedding && p.embedding.length > 0);

  // Tenta busca semântica; se a API falhar, usa busca por texto
  if (produtosComEmbedding.length > 0) {
    try {
      const queryEmbedding = await gerarEmbedding(query);
      const resultados: SearchResult[] = produtosComEmbedding.map((produto) => {
        const score = cosineSimilarity(queryEmbedding, produto.embedding);
        const { embedding: _e, embedding_text: _et, ...produtoPublico } = produto;
        return { produto: produtoPublico, score };
      });
      resultados.sort((a, b) => b.score - a.score);
      return resultados.slice(0, Math.min(limit, 20));
    } catch {
      // API indisponível (cota, erro de rede) — cai no fallback
    }
  }

  return buscaTexto(produtos, query, limit);
}
