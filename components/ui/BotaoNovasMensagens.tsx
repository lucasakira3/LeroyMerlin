import { ArrowDown } from 'lucide-react'

interface Props {
  quantidade: number
  onClick: () => void
}

// Aparece sobre o fim da área de mensagens quando chega mensagem nova e a pessoa está lendo
// mais acima — nesse caso o chat não rola sozinho (ver lib/hooks/useChatScroll.ts).
// O pai precisa ser `relative`. A centralização é feita pelo flex de fora, não por
// transform no botão: a animação de entrada usa transform e desfaria o translate.
export default function BotaoNovasMensagens({ quantidade, onClick }: Props) {
  if (quantidade <= 0) return null
  return (
    <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center pointer-events-none">
      <button
        type="button"
        onClick={onClick}
        className="pointer-events-auto flex items-center gap-1.5 bg-lm-green text-white text-sm font-bold pl-4 pr-3 py-1.5 rounded-full shadow-lg hover:bg-green-700 transition-colors animate-fade-in-up"
      >
        {quantidade === 1 ? 'Nova mensagem' : `${quantidade} novas mensagens`}
        <ArrowDown size={15} />
      </button>
    </div>
  )
}
