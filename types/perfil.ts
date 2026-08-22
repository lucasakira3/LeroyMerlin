export type Moradia = 'Casa' | 'Apartamento' | 'Sítio ou chácara' | 'Comércio'

export type Experiencia = 'Iniciante' | 'Intermediário' | 'Avançado' | 'Prefiro contratar um profissional'

export type Area =
  | 'Cozinha' | 'Banheiro' | 'Quarto' | 'Sala'
  | 'Jardim ou área externa' | 'Elétrica' | 'Iluminação' | 'Pintura'

export type Orcamento = 'Até R$500' | 'R$500–2.000' | 'R$2.000–5.000' | 'Acima de R$5.000'

export type SustentabilidadePreferencia = 'Pouco importante' | 'Importante, mas não decisivo' | 'Muito importante'

export interface Perfil {
  moradia: Moradia
  experiencia: Experiencia
  areas: Area[]
  orcamento: Orcamento
  sustentabilidade: SustentabilidadePreferencia
  respondidoEm: string
}

export interface ServicoSugerido {
  titulo: string
  descricao: string
  href: string
}
