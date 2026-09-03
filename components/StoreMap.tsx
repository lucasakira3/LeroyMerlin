'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'
import type { SearchResult } from '@/types/produto'
import { trackProductView } from '@/lib/hooks/useProductTracker'
import { getImagemCategoria } from '@/lib/categoriaImagens'

const VW = 1200
const VH = 590
const LMARG = 14
const CORR_W = 46
const SHELF_W = 14
const AISLE_W = 18
const SHELF_H = 118

const ROW1_Y = 118
const ROW2_Y = 340

function shelfColor(n: number): { fill: string; stroke: string } {
  if (n <= 8)  return { fill: '#fef3c7', stroke: '#d97706' }
  if (n <= 15) return { fill: '#fef9c3', stroke: '#ca8a04' }
  if (n <= 22) return { fill: '#dbeafe', stroke: '#2563eb' }
  if (n <= 28) return { fill: '#fff7ed', stroke: '#ea580c' }
  if (n <= 35) return { fill: '#dcfce7', stroke: '#16a34a' }
  if (n <= 43) return { fill: '#f1f5f9', stroke: '#64748b' }
  if (n <= 47) return { fill: '#e0f2fe', stroke: '#0284c7' }
  return               { fill: '#fdf4ff', stroke: '#9333ea' }
}

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
}

