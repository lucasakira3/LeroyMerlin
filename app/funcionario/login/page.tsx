'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Mail, ArrowRight } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-lm-light p-4 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-lm-green -skew-y-6 transform origin-top-left -z-10" />
      
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative z-10">
        <div className="flex justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/leroy-logo.png" alt="Leroy Merlin" className="h-12 w-auto object-contain" />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-lm-dark">Portal do Funcionário</h1>
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
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-lm-green focus:border-lm-green outline-none transition-all bg-gray-50 focus:bg-white"
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
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-lm-green focus:border-lm-green outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-lm-green hover:bg-[#007034] text-white py-3.5 rounded-xl font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Autenticando...' : 'Entrar no Sistema'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <a href="#" className="text-sm font-medium text-lm-green hover:underline">
            Esqueceu sua senha?
          </a>
        </div>
      </div>
    </div>
  )
}
