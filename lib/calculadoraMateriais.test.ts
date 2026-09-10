import { describe, it, expect } from 'vitest'
import { calcularTinta, calcularPiso, calcularCimento, calcularPapelParede } from './calculadoraMateriais'

describe('calcularTinta', () => {
  it('calcula litros a partir de área e demãos', () => {
    expect(calcularTinta(20, 2).quantidade).toBe(4)
  })

  it('arredonda pra cima em passos de 0.5L', () => {
    expect(calcularTinta(21, 1).quantidade).toBe(2.5) // 21/10 = 2.1 -> arredonda pra 2.5
  })
})

describe('calcularPiso', () => {
  it('aplica a margem de perda sobre a área', () => {
    expect(calcularPiso(15, 10).quantidade).toBe(16.5)
  })

  it('estima sacos de argamassa e kg de rejunte coerentes com a área', () => {
    const r = calcularPiso(15, 10)
    expect(r.linhas.find(l => l.label === 'Argamassa estimada')?.valor).toBe('5 sacos de 20kg')
    expect(r.linhas.find(l => l.label === 'Rejunte estimado')?.valor).toBe('5 kg')
  })
})

describe('calcularCimento', () => {
  it('soma assentamento + reboco quando marcado', () => {
    expect(calcularCimento(12, true).quantidade).toBe(9) // ceil(12/4)=3 + ceil(12/2.2)=6
  })

  it('conta só assentamento quando reboco não é marcado', () => {
    expect(calcularCimento(12, false).quantidade).toBe(3)
  })
})

describe('calcularPapelParede', () => {
  it('calcula rolos considerando tiras aproveitáveis por rolo, não só área', () => {
    // altura 2.7m -> 3 tiras de 10m por rolo (floor(10/2.7)) -> 1.59m de largura coberta por rolo
    expect(calcularPapelParede(4, 2.7).quantidade).toBe(3)
  })

  it('nunca deixa tirasPorRolo chegar a zero mesmo com parede muito alta', () => {
    const r = calcularPapelParede(4, 12) // altura maior que o rolo inteiro (10m)
    expect(r.linhas.find(l => l.label === 'Tiras por rolo')?.valor).toBe('1')
  })
})
