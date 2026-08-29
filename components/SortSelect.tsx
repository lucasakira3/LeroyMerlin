'use client'

import { ArrowUpDown } from 'lucide-react'
import { OPCOES_ORDENACAO, type CriterioOrdenacao } from '@/lib/ordenarProdutos'

interface Props {
  value: CriterioOrdenacao
  onChange: (valor: CriterioOrdenacao) => void
}

export default function SortSelect({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <ArrowUpDown size={13} className="text-gray-400 flex-shrink-0" />
      <select
        value={value}
        onChange={e => onChange(e.target.value as CriterioOrdenacao)}
        className="h-7 px-2 rounded-full border border-gray-200 text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
      >
        {OPCOES_ORDENACAO.map(o => (
          <option key={o.valor} value={o.valor}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
