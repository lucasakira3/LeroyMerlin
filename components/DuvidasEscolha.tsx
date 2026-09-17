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
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <h2 className="text-lg font-bold text-lm-dark text-center mb-1">Como podemos ajudar?</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Escolha como prefere tirar sua dúvida</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {OPCOES.map(({ modo, titulo, descricao, icone: Icone }) => (
            <button
              key={modo}
              type="button"
              onClick={() => onEscolher(modo)}
              className="flex flex-col items-start gap-3 bg-white border-2 border-gray-100 rounded-2xl p-5 text-left hover:border-lm-green/40 hover:shadow-soft-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-lm-green/10 text-lm-green flex items-center justify-center">
                <Icone size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <p className="font-bold text-lm-dark">{titulo}</p>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
                <p className="text-xs text-gray-500 mt-1">{descricao}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
