'use client'

import { useEffect, useRef, useState } from 'react'
import { ShoppingCart, Check, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'
import type { SearchResult } from '@/types/produto'
import { trackProductView } from '@/lib/hooks/useProductTracker'
import { getImagemProduto, ajusteFoto } from '@/lib/categoriaImagens'
import type { ParadaRota } from '@/lib/rotaLoja'
import { shelfColor } from '@/lib/corredorCores'

const VW = 1200
const VH = 590
const LMARG = 14
const CORR_W = 46
const SHELF_W = 14
const AISLE_W = 18
const SHELF_H = 118

const ROW1_Y = 118
const ROW2_Y = 340

// Celular: abaixo desta largura a planta inteira não dá pra ler, e ela passa a abrir "de
// perto" com esta altura fixa (ver `dePerto` no componente).
const LARGURA_ESTREITA = 560
const ALTURA_DE_PERTO = 420

// Mapeia lettered corredores para corredores numéricos próximos (para exibir no mapa principal)
function specialToNumeric(slug: string): number | null {
  const m = slug.match(/^([a-z])-(\d+)$/)
  if (!m) return null
  const [, prefix, numStr] = m
  const n = parseInt(numStr)
  const map: Record<string, [number, number]> = {
    e: [9, 15],    // Elétrica
    c: [16, 22],   // Hidráulica/Cozinhas
    d: [48, 50],   // Decoração
    t: [44, 47],   // Técnico → Banheiros
    p: [36, 43],   // Projeto → Pisos
    s: [29, 35],   // Sustentável → Jardim
    x: [48, 50],   // Especialista → Pintura
  }
  const range = map[prefix]
  if (!range) return null
  const [min, max] = range
  const ratio = Math.min((n - 1) / 20, 1)
  return Math.round(min + ratio * (max - min))
}


export function getCorredorRowIndex(corridorNorm: string): { row: 1 | 2; idx: number } | null {
  const slug = corridorNorm.toLowerCase().trim()

  const numM = slug.match(/^corredor-(\d+)$/)
  if (numM) {
    const n = parseInt(numM[1])
    if (n < 1 || n > 50) return null
    return { row: n <= 25 ? 1 : 2, idx: n <= 25 ? n - 1 : n - 26 }
  }

  const mapped = specialToNumeric(slug)
  if (mapped) {
    return { row: mapped <= 25 ? 1 : 2, idx: mapped <= 25 ? mapped - 1 : mapped - 26 }
  }

  return null
}

function getPos(corridorNorm: string): { x: number; y: number } | null {
  const pos = getCorredorRowIndex(corridorNorm)
  if (!pos) return null
  return {
    x: LMARG + pos.idx * CORR_W + CORR_W / 2,
    y: (pos.row === 1 ? ROW1_Y : ROW2_Y) + SHELF_H / 2,
  }
}

const PIN_COLORS = ['#ef4444','#3b82f6','#f59e0b','#10b981','#8b5cf6','#ec4899','#06b6d4','#84cc16']

const DEPT_LABELS = [
  { label: 'FERRAMENTAS', n1: 1,  n2: 8,  row: 1 as const },
  { label: 'ELÉTRICA',    n1: 9,  n2: 15, row: 1 as const },
  { label: 'HIDRÁULICA',  n1: 16, n2: 22, row: 1 as const },
  { label: 'ILUMINAÇÃO',  n1: 23, n2: 25, row: 1 as const },
  { label: 'JARDIM',      n1: 26, n2: 32, row: 2 as const },
  { label: 'PISOS & CERÂMICA', n1: 33, n2: 43, row: 2 as const },
  { label: 'BANHEIROS',   n1: 44, n2: 47, row: 2 as const },
  { label: 'PINTURA & DEC.', n1: 48, n2: 50, row: 2 as const },
]

interface Props {
  resultados: SearchResult[]
  loja: string
  totalEstimado?: number
  onSelect?: (produto: SearchResult['produto']) => void
  rota?: ParadaRota[]
  /** Esconde o botão de carrinho (uso do funcionário, que não compra pelo mapa). */
  semCarrinho?: boolean
}

export default function StoreMap({ resultados, loja, totalEstimado, onSelect, rota, semCarrinho }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [adicionadoId, setAdicionadoId] = useState<string | null>(null)

  // Zoom/pan do mapa — permite aproximar de um corredor específico e arrastar pra
  // navegar, útil quando o carrinho tem muitos itens espalhados pela loja inteira.
  const ZOOM_MIN = 1
  const ZOOM_MAX = 5
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [arrastando, setArrastando] = useState(false)
  const arrastoRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)

  function clampZoom(valor: number) {
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, valor))
  }

  function aplicarZoom(delta: number) {
    setZoom(z => {
      const novo = clampZoom(z + delta)
      if (novo === 1) setPan({ x: 0, y: 0 })
      return novo
    })
  }

  function resetZoom() {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Zoom via scroll da roda do mouse atrapalhava a rolagem normal da página (o usuário
  // só queria rolar a tela e o mapa dava zoom sem querer). Trocado por duplo clique:
  // aproxima num nível fixo e confortável, duplo clique de novo volta ao normal.
  const ZOOM_DUPLO_CLIQUE = 2.5

  function handleDoubleClick() {
    if (zoom > 1) {
      resetZoom()
    } else {
      setZoom(ZOOM_DUPLO_CLIQUE)
    }
  }

  // ── Celular ──
  // Numa tela estreita a planta inteira fica com ~150px de altura e os números dos
  // corredores somem. Então no celular ela abre "de perto": altura fixa, mais larga que a
  // tela, e o cliente desliza de lado com o dedo (rolagem normal do navegador, então a página
  // continua rolando pra cima e pra baixo). O botão do canto alterna pra "loja inteira".
  // O zoom com arraste, abaixo, fica só pras telas largas.
  const moldura = useRef<HTMLDivElement>(null)
  const [estreito, setEstreito] = useState(false)
  const [lojaInteira, setLojaInteira] = useState(false)
  const dePerto = estreito && !lojaInteira

  useEffect(() => {
    const el = moldura.current
    if (!el) return
    const medir = () => setEstreito(el.clientWidth < LARGURA_ESTREITA)
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (estreito || zoom <= 1) return
    setArrastando(true)
    arrastoRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!arrastoRef.current) return
    const { x, y, panX, panY } = arrastoRef.current
    setPan({ x: panX + (e.clientX - x), y: panY + (e.clientY - y) })
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    setArrastando(false)
    arrastoRef.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  function handleAdicionar(produtoId: string, estoque: number, e?: React.MouseEvent) {
    e?.stopPropagation()
    if (estoque === 0) return
    adicionarAoCarrinho(produtoId)
    setAdicionadoId(produtoId)
    setTimeout(() => setAdicionadoId(prev => prev === produtoId ? null : prev), 1500)
  }

  const ordemPorCorredor = rota
    ? new Map(rota.map((p, i) => [p.corredorNormalizado, i + 1]))
    : null

  const pins = resultados
    .map((r, i) => {
      const pos = getPos(r.produto.corredor_normalizado)
      if (!pos) return null
      const idx = ordemPorCorredor?.get(r.produto.corredor_normalizado) ?? i + 1
      return { ...r, pos, color: PIN_COLORS[i % PIN_COLORS.length], idx }
    })
    .filter(Boolean) as Array<SearchResult & { pos: {x:number;y:number}; color:string; idx:number }>

  // Quando há rota calculada, a legenda abaixo do mapa deve seguir a mesma ordem de
  // visita (não a ordem em que os produtos entraram na busca/carrinho).
  if (ordemPorCorredor) pins.sort((a, b) => a.idx - b.idx)

  const pontosRota = rota
    ? (rota.map(p => getPos(p.corredorNormalizado)).filter(Boolean) as Array<{ x: number; y: number }>)
    : []

  // Vários produtos no mesmo corredor caem exatamente nas mesmas coordenadas — sem isso,
  // o pin desenhado por último cobre os outros por completo e eles somem do mapa. Espalha
  // os pins de um mesmo grupo num pequeno círculo ao redor do ponto original. O raio cresce
  // com o tamanho do grupo (regra: raio tal que a distância entre pins vizinhos no círculo
  // fique perto do diâmetro do próprio pin) — com raio fixo, grupos de 4-5 produtos no
  // mesmo corredor (comum quando a busca traz muitas variações do mesmo item) continuavam
  // se sobrepondo bastante mesmo espalhados.
  const gruposPorPosicao = new Map<string, typeof pins>()
  pins.forEach(p => {
    const chave = `${p.pos.x},${p.pos.y}`
    gruposPorPosicao.set(chave, [...(gruposPorPosicao.get(chave) ?? []), p])
  })
  gruposPorPosicao.forEach(grupo => {
    if (grupo.length <= 1) return
    const raio = grupo.length <= 2 ? 12 : Math.min(22, 10 / Math.sin(Math.PI / grupo.length))
    grupo.forEach((p, gi) => {
      const angulo = (2 * Math.PI * gi) / grupo.length - Math.PI / 2
      p.pos = { x: p.pos.x + raio * Math.cos(angulo), y: p.pos.y + raio * Math.sin(angulo) }
    })
  })

  function handlePinClick(pin: typeof pins[0]) {
    // Quando existe um `onSelect` (ex.: busca, mapa com detalhes habilitados), o clique no
    // pin já abre o modal de detalhes do produto diretamente.
    if (onSelect) {
      trackProductView({ id: pin.produto.id, nome: pin.produto.produto, categoria: pin.produto.categoria })
      setSelectedId(pin.produto.id)
      onSelect(pin.produto)
      return
    }
    setSelectedId(prev => prev === pin.produto.id ? null : pin.produto.id)
  }

  const renderCorredor = (n: number, row: 1 | 2) => {
    const idx = row === 1 ? n - 1 : n - 26
    const x = LMARG + idx * CORR_W
    const y = row === 1 ? ROW1_Y : ROW2_Y
    const { fill, stroke } = shelfColor(n)
    const label = String(n).padStart(2, '0')
    return (
      <g key={`c${n}`}>
        <rect x={x} y={y} width={SHELF_W} height={SHELF_H} fill={fill} stroke={stroke} strokeWidth="0.8" rx="1" />
        {[25,50,75,100].filter(oy => oy < SHELF_H).map(oy => (
          <line key={oy} x1={x+2} y1={y+oy} x2={x+SHELF_W-2} y2={y+oy} stroke={stroke} strokeWidth="0.5" opacity="0.5" />
        ))}
        <rect x={x+SHELF_W} y={y} width={AISLE_W} height={SHELF_H} fill="#f8fafc" />
        <text x={x+SHELF_W+AISLE_W/2} y={y+15} textAnchor="middle"
          fontSize="11" fontWeight="800" fill="#1f2937" fontFamily="Inter,sans-serif">{label}</text>
        <text x={x+SHELF_W+AISLE_W/2} y={y+SHELF_H-5} textAnchor="middle"
          fontSize="7" fill="#94a3b8" fontFamily="Inter,sans-serif">↕</text>
        <rect x={x+SHELF_W+AISLE_W} y={y} width={SHELF_W} height={SHELF_H} fill={fill} stroke={stroke} strokeWidth="0.8" rx="1" />
        {[25,50,75,100].filter(oy => oy < SHELF_H).map(oy => (
          <line key={oy} x1={x+SHELF_W+AISLE_W+2} y1={y+oy} x2={x+CORR_W-2} y2={y+oy} stroke={stroke} strokeWidth="0.5" opacity="0.5" />
        ))}
      </g>
    )
  }

  // No modo "de perto" a planta desliza sozinha até o produto escolhido (ou, ao abrir, até o
  // primeiro da lista) ficar no meio da tela.
  const alvo = pins.find(p => p.produto.id === selectedId) ?? pins[0]
  const alvoX = alvo ? alvo.pos.x : null
  useEffect(() => {
    const el = moldura.current
    if (!dePerto || !el || alvoX === null) return
    const escala = ALTURA_DE_PERTO / VH
    el.scrollTo({ left: alvoX * escala - el.clientWidth / 2, behavior: 'smooth' })
  }, [dePerto, alvoX])

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 mb-2">
        <div>
          <span className="text-xs font-bold text-gray-700">{loja}</span>
          <span className="hidden sm:inline ml-2 text-xs text-gray-600">Planta da loja · 50 corredores</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pins.length > 0 && (
            <span className="text-xs bg-lm-green/10 text-lm-green border border-lm-green/20 px-2 py-0.5 rounded-full font-semibold">
              {pins.length} produto{pins.length > 1 ? 's' : ''} localizado{pins.length > 1 ? 's' : ''}
            </span>
          )}
          {totalEstimado != null && totalEstimado > 0 && (
            <span className="text-xs bg-lm-green text-white px-3 py-0.5 rounded-full font-bold shadow-sm">
              Total: {totalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          )}
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-500 rounded-card overflow-hidden shadow-soft bg-white relative select-none">
        {estreito && (
          <button
            type="button"
            onClick={() => setLojaInteira(v => !v)}
            className="absolute z-30 top-2 right-2 h-9 px-3 rounded-full flex items-center gap-1.5 bg-gray-900/80 backdrop-blur-sm text-white text-xs font-semibold shadow-md"
          >
            {lojaInteira ? <><ZoomIn size={14} /> Ver de perto</> : <><Maximize2 size={13} /> Loja inteira</>}
          </button>
        )}
        {/* Controles de zoom — pílula flutuante escura sobre a planta clara (mesmo padrão
            visual dos ícones de favoritar/comparar sobre a foto do produto em
            ProdutoDrawer.tsx), em vez de quadrados soltos. Fixo em tom escuro de propósito:
            o SVG da planta da loja não inverte com o tema (ver [[project-dev-workflow]]),
            então um controle neutro em cima dela fica legível nos dois modos. */}
        {!estreito && <div className="absolute z-30 top-2 right-2 flex flex-col gap-0.5 bg-gray-900/80 backdrop-blur-sm rounded-full p-1 shadow-md">
          <button
            type="button"
            onClick={() => aplicarZoom(0.5)}
            disabled={zoom >= ZOOM_MAX}
            aria-label="Aumentar zoom"
            className="w-7 h-7 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            onClick={() => aplicarZoom(-0.5)}
            disabled={zoom <= ZOOM_MIN}
            aria-label="Diminuir zoom"
            className="w-7 h-7 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            disabled={zoom === 1}
            aria-label="Restaurar zoom"
            className="w-7 h-7 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Maximize2 size={13} />
          </button>
        </div>}

        {/* Moldura da planta: no celular "de perto" é ela que rola de lado; nas telas largas
            é onde se arrasta a planta com zoom. O dedo só fica preso ao mapa quando há zoom —
            com touch-action sempre desligado, a página não rolava com o dedo sobre a planta. */}
        <div
          ref={moldura}
          className={dePerto ? 'overflow-x-auto overscroll-x-contain' : undefined}
          onDoubleClick={estreito ? undefined : handleDoubleClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={estreito ? undefined : { touchAction: zoom > 1 ? 'none' : 'auto', cursor: zoom > 1 ? (arrastando ? 'grabbing' : 'grab') : 'default' }}
        >
        <div
          style={estreito ? undefined : {
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: arrastando ? 'none' : 'transform 0.15s ease-out',
          }}
        >
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className={dePerto ? undefined : 'w-full'}
          style={dePerto
            ? { display: 'block', height: ALTURA_DE_PERTO, width: (ALTURA_DE_PERTO * VW) / VH, maxWidth: 'none' }
            : { display: 'block' }}
        >
          <rect width={VW} height={VH} fill="#eef2f7" />

          {/* Jardim */}
          <rect x="0" y="0" width={VW} height="110" fill="#f0fdf4" />
          <rect x="0" y="109" width={VW} height="1" fill="#bbf7d0" />
          <text x="600" y="34" textAnchor="middle" fontSize="12" fontWeight="700"
            fill="#16a34a" fontFamily="Inter,sans-serif" letterSpacing="2">🌿  JARDIM / ÁREA EXTERNA</text>
          <text x="600" y="52" textAnchor="middle" fontSize="9" fill="#86efac" fontFamily="Inter,sans-serif">
            Plantas · Sementes · Ferramentas de Jardim · Vasos · Mangueiras
          </text>
          {[120,260,410,570,730,880,1050].map(tx => (
            <g key={tx}>
              <ellipse cx={tx} cy={82} rx="18" ry="14" fill="#86efac" opacity="0.6" />
              <line x1={tx} y1={90} x2={tx} y2={108} stroke="#6b7280" strokeWidth="2" />
            </g>
          ))}

          {/* Corredor traseiro */}
          <rect x="0" y="110" width={VW} height="8" fill="#cbd5e1" />
          <text x="600" y="117" textAnchor="middle" fontSize="7" fill="#94a3b8"
            fontFamily="Inter,sans-serif" letterSpacing="1">— CORREDOR TRASEIRO —</text>

          {/* Linha 1 (01-25) */}
          <rect x={LMARG-2} y={ROW1_Y-2} width={25*CORR_W+4} height={SHELF_H+4}
            fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" rx="3" />
          {Array.from({length:25}, (_,i) => renderCorredor(i+1, 1))}
          {DEPT_LABELS.filter(d => d.row === 1).map(d => {
            const x1 = LMARG + (d.n1-1)*CORR_W
            const x2 = LMARG + (d.n2-1)*CORR_W + CORR_W
            const { stroke, fill } = shelfColor(d.n1)
            return (
              <g key={d.label}>
                <rect x={x1} y={ROW1_Y-18} width={x2-x1} height="16" rx="2" fill={fill} stroke={stroke} strokeWidth="0.8" />
                <text x={(x1+x2)/2} y={ROW1_Y-6.5} textAnchor="middle"
                  fontSize="9.5" fontWeight="700" fill="#374151" fontFamily="Inter,sans-serif">{d.label}</text>
              </g>
            )
          })}

          {/* Corredor central */}
          <rect x="0" y={ROW1_Y+SHELF_H+2} width={VW} height="35" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" />
          <line x1="20" y1={ROW1_Y+SHELF_H+19} x2={VW-20} y2={ROW1_Y+SHELF_H+19}
            stroke="#94a3b8" strokeWidth="1" strokeDasharray="6 4" />
          <text x="600" y={ROW1_Y+SHELF_H+22} textAnchor="middle" fontSize="8" fontWeight="600"
            fill="#94a3b8" fontFamily="Inter,sans-serif" letterSpacing="3">
            ← CORREDOR CENTRAL (PASSAGEM PRINCIPAL) →
          </text>

          {/* Linha 2 (26-50) */}
          <rect x={LMARG-2} y={ROW2_Y-2} width={25*CORR_W+4} height={SHELF_H+4}
            fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" rx="3" />
          {Array.from({length:25}, (_,i) => renderCorredor(i+26, 2))}
          {DEPT_LABELS.filter(d => d.row === 2).map(d => {
            const x1 = LMARG + (d.n1-26)*CORR_W
            const x2 = LMARG + (d.n2-26)*CORR_W + CORR_W
            const { stroke, fill } = shelfColor(d.n1)
            return (
              <g key={d.label}>
                <rect x={x1} y={ROW2_Y-18} width={x2-x1} height="16" rx="2" fill={fill} stroke={stroke} strokeWidth="0.8" />
                <text x={(x1+x2)/2} y={ROW2_Y-6.5} textAnchor="middle"
                  fontSize="9.5" fontWeight="700" fill="#374151" fontFamily="Inter,sans-serif">{d.label}</text>
              </g>
            )
          })}

          {/* Corredor frontal */}
          <rect x="0" y={ROW2_Y+SHELF_H+2} width={VW} height="35" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" />
          <text x="600" y={ROW2_Y+SHELF_H+22} textAnchor="middle" fontSize="8" fontWeight="600"
            fill="#94a3b8" fontFamily="Inter,sans-serif" letterSpacing="3">← CORREDOR FRONTAL →</text>

          {/* Checkout / Entrada */}
          <rect x="0" y={VH-66} width={VW} height="66" fill="#e2e8f0" />
          <rect x="0" y={VH-66} width={VW} height="2" fill="#94a3b8" />
          {Array.from({length:10}, (_,i) => (
            <g key={i}>
              <rect x={40+i*110} y={VH-58} width="80" height="44" fill="white"
                stroke="#94a3b8" strokeWidth="1" rx="3" />
              <text x={80+i*110} y={VH-40} textAnchor="middle" fontSize="8"
                fill="#64748b" fontFamily="Inter,sans-serif" fontWeight="600">CAIXA</text>
              <text x={80+i*110} y={VH-28} textAnchor="middle" fontSize="9"
                fill="#374151" fontFamily="Inter,sans-serif" fontWeight="700">{String(i+1).padStart(2,'0')}</text>
            </g>
          ))}
          <rect x="1140" y={VH-58} width="48" height="44" fill="#fef3c7" stroke="#d97706" strokeWidth="1" rx="3" />
          <text x="1164" y={VH-34} textAnchor="middle" fontSize="8" fill="#92400e" fontFamily="Inter,sans-serif" fontWeight="700">INFO</text>
          <text x="600" y={VH-6} textAnchor="middle" fontSize="10" fontWeight="800"
            fill="#475569" fontFamily="Inter,sans-serif" letterSpacing="4">ENTRADA PRINCIPAL</text>

          {/* Rota de compra sugerida */}
          {pontosRota.length > 1 && (
            <polyline
              points={pontosRota.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#16a34a"
              strokeWidth="3"
              strokeDasharray="7 5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
          )}

          {/* Pins — o selecionado é redesenhado por último (SVG pinta na ordem do DOM) pra
              nunca ficar escondido embaixo de outros pins do mesmo corredor. */}
          {[...pins].sort((a, b) => Number(a.produto.id === selectedId) - Number(b.produto.id === selectedId)).map(pin => {
            const isSel = selectedId === pin.produto.id
            return (
              <g key={pin.produto.id}
                onClick={() => handlePinClick(pin)}
                style={{ cursor: 'pointer' }}>
                <circle cx={pin.pos.x} cy={pin.pos.y} r="24" fill="transparent" />
                <circle cx={pin.pos.x} cy={pin.pos.y+2} r="11" fill="rgba(0,0,0,0.2)" />
                {isSel && (
                  <circle cx={pin.pos.x} cy={pin.pos.y} r="18" fill={pin.color} opacity="0.25" />
                )}
                <circle cx={pin.pos.x} cy={pin.pos.y} r="15" fill={pin.color} opacity="0">
                  <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={pin.pos.x} cy={pin.pos.y} r={isSel ? 13 : 11}
                  fill={pin.color} stroke="white" strokeWidth={isSel ? 3 : 2.5} />
                <text x={pin.pos.x} y={pin.pos.y+4} textAnchor="middle"
                  fontSize="10" fontWeight="800" fill="white" fontFamily="Inter,sans-serif">{pin.idx}</text>
              </g>
            )
          })}
        </svg>
        </div>
        </div>
      </div>
      {dePerto && (
        <p className="mt-1.5 text-xs text-gray-600 text-center">Deslize a planta para o lado para ver a loja toda</p>
      )}

      {/* Legenda — quando há rota calculada, os cards já vêm na ordem de visita (ver
          `ordemPorCorredor` acima), então esse título é só um rótulo pro que já está
          visível ali embaixo, não uma segunda lista repetindo a mesma informação em texto. */}
      {rota && rota.length > 0 && pins.length > 0 && (
        <p className="mt-3 text-xs font-bold text-gray-700 dark:text-zinc-300 flex items-center gap-1">
          🧭 Ordem sugerida da rota
        </p>
      )}
      {pins.length > 0 && (
        // Grade de colunas iguais (e não flex-wrap): com flex cada cartão ficava da largura do
        // próprio nome do produto, e a legenda virava uma fileira de caixas de tamanhos diferentes.
        // 340px é o mínimo pra caber nome + marca sem cortar; o min(100%, …) evita que a coluna
        // estoure a tela em celular, onde o espaço é menor que isso.
        <div className={`${rota && rota.length > 0 ? 'mt-1.5' : 'mt-3'} grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-2`}>
          {pins.map((pin, i) => {
            const isSel = selectedId === pin.produto.id
            return (
              <div key={pin.produto.id}
                onClick={() => handlePinClick(pin)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all animate-fade-in-up ${
                  isSel ? 'shadow-md scale-[1.02]' : 'hover:shadow-sm'
                }`}
                style={{ borderColor: pin.color, backgroundColor: `${pin.color}12`, '--stagger-delay': `${Math.min(i, 15) * 25}ms` } as React.CSSProperties}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                  style={{ backgroundColor: pin.color }}>{pin.idx}</span>
                <img
                  src={getImagemProduto(pin.produto)}
                  alt={pin.produto.categoria}
                  className={`w-9 h-9 rounded-md ${ajusteFoto(pin.produto, 'p-0.5')} flex-shrink-0`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 line-clamp-2 sm:line-clamp-1">{pin.produto.produto}</p>
                  <p className="text-gray-700 truncate">{pin.produto.corredor}<span className="hidden sm:inline"> · {pin.produto.categoria}</span></p>
                  {(pin.produto as any).preco != null && (
                    <p className="text-xs font-bold text-lm-green mt-0.5">
                      {Number((pin.produto as any).preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                  {!semCarrinho && <button
                    onClick={(e) => handleAdicionar(pin.produto.id, pin.produto.estoque, e)}
                    disabled={pin.produto.estoque === 0}
                    aria-label="Adicionar ao carrinho"
                    className="w-9 h-9 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: pin.color }}
                  >
                    {adicionadoId === pin.produto.id ? <Check size={14} /> : <ShoppingCart size={14} />}
                  </button>}
                  {onSelect && (
                    <span className="text-xs font-bold shrink-0" style={{ color: pin.color }}>
                      Ver →
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}