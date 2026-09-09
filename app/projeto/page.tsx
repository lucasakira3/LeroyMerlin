import Link from 'next/link'
import {
  Ruler, ChevronRight, Mic, Sparkles, ListChecks, Bot, MapPin, Clock,
  Droplet, Zap, PaintRoller, HardHat, MessageCircle, CalendarCheck,
} from 'lucide-react'
import ProjetoWizard from '@/components/ProjetoWizard'
import TermometroOrcamento from '@/components/TermometroOrcamento'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'

const COMO_FUNCIONA = [
  { icone: Mic, titulo: 'Descreva ou fale', texto: 'Conte o que quer reformar, em texto ou por voz.' },
  { icone: Sparkles, titulo: 'A IA analisa', texto: 'O Gemini identifica os materiais certos pro seu projeto.' },
  { icone: ListChecks, titulo: 'Lista pronta', texto: 'Receba a lista completa com preços e corredores da loja.' },
]

const CATEGORIAS_RAPIDAS = [
  { slug: 'hidraulica', label: 'Hidráulica', icone: Droplet },
  { slug: 'eletrica', label: 'Elétrica', icone: Zap },
  { slug: 'pintura', label: 'Pintura', icone: PaintRoller },
  { slug: 'construcao', label: 'Construção', icone: HardHat },
]

// Mesmo padrão visual de app/duvidas/page.tsx: chat (2/3 da largura) + coluna de apoio
// empilhada (1/3) — usuário pediu explicitamente pra deixar essa aba com "estilo de chat
// bot", já que o Projeto Guiado também é, no fundo, uma conversa guiada com a IA. As 4
// caixinhas que antes ficavam divididas nos dois lados (2 à esquerda, 2 à direita) agora
// ficam todas empilhadas numa coluna só, à direita do chat. A lista de sugestões
// personalizadas saiu daqui a pedido do usuário — ele vai decidir depois onde ela mora.
export default function ProjetoPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Projeto Guiado"
        description="Descreva o que você quer fazer e a IA monta a lista completa de materiais."
      />

      <div className="max-w-2xl mb-6 space-y-4">
        <TermometroOrcamento />

        <Link
          href="/medir"
          className="flex items-center gap-4 bg-lm-green/5 border border-lm-green/20 rounded-xl px-5 py-4 hover:bg-lm-green/10 transition-colors"
        >
          <div className="w-11 h-11 rounded-lg bg-lm-green/10 flex items-center justify-center text-lm-green flex-shrink-0">
            <Ruler size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-lm-dark">Não sabe as medidas do espaço?</p>
            <p className="text-xs text-gray-500 mt-0.5">Use a régua virtual — tire uma foto e a IA estima quanto material comprar.</p>
          </div>
          <ChevronRight size={18} className="text-lm-green flex-shrink-0" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">
        {/* Chat — coluna principal */}
        <Card padding="none" className="lg:col-span-2 flex flex-col overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-lm-green animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-lm-dark">Assistente de Projetos</p>
              <p className="text-xs text-gray-500">Powered by Gemini · monta sua lista de materiais</p>
            </div>
          </div>

          <ProjetoWizard />
        </Card>

        {/* Coluna de apoio — as 4 caixinhas empilhadas */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card padding="sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Como funciona</h3>
            <ol className="space-y-4">
              {COMO_FUNCIONA.map((passo, i) => (
                <li key={passo.titulo} className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-lm-green/10 text-lm-green flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-lm-dark">{passo.titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{passo.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <div className="bg-lm-dark rounded-card p-5">
            <p className="text-sm font-semibold text-white mb-3">Por que a IA acerta</p>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-xs text-white/70">
                <Bot size={14} className="text-lm-green flex-shrink-0" /> Conversa em português, sem termos técnicos
              </li>
              <li className="flex items-center gap-2 text-xs text-white/70">
                <MapPin size={14} className="text-lm-green flex-shrink-0" /> Já aponta o corredor certo na loja
              </li>
              <li className="flex items-center gap-2 text-xs text-white/70">
                <Clock size={14} className="text-lm-green flex-shrink-0" /> Disponível 24h, sem fila de espera
              </li>
            </ul>
          </div>

          <Card padding="sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Navegar direto</h3>
            <div className="space-y-1">
              {CATEGORIAS_RAPIDAS.map(cat => (
                <Link
                  key={cat.slug}
                  href={`/produtos?categoria=${cat.slug}`}
                  className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-lm-green hover:bg-lm-green/5 rounded-lg px-2.5 py-2 transition-colors"
                >
                  <cat.icone size={15} className="flex-shrink-0" /> {cat.label}
                </Link>
              ))}
            </div>
          </Card>

          <Card padding="sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Prefere conversar?</h3>
            <div className="space-y-1">
              <Link
                href="/duvidas"
                className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-lm-green hover:bg-lm-green/5 rounded-lg px-2.5 py-2 transition-colors"
              >
                <MessageCircle size={15} className="flex-shrink-0" /> Tire dúvidas com a IA
              </Link>
              <Link
                href="/agendamento"
                className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-lm-green hover:bg-lm-green/5 rounded-lg px-2.5 py-2 transition-colors"
              >
                <CalendarCheck size={15} className="flex-shrink-0" /> Agendar visita à loja
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
