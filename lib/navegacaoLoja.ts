// Navegação guiada dentro da loja (tela /navegar, components/NavegacaoLoja.tsx) — a parte de
// cálculo, sem tela: por onde se anda, em que ordem visitar os produtos e o que dizer em cada
// trecho ("Em 12 m, vire à esquerda no Corredor 05").
//
// A loja é vista como um mapa de ruas, nas mesmas medidas da planta desenhada
// (components/PlantaLoja.tsx), pra os pontos baterem com o mapa da busca:
//   - três "avenidas" horizontais: o corredor traseiro (em cima), o central (entre as duas
//     fileiras de prateleiras) e o frontal (embaixo, perto dos caixas);
//   - cada corredor de produtos (01 a 50) é uma rua vertical entre duas prateleiras: os da
//     fileira de cima ligam o traseiro ao central; os da de baixo, o central ao frontal;
//   - duas passagens nas pontas da loja ligam as três avenidas;
//   - a entrada fica embaixo, entre os caixas 05 e 06.
// O caminho entre dois pontos é o menor por essas ruas (Dijkstra) — nunca atravessa prateleira.
// Não há GPS: a tela anda pelo caminho numa simulação.
import { AISLE_W, CORR_W, LMARG, ROW1_Y, ROW2_Y, SHELF_H, SHELF_W, VW } from '@/components/PlantaLoja'
import { getCorredorRowIndex } from '@/lib/corredores'

export interface Ponto { x: number; y: number }

// Um corredor de produtos tem uns 3 m de largura na loja de verdade (CORR_W unidades no
// desenho). Isso dá ~78 m de fundo a fundo — uma loja grande de material de construção.
export const METROS_POR_UNIDADE = 3 / CORR_W

// Linhas de circulação (y do meio de cada uma, no desenho).
export const Y_TRASEIRO = ROW1_Y - 4
export const Y_CENTRAL = ROW1_Y + SHELF_H + 19
export const Y_FRONTAL = ROW2_Y + SHELF_H + 20
const X_PASSAGEM_ESQUERDA = LMARG / 2 - 1
const X_PASSAGEM_DIREITA = (LMARG + 25 * CORR_W + 2 + VW) / 2

// Entrada: entre os caixas 05 e 06 (cada caixa tem 80 de largura, um a cada 110, a partir de 40).
export const ENTRADA: Ponto = { x: 575, y: 586 }
export const CAIXAS: Ponto = { x: 575, y: 540 }

export interface ProdutoNoMapa {
  id: string
  numero: number            // o mesmo número do pin no mapa da busca
  corredorNormalizado: string
}

export interface Parada {
  id: string
  numero: number
  corredorNormalizado: string
  numeroDoCorredor: number  // 1 a 50
  ponto: Ponto
}

// Meio do corredor (rua vertical) de produtos `n` (1 a 50).
function xDoCorredor(n: number): number {
  const idx = n <= 25 ? n - 1 : n - 26
  return LMARG + idx * CORR_W + SHELF_W + AISLE_W / 2
}

function numeroDoCorredor(corredorNormalizado: string): number | null {
  const pos = getCorredorRowIndex(corredorNormalizado)
  if (!pos) return null
  return pos.row === 1 ? pos.idx + 1 : pos.idx + 26
}

// Onde fica cada produto. Um só no corredor: no meio dele, igual ao pin do mapa da busca.
// Vários no mesmo corredor: espalhados ao longo dele, pra cada um ser uma parada própria.
export function paradasDosProdutos(produtos: ProdutoNoMapa[]): { paradas: Parada[]; foraDoMapa: ProdutoNoMapa[] } {
  const foraDoMapa: ProdutoNoMapa[] = []
  const porCorredor = new Map<number, ProdutoNoMapa[]>()
  for (const p of produtos) {
    const n = numeroDoCorredor(p.corredorNormalizado)
    if (n === null) { foraDoMapa.push(p); continue }
    porCorredor.set(n, [...(porCorredor.get(n) ?? []), p])
  }
  const paradas: Parada[] = []
  porCorredor.forEach((lista, n) => {
    const topo = n <= 25 ? ROW1_Y : ROW2_Y
    lista.sort((a, b) => a.numero - b.numero).forEach((p, k) => {
      paradas.push({
        id: p.id, numero: p.numero, corredorNormalizado: p.corredorNormalizado, numeroDoCorredor: n,
        ponto: { x: xDoCorredor(n), y: topo + (SHELF_H * (k + 1)) / (lista.length + 1) },
      })
    })
  })
  return { paradas, foraDoMapa }
}

