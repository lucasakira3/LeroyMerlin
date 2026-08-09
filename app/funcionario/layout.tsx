'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Package, MessageSquare, LogOut, Menu, X } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export default function FuncionarioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarAberta, setSidebarAberta] = useState(false)

  const isLoginPage = pathname === '/funcionario/login'

  useEffect(() => {
    setSidebarAberta(false)
  }, [pathname])

  if (isLoginPage) {
    return <>{children}</>
  }

  const menuItems = [
    { href: '/funcionario/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/funcionario/clientes', icon: Users, label: 'Clientes' },
    { href: '/funcionario/produtos', icon: Package, label: 'Estoque / Produtos' },
    { href: '/funcionario/chamados', icon: MessageSquare, label: 'Chamados Chat' },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Overlay — mobile */}
      {sidebarAberta && (
        <div
          onClick={() => setSidebarAberta(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      <aside
        className={`w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm z-40 fixed inset-y-0 left-0 transition-transform duration-300 ease-out lg:static lg:translate-x-0 lg:shadow-sm ${
          sidebarAberta ? 'translate-x-0 shadow-soft-lg' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-100 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/leroy-logo.png" alt="Leroy Merlin" className="h-10 w-auto object-contain" />
          <button
            type="button"
            onClick={() => setSidebarAberta(false)}
            aria-label="Fechar menu"
            className="lg:hidden p-1.5 text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Painel do Funcionário
          </span>
          <ThemeToggle variant="onLight" />
        </div>
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
                <item.icon size={18} className={active ? 'text-lm-green' : 'text-gray-400'} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <Link
            href="/funcionario/login"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Sair do Sistema
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior — mobile */}
        <div className="lg:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-gray-100 flex-shrink-0 z-20">
          <button
            type="button"
            onClick={() => setSidebarAberta(true)}
            aria-label="Abrir menu"
            className="p-2 -ml-2 text-gray-600"
          >
            <Menu size={22} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/leroy-logo.png" alt="Leroy Merlin" className="h-7 w-auto object-contain" />
          <div className="w-9" />
        </div>

        <main className="flex-1 overflow-auto bg-gray-50 relative">
          {children}
        </main>
      </div>
    </div>
  )
}
