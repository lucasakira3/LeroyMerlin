import Link from 'next/link'
import { Ruler, ChevronRight } from 'lucide-react'
import ProjetoWizard from '@/components/ProjetoWizard'
import SugestoesProjetoGuiado from '@/components/SugestoesProjetoGuiado'
import TermometroOrcamento from '@/components/TermometroOrcamento'
import PageHeader from '@/components/ui/PageHeader'

// Container único, centralizado, na mesma largura do miolo do ProjetoWizard
// (max-w-3xl) — antes cada bloco tinha sua própria largura/alinhamento (Termômetro e o
// convite pra régua virtual em max-w-2xl colados à esquerda, o wizard em max-w-3xl
// centralizado), o que deixava uma faixa cinza enorme e assimétrica à direita nas telas
// largas. Com tudo dentro da mesma coluna centralizada, a página usa o espaço de forma
// consistente do topo ao fim, sem caixas "perdidas" no canto.
export default function ProjetoPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
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
    </div>
  )
}
