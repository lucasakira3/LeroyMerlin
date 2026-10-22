// Desenho da planta da loja (o mesmo em todas as lojas do MVP) e as medidas dele.
// Usado pelo mapa da busca, do Projeto Guiado e do carrinho (components/StoreMap.tsx) e pela
// navegação guiada no celular (/navegar, components/NavegacaoLoja.tsx). Ficar num lugar só
// garante que um produto aparece no mesmo corredor, no mesmo ponto, nas duas telas.
// Tudo em unidades do viewBox (0 0 VW VH) do SVG.
import { getCorredorRowIndex } from '@/lib/corredores'
import { shelfColor } from '@/lib/corredorCores'

export const VW = 1200
export const VH = 590
export const LMARG = 14
export const CORR_W = 46
export const SHELF_W = 14
export const AISLE_W = 18
export const SHELF_H = 118

// Cor de cada pin pelo número dele (1ª cor pro 1, 2ª pro 2...), igual em todas as telas.
export const CORES_DOS_PINS = ['#ef4444','#3b82f6','#f59e0b','#10b981','#8b5cf6','#ec4899','#06b6d4','#84cc16']

export const ROW1_Y = 118
export const ROW2_Y = 340

// Ponto do produto no mapa: meio do corredor (entre as duas prateleiras), na metade da altura.
export function posicaoDoCorredor(corridorNorm: string): { x: number; y: number } | null {
  const pos = getCorredorRowIndex(corridorNorm)
  if (!pos) return null
  return {
    x: LMARG + pos.idx * CORR_W + CORR_W / 2,
    y: (pos.row === 1 ? ROW1_Y : ROW2_Y) + SHELF_H / 2,
  }
}

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

function renderCorredor(n: number, row: 1 | 2) {
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

// O desenho fixo: jardim, corredores de circulação, as duas fileiras de prateleiras com os
// nomes dos setores, os caixas e a entrada. Vai dentro de um <svg viewBox="0 0 VW VH">.
export function DesenhoPlantaLoja() {
  return (
    <g>
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
    </g>
  )
}
