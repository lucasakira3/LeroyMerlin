import { Suspense } from 'react'
import OfertasView from '@/components/OfertasView'

export default function OfertasPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<div className="min-h-[40vh]" />}>
        <OfertasView />
      </Suspense>
    </div>
  )
}
