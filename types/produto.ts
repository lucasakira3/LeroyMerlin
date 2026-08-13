// types/produto.ts

export type Complexidade =
  | "Baixa"
  | "Média"
  | "Alta"
  | "DIY"
  | "Profissional"
  | "Especialista";

export type SustentabilidadeScore = "N/A" | "Bronze" | "Prata" | "Ouro";

export interface Produto {
  id: string;                        // "LM-0042" — id_referencia do CSV
  categoria: string;                  // "Cerâmica"
  produto: string;                    // "Porcelanato Acetinado 60x60cm"
  pergunta: string;                   // pergunta_cliente do CSV
  resposta_ia: string;                // contexto_resposta_ia do CSV
  corredor: string;                   // "Corredor 08" — exibido na UI
  corredor_normalizado: string;       // "corredor-08" — slug para URLs
  complexidade: Complexidade;
  especificacoes: string;             // especificacao_tecnica do CSV
  tags: string[];                     // array de tags (split por vírgula no CSV)
  estoque: number;                    // estoque_num como inteiro
  preco: number;                      // preço em BRL
  sustentabilidade: SustentabilidadeScore;
  embedding: number[];                // vetor 768 dimensões (text-embedding-004); [] antes de gerar
  embedding_text: string;             // "{produto} — {pergunta} {resposta_ia}"
}

export interface SearchResult {
  produto: Omit<Produto, "embedding" | "embedding_text">; // não expor vetores na UI
  score: number; // cosine similarity [0.0, 1.0]
}

export interface SearchRequest {
  query: string;   // linguagem natural do usuário
  limit?: number;  // default: 5, max: 20
}

export interface SearchResponse {
  resultados: SearchResult[];
  total: number;
  query_processada: string;
}

export interface VisionRequest {
  image: string; // base64 da imagem (sem prefixo data:image/...)
}

export interface VisionResponse {
  descricao_identificada: string;
  resultados: SearchResult[];
  total: number;
}

export interface DiagnosticoVisualRequest {
  image: string; // base64 da imagem (sem prefixo data:image/...)
  mimeType?: string;
}

export interface DiagnosticoItem {
  nome_busca: string;   // termo específico e buscável, ex: "Vedante para torneira"
  motivo: string;       // por que esse item ajuda a resolver o problema
  resultados: SearchResult[]; // produtos reais do catálogo cruzados com nome_busca
}

export interface DiagnosticoVisualResponse {
  problema_identificado: boolean;
  diagnostico: string;              // explicação em linguagem simples do que a IA viu
  itens_sugeridos: DiagnosticoItem[];
  resultados: SearchResult[];       // lista achatada e sem duplicatas, pronta pro mapa da loja
  total: number;
}
