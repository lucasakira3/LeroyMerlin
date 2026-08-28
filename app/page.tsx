import { Suspense } from 'react'
import HomeView from '@/components/HomeView'

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-lm-light" />}>
      <HomeView />
    </Suspense>
  )
}
