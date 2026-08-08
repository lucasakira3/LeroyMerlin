'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Package, MessageSquare, LogOut } from 'lucide-react'

export default function FuncionarioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isLoginPage = pathname === '/funcionario/login'

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
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm z-10">
        <div className="p-6 flex justify-center border-b border-gray-100 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/leroy-logo.png" alt="Leroy Merlin" className="h-10 w-auto object-contain" />
        </div>
        <div className="px-6 pt-6 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
          Painel do Funcionário
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

      <main className="flex-1 overflow-auto bg-gray-50 relative">
        {children}
      </main>
    </div>
  )
}
