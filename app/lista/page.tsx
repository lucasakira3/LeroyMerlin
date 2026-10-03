import { Suspense } from 'react'
import ListaCompartilhadaView from '@/components/ListaCompartilhadaView'

export default function ListaCompartilhadaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ListaCompartilhadaView />
    </Suspense>
  )
}
