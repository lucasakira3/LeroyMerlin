'use client'

import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { trocarSenha } from '@/lib/authServidor'
import { SENHA_MINIMA } from '@/lib/authTipos'
import { showToast } from '@/lib/toast'

// Botão "Trocar senha do painel" da barra lateral do funcionário. O painel tem uma senha
// só, do time todo (app/api/auth/funcionario/route.ts); qualquer pessoa logada no painel
// pode trocá-la, desde que saiba a atual. Quem já estava logado continua logado.
export default function TrocarSenhaPainel() {
  const [aberto, setAberto] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  function fechar() {
    setAberto(false)
    setSenhaAtual('')
    setNovaSenha('')
    setErro(null)
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    if (novaSenha.length < SENHA_MINIMA) {
      setErro(`A nova senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`)
      return
    }
    setSalvando(true)
    const resultado = await trocarSenha('funcionario', senhaAtual, novaSenha)
    setSalvando(false)
    if (resultado === 'ok') {
      showToast('Senha do painel trocada. Avise o time.')
      fechar()
      return
    }
    setErro(
      resultado === 'senha_incorreta' ? 'Senha atual incorreta.'
        : resultado === 'sem_sessao' ? 'Sua sessão terminou. Saia e entre de novo no painel.'
        : resultado === 'sem-banco' ? 'O painel ainda não tem senha neste site: o banco de dados não respondeu.'
        : 'Não foi possível trocar a senha agora. Tente de novo.'
    )
  }

  const campo = 'w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-500 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30'

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="w-full flex items-center gap-3 px-4 py-3 mb-1 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <KeyRound size={18} />
        Trocar senha do painel
      </button>

      <Modal open={aberto} onClose={fechar} title="Trocar senha do painel" maxWidthClass="md:max-w-md">
        <form onSubmit={salvar} className="p-5 space-y-3">
          <p className="text-sm text-gray-700">
            A senha do painel é a mesma para todo o time da loja. Depois de trocar, avise quem usa o painel.
          </p>
          <div>
            <label htmlFor="painel-senha-atual" className="block text-sm font-semibold text-gray-700 mb-1">Senha atual</label>
            <input
              id="painel-senha-atual"
              type="password"
              value={senhaAtual}
              onChange={e => { setSenhaAtual(e.target.value); setErro(null) }}
              autoFocus
              required
              className={campo}
            />
          </div>
          <div>
            <label htmlFor="painel-senha-nova" className="block text-sm font-semibold text-gray-700 mb-1">Nova senha</label>
            <input
              id="painel-senha-nova"
              type="password"
              value={novaSenha}
              onChange={e => { setNovaSenha(e.target.value); setErro(null) }}
              required
              className={campo}
            />
          </div>
          {erro && <p role="alert" className="text-sm text-red-600">{erro}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={fechar}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>{salvando ? 'Trocando...' : 'Trocar senha'}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
