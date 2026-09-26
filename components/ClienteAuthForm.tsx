'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { KeyRound, Mail, ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import { contaExiste, criarConta, getConta } from '@/lib/clientContas'
import { loginUsuario } from '@/lib/clientAuth'

// Login de cliente do MVP: qualquer e-mail/senha entram (sem cadastro nem "esqueci a
// senha" — não há o que recuperar). Ainda assim garantimos um registro em clientContas
// pro e-mail, porque Minha Conta (dados, segurança, privacidade) e o painel do
// funcionário leem essa conta.
export default function ClienteAuthForm() {
  const searchParams = useSearchParams()
  // ?next=/carrinho, por ex — volta pra onde o usuário estava tentando ir antes do
  // login pedir a conta (checkout, chat com especialista, etc), em vez de mandar
  // sempre pra home e obrigar a navegar de novo.
  const destino = searchParams.get('next') || '/'
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      if (!contaExiste(email)) {
        // Nome provisório a partir do e-mail ("maria.silva@x.com" -> "maria.silva"); o
        // cliente pode trocar em Minha Conta > Meus dados.
        criarConta(email.trim().split('@')[0], email, senha)
      }
      loginUsuario(email, getConta(email)?.nome)
      window.location.href = destino
    }, 1000)
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-gray-900">Entrar como Cliente</h1>
        <p className="text-gray-500 text-sm mt-2">Acesse para favoritar produtos e ver seu histórico</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
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
              className="block w-full pl-10 pr-3 py-3 border border-gray-500 rounded-xl text-sm focus:ring-2 focus:ring-lm-green/30 focus:border-lm-green outline-none transition-all bg-gray-50 focus:bg-white"
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
              className="block w-full pl-10 pr-3 py-3 border border-gray-500 rounded-xl text-sm focus:ring-2 focus:ring-lm-green/30 focus:border-lm-green outline-none transition-all bg-gray-50 focus:bg-white"
              placeholder="••••••••"
            />
          </div>
        </div>

        <Button type="submit" variant="primary" disabled={loading} className="w-full mt-2">
          {loading ? 'Entrando...' : 'Entrar no Sistema'}
          {!loading && <ArrowRight size={18} />}
        </Button>
      </form>
    </>
  )
}
