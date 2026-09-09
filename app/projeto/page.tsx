import Link from 'next/link'
import {
  Ruler, Scale, Mic, Sparkles, ListChecks, Bot, MapPin, Clock,
  Droplet, Zap, PaintRoller, HardHat, MessageCircle, CalendarCheck,
} from 'lucide-react'
import ProjetoWizard from '@/components/ProjetoWizard'
import TermometroOrcamento from '@/components/TermometroOrcamento'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'

const FERRAMENTAS = [
  { href: '/medir', icone: Ruler, label: 'Régua virtual', texto: 'Estime medidas por foto' },
  { href: '/comparar', icone: Scale, label: 'Comparador de produtos', texto: 'Compare até 3 produtos lado a lado' },
]

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

// A pedido do usuário: a coluna de apoio virou uma "bancada de ferramentas" ao lado do chat
// (a "bancada" de trabalho) — sem os rótulos de categoria em maiúsculo que cada caixinha
// tinha antes (COMO FUNCIONA / NAVEGAR DIRETO / etc.), pra ficar mais limpo, tipo um
// toolbox. O card de ferramentas (régua virtual, comparador) veio pro topo da coluna — antes
// a régua virtual só aparecia como um banner solto acima do chat, agora mora junto das
// outras ferramentas, sem duplicar o mesmo convite em dois lugares.
export default function ProjetoPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Projeto Guiado"
        description="Descreva o que você quer fazer e a IA monta a lista completa de materiais."
      />

      <div className="max-w-2xl mb-6">
        <TermometroOrcamento />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">
        {/* Chat — a bancada */}
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

        {/* Coluna de apoio — as ferramentas, ao lado da bancada */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card padding="sm">
            <div className="space-y-1">
              {FERRAMENTAS.map(ferramenta => (
                <Link
                  key={ferramenta.href}
                  href={ferramenta.href}
                  className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 hover:bg-lm-green/5 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-lm-green/10 flex items-center justify-center text-lm-green flex-shrink-0">
                    <ferramenta.icone size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-lm-dark">{ferramenta.label}</p>
                    <p className="text-xs text-gray-500">{ferramenta.texto}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          <Card padding="sm">
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
              <div className="border-t border-gray-100 my-1" />
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
