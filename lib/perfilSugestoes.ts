import type { Perfil, Area, Experiencia, Orcamento, ServicoSugerido } from '@/types/perfil'
import type { Produto, Complexidade } from '@/types/produto'

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

export const EXPERIENCIA_PARA_COMPLEXIDADE: Record<Experiencia, Complexidade[]> = {
  'Iniciante': ['Baixa', 'DIY'],
  'Intermediário': ['Baixa', 'DIY', 'Média'],
  'Avançado': ['Média', 'Alta', 'Profissional', 'Especialista'],
  'Prefiro contratar um profissional': ['Baixa', 'DIY', 'Média'],
}

export const ORCAMENTO_PARA_FAIXA: Record<Orcamento, [number, number]> = {
  'Até R$500': [0, 500],
  'R$500–2.000': [500, 2000],
  'R$2.000–5.000': [2000, 5000],
  'Acima de R$5.000': [5000, Infinity],
}

export function pontuarProduto(produto: Produto, perfil: Perfil): number {
  let pontos = 0
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
