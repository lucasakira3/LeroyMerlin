import ReguaVirtual from '@/components/ReguaVirtual'
import PageHeader from '@/components/ui/PageHeader'

export default function MedirPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Régua Virtual"
        description="Não sabe quanto material comprar? Tire uma foto e a IA estima a medida do espaço."
      />
      <ReguaVirtual />
    </div>
  )
}
