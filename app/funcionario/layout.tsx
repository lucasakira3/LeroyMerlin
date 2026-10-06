'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Package, MessageSquare, LogOut, Menu, X, Search, ClipboardList, PackagePlus } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import Logo from '@/components/Logo'
import { getFuncionarioLogado, logoutFuncionario } from '@/lib/funcionarioAuth'
import { useSituacaoSync } from '@/lib/hooks/useAoSincronizar'

export default function FuncionarioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const situacaoSync = useSituacaoSync()

  const isLoginPage = pathname === '/funcionario/login'

  useEffect(() => {
    setSidebarAberta(false)
  }, [pathname])

  // Sem isso, qualquer /funcionario/* era acessível direto por URL sem nenhuma sessão —
  // fake auth por design (MVP acadêmico, ver lib/funcionarioAuth.ts), mas pelo menos real.
  useEffect(() => {
    if (isLoginPage) return
    const logado = getFuncionarioLogado()
    if (!logado) {
      router.push('/funcionario/login')
      return
    }
    setEmail(logado.email)
  }, [isLoginPage, pathname, router])

  if (isLoginPage) {
    return <>{children}</>
  }

  if (!email) {
    return null
  }

  function handleSair() {
    logoutFuncionario()
    router.push('/funcionario/login')
  }

  const menuItems = [
    { href: '/funcionario/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/funcionario/consulta', icon: Search, label: 'Consulta rápida' },
    { href: '/funcionario/pedidos', icon: ClipboardList, label: 'Pedidos' },
    { href: '/funcionario/reposicao', icon: PackagePlus, label: 'Reposição' },
    { href: '/funcionario/clientes', icon: Users, label: 'Clientes' },
    { href: '/funcionario/produtos', icon: Package, label: 'Estoque / Produtos' },
    { href: '/funcionario/chamados', icon: MessageSquare, label: 'Chamados Chat' },
  ]

  return (
    <div className="flex h-screen">
      {/* Overlay — mobile */}
      {sidebarAberta && (
        <div
          onClick={() => setSidebarAberta(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      <aside
        className={`w-64 bg-white border-r border-gray-200 dark:border-gray-500 flex flex-col shadow-sm z-40 fixed inset-y-0 left-0 transition-transform duration-300 ease-out lg:static lg:translate-x-0 lg:shadow-sm ${
          sidebarAberta ? 'translate-x-0 shadow-soft-lg' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-500 bg-white">
          <Logo className="h-10" />
          <button
            type="button"
            onClick={() => setSidebarAberta(false)}
            aria-label="Fechar menu"
            className="lg:hidden p-1.5 text-gray-600 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">
            Painel do Funcionário
          </span>
          <ThemeToggle variant="onLight" />
        </div>
        <p className="px-6 pb-2 text-sm text-gray-700 truncate" title={email}>{email}</p>
        {/* Diz se o painel está recebendo o que os clientes fazem em outros aparelhos
            (lib/sync). "Só neste aparelho" é o plano B: banco fora do ar ou não configurado. */}
        {situacaoSync !== 'verificando' && (
          <p
            className="px-6 pb-2 flex items-center gap-2 text-sm text-gray-700"
            title={situacaoSync === 'conectado'
              ? 'Pedidos e atendimentos feitos em outros aparelhos aparecem aqui.'
              : 'Sem conexão com o banco de dados: o painel mostra só o que foi feito neste aparelho.'}
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${situacaoSync === 'conectado' ? 'bg-lm-green' : 'bg-amber-500'}`} />
            {situacaoSync === 'conectado' ? 'Banco de dados conectado' : 'Só neste aparelho'}
          </p>
        )}
        <nav className="flex-1 px-4 py-2 space-y-1">
          {menuItems.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-lm-green/10 text-lm-green'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon size={18} className={active ? 'text-lm-green' : 'text-gray-600'} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-500 bg-gray-50">
          <button
            type="button"
            onClick={handleSair}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior — mobile */}
        <div className="lg:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-gray-200 dark:border-gray-500 flex-shrink-0 z-20">
          <button
            type="button"
            onClick={() => setSidebarAberta(true)}
            aria-label="Abrir menu"
            className="p-2 -ml-2 text-gray-600"
          >
            <Menu size={22} />
          </button>
          <Logo className="h-7" />
          <div className="w-9" />
        </div>

        <main className="flex-1 overflow-auto relative">
          {children}
        </main>
      </div>
    </div>
  )
}
