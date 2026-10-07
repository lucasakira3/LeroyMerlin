'use client'

import { useState } from 'react'
import { Lock, Check, X, ShieldCheck } from 'lucide-react'
import Card from './ui/Card'
import Button from './ui/Button'
import { atualizarConta, validarLogin, getConta } from '@/lib/clientContas'
import { trocarSenha } from '@/lib/authServidor'
import { SENHA_MINIMA } from '@/lib/authTipos'
import { showToast } from '@/lib/toast'

// Extraído de MeusDados.tsx — troca de senha vira sua própria seção "Segurança",
// separada de "Informações do Perfil".
export default function SegurancaConta({ email }: { email: string }) {
  const [trocando, setTrocando] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const conta = getConta(email)

  function cancelar() {
    setTrocando(false)
    setSenhaAtual('')
    setNovaSenha('')
    setErro(null)
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!senhaAtual || !novaSenha) {
      setErro('Preencha a senha atual e a nova senha.')
      return
    }
    if (novaSenha.length < SENHA_MINIMA) {
      setErro(`A nova senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`)
      return
    }

    // A senha é conferida e trocada no servidor (lib/authServidor.ts).
    const resultado = await trocarSenha('cliente', senhaAtual, novaSenha)
    if (resultado === 'sem-banco') {
      // Plano B (banco fora do ar): a senha desta conta só existe neste aparelho.
      if (validarLogin(email, senhaAtual) !== 'ok') {
        setErro('Senha atual incorreta.')
        return
      }
      atualizarConta(email, { senha: novaSenha })
    } else if (resultado !== 'ok') {
      setErro(
        resultado === 'senha_incorreta' ? 'Senha atual incorreta.'
          : resultado === 'sem_sessao' ? 'Sua sessão terminou. Saia e entre de novo para trocar a senha.'
          : 'Não foi possível trocar a senha agora. Tente de novo.'
      )
      return
    }

    showToast('Senha atualizada')
    cancelar()
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck size={16} className="text-gray-600" />
        <h2 className="text-sm font-bold text-gray-900">Segurança</h2>
      </div>
      {conta && (
        <p className="text-sm text-gray-700 mb-4">
          Conta criada em {new Date(conta.criadoEm).toLocaleDateString('pt-BR')}
        </p>
      )}

      {!trocando ? (
        <Button variant="secondary" size="sm" onClick={() => setTrocando(true)}>
          <Lock size={14} /> Alterar senha
        </Button>
      ) : (
        <form onSubmit={salvar} className="space-y-2.5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Senha atual</label>
            <input
              type="password"
              value={senhaAtual}
              onChange={e => { setSenhaAtual(e.target.value); setErro(null) }}
              autoFocus
              className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-500 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nova senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-500 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
            />
          </div>
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
              className="flex items-center gap-1.5 text-gray-700 text-base font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X size={14} /> Cancelar
            </button>
          </div>
        </form>
      )}
    </Card>
  )
}
