'use client'

import { ListOrdered, Hammer, PaintRoller, Zap, Droplets, Layers, Sparkles, Ruler, type LucideIcon } from 'lucide-react'
import Card from './ui/Card'

interface ItemComEtapa {
  material: string
  etapa_ordem?: number
  etapa_nome?: string
}

// O nome da etapa vem de texto livre da IA ("Preparação da parede", "Pintura"...), então o
// ícone é escolhido por palavra-chave, com ListOrdered como fallback — mesmo padrão de
// lib/comodoIcones.ts.
const ICONES_POR_PALAVRA: [string[], LucideIcon][] = [
  [['pintur', 'tinta', 'massa'], PaintRoller],
  [['elétric', 'eletric', 'fiação', 'fiacao', 'ilumin'], Zap],
  [['hidr', 'encanament', 'água', 'agua', 'vedaç', 'vedac'], Droplets],
  [['piso', 'revestiment', 'azulejo', 'rejunte', 'contrapiso'], Layers],
  [['acabament', 'limpez', 'finaliz', 'instalaç', 'instalac'], Sparkles],
  [['medi', 'planej', 'marcaç', 'marcac'], Ruler],
  [['prepar', 'demoli', 'remoç', 'remoc', 'estrutur', 'obra'], Hammer],
]

function iconeDaEtapa(nome: string): LucideIcon {
  const lower = nome.toLowerCase()
  const achado = ICONES_POR_PALAVRA.find(([palavras]) => palavras.some(p => lower.includes(p)))
  return achado ? achado[1] : ListOrdered
}

export default function ProjetoTimeline({ itens }: { itens: ItemComEtapa[] }) {
  const comEtapa = itens.filter(i => i.etapa_nome)
  if (comEtapa.length === 0) return null

  const etapasMap = new Map<number, { nome: string; itens: string[] }>()
  for (const item of comEtapa) {
    const ordem = item.etapa_ordem ?? 1
    const atual = etapasMap.get(ordem)
    if (atual) {
      atual.itens.push(item.material)
    } else {
      etapasMap.set(ordem, { nome: item.etapa_nome!, itens: [item.material] })
    }
  }

  const etapas = Array.from(etapasMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([ordem, dados]) => ({ ordem, ...dados }))

  if (etapas.length < 2) return null

  return (
    <Card className="mb-2">
      <div className="flex items-center gap-2 mb-4">
        <ListOrdered size={15} className="text-lm-green" />
        <h3 className="text-sm font-bold text-gray-900">Ordem sugerida</h3>
      </div>
      <div className="space-y-0">
        {etapas.map((etapa, i) => {
          const Icone = iconeDaEtapa(etapa.nome)
          return (
            <div key={etapa.ordem} className="flex gap-3">
              <div className="flex flex-col items-center flex-shrink-0">
                <span className="relative w-9 h-9 rounded-xl bg-lm-green/10 text-lm-green flex items-center justify-center">
                  <Icone size={18} />
                  <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-lm-green text-white text-[9px] font-black flex items-center justify-center">
                    {etapa.ordem}
                  </span>
                </span>
                {i < etapas.length - 1 && <span className="w-px flex-1 bg-lm-green/20 my-1" />}
              </div>
              <div className={`min-w-0 ${i < etapas.length - 1 ? 'pb-4' : ''}`}>
                <p className="text-sm font-semibold text-gray-900">{etapa.nome}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {etapa.itens.map(m => (
                    <span key={m} className="text-[11px] text-gray-600 bg-gray-100 rounded-full px-2 py-0.5">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
