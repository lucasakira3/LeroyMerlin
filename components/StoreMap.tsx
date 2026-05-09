'use client'

import { useState } from 'react'
import type { SearchResult } from '@/types/produto'

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

function getPos(corridorNorm: string): { x: number; y: number } | null {
  const slug = corridorNorm.toLowerCase().trim()

  const numM = slug.match(/^corredor-(\d+)$/)
  if (numM) {
    const n = parseInt(numM[1])
    if (n < 1 || n > 50) return null
    const row = n <= 25 ? 1 : 2
    const idx = n <= 25 ? n - 1 : n - 26
    return {
      x: LMARG + idx * CORR_W + CORR_W / 2,
      y: (row === 1 ? ROW1_Y : ROW2_Y) + SHELF_H / 2,
    }
  }

  const mapped = specialToNumeric(slug)
  if (mapped) {
    const row = mapped <= 25 ? 1 : 2
    const idx = mapped <= 25 ? mapped - 1 : mapped - 26
    return {
      x: LMARG + idx * CORR_W + CORR_W / 2,
      y: (row === 1 ? ROW1_Y : ROW2_Y) + SHELF_H / 2,
    }
  }

  return null
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
}

export default function StoreMap({ resultados, loja, totalEstimado }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  const pins = resultados
    .map((r, i) => {
      const pos = getPos(r.produto.corredor_normalizado)
      if (!pos) return null
      return { ...r, pos, color: PIN_COLORS[i % PIN_COLORS.length], idx: i + 1 }
    })
    .filter(Boolean) as Array<SearchResult & { pos: {x:number;y:number}; color:string; idx:number }>

  const hovPin = hovered ? pins.find(p => p.produto.id === hovered) : null

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

      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
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
          {pins.map(pin => (
            <g key={pin.produto.id}
              onMouseEnter={() => setHovered(pin.produto.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}>
              <circle cx={pin.pos.x} cy={pin.pos.y+2} r="11" fill="rgba(0,0,0,0.2)" />
              <circle cx={pin.pos.x} cy={pin.pos.y} r="15" fill={pin.color} opacity="0">
                <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={pin.pos.x} cy={pin.pos.y} r="11" fill={pin.color} stroke="white" strokeWidth="2.5" />
              <text x={pin.pos.x} y={pin.pos.y+4} textAnchor="middle"
                fontSize="10" fontWeight="800" fill="white" fontFamily="Inter,sans-serif">{pin.idx}</text>
            </g>
          ))}

          {/* Tooltip */}
          {hovPin && (() => {
            const { pos, produto, color } = hovPin
            const preco = (produto as any).preco
            const precoStr = preco != null
              ? Number(preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
              : null
            const tooltipH = precoStr ? 80 : 64
            const tx = Math.min(Math.max(pos.x - 95, 8), VW - 212)
            const ty = pos.y > 350 ? pos.y - tooltipH - 4 : pos.y + 18
            return (
              <g>
                <rect x={tx} y={ty} width="204" height={tooltipH} rx="7"
                  fill="white" stroke={color} strokeWidth="1.8"
                  filter="drop-shadow(0 3px 8px rgba(0,0,0,0.18))" />
                <rect x={tx} y={ty} width="204" height="20" rx="7" fill={color} opacity="0.12" />
                <text x={tx+10} y={ty+14} fontSize="9" fill={color} fontWeight="800" fontFamily="Inter,sans-serif">
                  📍 {produto.corredor}
                </text>
                <foreignObject x={tx+8} y={ty+20} width="188" height="30">
                  <div xmlns="http://www.w3.org/1999/xhtml"
                    style={{ fontSize: '10px', color: '#1f2937', lineHeight: '1.35',
                      fontFamily: 'Inter,sans-serif', overflow: 'hidden',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const }}>
                    {produto.produto}
                  </div>
                </foreignObject>
                {precoStr && (
                  <text x={tx+10} y={ty+58} fontSize="11" fontWeight="800" fill="#00843d" fontFamily="Inter,sans-serif">
                    {precoStr}
                  </text>
                )}
                <text x={tx+10} y={ty+tooltipH-6} fontSize="8" fill="#94a3b8" fontFamily="Inter,sans-serif">
                  {produto.estoque > 0 ? `${produto.estoque} un. em estoque` : 'Sem estoque'}
                </text>
              </g>
            )
          })()}
        </svg>
      </div>

      {/* Legenda */}
      {pins.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {pins.map(pin => (
            <div key={pin.produto.id}
              onMouseEnter={() => setHovered(pin.produto.id)}
              onMouseLeave={() => setHovered(null)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all ${
                hovered === pin.produto.id ? 'shadow-md scale-[1.03]' : 'hover:shadow-sm'
              }`}
              style={{ borderColor: pin.color, backgroundColor: `${pin.color}12` }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                style={{ backgroundColor: pin.color }}>{pin.idx}</span>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate max-w-[180px]">{pin.produto.produto}</p>
                <p className="text-gray-500">{pin.produto.corredor} · {pin.produto.categoria}</p>
                {(pin.produto as any).preco != null && (
                  <p className="text-xs font-bold text-lm-green mt-0.5">
                    {Number((pin.produto as any).preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
