import { Suspense } from 'react'
import PedidoCompartilhadoView from '@/components/PedidoCompartilhadoView'

export default function PedidoCompartilhadoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <PedidoCompartilhadoView />
    </Suspense>
  )
}
