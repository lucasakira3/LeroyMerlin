'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, Mail, ArrowRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { loginFuncionario } from '@/lib/funcionarioAuth'
import { entrarFuncionario } from '@/lib/authServidor'
import { showToast } from '@/lib/toast'
import ClienteAuthForm from '@/components/ClienteAuthForm'
import Logo from '@/components/Logo'

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

const DESTAQUES = [
  { titulo: 'IA conversacional', texto: 'Tire dúvidas e monte projetos falando do seu jeito' },
  { titulo: 'Mapa da loja', texto: 'Ache o corredor certo de cada produto' },
  { titulo: 'Sua conta', texto: 'Favoritos, pedidos e sugestões feitas pra você' },
]

export default function LoginFuncionario() {
  const router = useRouter()
  const [tipo, setTipo] = useState<TipoLogin>('cliente')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const textos = TEXTOS[tipo]

  // Só o login do funcionário passa por aqui; o do cliente é o ClienteAuthForm. O painel
  // tem uma senha só, do time todo (ver app/api/auth/funcionario/route.ts).
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setLoading(true)
    const emailLimpo = email.trim().toLowerCase()
    const resultado = await entrarFuncionario(emailLimpo, password)
    if (resultado.tipo === 'senha_incorreta' || resultado.tipo === 'invalido') {
      setErro(resultado.tipo === 'invalido' ? resultado.mensagem : 'Senha do painel incorreta.')
      setLoading(false)
      return
    }
    // 'sem-banco' = plano B: sem banco não há o que proteger nem sincronizar, o painel
    // abre só com os dados deste aparelho, como era antes.
    loginFuncionario(emailLimpo)
    setLoading(false)
    router.push('/funcionario/dashboard')
    if (resultado.tipo === 'ok' && resultado.criado) {
      showToast('Senha do painel definida. Guarde-a: é a mesma para todo o time.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center gap-16 bg-blueprint p-4 relative overflow-hidden">
      {/* Painel lateral no estilo planta baixa — só em telas largas */}
      <div className="hidden lg:flex flex-col max-w-sm text-white">
        <p className="text-xs font-bold tracking-widest text-lm-yellow mb-3">FIAP CHALLENGE 2026</p>
        <h2 className="text-4xl font-black leading-tight mb-8">A loja que entende você</h2>
        <ul className="space-y-5">
          {DESTAQUES.map((d, i) => (
            <li key={d.titulo} className="flex items-start gap-4">
              <span className="w-9 h-9 rounded-full bg-lm-green text-white text-xs font-black flex items-center justify-center flex-shrink-0 ring-2 ring-[#161b22]">
                {i + 1}
              </span>
              <div>
                <p className="font-bold">{d.titulo}</p>
                <p className="text-sm text-white/60">{d.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Card className="w-full max-w-md relative z-10" padding="none">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <Link href="/">
              <Logo className="h-12" />
            </Link>
          </div>

          <div className="flex rounded-xl bg-gray-100 p-1 mb-8">
            <button
              type="button"
              onClick={() => setTipo('cliente')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tipo === 'cliente' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-700 hover:text-gray-700'
              }`}
            >
              Cliente
            </button>
            <button
              type="button"
              onClick={() => setTipo('funcionario')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tipo === 'funcionario' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-700 hover:text-gray-700'
              }`}
            >
              Funcionário
            </button>
          </div>

          {tipo === 'cliente' ? (
            <Suspense fallback={null}>
              <ClienteAuthForm />
            </Suspense>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-black text-gray-900">{textos.titulo}</h1>
                <p className="text-gray-700 text-base mt-2">{textos.descricao}</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">{textos.labelEmail}</label>
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
                      placeholder={textos.placeholderEmail}
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
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErro(null) }}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-500 rounded-xl text-sm focus:ring-2 focus:ring-lm-green/30 focus:border-lm-green outline-none transition-all bg-gray-50 focus:bg-white"
                      placeholder="••••••••"
                    />
                  </div>
                  {erro && <p role="alert" className="text-sm text-red-600 mt-2">{erro}</p>}
                </div>

                <Button type="submit" variant="primary" disabled={loading} className="w-full mt-2">
                  {loading ? 'Autenticando...' : 'Entrar no Sistema'}
                  {!loading && <ArrowRight size={18} />}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-700">
                A senha do painel é a mesma para todo o time da loja.
              </p>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
