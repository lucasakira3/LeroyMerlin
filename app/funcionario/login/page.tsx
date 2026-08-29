'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, Mail, ArrowRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { loginUsuario } from '@/lib/clientAuth'
import { loginFuncionario } from '@/lib/funcionarioAuth'
import ClienteAuthForm from '@/components/ClienteAuthForm'

type TipoLogin = 'funcionario' | 'cliente'

const TEXTOS: Record<TipoLogin, { titulo: string; descricao: string; labelEmail: string; placeholderEmail: string }> = {
  cliente: {
    titulo: 'Entrar como Cliente',
    descricao: 'Acesse para favoritar produtos e ver seu histórico',
    labelEmail: 'E-mail',
    placeholderEmail: 'seuemail@exemplo.com',
  },
  funcionario: {
    titulo: 'Portal do Funcionário',
    descricao: 'Acesse com suas credenciais corporativas',
    labelEmail: 'E-mail Corporativo',
    placeholderEmail: 'nome.sobrenome@leroymerlin.com.br',
  },
}

export default function LoginFuncionario() {
  const router = useRouter()
  const [tipo, setTipo] = useState<TipoLogin>('cliente')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const textos = TEXTOS[tipo]

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simular delay de rede
    setTimeout(() => {
      if (tipo === 'funcionario') {
        loginFuncionario(email)
        setLoading(false)
        router.push('/funcionario/dashboard')
        return
      }
      loginUsuario(email)
      window.location.href = '/'
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-lm-green -skew-y-6 transform origin-top-left -z-10" />

      <Card className="w-full max-w-md relative z-10" padding="none">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/leroy-logo.png" alt="Leroy Merlin" className="h-12 w-auto object-contain" />
            </Link>
          </div>

          <div className="flex rounded-xl bg-gray-100 p-1 mb-8">
            <button
              type="button"
              onClick={() => setTipo('cliente')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tipo === 'cliente' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cliente
            </button>
            <button
              type="button"
              onClick={() => setTipo('funcionario')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tipo === 'funcionario' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Funcionário
            </button>
          </div>

          {tipo === 'cliente' ? (
            <ClienteAuthForm />
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-black text-gray-900">{textos.titulo}</h1>
                <p className="text-gray-500 text-sm mt-2">{textos.descricao}</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">{textos.labelEmail}</label>
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
                      placeholder={textos.placeholderEmail}
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lm-green/30 focus:border-lm-green outline-none transition-all bg-gray-50 focus:bg-white"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <Button type="submit" variant="primary" disabled={loading} className="w-full mt-2">
                  {loading ? 'Autenticando...' : 'Entrar no Sistema'}
                  {!loading && <ArrowRight size={18} />}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <a href="#" className="text-sm font-medium text-lm-green hover:underline">
                  Esqueceu sua senha?
                </a>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
