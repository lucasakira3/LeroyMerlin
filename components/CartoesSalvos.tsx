'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Star, Trash2, Plus } from 'lucide-react'
import {
  getCartoes, salvarCartao, removerCartao, definirCartaoPadrao,
  type CartaoSalvo,
} from '@/lib/clientCartoes'
import { formatarNumeroCartao, formatarValidade, detectarBandeira, type Bandeira } from '@/lib/pagamento'
import { showToast } from '@/lib/toast'

interface FormCartao {
  apelido: string
  numero: string
  nomeImpresso: string
  validade: string
}

const FORM_VAZIO: FormCartao = { apelido: '', numero: '', nomeImpresso: '', validade: '' }

// Gestão de cartões salvos em /conta/cartoes: listar, adicionar e remover — mesmo padrão
// de EnderecosSalvos.tsx. O número completo só existe no estado do formulário enquanto o
// usuário digita; ao salvar, só os 4 últimos dígitos + bandeira vão pro localStorage (ver
// lib/clientCartoes.ts e o comentário em lib/pagamento.ts sobre nunca guardar o número
// inteiro). É a mesma carteira usada no checkout (app/carrinho/page.tsx).
export default function CartoesSalvos({ email }: { email: string }) {
  const [cartoes, setCartoes] = useState<CartaoSalvo[]>([])
  const [novoAberto, setNovoAberto] = useState(false)
  const [form, setForm] = useState<FormCartao>(FORM_VAZIO)

  useEffect(() => {
    setCartoes(getCartoes(email))
  }, [email])

  function recarregar() {
    setCartoes(getCartoes(email))
  }

  const digitos = form.numero.replace(/\D/g, '')
  const bandeira: Bandeira = detectarBandeira(form.numero)
  const formValido = digitos.length >= 13 && /^\d{2}\/\d{2}$/.test(form.validade) && form.nomeImpresso.trim().length > 2

  function adicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!formValido) return
    salvarCartao(email, {
      apelido: form.apelido,
      bandeira,
      ultimosDigitos: digitos.slice(-4),
      nomeImpresso: form.nomeImpresso.trim(),
      validade: form.validade,
    })
    setForm(FORM_VAZIO)
    setNovoAberto(false)
    recarregar()
    showToast('Cartão salvo')
  }

  function remover(cartao: CartaoSalvo) {
    removerCartao(email, cartao.id)
    recarregar()
    showToast('Cartão removido')
  }

  function tornarPadrao(id: string) {
    definirCartaoPadrao(email, id)
    recarregar()
  }

  return (
    <div>
      {cartoes.length === 0 && !novoAberto && (
        <p className="text-sm text-gray-500 py-2 mb-3">Nenhum cartão salvo ainda.</p>
      )}

      {cartoes.length > 0 && (
        <div className="space-y-2 mb-3">
          {cartoes.map(c => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 bg-white rounded-card shadow-soft border border-gray-200 p-3"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <CreditCard size={16} className="text-lm-green flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-900">{c.apelido}</p>
                    {c.padrao && (
                      <span className="text-[10px] font-bold text-lm-green bg-lm-green/10 px-1.5 py-0.5 rounded-full">
                        Padrão
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {c.bandeira} final {c.ultimosDigitos} · vence {c.validade}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!c.padrao && (
                  <button
                    type="button"
                    onClick={() => tornarPadrao(c.id)}
                    aria-label="Tornar cartão padrão"
                    className="p-1.5 text-gray-300 hover:text-lm-green transition-colors"
                  >
                    <Star size={15} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remover(c)}
                  aria-label="Remover cartão"
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
          <Plus size={14} /> Adicionar cartão
        </button>
      ) : (
        <form onSubmit={adicionar} className="bg-white rounded-card shadow-soft border border-gray-200 p-4 space-y-2.5">
          <input
            type="text"
            value={form.apelido}
            onChange={e => setForm(f => ({ ...f, apelido: e.target.value }))}
            placeholder="Apelido (opcional, ex: Cartão do trabalho)"
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
          />
          <input
            type="text"
            value={form.numero}
            onChange={e => setForm(f => ({ ...f, numero: formatarNumeroCartao(e.target.value) }))}
            placeholder="Número do cartão"
            inputMode="numeric"
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
          />
          <input
            type="text"
            value={form.nomeImpresso}
            onChange={e => setForm(f => ({ ...f, nomeImpresso: e.target.value }))}
            placeholder="Nome impresso no cartão"
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
          />
          <input
            type="text"
            value={form.validade}
            onChange={e => setForm(f => ({ ...f, validade: formatarValidade(e.target.value) }))}
            placeholder="MM/AA"
            inputMode="numeric"
            className="w-24 h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
          />
          <p className="text-[11px] text-gray-400">
            Cartão fictício — só os 4 últimos dígitos ficam salvos, nunca o número completo.
          </p>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={!formValido}
              className="bg-lm-green text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => { setNovoAberto(false); setForm(FORM_VAZIO) }}
              className="text-gray-500 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
