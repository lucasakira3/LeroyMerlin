import Link from 'next/link'
import { Ruler, ChevronRight } from 'lucide-react'
import ProjetoWizard from '@/components/ProjetoWizard'
import SugestoesProjetoGuiado from '@/components/SugestoesProjetoGuiado'
import TermometroOrcamento from '@/components/TermometroOrcamento'
import PageHeader from '@/components/ui/PageHeader'

export default function ProjetoPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        title="Projeto Guiado"
        description="Descreva o que você quer fazer e a IA monta a lista completa de materiais."
      />

      <div className="max-w-2xl">
        <TermometroOrcamento />
      </div>

      <Link
        href="/medir"
        className="flex items-center gap-3 bg-lm-green/5 border border-lm-green/20 rounded-xl px-4 py-3 hover:bg-lm-green/10 transition-colors max-w-2xl"
      >
        <div className="w-9 h-9 rounded-lg bg-lm-green/10 flex items-center justify-center text-lm-green flex-shrink-0">
          <Ruler size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-lm-dark">Não sabe as medidas do espaço?</p>
          <p className="text-xs text-gray-500">Use a régua virtual — tire uma foto e a IA estima quanto material comprar.</p>
        </div>
        <ChevronRight size={16} className="text-lm-green flex-shrink-0" />
      </Link>

      <ProjetoWizard />
      <SugestoesProjetoGuiado />
    </div>
  )
}