// ── Grafo de ruas ─────────────────────────────────────────────────────────────────

type Chave = string
const chave = (p: Ponto): Chave => `${Math.round(p.x * 100) / 100},${Math.round(p.y * 100) / 100}`

class Grafo {
  pontos = new Map<Chave, Ponto>()
  vizinhos = new Map<Chave, Map<Chave, number>>()
  ligar(a: Ponto, b: Ponto) {
    const ka = chave(a), kb = chave(b)
    if (ka === kb) return
    this.pontos.set(ka, a); this.pontos.set(kb, b)
    const d = Math.hypot(a.x - b.x, a.y - b.y)
    if (!this.vizinhos.has(ka)) this.vizinhos.set(ka, new Map())
    if (!this.vizinhos.has(kb)) this.vizinhos.set(kb, new Map())
    this.vizinhos.get(ka)!.set(kb, d)
    this.vizinhos.get(kb)!.set(ka, d)
  }
  // Liga em sequência pontos que estão sobre a mesma linha reta.
  ligarEmFila(pontos: Ponto[], eixo: 'x' | 'y') {
    const unicos = Array.from(new Map(pontos.map(p => [chave(p), p])).values()).sort((a, b) => a[eixo] - b[eixo])
    for (let i = 1; i < unicos.length; i++) this.ligar(unicos[i - 1], unicos[i])
  }
  caminho(de: Ponto, para: Ponto): { pontos: Ponto[]; distancia: number } | null {
    const inicio = chave(de), fim = chave(para)
    const dist = new Map<Chave, number>([[inicio, 0]])
    const veio = new Map<Chave, Chave>()
    const abertos = new Set<Chave>([inicio])
    while (abertos.size) {
      let atual: Chave | null = null
      for (const k of abertos) if (atual === null || dist.get(k)! < dist.get(atual)!) atual = k
      abertos.delete(atual!)
      if (atual === fim) break
      for (const [viz, d] of this.vizinhos.get(atual!) ?? []) {
        const nova = dist.get(atual!)! + d
        if (nova < (dist.get(viz) ?? Infinity)) { dist.set(viz, nova); veio.set(viz, atual!); abertos.add(viz) }
      }
    }
    if (!dist.has(fim)) return null
    const seq: Ponto[] = []
    for (let k: Chave | undefined = fim; k !== undefined; k = veio.get(k)) seq.unshift(this.pontos.get(k)!)
    return { pontos: seq, distancia: dist.get(fim)! }
  }
}

function montarGrafo(paradas: Parada[]): Grafo {
  const g = new Grafo()
  const naLinha: Record<'traseiro' | 'central' | 'frontal', Ponto[]> = { traseiro: [], central: [], frontal: [] }
  for (let n = 1; n <= 50; n++) {
    const x = xDoCorredor(n)
    const [cima, baixo] = n <= 25 ? [Y_TRASEIRO, Y_CENTRAL] : [Y_CENTRAL, Y_FRONTAL]
    const noCorredor = paradas.filter(p => p.numeroDoCorredor === n).map(p => p.ponto)
    g.ligarEmFila([{ x, y: cima }, ...noCorredor, { x, y: baixo }], 'y')
    if (n <= 25) { naLinha.traseiro.push({ x, y: cima }); naLinha.central.push({ x, y: baixo }) }
    else { naLinha.central.push({ x, y: cima }); naLinha.frontal.push({ x, y: baixo }) }
  }
  for (const x of [X_PASSAGEM_ESQUERDA, X_PASSAGEM_DIREITA]) {
    g.ligarEmFila([{ x, y: Y_TRASEIRO }, { x, y: Y_CENTRAL }, { x, y: Y_FRONTAL }], 'y')
    naLinha.traseiro.push({ x, y: Y_TRASEIRO }); naLinha.central.push({ x, y: Y_CENTRAL }); naLinha.frontal.push({ x, y: Y_FRONTAL })
  }
  const chegadaDaEntrada = { x: ENTRADA.x, y: Y_FRONTAL }
  naLinha.frontal.push(chegadaDaEntrada)
  g.ligarEmFila([chegadaDaEntrada, CAIXAS, ENTRADA], 'y')
  g.ligarEmFila(naLinha.traseiro, 'x')
  g.ligarEmFila(naLinha.central, 'x')
  g.ligarEmFila(naLinha.frontal, 'x')
  return g
}

