'use client'

import { useState } from 'react'
import { KeyRound, Mail, User, ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import { contaExiste, criarConta, validarLogin, getConta } from '@/lib/clientContas'
import { loginUsuario } from '@/lib/clientAuth'

type Modo = 'login' | 'cadastro'

export default function ClienteAuthForm() {
  const [modo, setModo] = useState<Modo>('login')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function trocarModo(novoModo: Modo) {
    setModo(novoModo)
    setErro(null)
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      const resultado = validarLogin(email, senha)
      if (resultado === 'nao_encontrada') {
        setErro('Não encontramos uma conta com esse email.')
        setLoading(false)
        return
      }
      if (resultado === 'senha_incorreta') {
        setErro('Senha incorreta.')
        setLoading(false)
        return
      }
      const conta = getConta(email)
      loginUsuario(email, conta?.nome)
      window.location.href = '/'
    }, 1000)
  }

  function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }
    if (contaExiste(email)) {
      setErro('Já existe uma conta com esse email. Faça login.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      criarConta(nome, email, senha)
      loginUsuario(email, nome)
      window.location.href = '/'
    }, 1000)
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-gray-900">
          {modo === 'login' ? 'Entrar como Cliente' : 'Criar conta'}
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          {modo === 'login' ? 'Acesse para favoritar produtos e ver seu histórico' : 'Leva menos de um minuto'}
        </p>
      </div>

      <form onSubmit={modo === 'login' ? handleLogin : handleCadastro} className="space-y-5">
        {modo === 'cadastro' && (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Nome</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lm-green/30 focus:border-lm-green outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="Seu nome"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">E-mail</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={18} className="text-gray-400" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lm-green/30 focus:border-lm-green outline-none transition-all bg-gray-50 focus:bg-white"
              placeholder="seuemail@exemplo.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Senha</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound size={18} className="text-gray-400" />
            </div>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lm-green/30 focus:border-lm-green outline-none transition-all bg-gray-50 focus:bg-white"
              placeholder="••••••••"
            />
          </div>
        </div>

        {modo === 'cadastro' && (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirmar senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound size={18} className="text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lm-green/30 focus:border-lm-green outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="••••••••"
              />
            </div>
          </div>
        )}

        {erro && (
          <p className="text-sm text-red-600 text-center">
            {erro}
            {modo === 'login' && erro.startsWith('Não encontramos') && (
              <>
                {' '}
                <button type="button" onClick={() => trocarModo('cadastro')} className="font-semibold underline">
                  Cadastre-se
                </button>
              </>
            )}
          </p>
        )}

        <Button type="submit" variant="primary" disabled={loading} className="w-full mt-2">
          {loading ? 'Enviando...' : modo === 'login' ? 'Entrar no Sistema' : 'Criar conta'}
          {!loading && <ArrowRight size={18} />}
        </Button>
      </form>

      <div className="mt-6 text-center">
        {modo === 'login' ? (
          <button type="button" onClick={() => trocarModo('cadastro')} className="text-sm font-medium text-lm-green hover:underline">
            Não tem conta? Cadastre-se
          </button>
        ) : (
          <button type="button" onClick={() => trocarModo('login')} className="text-sm font-medium text-lm-green hover:underline">
            Já tem conta? Entrar
          </button>
        )}
      </div>
    </>
  )
}