export default function StoreMap({ resultados, loja, totalEstimado, onSelect }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [adicionadoId, setAdicionadoId] = useState<string | null>(null)

  function handleAdicionar(produtoId: string, estoque: number, e?: React.MouseEvent) {
    e?.stopPropagation()
    if (estoque === 0) return
    adicionarAoCarrinho(produtoId)
    setAdicionadoId(produtoId)
    setTimeout(() => setAdicionadoId(prev => prev === produtoId ? null : prev), 1500)
  }

  const pins = resultados
    .map((r, i) => {
      const pos = getPos(r.produto.corredor_normalizado)
      if (!pos) return null
      return { ...r, pos, color: PIN_COLORS[i % PIN_COLORS.length], idx: i + 1 }
    })
    .filter(Boolean) as Array<SearchResult & { pos: {x:number;y:number}; color:string; idx:number }>

  // Vários produtos no mesmo corredor caem exatamente nas mesmas coordenadas — sem isso,
  // o pin desenhado por último cobre os outros por completo e eles somem do mapa. Espalha
  // os pins de um mesmo grupo num pequeno círculo ao redor do ponto original.
  const gruposPorPosicao = new Map<string, typeof pins>()
  pins.forEach(p => {
    const chave = `${p.pos.x},${p.pos.y}`
    gruposPorPosicao.set(chave, [...(gruposPorPosicao.get(chave) ?? []), p])
  })
  gruposPorPosicao.forEach(grupo => {
    if (grupo.length <= 1) return
    const raio = 12
    grupo.forEach((p, gi) => {
      const angulo = (2 * Math.PI * gi) / grupo.length - Math.PI / 2
      p.pos = { x: p.pos.x + raio * Math.cos(angulo), y: p.pos.y + raio * Math.sin(angulo) }
    })
  })

  const selPin = selectedId ? pins.find(p => p.produto.id === selectedId) : null

  function handlePinClick(pin: typeof pins[0]) {
    // Quando existe um `onSelect` (ex.: busca, mapa com detalhes habilitados), o clique no
    // pin já abre o modal de detalhes do produto diretamente — antes era preciso clicar no
    // pin (selecionar) e depois clicar num botão "Ver detalhes (o que gerava mais cliques para o cliente)" no popup pra só então ver
    // as informações do produto. 
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
        <text x={x+SHELF_W+AISLE_W/2} y={y+13} textAnchor="middle"
          fontSize="8.5" fontWeight="700" fill="#374151" fontFamily="Inter,sans-serif">{label}</text>
        <text x={x+SHELF_W+AISLE_W/2} y={y+SHELF_H-5} textAnchor="middle"
          fontSize="7" fill="#94a3b8" fontFamily="Inter,sans-serif">↕</text>
        <rect x={x+SHELF_W+AISLE_W} y={y} width={SHELF_W} height={SHELF_H} fill={fill} stroke={stroke} strokeWidth="0.8" rx="1" />
        {[25,50,75,100].filter(oy => oy < SHELF_H).map(oy => (
          <line key={oy} x1={x+SHELF_W+AISLE_W+2} y1={y+oy} x2={x+CORR_W-2} y2={y+oy} stroke={stroke} strokeWidth="0.5" opacity="0.5" />
        ))}
      </g>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-xs font-bold text-gray-700">{loja}</span>
          <span className="ml-2 text-[11px] text-gray-400">Planta da loja · 50 corredores</span>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="border border-gray-100 rounded-card overflow-hidden shadow-soft bg-white relative">
        {/* Info box HTML — aparece ao clicar num pin */}
        {selPin && (() => {
          const { pos, produto, color } = selPin
          const preco = (produto as any).preco as number | undefined
          const leftPct = (pos.x / VW) * 100
          const topPct  = (pos.y / VH)  * 100
          const flipX = leftPct > 70
          const flipY = topPct  > 55
          return (
            <div
              className="absolute z-20 w-52 bg-white rounded-xl shadow-xl border-2 pointer-events-auto"
              style={{
                borderColor: color,
                left:   flipX ? 'auto' : `calc(${leftPct}% + 14px)`,
                right:  flipX ? `calc(${100 - leftPct}% + 14px)` : 'auto',
                top:    flipY ? 'auto' : `calc(${topPct}% + 14px)`,
                bottom: flipY ? `calc(${100 - topPct}% + 14px)` : 'auto',
              }}
            >
              <div className="rounded-t-[10px] px-3 py-2" style={{ backgroundColor: `${color}18` }}>
                <p className="text-[11px] font-black" style={{ color }}>📍 {produto.corredor}</p>
              </div>
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-gray-800 leading-tight mb-1 line-clamp-2">
                  {produto.produto}
                </p>
                {preco != null && (
                  <p className="text-sm font-black text-lm-green">
                    {Number(preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {produto.estoque > 0 ? `${produto.estoque} un. em estoque` : 'Sem estoque'}
                </p>
                <div className="mt-2 flex gap-1.5">
                  <button
                    onClick={(e) => handleAdicionar(produto.id, produto.estoque, e)}
                    disabled={produto.estoque === 0}
                    aria-label="Adicionar ao carrinho"
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {adicionadoId === produto.id ? <Check size={14} /> : <ShoppingCart size={14} />}
                  </button>
                  {onSelect && (
                    <button
                      onClick={() => {
                        trackProductView({ id: produto.id, nome: produto.produto, categoria: produto.categoria })
                        onSelect(produto)
                        setSelectedId(null)
                      }}
                      className="flex-1 text-[11px] font-bold text-white rounded-lg py-1.5 transition-colors"
                      style={{ backgroundColor: color }}
                    >
                      Ver detalhes →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" style={{ display: 'block' }}>
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
                <text x={(x1+x2)/2} y={ROW1_Y-7} textAnchor="middle"
                  fontSize="7.5" fontWeight="700" fill="#374151" fontFamily="Inter,sans-serif">{d.label}</text>
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
                <text x={(x1+x2)/2} y={ROW2_Y-7} textAnchor="middle"
                  fontSize="7.5" fontWeight="700" fill="#374151" fontFamily="Inter,sans-serif">{d.label}</text>
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

          {/* Pins */}
          {pins.map(pin => {
            const isSel = selectedId === pin.produto.id
            return (
              <g key={pin.produto.id}
                onClick={() => handlePinClick(pin)}
                style={{ cursor: 'pointer' }}>
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

      {/* Legenda */}
      {pins.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {pins.map((pin, i) => {
            const isSel = selectedId === pin.produto.id
            return (
              <div key={pin.produto.id}
                onClick={() => {
                  if (onSelect) onSelect(pin.produto)
                  else handlePinClick(pin)
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all animate-fade-in-up ${
                  isSel ? 'shadow-md scale-[1.02]' : 'hover:shadow-sm'
                }`}
                style={{ borderColor: pin.color, backgroundColor: `${pin.color}12`, '--stagger-delay': `${Math.min(i, 15) * 25}ms` } as React.CSSProperties}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                  style={{ backgroundColor: pin.color }}>{pin.idx}</span>
                <img
                  src={getImagemCategoria(pin.produto.categoria, pin.produto.id)}
                  alt={pin.produto.categoria}
                  className="w-9 h-9 rounded-md object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate max-w-[180px]">{pin.produto.produto}</p>
                  <p className="text-gray-500">{pin.produto.corredor} · {pin.produto.categoria}</p>
                  {(pin.produto as any).preco != null && (
                    <p className="text-xs font-bold text-lm-green mt-0.5">
                      {Number((pin.produto as any).preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => handleAdicionar(pin.produto.id, pin.produto.estoque, e)}
                    disabled={pin.produto.estoque === 0}
                    aria-label="Adicionar ao carrinho"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: pin.color }}
                  >
                    {adicionadoId === pin.produto.id ? <Check size={13} /> : <ShoppingCart size={13} />}
                  </button>
                  {onSelect && (
                    <span className="text-[10px] font-bold shrink-0" style={{ color: pin.color }}>
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