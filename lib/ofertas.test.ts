import { describe, it, expect } from 'vitest'
import { getInfoOferta } from './ofertas'

describe('getInfoOferta', () => {
  it('é determinístico — o mesmo id sempre dá o mesmo resultado', () => {
    const a = getInfoOferta('LM-0042', 100)
    const b = getInfoOferta('LM-0042', 100)
    expect(a).toEqual(b)
  })

  it('produto fora de oferta mantém o preço original', () => {
    // 'LM-0001' -> hash % 5 !== 0 (fora de oferta), confirmado empiricamente
    const info = getInfoOferta('LM-0001', 199.9)
    expect(info.emOferta).toBe(false)
    expect(info.percentualDesconto).toBe(0)
    expect(info.precoComDesconto).toBe(199.9)
  })

  it('percentual de desconto varia entre produtos em oferta — não trava sempre em 10% (regressão do bug real de hash % 5)', () => {
    const percentuaisEncontrados = new Set<number>()
    for (let i = 0; i < 500; i++) {
      const id = `LM-${String(i).padStart(4, '0')}`
      const info = getInfoOferta(id, 100)
      if (info.emOferta) percentuaisEncontrados.add(info.percentualDesconto)
    }
    // Varrendo 500 ids reais o suficiente pra bater nas 5 faixas — se o bug do hash%5
    // reaparecer, essa asserção falha porque só apareceria 1 valor (10%).
    expect(percentuaisEncontrados.size).toBeGreaterThan(1)
    for (const p of percentuaisEncontrados) {
      expect([10, 15, 20, 25, 30]).toContain(p)
    }
  })

  it('preço com desconto é sempre menor que o original quando em oferta', () => {
    for (let i = 0; i < 100; i++) {
      const id = `LM-${String(i).padStart(4, '0')}`
      const info = getInfoOferta(id, 250)
      if (info.emOferta) {
        expect(info.precoComDesconto).toBeLessThan(info.precoOriginal)
      } else {
        expect(info.precoComDesconto).toBe(info.precoOriginal)
      }
    }
  })

  it('aproximadamente 20% do catálogo cai em oferta', () => {
    let emOferta = 0
    const total = 1000
    for (let i = 0; i < total; i++) {
      const id = `LM-${String(i).padStart(4, '0')}`
      if (getInfoOferta(id, 100).emOferta) emOferta++
    }
    const proporcao = emOferta / total
    expect(proporcao).toBeGreaterThan(0.1)
    expect(proporcao).toBeLessThan(0.3)
  })
})
