'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, MessageCircleQuestion, CalendarCheck, Sparkles, LogIn, User, Menu, X } from 'lucide-react'
import { getUsuarioLogado } from '@/lib/clientAuth'
import ThemeToggle from './ThemeToggle'
import CarrinhoIcon from './CarrinhoIcon'
import NotificacoesBell from './NotificacoesBell'

const tabs = [
  { href: '/', label: 'Buscar Produtos', icon: Search },
  { href: '/projeto', label: 'Projeto Guiado', icon: Sparkles },
  { href: '/duvidas', label: 'Tire Dúvidas', icon: MessageCircleQuestion },
  { href: '/agendamento', label: 'Agendar Visita', icon: CalendarCheck },
]

export default function NavBar() {
  const pathname = usePathname()
  const [logado, setLogado] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    setLogado(getUsuarioLogado() !== null)
  }, [])

  useEffect(() => {
    setMenuAberto(false)
  }, [pathname])

  if (pathname.startsWith('/funcionario')) return null;

  return (
    <header className="bg-lm-green shadow-md relative z-30">
      <div className="px-4 md:px-6 flex items-center justify-between h-16">

        {/* Logo — esquerda */}
        <Link href="/" className="flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/leroy-logo.png"
            alt="Leroy Merlin"
            className="h-9 md:h-10 w-auto object-contain"
          />
        </Link>

        {/* Tabs + login/conta — direita (desktop) */}
        <div className="hidden md:flex items-center gap-3 h-full">
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

          <CarrinhoIcon />
          {logado && <NotificacoesBell />}
          <ThemeToggle />

          {logado ? (
            <Link
              href="/conta"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === '/conta'
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <User size={15} />
              Minha Conta
            </Link>
          ) : (
            <Link
              href="/funcionario/login"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-500 shadow-soft hover:bg-green-400 transition-colors"
            >
              <LogIn size={15} />
              Login
            </Link>
          )}
        </div>

        {/* Botão hambúrguer — mobile */}
        <button
          type="button"
          onClick={() => setMenuAberto((v) => !v)}
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuAberto}
          className="md:hidden flex items-center justify-center w-10 h-10 -mr-2 text-white"
        >
          {menuAberto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Menu mobile */}
      {menuAberto && (
        <div className="md:hidden bg-lm-green border-t border-white/15 px-4 py-3 space-y-1 animate-fade-in">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                  active ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}

          <div className="flex items-center justify-between gap-3 pt-3 mt-2 border-t border-white/15">
            <div className="flex items-center gap-2">
              <CarrinhoIcon />
              {logado && <NotificacoesBell />}
              <ThemeToggle />
            </div>
            {logado ? (
              <Link
                href="/conta"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === '/conta' ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <User size={15} />
                Minha Conta
              </Link>
            ) : (
              <Link
                href="/funcionario/login"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-500 shadow-soft hover:bg-green-400 transition-colors"
              >
                <LogIn size={15} />
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
