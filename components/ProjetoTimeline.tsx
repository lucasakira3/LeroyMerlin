'use client'

import { ListOrdered } from 'lucide-react'
import Card from './ui/Card'

interface ItemComEtapa {
  material: string
  etapa_ordem?: number
  etapa_nome?: string
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
        {etapas.map((etapa, i) => (
          <div key={etapa.ordem} className="flex gap-3">
            <div className="flex flex-col items-center flex-shrink-0">
              <span className="w-6 h-6 rounded-full bg-lm-green text-white text-xs font-bold flex items-center justify-center">
                {etapa.ordem}
              </span>
              {i < etapas.length - 1 && <span className="w-px flex-1 bg-lm-green/20 my-1" />}
            </div>
            <div className={`min-w-0 ${i < etapas.length - 1 ? 'pb-4' : ''}`}>
              <p className="text-sm font-semibold text-gray-900">{etapa.nome}</p>
              <p className="text-xs text-gray-500 mt-0.5">{etapa.itens.join(' · ')}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
