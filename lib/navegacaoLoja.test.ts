import { describe, it, expect } from 'vitest'
import {
  CAIXAS, ENTRADA, Y_CENTRAL, Y_FRONTAL, Y_TRASEIRO, comprimento, instrucaoAgora, montarRoteiro, paradasDosProdutos,
  posicaoNoTrecho, textoDaInstrucao, type Ponto,
} from './navegacaoLoja'
import { posicaoDoCorredor, ROW1_Y, ROW2_Y, SHELF_H, LMARG, CORR_W, SHELF_W } from '@/components/PlantaLoja'

const produto = (id: string, numero: number, corredor: number) => ({ id, numero, corredorNormalizado: `corredor-${corredor}` })

// Um ponto está "dentro de uma prateleira" se cai na faixa de alguma fileira e fora do meio
// (rua) de um corredor.
function dentroDePrateleira(p: Ponto): boolean {
  const naFileira = (p.y > ROW1_Y + 0.5 && p.y < ROW1_Y + SHELF_H - 0.5) || (p.y > ROW2_Y + 0.5 && p.y < ROW2_Y + SHELF_H - 0.5)
  if (!naFileira) return false
  const resto = (p.x - LMARG) % CORR_W
  return p.x > LMARG && p.x < LMARG + 25 * CORR_W && !(resto > SHELF_W - 0.5 && resto < CORR_W - SHELF_W + 0.5)
}

