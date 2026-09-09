import Link from 'next/link'
import { Ruler, Scale } from 'lucide-react'
import ProjetoWizard from '@/components/ProjetoWizard'
import TermometroOrcamento from '@/components/TermometroOrcamento'
import Card from '@/components/ui/Card'

const FERRAMENTAS = [
  { href: '/medir', icone: Ruler, label: 'Régua virtual', texto: 'Estime medidas por foto', bg: 'bg-lm-green/10', cor: 'text-lm-green' },
  { href: '/comparar', icone: Scale, label: 'Comparador de produtos', texto: 'Compare até 3 produtos lado a lado', bg: 'bg-lm-yellow/20', cor: 'text-yellow-700' },
]

// A pedido do usuário: chat expandido (coluna fixa e mais estreita pras ferramentas, em vez
// de 1/3 da grade, + altura mínima pra parecer uma janela de chat de verdade, não só o
// tamanho do conteúdo atual) e as ferramentas viraram ícones "soltos" (sem card/borda ao
// redor), grandes, espaçados e cada um com sua cor — pra parecer uma bancada com ferramentas
// penduradas do lado, não uma lista de links.
export default function ProjetoPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mb-6">
        <TermometroOrcamento />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-8 lg:items-start">
        {/* Chat — a bancada, expandida */}
        <Card padding="none" className="flex flex-col overflow-hidden lg:min-h-[640px]">
          <div className="border-b border-gray-100 px-4 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-lm-green animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-lm-dark">Assistente de Projetos</p>
              <p className="text-xs text-gray-500">Powered by Gemini · monta sua lista de materiais</p>
            </div>
          </div>

          <ProjetoWizard />
        </Card>

        {/* Ferramentas — soltas, ao lado da bancada */}
        <div className="flex flex-col items-center gap-10 pt-4 lg:sticky lg:top-6 lg:self-start">
          {FERRAMENTAS.map(ferramenta => (
            <Link
              key={ferramenta.href}
              href={ferramenta.href}
              className="group flex flex-col items-center text-center gap-3 w-full"
            >
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 group-hover:-rotate-3 ${ferramenta.bg}`}>
                <ferramenta.icone size={36} className={ferramenta.cor} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-bold text-lm-dark">{ferramenta.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 max-w-[160px]">{ferramenta.texto}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
