import type { Perfil, Moradia, Area, Experiencia, Orcamento, ServicoSugerido } from '@/types/perfil'
import type { Produto, Complexidade } from '@/types/produto'

// Motor de pontuação da "entrevista guiada" (perfil do cliente -> sugestões de produto).
// As tabelas abaixo (faixas de preço, complexidade, moradia) foram calibradas contra a
// DISTRIBUIÇÃO REAL de data/produtos.json, não contra o range teórico dos tipos TypeScript.
// Ex.: Complexidade permite 6 valores no tipo, mas o gerador de mock só emite 3 deles
// (DIY/Profissional/Especialista); um bug real já aconteceu aqui por assumir os 6.
// Antes de mudar qualquer faixa/mapeamento, reaudite a distribuição real do campo em
// data/produtos.json (ex.: `node -e "..."` contando valores) — não assuma pelo tipo.
export const AREA_PARA_CATEGORIAS: Record<Area, string[]> = {
  'Cozinha': ['Pisos e Cerâmica', 'Hidráulica', 'Elétrica', 'Iluminação'],
  'Banheiro': ['Banheiro', 'Hidráulica', 'Pisos e Cerâmica'],
  'Quarto': ['Decoração', 'Iluminação', 'Pintura'],
  'Sala': ['Decoração', 'Iluminação', 'Pintura'],
  'Jardim ou área externa': ['Jardim', 'Construção'],
  'Elétrica': ['Elétrica', 'Ferramentas'],
  'Iluminação': ['Iluminação'],
  'Pintura': ['Pintura'],
}

export const MORADIA_PARA_CATEGORIAS: Record<Moradia, string[]> = {
  'Casa': ['Jardim', 'Construção'],
  'Apartamento': ['Decoração', 'Iluminação'],
  'Sítio ou chácara': ['Jardim', 'Construção'],
  'Comércio': ['Elétrica', 'Iluminação', 'Pintura'],
}

export const EXPERIENCIA_PARA_COMPLEXIDADE: Record<Experiencia, Complexidade[]> = {
  'Iniciante': ['DIY'],
  'Intermediário': ['DIY', 'Profissional'],
  'Avançado': ['Profissional', 'Especialista'],
  'Prefiro contratar um profissional': ['DIY', 'Profissional', 'Especialista'],
}

export const ORCAMENTO_PARA_FAIXA: Record<Orcamento, [number, number]> = {
  'Até R$100': [0, 100],
  'R$100–300': [100, 300],
  'R$300–600': [300, 600],
  'Acima de R$600': [600, Infinity],
}

export function pontuarProduto(produto: Produto, perfil: Perfil): number {
  let pontos = 0
  if (MORADIA_PARA_CATEGORIAS[perfil.moradia].includes(produto.categoria)) pontos += 1
  if (EXPERIENCIA_PARA_COMPLEXIDADE[perfil.experiencia].includes(produto.complexidade)) pontos += 2
  const [min, max] = ORCAMENTO_PARA_FAIXA[perfil.orcamento]
  if (produto.preco >= min && produto.preco <= max) pontos += 1
  if (perfil.sustentabilidade === 'Muito importante' && (produto.sustentabilidade === 'Prata' || produto.sustentabilidade === 'Ouro')) pontos += 1
  if (produto.estoque > 0) pontos += 1
  return pontos
}

export function sugerirServicos(perfil: Perfil): ServicoSugerido[] {
  const servicos: ServicoSugerido[] = []
  if (perfil.experiencia === 'Prefiro contratar um profissional') {
    servicos.push({
      titulo: 'Agendar visita com especialista',
      descricao: 'Um consultor avalia seu projeto pessoalmente, sem custo.',
      href: '/agendamento',
    })
  }
  if (perfil.experiencia === 'Iniciante') {
    servicos.push({
      titulo: 'Tire suas dúvidas com a IA',
      descricao: 'Pergunte sobre materiais e técnicas antes de comprar.',
      href: '/duvidas',
    })
  }
  if (perfil.areas.length >= 2) {
    servicos.push({
      titulo: 'Monte um Projeto Guiado',
      descricao: 'Lista de materiais completa pra reformar mais de um cômodo de uma vez.',
      href: '/projeto',
    })
  }
  return servicos
}