describe('navegação na loja', () => {
  it('produto sozinho no corredor fica no mesmo ponto do pin do mapa da busca', () => {
    const { paradas } = paradasDosProdutos([produto('A', 1, 5), produto('B', 2, 33)])
    expect(paradas.find(p => p.id === 'A')!.ponto).toEqual(posicaoDoCorredor('corredor-5'))
    expect(paradas.find(p => p.id === 'B')!.ponto).toEqual(posicaoDoCorredor('corredor-33'))
  })

  it('vários no mesmo corredor viram paradas diferentes ao longo dele', () => {
    const { paradas } = paradasDosProdutos([produto('A', 1, 5), produto('B', 2, 5), produto('C', 3, 5)])
    const ys = paradas.map(p => p.ponto.y)
    expect(new Set(ys).size).toBe(3)
    expect(new Set(paradas.map(p => p.ponto.x)).size).toBe(1)
  })

  it('produto sem corredor reconhecido fica fora do mapa (não quebra o roteiro)', () => {
    const { paradas, foraDoMapa } = paradasDosProdutos([produto('A', 1, 5), { id: 'Z', numero: 2, corredorNormalizado: 'balcao' }])
    expect(paradas).toHaveLength(1)
    expect(foraDoMapa.map(p => p.id)).toEqual(['Z'])
  })

  it('o roteiro sai da entrada, passa por todos os produtos uma vez e termina nos caixas', () => {
    const { paradas } = paradasDosProdutos([produto('A', 1, 3), produto('B', 2, 44), produto('C', 3, 20), produto('D', 4, 28)])
    const trechos = montarRoteiro(paradas)
    expect(trechos).toHaveLength(5)
    expect(trechos[0].pontos[0]).toEqual(ENTRADA)
    expect(trechos.at(-1)!.destino).toBe('caixas')
    expect(trechos.at(-1)!.pontos.at(-1)).toEqual(CAIXAS)
    const visitados = trechos.slice(0, -1).map(t => (t.destino as { id: string }).id).sort()
    expect(visitados).toEqual(['A', 'B', 'C', 'D'])
    // cada trecho começa onde o anterior terminou
    for (let i = 1; i < trechos.length; i++) expect(trechos[i].pontos[0]).toEqual(trechos[i - 1].pontos.at(-1))
  })

  it('o caminho só anda reto (na horizontal ou na vertical) e nunca passa por dentro de uma prateleira', () => {
    const { paradas } = paradasDosProdutos([produto('A', 1, 1), produto('B', 2, 25), produto('C', 3, 26), produto('D', 4, 50), produto('E', 5, 13)])
    for (const t of montarRoteiro(paradas)) {
      for (let i = 1; i < t.pontos.length; i++) {
        const a = t.pontos[i - 1], b = t.pontos[i]
        expect(Math.abs(a.x - b.x) < 1e-6 || Math.abs(a.y - b.y) < 1e-6).toBe(true)
        for (let f = 0; f <= 20; f++) {
          const p = { x: a.x + ((b.x - a.x) * f) / 20, y: a.y + ((b.y - a.y) * f) / 20 }
          expect(dentroDePrateleira(p), `ponto ${p.x.toFixed(1)},${p.y.toFixed(1)}`).toBe(false)
        }
      }
    }
  })

  it('para ir de um produto da fileira de baixo pra um da de cima, atravessa o corredor central (e não dá a volta pelos de trás/frente)', () => {
    const { paradas } = paradasDosProdutos([produto('A', 1, 10), produto('B', 2, 35)])
    const trechos = montarRoteiro(paradas)
    const entreEles = trechos[1].pontos
    // (o 10 fica bem em cima do 35: o caminho é uma reta que atravessa o corredor central)
    const cruzaOCentral = entreEles.some((p, i) => i > 0 && Math.min(p.y, entreEles[i - 1].y) <= Y_CENTRAL + 0.01 && Math.max(p.y, entreEles[i - 1].y) >= Y_CENTRAL - 0.01)
    expect(cruzaOCentral).toBe(true)
    expect(entreEles.some(p => Math.abs(p.y - Y_TRASEIRO) < 0.01 || Math.abs(p.y - Y_FRONTAL) < 0.01)).toBe(false)
  })

  it('visita primeiro o produto mais perto da entrada', () => {
    // corredor 30 (fileira de baixo, perto da entrada) x corredor 2 (fileira de cima, longe)
    const { paradas } = paradasDosProdutos([produto('LONGE', 1, 2), produto('PERTO', 2, 37)])
    expect((montarRoteiro(paradas)[0].destino as { id: string }).id).toBe('PERTO')
  })

  it('trecho reto que passa por um corredor de baixo e entra no de cima diz os dois', () => {
    const { paradas } = paradasDosProdutos([produto('A', 1, 5)])
    const [primeiro] = montarRoteiro(paradas)
    // da entrada: frontal → sobe pelo 30 → atravessa o central → entra no 05
    const textos: string[] = []
    for (let andado = 0; andado < comprimento(primeiro.pontos); andado += 5) textos.push(textoDaInstrucao(instrucaoAgora(primeiro.pontos, andado), 'produto 1'))
    expect(textos.some(t => /Corredor 30 e siga reto até o 05/.test(t))).toBe(true)
  })

  it('andar pelo trecho: posição, rumo e instrução', () => {
    // sobe 100, vira à direita, anda 50
    const pontos = [{ x: 0, y: 200 }, { x: 0, y: 100 }, { x: 50, y: 100 }]
    expect(comprimento(pontos)).toBe(150)
    expect(posicaoNoTrecho(pontos, 0).rumo).toBe(0)
    expect(posicaoNoTrecho(pontos, 120)).toMatchObject({ ponto: { x: 20, y: 100 }, rumo: 90 })
    const i = instrucaoAgora(pontos, 10)
    expect(i.manobra).toBe('direita')
    expect(textoDaInstrucao(i, 'produto 5')).toMatch(/^Em \d+ m, vire à direita no /)
    expect(instrucaoAgora(pontos, 149.9).manobra).toBe('chegou')
    expect(textoDaInstrucao(instrucaoAgora(pontos, 149.9), 'produto 5')).toBe('Você chegou ao produto 5')
    expect(textoDaInstrucao(instrucaoAgora(pontos, 149.9), 'caixas', true)).toBe('Você chegou aos caixas')
    expect(textoDaInstrucao({ manobra: 'siga', metros: 30, rua: '' }, 'caixas', true)).toBe('Siga 30 m até os caixas')
    expect(instrucaoAgora([{ x: 0, y: 100 }, { x: 0, y: 0 }, { x: -30, y: 0 }], 5).manobra).toBe('esquerda')
  })
})
