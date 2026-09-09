import Link from 'next/link'
import { Ruler, Scale } from 'lucide-react'
import ProjetoWizard from '@/components/ProjetoWizard'
import TermometroOrcamento from '@/components/TermometroOrcamento'
import Card from '@/components/ui/Card'

const FERRAMENTAS = [
  { href: '/medir', icone: Ruler, label: 'Régua virtual', texto: 'Estime medidas por foto' },
  { href: '/comparar', icone: Scale, label: 'Comparador de produtos', texto: 'Compare até 3 produtos lado a lado' },
]

// A pedido do usuário: a coluna de apoio virou uma "bancada de ferramentas" ao lado do chat
// (a "bancada" de trabalho) — só o card de ferramentas (régua virtual, comparador) fica na
// coluna direita agora; os cards explicativos (como funciona, por que a IA acerta, navegar
// direto/prefere conversar) foram removidos a pedido do usuário.
export default function ProjetoPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
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
        </div>
      </div>
    </div>
  )
}
