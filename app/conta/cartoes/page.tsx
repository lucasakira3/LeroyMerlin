'use client'

import { useEffect, useState } from 'react'
import CartoesSalvos from '@/components/CartoesSalvos'
import { getUsuarioLogado } from '@/lib/clientAuth'

export default function CartoesPage() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const usuario = getUsuarioLogado()
    if (usuario) setEmail(usuario.email)
  }, [])

  if (!email) return null

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Cartões Salvos</h1>
      <CartoesSalvos email={email} />
    </div>
  )
}
