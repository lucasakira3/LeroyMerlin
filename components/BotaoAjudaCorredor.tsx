'use client'

import { useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { solicitarAjuda } from '@/lib/ajudaCorredor'
import { getUsuarioLogado } from '@/lib/clientAuth'

interface Props {
  produtoId: string
  produtoNome: string
  corredor: string
}

export default function BotaoAjudaCorredor({ produtoId, produtoNome, corredor }: Props) {
  const [enviado, setEnviado] = useState(false)

  function handleClick() {
    if (enviado) return
    solicitarAjuda({
      produtoId,
      produtoNome,
      corredor,
      clienteNome: getUsuarioLogado()?.nome,
    })
    setEnviado(true)
    setTimeout(() => setEnviado(false), 8000)
  }

  return (
    <button
      onClick={handleClick}
      disabled={enviado}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
        enviado
          ? 'bg-lm-green/10 text-lm-green cursor-default'
          : 'bg-gray-100 text-gray-600 hover:bg-lm-yellow/20 hover:text-amber-700'
      }`}
    >
      {enviado ? <Check size={13} /> : <Bell size={13} />}
      {enviado ? 'Funcionário avisado' : 'Preciso de ajuda aqui'}
    </button>
  )
}
