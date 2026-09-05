import { Suspense } from 'react'
import BuscarView from '@/components/BuscarView'

export default function BuscarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-lm-light" />}>
      <BuscarView />
    </Suspense>
  )
}
