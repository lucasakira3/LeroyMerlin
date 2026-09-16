'use client'

import { useEffect, useState } from 'react'
import MeusDados from '@/components/MeusDados'
import { getUsuarioLogado, type UsuarioLogado } from '@/lib/clientAuth'

export default function PerfilPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null)

  useEffect(() => {
    setUsuario(getUsuarioLogado())
  }, [])

  if (!usuario) return null

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Informações do Perfil</h1>
      <MeusDados
        email={usuario.email}
        nomeAtual={usuario.nome ?? usuario.email}
        onNomeAtualizado={novoNome => setUsuario({ ...usuario, nome: novoNome })}
      />
    </div>
  )
}
