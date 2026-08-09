import { Suspense } from 'react'
import ListaCompartilhadaView from '@/components/ListaCompartilhadaView'

export default function ListaCompartilhadaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ListaCompartilhadaView />
    </Suspense>
  )
}
