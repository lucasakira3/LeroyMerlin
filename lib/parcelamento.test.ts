import { describe, it, expect } from 'vitest'
import { getParcelamento, getOpcoesParcelamento, formatarParcelamento } from './parcelamento'

describe('getParcelamento', () => {
  it('produto muito barato não mostra parcelamento (parcela mínima de R$10)', () => {
    expect(getParcelamento(2.9)).toBeNull()
    expect(formatarParcelamento(2.9)).toBeNull()
  })

  it('nunca passa de 10x mesmo pra produtos caros', () => {
    const p = getParcelamento(5000)
    expect(p).not.toBeNull()
    expect(p!.parcelas).toBe(10)
  })

  it('valor de cada parcela nunca fica abaixo de R$10', () => {
    for (const preco of [15, 50, 99.9, 189.9, 999, 2500]) {
      const p = getParcelamento(preco)
      if (p) expect(p.valorParcela).toBeGreaterThanOrEqual(10 - 0.01)
    }
  })

  it('parcelas × valorParcela reconstrói o preço original', () => {
    const preco = 349.9
    const p = getParcelamento(preco)
    expect(p).not.toBeNull()
    expect(p!.parcelas * p!.valorParcela).toBeCloseTo(preco, 5)
  })
})

describe('getOpcoesParcelamento', () => {
  it('lista de 1x até o máximo permitido pelo preço', () => {
    const opcoes = getOpcoesParcelamento(100)
    expect(opcoes[0].parcelas).toBe(1)
    expect(opcoes[opcoes.length - 1].parcelas).toBe(opcoes.length)
  })

  it('produto abaixo de R$10 ainda oferece 1x (nunca lista vazia)', () => {
    const opcoes = getOpcoesParcelamento(5)
    expect(opcoes).toHaveLength(1)
    expect(opcoes[0]).toEqual({ parcelas: 1, valorParcela: 5 })
  })
})
