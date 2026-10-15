import type { SearchResult } from "./produto";

export type ProdutoMobile = SearchResult["produto"];
export type StatusAjudaMobile = "pendente" | "a_caminho" | "atendido";
export interface SessaoMobile {
  id: string;
  nome: string;
  token: string;
  expiraEm: number;
}
export interface ChamadoMobile {
  id: string;
  sessaoId: string;
  clienteNome: string;
  produtoId: string;
  produtoNome: string;
  corredor: string;
  status: StatusAjudaMobile;
  mensagem: string;
  criadoEm: string;
  atualizadoEm: string;
}
export interface ProjetoMobile {
  titulo: string;
  resumo: string;
  orcamento_estimado: string;
  dica_especialista: string;
  etapas?: { ordem: number; nome: string; instrucoes: string }[];
  itens: {
    material: string;
    quantidade: string;
    observacao: string;
    etapa_ordem: number;
    etapa_nome: string;
    resultados: SearchResult[];
  }[];
}
