'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, MessageCircleQuestion, CalendarCheck, Sparkles, LogIn, User } from 'lucide-react'

const tabs = [
  { href: '/', label: 'Buscar Produtos', icon: Search },
  { href: '/projeto', label: 'Projeto Guiado', icon: Sparkles },
  { href: '/duvidas', label: 'Tire Dúvidas', icon: MessageCircleQuestion },
  { href: '/agendamento', label: 'Agendar Visita', icon: CalendarCheck },
  { href: '/conta', label: 'Minha Conta', icon: User },
]

export default function NavBar() {
  const pathname = usePathname()

  if (pathname.startsWith('/funcionario')) return null;

  return (
    <header className="bg-lm-green shadow-md">
      <div className="px-6 flex items-center justify-between h-16">

        {/* Logo — esquerda */}
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/leroy-logo.png"
            alt="Leroy Merlin"
            className="h-10 w-auto object-contain"
          />
        </Link>

        {/* Tabs + login — direita */}
        <div className="flex items-center gap-3 h-full">
          <nav className="flex items-center gap-1 h-full py-2.5">
            {tabs.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 h-full rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-white/15 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              )
            })}
          </nav>

          <Link
            href="/funcionario/login"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-500 shadow-soft hover:bg-green-400 transition-colors"
          >
            <LogIn size={15} />
            Login
          </Link>
        </div>

      </div>
    </header>
  )
}
