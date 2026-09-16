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
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6 lg:gap-8">
        <ContaSidebar nome={usuario.nome ?? usuario.email} email={usuario.email} />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </main>
  )
}
