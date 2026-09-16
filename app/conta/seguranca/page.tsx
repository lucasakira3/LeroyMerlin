'use client'

import { useEffect, useState } from 'react'
import SegurancaConta from '@/components/SegurancaConta'
import { getUsuarioLogado } from '@/lib/clientAuth'

export default function SegurancaPage() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const usuario = getUsuarioLogado()
    if (usuario) setEmail(usuario.email)
  }, [])

  if (!email) return null

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Segurança</h1>
      <SegurancaConta email={email} />
    </div>
  )
}
