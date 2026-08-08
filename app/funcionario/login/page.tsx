'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, Mail, ArrowRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function LoginFuncionario() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simular delay de rede
    setTimeout(() => {
      setLoading(false)
      router.push('/funcionario/dashboard')
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

          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-gray-900">Portal do Funcionário</h1>
            <p className="text-gray-500 text-sm mt-2">Acesse com suas credenciais corporativas</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">E-mail Corporativo</label>
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
                  placeholder="nome.sobrenome@leroymerlin.com.br"
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
        </div>
      </Card>
    </div>
  )
}
