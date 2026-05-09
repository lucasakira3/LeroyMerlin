'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, MessageCircleQuestion, CalendarCheck, Sparkles } from 'lucide-react'

const tabs = [
  { href: '/', label: 'Buscar Produtos', icon: Search },
  { href: '/projeto', label: 'Projeto Guiado', icon: Sparkles },
  { href: '/duvidas', label: 'Tire Dúvidas', icon: MessageCircleQuestion },
  { href: '/agendamento', label: 'Agendar Visita', icon: CalendarCheck },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <header className="shadow-md" style={{ backgroundColor: '#2d6a4f' }}>
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

        {/* Tabs — direita */}
        <nav className="flex items-center h-full">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-5 h-full text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? 'border-lm-yellow text-white'
                    : 'border-transparent text-white/70 hover:text-white hover:border-white/30'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>

      </div>
    </header>
  )
}
