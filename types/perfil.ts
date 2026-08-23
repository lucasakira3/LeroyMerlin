export type Moradia = 'Casa' | 'Apartamento' | 'Sítio ou chácara' | 'Comércio'

export type Experiencia = 'Iniciante' | 'Intermediário' | 'Avançado' | 'Prefiro contratar um profissional'

export type Area =
  | 'Cozinha' | 'Banheiro' | 'Quarto' | 'Sala'
  | 'Jardim ou área externa' | 'Elétrica' | 'Iluminação' | 'Pintura'

export type Orcamento = 'Até R$100' | 'R$100–300' | 'R$300–600' | 'Acima de R$600'

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
