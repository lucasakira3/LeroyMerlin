import ProjetoWizard from '@/components/ProjetoWizard'
import SugestoesProjetoGuiado from '@/components/SugestoesProjetoGuiado'
import PageHeader from '@/components/ui/PageHeader'

export default function ProjetoPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        title="Projeto Guiado"
        description="Descreva o que você quer fazer e a IA monta a lista completa de materiais."
      />
      <ProjetoWizard />
      <SugestoesProjetoGuiado />
    </div>
  )
}
