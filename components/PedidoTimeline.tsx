import { Fragment } from 'react'
import { Check, PackageCheck, PackageSearch, Store, Truck, type LucideIcon } from 'lucide-react'

interface Props {
  etapas: string[]
  etapaAtual: number
  /** Data/hora prevista (ou já ocorrida) de cada etapa — mesma ordem de `etapas`. */
  previsoes?: Date[]
}

// Ícone por nome de etapa (strings vêm de lib/statusPedido.ts) — combinado com um
// fallback genérico caso o texto mude lá e não seja atualizado aqui junto.
const ICONES: Record<string, LucideIcon> = {
  'Confirmado': Check,
  'Em preparação': PackageSearch,
  'Enviado': Truck,
  'Entregue': PackageCheck,
  'Pronto para retirada': Store,
}

function formatarPrevisao(data: Date, ehPassado: boolean): string {
  const hoje = new Date()
  const mesmoDia = data.toDateString() === hoje.toDateString()
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (mesmoDia) return `${ehPassado ? '' : 'Previsto '}hoje, ${hora}`
  const dataFmt = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return `${ehPassado ? '' : 'Previsto '}${dataFmt}, ${hora}`
}

// Linha do tempo visual do status do pedido (ver lib/statusPedido.ts) — substitui/complementa
// o badge de texto puro por uma sequência de passos, comum em telas de rastreio de pedido
// de lojas grandes. `etapaAtual` já vem calculada a partir do tempo real decorrido desde a
// compra, não é um valor arbitrário. `previsoes` é opcional pra não quebrar quem ainda não
// passa a prop (nenhum call site atual, mas mantém o componente robusto a chamadas antigas).
export default function PedidoTimeline({ etapas, etapaAtual, previsoes }: Props) {
  return (
    <div className="flex items-start">
      {etapas.map((etapa, i) => {
        const Icone = ICONES[etapa] ?? Check
        const concluida = i < etapaAtual
        const atual = i === etapaAtual
        return (
          <Fragment key={etapa}>
            <div className="flex flex-col items-center gap-1 w-[4.5rem] flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  concluida || atual
                    ? 'bg-lm-green text-white'
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                } ${atual ? 'ring-4 ring-lm-green/20' : ''}`}
              >
                <Icone size={15} />
              </div>
              <span
                className={`text-[10px] text-center leading-tight ${
                  i <= etapaAtual ? 'text-gray-700 font-semibold' : 'text-gray-400'
                }`}
              >
                {etapa}
              </span>
              {previsoes?.[i] && (
                <span className="text-[9px] text-center leading-tight text-gray-400">
                  {formatarPrevisao(previsoes[i], i <= etapaAtual)}
                </span>
              )}
            </div>
            {i < etapas.length - 1 && (
              <div className={`h-0.5 flex-1 mt-4 ${i < etapaAtual ? 'bg-lm-green' : 'bg-gray-200'}`} />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
