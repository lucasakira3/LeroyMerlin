'use client'

import { useEffect, useState } from 'react'
import EnderecosSalvos from '@/components/EnderecosSalvos'
import { getUsuarioLogado } from '@/lib/clientAuth'

export default function EnderecosPage() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const usuario = getUsuarioLogado()
    if (usuario) setEmail(usuario.email)
  }, [])

  if (!email) return null

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Endereços Salvos</h1>
      <EnderecosSalvos email={email} />
    </div>
  )
}
