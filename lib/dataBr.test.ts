import { describe, it, expect } from 'vitest'
import { parseDataBR } from './dataBr'

describe('parseDataBR', () => {
  it('interpreta o formato real gravado por toLocaleString("pt-BR") sem virar Invalid Date', () => {
    // Formato real gerado em produção (ver AgendamentosLista.tsx): "DD/MM/AAAA, HH:mm:ss"
    const d = parseDataBR('29/08/2026, 12:21:09')
    expect(d.toString()).not.toBe('Invalid Date')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(7) // agosto = índice 7
    expect(d.getDate()).toBe(29)
    expect(d.getHours()).toBe(12)
    expect(d.getMinutes()).toBe(21)
    expect(d.getSeconds()).toBe(9)
  })

  it('ordena cronologicamente duas datas reais', () => {
    const antes = parseDataBR('01/01/2026, 08:00:00')
    const depois = parseDataBR('15/03/2026, 08:00:00')
    expect(depois.getTime()).toBeGreaterThan(antes.getTime())
  })

  it('lida com string sem parte de hora', () => {
    const d = parseDataBR('05/09/2026')
    expect(d.toString()).not.toBe('Invalid Date')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getHours()).toBe(0)
  })
})
