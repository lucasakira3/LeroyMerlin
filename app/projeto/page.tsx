import Link from 'next/link'
import {
  Ruler, ChevronRight, Mic, Sparkles, ListChecks, Bot, MapPin, Clock,
  Droplet, Zap, PaintRoller, HardHat, MessageCircle, CalendarCheck,
} from 'lucide-react'
import ProjetoWizard from '@/components/ProjetoWizard'
import SugestoesProjetoGuiado from '@/components/SugestoesProjetoGuiado'
import TermometroOrcamento from '@/components/TermometroOrcamento'
import PageHeader from '@/components/ui/PageHeader'

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

// Layout de 3 colunas em telas largas (lg+): as laterais eram puro cinza vazio quando a
// página só tinha uma coluna central — usuário pediu explicitamente pra preencher esses
// vãos com conteúdo real, não só alargar o centro. Laterais viram apoio ao fluxo principal
// (como funciona, atalhos de categoria, canais alternativos de ajuda), nunca o próprio
// formulário — por isso ficam `hidden` abaixo de `lg`, onde não sobra espaço horizontal pra
// justificar dividir a tela em 3 colunas.
export default function ProjetoPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-[240px_minmax(0,1fr)_240px] lg:gap-8 xl:grid-cols-[280px_minmax(0,1fr)_280px] xl:gap-10">
        {/* Coluna esquerda — explica o fluxo pra quem chega sem contexto */}
        <aside className="hidden lg:flex lg:flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          <div className="bg-white rounded-card shadow-soft border border-gray-100 p-5">
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
          </div>

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
        </aside>

        {/* Coluna central — fluxo principal, inalterado */}
        <div className="max-w-2xl mx-auto w-full space-y-6">
          <PageHeader
            title="Projeto Guiado"
            description="Descreva o que você quer fazer e a IA monta a lista completa de materiais."
          />

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

          <ProjetoWizard />
          <SugestoesProjetoGuiado />
        </div>

        {/* Coluna direita — atalhos pra quem prefere navegar ou falar com alguém */}
        <aside className="hidden lg:flex lg:flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          <div className="bg-white rounded-card shadow-soft border border-gray-100 p-5">
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
          </div>

          <div className="bg-white rounded-card shadow-soft border border-gray-100 p-5">
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
          </div>
        </aside>
      </div>
    </div>
  )
}
