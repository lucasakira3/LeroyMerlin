import { Suspense } from 'react'
import OfertasView from '@/components/OfertasView'
import PageHeader from '@/components/ui/PageHeader'

export default function OfertasPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="Ofertas" description="Produtos com desconto por tempo limitado." />
      <Suspense fallback={<div className="min-h-[40vh]" />}>
        <OfertasView />
      </Suspense>
    </div>
  )
}
