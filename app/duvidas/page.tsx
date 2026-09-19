'use client'

import { useState } from 'react'
import { ArrowLeft, Bot, Headset, Phone, MessageCircle, Clock, ShieldCheck } from 'lucide-react'
import DuvidasChat from '@/components/DuvidasChat'
import DuvidasEscolha from '@/components/DuvidasEscolha'
import ConversaEspecialista from '@/components/ConversaEspecialista'
import Card from '@/components/ui/Card'

type Modo = 'escolha' | 'robo' | 'especialista'

const CABECALHOS: Record<Exclude<Modo, 'escolha'>, { titulo: string; descricao: string; icone: typeof Bot }> = {
  robo: { titulo: 'Assistente Robô', descricao: 'Powered by Gemini · responde em segundos', icone: Bot },
  especialista: { titulo: 'Especialista', descricao: 'Conversa direto com um funcionário da loja', icone: Headset },
}

export default function DuvidasPage() {
  const [modo, setModo] = useState<Modo>('escolha')

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-220px)]">

        {/* Chat — coluna principal */}
        <Card padding="none" className="lg:col-span-2 flex flex-col overflow-hidden h-[70vh] lg:h-auto">
          {modo === 'escolha' ? (
            <DuvidasEscolha onEscolher={setModo} />
          ) : (
            <>
              {/* Header */}
              <div className="border-b border-gray-500 px-4 py-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModo('escolha')}
                  aria-label="Voltar"
                  className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-gray-400 hover:text-lm-green hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="w-2 h-2 rounded-full bg-lm-green animate-pulse flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-lm-dark">{CABECALHOS[modo].titulo}</p>
                  <p className="text-xs text-gray-500">{CABECALHOS[modo].descricao}</p>
                </div>
              </div>

              {modo === 'robo' ? <DuvidasChat /> : <ConversaEspecialista />}
            </>
          )}
        </Card>

        {/* Sidebar — contato humano */}
        <div className="space-y-4">

          {/* Falar com especialista humano */}
          <Card padding="sm">
            <h2 className="text-sm font-bold text-lm-dark mb-1">Prefere falar com um especialista?</h2>
            <p className="text-xs text-gray-500 mb-4">
              Nossos consultores estão disponíveis para tirar dúvidas técnicas e ajudar no seu projeto.
            </p>

            <a
              href="https://wa.me/551140071380"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 w-full bg-[#25D366] text-black px-4 py-3 rounded-xl text-sm font-semibold hover:bg-[#20b858] transition-colors mb-3"
            >
              <MessageCircle size={18} />
              WhatsApp Leroy Merlin
            </a>

            <a
              href="tel:40205376"
              className="flex items-center gap-3 w-full bg-white border-2 border-lm-green text-lm-green px-4 py-3 rounded-xl text-sm font-semibold hover:bg-lm-green/5 transition-colors"
            >
              <Phone size={18} />
              4020-5376
            </a>
          </Card>

          {/* Horários */}
          <Card padding="sm">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={15} className="text-lm-green" />
              <h3 className="text-sm font-semibold text-lm-dark">Horário de atendimento</h3>
            </div>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Segunda a Sábado</span>
                <span className="font-medium">08h – 20h</span>
              </div>
              <div className="flex justify-between">
                <span>Domingo</span>
                <span className="font-medium">10h – 18h</span>
              </div>
              <div className="flex justify-between">
                <span>Feriados</span>
                <span className="font-medium">10h – 16h</span>
              </div>
            </div>
          </Card>

          {/* Garantia */}
          <div className="bg-lm-green/5 border border-lm-green/20 rounded-card p-4">
            <div className="flex items-start gap-2">
              <ShieldCheck size={16} className="text-lm-green mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-lm-green mb-1">Atendimento especializado</p>
                <p className="text-xs text-gray-600">
                  Nossos consultores têm treinamento técnico em todas as categorias de produtos e podem ajudar com projetos de reforma e instalação.
                </p>
              </div>
            </div>
          </div>

          {/* CTA agendamento */}
          <a
            href="/agendamento"
            className="block w-full bg-lm-yellow text-black text-center py-3 rounded-xl text-sm font-bold hover:bg-yellow-300 transition-colors"
          >
            Agendar visita presencial →
          </a>
        </div>
      </div>
    </div>
  )
}
