'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUsuarioLogado, type UsuarioLogado } from '@/lib/clientAuth'
import ContaSidebar from '@/components/ContaSidebar'

// Casca compartilhada por toda /conta/* (hub, pedidos, perguntas, avaliações, favoritos,
// perfil, segurança, cartões, endereços, privacidade) — barra lateral fixa + verificação de
// login uma vez só. Cada page.tsx embaixo cuida só do próprio conteúdo.
export default function ContaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null)

  useEffect(() => {
    const u = getUsuarioLogado()
    if (!u) {
      router.push('/funcionario/login')
      return
    }
    setUsuario(u)
  }, [router])

  if (!usuario) return null

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Barra lateral encostada na borda esquerda de verdade, fora do container
          centralizado — não faz sentido ela ficar boiando no meio da tela em monitor largo. */}
      <div className="lg:w-64 flex-shrink-0 px-4 sm:px-6 lg:px-8 py-6">
        <ContaSidebar nome={usuario.nome ?? usuario.email} email={usuario.email} />
      </div>
      {/* O conteúdo em si (cards, listas) continua centralizado no espaço restante. */}
      <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 flex justify-center">
        <div className="w-full max-w-4xl">{children}</div>
      </div>
    </main>
  )
}