// ── Roteiro ──────────────────────────────────────────────────────────────────────

export interface Trecho {
  destino: Parada | 'caixas'
  pontos: Ponto[]       // do ponto de partida até o destino, só com as curvas
  distancia: number     // em unidades do desenho
}

// Tira pontos do meio de retas (sobram só a partida, as curvas e a chegada).
function soAsCurvas(pontos: Ponto[]): Ponto[] {
  const r: Ponto[] = []
  for (const p of pontos) {
    if (r.length && chave(r[r.length - 1]) === chave(p)) continue
    if (r.length >= 2) {
      const a = r[r.length - 2], b = r[r.length - 1]
      const reto = Math.abs((b.x - a.x) * (p.y - b.y) - (b.y - a.y) * (p.x - b.x)) < 1e-6
      const mesmoSentido = (b.x - a.x) * (p.x - b.x) + (b.y - a.y) * (p.y - b.y) > 0
      if (reto && mesmoSentido) r.pop()
    }
    r.push(p)
  }
  return r
}

// Ordem de visita: a partir da entrada, sempre o produto mais perto andando (não em linha
// reta). No fim, os caixas.
export function montarRoteiro(paradas: Parada[]): Trecho[] {
  const g = montarGrafo(paradas)
  const faltam = [...paradas]
  const trechos: Trecho[] = []
  let aqui = ENTRADA
  while (faltam.length) {
    let melhor: { i: number; c: { pontos: Ponto[]; distancia: number } } | null = null
    faltam.forEach((p, i) => {
      const c = g.caminho(aqui, p.ponto)
      if (c && (!melhor || c.distancia < melhor.c.distancia)) melhor = { i, c }
    })
    if (!melhor) break
    const { i, c } = melhor as { i: number; c: { pontos: Ponto[]; distancia: number } }
    const [parada] = faltam.splice(i, 1)
    trechos.push({ destino: parada, pontos: soAsCurvas(c.pontos), distancia: c.distancia })
    aqui = parada.ponto
  }
  const fim = g.caminho(aqui, CAIXAS)
  if (fim) trechos.push({ destino: 'caixas', pontos: soAsCurvas(fim.pontos), distancia: fim.distancia })
  return trechos
}

// ── Andando por um trecho ────────────────────────────────────────────────────────

// Onde se está depois de andar `andado` unidades pelo trecho, e pra que lado se olha
// (graus: 0 = pra cima no desenho, 90 = pra direita).
export function posicaoNoTrecho(pontos: Ponto[], andado: number): { ponto: Ponto; rumo: number; segmento: number } {
  let resta = Math.max(0, andado)
  for (let i = 1; i < pontos.length; i++) {
    const a = pontos[i - 1], b = pontos[i]
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    const rumo = (Math.atan2(b.x - a.x, a.y - b.y) * 180) / Math.PI
    if (resta <= len || i === pontos.length - 1) {
      const f = len === 0 ? 1 : Math.min(1, resta / len)
      return { ponto: { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }, rumo, segmento: i - 1 }
    }
    resta -= len
  }
  return { ponto: pontos[pontos.length - 1], rumo: 0, segmento: 0 }
}

