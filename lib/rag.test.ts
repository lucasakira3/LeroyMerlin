import { describe, expect, it } from 'vitest'
import { medidasConflitam } from './rag'

describe('medidasConflitam', () => {
  it('fio de bitola diferente não serve (6mm² pedido, loja com 1,5mm²)', () => {
    expect(medidasConflitam('Fio Flexível 6,0mm² 750V', 'Cabo Flexível 1.5mm² 750V Rolo 100m')).toBe(true)
    expect(medidasConflitam('Fio Flexível 6,0mm² 750V', 'Cabo Flexível 4mm² 750V Azul Sil')).toBe(true)
  })

  it('mesma bitola serve, com vírgula ou ponto e com ou sem o ² no material', () => {
    expect(medidasConflitam('Fio Flexível 2,5mm²', 'Cabo Flexível 2.5mm² 750V Rolo 100m')).toBe(false)
    expect(medidasConflitam('Fio Flexível 2,5mm', 'Cabo Flexível 2.5mm² 750V Rolo 100m')).toBe(false)
    expect(medidasConflitam('Fio Flexível 2,5mm', 'Cabo Flexível 1.5mm² 750V Rolo 100m')).toBe(true)
  })

  it('corrente, tensão e potência diferentes não servem', () => {
    expect(medidasConflitam('Disjuntor 20A', 'Disjuntor Bipolar 32A Pial Legrand')).toBe(true)
    expect(medidasConflitam('Disjuntor 20A', 'Disjuntor Bipolar 20A Schneider')).toBe(false)
    expect(medidasConflitam('Chuveiro Elétrico 7500W 220V', 'Chuveiro Elétrico 5500W 110V Lorenzetti')).toBe(true)
  })

  it('produto sem a medida pedida não serve (DR e quadro não substituem disjuntor de 40A)', () => {
    expect(medidasConflitam('Disjuntor Bipolar 40A', 'Disjuntor Diferencial Residual 30mA Schneider')).toBe(true)
    expect(medidasConflitam('Disjuntor Bipolar 40A', 'Quadro de Distribuição 12 Disjuntores Schneider')).toBe(true)
  })

  it('material sem medida elétrica, ou medidas que não são elétricas, não bloqueiam', () => {
    expect(medidasConflitam('Disjuntor DR', 'Disjuntor Diferencial Residual 30mA Schneider')).toBe(false)
    expect(medidasConflitam('Tinta Acrílica Fosca Branca 3,6L', 'Tinta Látex Acrílica Fosca 18L Coral')).toBe(false)
    expect(medidasConflitam('Fita Crepe 48mm', 'Fita Crepe 18mm x 50m para Pintura')).toBe(false)
    expect(medidasConflitam('Bucha 6mm com Parafuso', 'Parafuso Ancla Fixação Parede Concreto 6x50mm')).toBe(false)
  })
})
