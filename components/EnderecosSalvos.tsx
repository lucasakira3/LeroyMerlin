'use client'

import { useEffect, useState } from 'react'
import { MapPin, Star, Trash2, Plus } from 'lucide-react'
import {
  getEnderecos,
  salvarEndereco,
  removerEndereco,
  restaurarEndereco,
  definirEnderecoPadrao,
  type Endereco,
} from '@/lib/clientEnderecos'
import { showToast } from '@/lib/toast'

export default function EnderecosSalvos({ email }: { email: string }) {
  const [enderecos, setEnderecos] = useState<Endereco[]>([])
  const [novoAberto, setNovoAberto] = useState(false)
  const [rotulo, setRotulo] = useState('')
  const [texto, setTexto] = useState('')

  useEffect(() => {
    setEnderecos(getEnderecos(email))
  }, [email])

  function recarregar() {
    setEnderecos(getEnderecos(email))
  }

  function adicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    salvarEndereco(email, rotulo, texto)
    setRotulo('')
    setTexto('')
    setNovoAberto(false)
    recarregar()
  }

  function remover(endereco: Endereco) {
    removerEndereco(email, endereco.id)
    recarregar()
    showToast('Endereço removido', () => {
      restaurarEndereco(email, endereco)
      recarregar()
    })
  }

  function tornarPadrao(id: string) {
    definirEnderecoPadrao(email, id)
    recarregar()
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Endereços salvos</h2>

      {enderecos.length === 0 && !novoAberto && (
        <p className="text-sm text-gray-500 py-2 mb-3">Nenhum endereço salvo ainda.</p>
      )}

      {enderecos.length > 0 && (
        <div className="space-y-2 mb-3">
          {enderecos.map(end => (
            <div
              key={end.id}
              className="flex items-center justify-between gap-3 bg-white rounded-card shadow-soft border border-gray-100 p-3"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <MapPin size={16} className="text-lm-green flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-900">{end.rotulo}</p>
                    {end.padrao && (
                      <span className="text-[10px] font-bold text-lm-green bg-lm-green/10 px-1.5 py-0.5 rounded-full">
                        Padrão
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{end.texto}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!end.padrao && (
                  <button
                    type="button"
                    onClick={() => tornarPadrao(end.id)}
                    aria-label="Tornar endereço padrão"
                    className="p-1.5 text-gray-300 hover:text-lm-green transition-colors"
                  >
                    <Star size={15} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remover(end)}
                  aria-label="Remover endereço"
                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!novoAberto ? (
        <button
          type="button"
          onClick={() => setNovoAberto(true)}
          className="flex items-center gap-1.5 text-sm font-semibold text-lm-green hover:underline"
        >
          <Plus size={14} /> Adicionar endereço
        </button>
      ) : (
        <form onSubmit={adicionar} className="bg-white rounded-card shadow-soft border border-gray-100 p-4 space-y-2">
          <input
            type="text"
            value={rotulo}
            onChange={e => setRotulo(e.target.value)}
            placeholder="Rótulo (ex: Casa, Trabalho)"
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
          />
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Endereço completo (rua, número, bairro, cidade)"
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-lm-green/30"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-lm-green text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => { setNovoAberto(false); setRotulo(''); setTexto('') }}
              className="text-gray-500 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
