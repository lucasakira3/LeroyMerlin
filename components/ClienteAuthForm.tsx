'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { KeyRound, Mail, ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import { contaExiste, criarConta, esquecerSenhaLocal, getConta } from '@/lib/clientContas'
import { loginUsuario } from '@/lib/clientAuth'
import { entrarCliente } from '@/lib/authServidor'

// Login de cliente. Não tem tela de cadastro: o primeiro login com um e-mail novo cria a
// conta com a senha digitada; daí em diante só aquela senha entra (conferida no servidor,
// ver lib/authServidor.ts). Não há "esqueci a senha" porque o site não envia e-mail.
// Além da sessão no servidor, garantimos um registro em clientContas pro e-mail, porque
// Minha Conta (dados, segurança, privacidade) lê essa conta.
export default function ClienteAuthForm() {
  const searchParams = useSearchParams()
  // ?next=/carrinho, por ex — volta pra onde o usuário estava tentando ir antes do
  // login pedir a conta (checkout, chat com especialista, etc), em vez de mandar
  // sempre pra home e obrigar a navegar de novo.
  const destino = searchParams.get('next') || '/'
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setLoading(true)
    // Sempre em minúsculas: o e-mail é a chave de tudo que é do cliente, aqui e no banco.
    const emailLimpo = email.trim().toLowerCase()
    const resultado = await entrarCliente(emailLimpo, senha)
    if (resultado.tipo === 'senha_incorreta' || resultado.tipo === 'invalido') {
      setErro(resultado.tipo === 'invalido' ? resultado.mensagem : 'Senha incorreta para este e-mail.')
      setLoading(false)
      return
    }
    // 'ok' = senha conferida no servidor. 'sem-banco' = plano B: login só deste aparelho,
    // como era antes — único caso em que a senha ainda é guardada aqui.
    const noServidor = resultado.tipo === 'ok'
    if (!contaExiste(emailLimpo)) {
      // Nome provisório a partir do e-mail ("maria.silva@x.com" -> "maria.silva"); o
      // cliente pode trocar em Minha Conta > Meus dados.
      criarConta(emailLimpo.split('@')[0], emailLimpo, noServidor ? '' : senha)
    } else if (noServidor) {
      esquecerSenhaLocal(emailLimpo)
    }
    loginUsuario(emailLimpo, getConta(emailLimpo)?.nome)
    window.location.href = destino
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-gray-900">Entrar como Cliente</h1>
        <p className="text-gray-700 text-base mt-2">Acesse para favoritar produtos e ver seu histórico</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">E-mail</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={18} className="text-gray-600" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-500 rounded-xl text-sm focus:ring-2 focus:ring-lm-green/30 focus:border-lm-green outline-none transition-all bg-gray-50 focus:bg-white"
              placeholder="seuemail@exemplo.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Senha</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound size={18} className="text-gray-600" />
            </div>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => { setSenha(e.target.value); setErro(null) }}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-500 rounded-xl text-sm focus:ring-2 focus:ring-lm-green/30 focus:border-lm-green outline-none transition-all bg-gray-50 focus:bg-white"
              placeholder="••••••••"
            />
          </div>
          {erro && <p role="alert" className="text-sm text-red-600 mt-2">{erro}</p>}
        </div>

        <Button type="submit" variant="primary" disabled={loading} className="w-full mt-2">
          {loading ? 'Entrando...' : 'Entrar no Sistema'}
          {!loading && <ArrowRight size={18} />}
        </Button>
        <p className="text-sm text-gray-700 text-center">
          Primeiro acesso? É só entrar: sua conta é criada com a senha que você digitar.
        </p>
      </form>
    </>
  )
}
