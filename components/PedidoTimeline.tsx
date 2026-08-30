import { Fragment } from 'react'
import { Check } from 'lucide-react'

interface Props {
  etapas: string[]
  etapaAtual: number
}

// Linha do tempo visual do status do pedido (ver lib/statusPedido.ts) — substitui/complementa
// o badge de texto puro por uma sequência de passos, comum em telas de rastreio de pedido
// de lojas grandes. `etapaAtual` já vem calculada a partir do tempo real decorrido desde a
// compra, não é um valor arbitrário.
export default function PedidoTimeline({ etapas, etapaAtual }: Props) {
  return (
    <div className="flex items-start">
      {etapas.map((etapa, i) => (
        <Fragment key={etapa}>
          <div className="flex flex-col items-center gap-1 w-16 flex-shrink-0">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                i < etapaAtual
                  ? 'bg-lm-green text-white'
                  : i === etapaAtual
                  ? 'bg-lm-green text-white ring-4 ring-lm-green/20'
                  : 'bg-gray-100 text-gray-400 border border-gray-200'
              }`}
            >
              {i < etapaAtual ? <Check size={11} /> : <span className="text-[9px] font-bold">{i + 1}</span>}
            </div>
            <span
              className={`text-[9px] text-center leading-tight ${
                i <= etapaAtual ? 'text-gray-700 font-semibold' : 'text-gray-400'
              }`}
            >
              {etapa}
            </span>
          </div>
          {i < etapas.length - 1 && (
            <div className={`h-0.5 flex-1 mt-2.5 ${i < etapaAtual ? 'bg-lm-green' : 'bg-gray-200'}`} />
          )}
        </Fragment>
      ))}
    </div>
  )
}
