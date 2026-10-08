'use client'

import { Bot, Headset, ChevronRight } from 'lucide-react'

interface Props {
  onEscolher: (modo: 'robo' | 'especialista') => void
}

const OPCOES = [
  {
    modo: 'robo' as const,
    titulo: 'Robô',
    descricao: 'Para tirar dúvidas simples e pontuais, um ajudante para o dia a dia.',
    icone: Bot,
  },
  {
    modo: 'especialista' as const,
    titulo: 'Especialista',
    descricao: 'Para dúvidas complexas e suporte personalizado.',
    icone: Headset,
  },
]

// Tela inicial de /duvidas — antes o chat da IA aparecia direto; agora o cliente escolhe
// entre o robô (IA, lib/gemini.ts) e um especialista humano de verdade (conversa real com
// um funcionário, ver components/ConversaEspecialista.tsx e lib/conversasEspecialista.ts).
export default function DuvidasEscolha({ onEscolher }: Props) {
  return (
    // `m-auto` no bloco de dentro (e não items-center/justify-center aqui): centraliza quando
    // sobra espaço e, quando falta, deixa rolar desde o começo em vez de cortar o topo.
    <div className="flex-1 flex p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-3xl m-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-lm-dark text-center mb-2">Como podemos ajudar?</h2>
        <p className="text-base text-gray-700 text-center mb-6 sm:mb-10">Escolha como prefere tirar sua dúvida</p>

        {/* No celular cada opção é uma faixa deitada (ícone à esquerda, texto à direita): em
            pé, como no computador, a segunda opção ficava cortada pra fora do cartão. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
          {OPCOES.map(({ modo, titulo, descricao, icone: Icone }) => (
            <button
              key={modo}
              type="button"
              onClick={() => onEscolher(modo)}
              className="flex flex-row sm:flex-col items-center sm:items-start gap-4 bg-white border-2 border-gray-200 dark:border-gray-500 rounded-2xl sm:rounded-3xl p-5 sm:p-10 text-left hover:border-lm-green/40 hover:shadow-soft-lg transition-all"
            >
              <div className="w-14 h-14 sm:w-20 sm:h-20 flex-shrink-0 rounded-2xl bg-lm-green/10 text-lm-green flex items-center justify-center">
                <Icone size={40} className="w-7 h-7 sm:w-10 sm:h-10" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xl sm:text-2xl font-bold text-lm-dark">{titulo}</p>
                  <ChevronRight size={24} className="text-gray-300" />
                </div>
                <p className="text-sm sm:text-base text-gray-700 mt-1 sm:mt-2">{descricao}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