// Nome da "rua" de um segmento, pra instrução.
export function nomeDoSegmento(a: Ponto, b: Ponto): string {
  if (Math.abs(a.y - b.y) < 0.01) {
    if (Math.abs(a.y - Y_TRASEIRO) < 1) return 'corredor traseiro'
    if (Math.abs(a.y - Y_CENTRAL) < 1) return 'corredor central'
    if (Math.abs(a.y - Y_FRONTAL) < 1) return 'corredor frontal'
  }
  if (Math.abs(a.x - b.x) < 0.01) {
    // Os corredores 01–25 ficam exatamente em cima dos 26–50: um trecho reto pode passar por
    // dentro de um (ex.: 30), atravessar o corredor central e entrar no de cima (05).
    const corredoresNoTrecho: number[] = []
    for (let n = 1; n <= 50; n++) {
      if (Math.abs(a.x - xDoCorredor(n)) < 0.5) {
        const [cima, baixo] = n <= 25 ? [Y_TRASEIRO, Y_CENTRAL] : [Y_CENTRAL, Y_FRONTAL]
        const de = Math.min(a.y, b.y), ate = Math.max(a.y, b.y)
        if (Math.min(ate, baixo) - Math.max(de, cima) > 1) corredoresNoTrecho.push(n)
      }
    }
    if (corredoresNoTrecho.length) {
      // na ordem em que se passa por eles
      const ordem = b.y < a.y ? corredoresNoTrecho.sort((m, n) => n - m) : corredoresNoTrecho.sort((m, n) => m - n)
      const nome = (n: number) => String(n).padStart(2, '0')
      return ordem.length === 1 ? `Corredor ${nome(ordem[0])}` : `Corredor ${nome(ordem[0])} e siga reto até o ${nome(ordem[1])}`
    }
    if (Math.abs(a.x - X_PASSAGEM_ESQUERDA) < 1 || Math.abs(a.x - X_PASSAGEM_DIREITA) < 1) return 'passagem lateral'
    if (Math.abs(a.x - ENTRADA.x) < 1) return 'saída dos caixas'
  }
  return 'corredor'
}

export type Manobra = 'siga' | 'esquerda' | 'direita' | 'meia-volta' | 'chegou'

export interface Instrucao {
  manobra: Manobra
  metros: number      // até a manobra (ou até a chegada)
  rua: string         // a rua em que se entra depois da manobra (ou onde se está)
}

// O que dizer agora, estando a `andado` unidades do começo do trecho.
export function instrucaoAgora(pontos: Ponto[], andado: number): Instrucao {
  const total = comprimento(pontos)
  if (andado >= total - 0.5) return { manobra: 'chegou', metros: 0, rua: '' }
  const { segmento } = posicaoNoTrecho(pontos, andado)
  let ateOFimDoSegmento = -andado
  for (let i = 1; i <= segmento + 1; i++) ateOFimDoSegmento += Math.hypot(pontos[i].x - pontos[i - 1].x, pontos[i].y - pontos[i - 1].y)
  const ultimo = segmento + 1 === pontos.length - 1
  if (ultimo) return { manobra: 'siga', metros: emMetros(total - andado), rua: nomeDoSegmento(pontos[segmento], pontos[segmento + 1]) }
  const a = pontos[segmento], b = pontos[segmento + 1], c = pontos[segmento + 2]
  // Com o y do desenho crescendo pra baixo, produto vetorial positivo = curva à direita.
  const cruz = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)
  const escalar = (b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y)
  const manobra: Manobra = escalar < 0 && Math.abs(cruz) < 1e-6 ? 'meia-volta' : cruz > 0 ? 'direita' : 'esquerda'
  return { manobra, metros: emMetros(ateOFimDoSegmento), rua: nomeDoSegmento(b, c) }
}

export function comprimento(pontos: Ponto[]): number {
  let t = 0
  for (let i = 1; i < pontos.length; i++) t += Math.hypot(pontos[i].x - pontos[i - 1].x, pontos[i].y - pontos[i - 1].y)
  return t
}

export function emMetros(unidades: number): number {
  return Math.max(0, Math.round(unidades * METROS_POR_UNIDADE))
}

// Texto da instrução, como num aplicativo de trânsito. `destino` vai sem artigo ("produto 5",
// "caixas"); `plural` escolhe "os/aos" em vez de "o/ao".
export function textoDaInstrucao(i: Instrucao, destino: string, plural = false): string {
  const o = plural ? 'os' : 'o', ao = plural ? 'aos' : 'ao'
  if (i.manobra === 'chegou') return `Você chegou ${ao} ${destino}`
  if (i.manobra === 'siga') return i.metros <= 2 ? `${destino[0].toUpperCase()}${destino.slice(1)} logo à frente` : `Siga ${i.metros} m até ${o} ${destino}`
  const quando = i.metros <= 2 ? 'Agora' : `Em ${i.metros} m`
  if (i.manobra === 'meia-volta') return `${quando}, dê meia-volta`
  return `${quando}, vire à ${i.manobra} no ${i.rua}`
}
