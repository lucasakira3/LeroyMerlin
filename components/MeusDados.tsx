'use client'

import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { atualizarConta } from '@/lib/clientContas'
import { loginUsuario } from '@/lib/clientAuth'
import { showToast } from '@/lib/toast'
import Card from './ui/Card'

interface Props {
  email: string
  nomeAtual: string
  onNomeAtualizado: (novoNome: string) => void
}

// Só o nome é editável aqui — troca de senha virou uma seção própria (ver
// components/SegurancaConta.tsx). E-mail nunca muda, é a chave usada em clientPedidos.ts,
// clientAvaliacoes.ts, clientPerfil.ts, clientHistorico.ts e clientPerguntas.ts.
export default function MeusDados({ email, nomeAtual, onNomeAtualizado }: Props) {
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(nomeAtual)

  function cancelar() {
    setEditando(false)
    setNome(nomeAtual)
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    const nomeFinal = nome.trim() || nomeAtual
    atualizarConta(email, { nome: nomeFinal })
    loginUsuario(email, nomeFinal)
    onNomeAtualizado(nomeFinal)
    showToast('Dados atualizados')
    setEditando(false)
  }

  if (!editando) {
    return (
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{nomeAtual}</p>
          <p className="text-xs text-gray-400">{email}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="flex items-center gap-1.5 text-sm font-semibold text-lm-green hover:underline flex-shrink-0"
        >
          <Pencil size={14} /> Editar
        </button>
      </Card>
    )
  }

  return (
    <Card>
      <form onSubmit={salvar} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Nome</label>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            autoFocus
            className="w-full h-10 px-3 rounded-xl border border-gray-400 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">E-mail</label>
          <input
            type="text"
            value={email}
            disabled
            className="w-full h-10 px-3 rounded-xl border border-gray-400 text-sm bg-gray-50 text-gray-400"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-lm-green text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Check size={14} /> Salvar
          </button>
          <button
            type="button"
            onClick={cancelar}
            className="flex items-center gap-1.5 text-gray-500 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X size={14} /> Cancelar
          </button>
        </div>
      </form>
    </Card>
  )
}
