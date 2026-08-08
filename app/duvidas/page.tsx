import DuvidasChat from '@/components/DuvidasChat'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import { Phone, MessageCircle, Clock, ShieldCheck } from 'lucide-react'

export default function DuvidasPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <PageHeader
        title="Dúvidas"
        description="Converse com o assistente especialista ou fale com um consultor humano."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">

        {/* Chat — coluna principal */}
        <Card padding="none" className="lg:col-span-2 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-100 px-4 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-lm-green animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-lm-dark">Assistente Especialista</p>
              <p className="text-xs text-gray-500">Powered by Gemini · responde em segundos</p>
            </div>
          </div>

          <DuvidasChat />
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
              className="flex items-center gap-3 w-full bg-[#25D366] text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-[#20b858] transition-colors mb-3"
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
            className="block w-full bg-lm-yellow text-lm-dark text-center py-3 rounded-xl text-sm font-bold hover:bg-yellow-300 transition-colors"
          >
            Agendar visita presencial →
          </a>
        </div>
      </div>
    </div>
  )
}
