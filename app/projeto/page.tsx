import ProjetoWizard from '@/components/ProjetoWizard'
import PageHeader from '@/components/ui/PageHeader'

export default function ProjetoPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <PageHeader
        title="Projeto Guiado"
        description="Descreva o que você quer fazer e a IA monta a lista completa de materiais."
      />
      <ProjetoWizard />
    </div>
  )
}
