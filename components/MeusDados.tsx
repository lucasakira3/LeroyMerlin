'use client'

import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { atualizarConta, validarLogin } from '@/lib/clientContas'
import { loginUsuario } from '@/lib/clientAuth'
import { showToast } from '@/lib/toast'

interface Props {
  email: string
  nomeAtual: string
  onNomeAtualizado: (novoNome: string) => void
}

export default function MeusDados({ email, nomeAtual, onNomeAtualizado }: Props) {
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(nomeAtual)
  const [trocarSenha, setTrocarSenha] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  function cancelar() {
    setEditando(false)
    setNome(nomeAtual)
    setTrocarSenha(false)
    setSenhaAtual('')
    setNovaSenha('')
    setErro(null)
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (trocarSenha) {
      if (!senhaAtual || !novaSenha) {
        setErro('Preencha a senha atual e a nova senha.')
        return
      }
      // E-mail nunca muda aqui de propósito — é a chave usada em pedidos, avaliações,
      // perfil e histórico (ver lib/clientContas.ts).
      if (validarLogin(email, senhaAtual) !== 'ok') {
        setErro('Senha atual incorreta.')
        return
      }
    }

    const nomeFinal = nome.trim() || nomeAtual
    atualizarConta(email, { nome: nomeFinal, senha: trocarSenha ? novaSenha : undefined })
    loginUsuario(email, nomeFinal)
    onNomeAtualizado(nomeFinal)
    showToast('Dados atualizados')
    setEditando(false)
  }

  if (!editando) {
    return (
      <section className="flex items-center justify-between bg-white rounded-card shadow-soft border border-gray-100 p-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">{nomeAtual}</p>
          <p className="text-xs text-gray-400">{email}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="flex items-center gap-1.5 text-sm font-semibold text-lm-green hover:underline flex-shrink-0"
        >
          <Pencil size={14} /> Editar dados
        </button>
      </section>
    )
  }

  return (
    <form onSubmit={salvar} className="bg-white rounded-card shadow-soft border border-gray-100 p-4 space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Nome</label>
        <input
          type="text"
          value={nome}
          onChange={e => setNome(e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
        />
      </div>

      {!trocarSenha ? (
        <button
          type="button"
          onClick={() => setTrocarSenha(true)}
          className="text-sm font-semibold text-lm-green hover:underline"
        >
          Alterar senha
        </button>
      ) : (
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Senha atual</label>
            <input
              type="password"
              value={senhaAtual}
              onChange={e => setSenhaAtual(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Nova senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
            />
          </div>
        </div>
      )}

      {erro && <p className="text-xs text-red-600">{erro}</p>}

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
  )
}
