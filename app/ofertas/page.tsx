import OfertasView from '@/components/OfertasView'
import PageHeader from '@/components/ui/PageHeader'

export default function OfertasPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="Ofertas" description="Produtos com desconto por tempo limitado." />
      <OfertasView />
    </div>
  )
}
