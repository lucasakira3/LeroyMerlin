import { Suspense } from 'react'
import ProdutosView from '@/components/ProdutosView'

export default function ProdutosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ProdutosView />
    </Suspense>
  )
}
