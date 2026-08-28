'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, MessageCircleQuestion, CalendarCheck, Sparkles, Tag, User, Menu, X } from 'lucide-react'
import { getUsuarioLogado } from '@/lib/clientAuth'
import ThemeToggle from './ThemeToggle'
import CarrinhoIcon from './CarrinhoIcon'
import NotificacoesBell from './NotificacoesBell'
import HeaderSearch from './HeaderSearch'

const tabs = [
  { href: '/', label: 'Buscar Produtos', icon: Search },
  { href: '/projeto', label: 'Projeto Guiado', icon: Sparkles },
  { href: '/duvidas', label: 'Tire Dúvidas', icon: MessageCircleQuestion },
  { href: '/agendamento', label: 'Agendar Visita', icon: CalendarCheck },
  { href: '/ofertas', label: 'Ofertas', icon: Tag },
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

  const contaIconClass = `flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
    pathname === '/conta'
      ? 'bg-white/15 text-white'
      : 'text-white/80 hover:text-white hover:bg-white/10'
  }`

  return (
    <header className="bg-lm-green shadow-md relative z-30">
      {/* Linha 1 — logo, busca, ícones */}
      <div className="px-4 md:px-6 flex items-center gap-3 md:gap-4 h-16">

        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/leroy-logo.png"
            alt="Leroy Merlin"
            className="h-9 md:h-10 w-auto object-contain"
          />
        </Link>

        {/* Busca — visível em qualquer largura de tela */}
        <HeaderSearch />

        {/* Ícones — desktop */}
        <div className="hidden md:flex items-center gap-1 flex-shrink-0">
          {logado && <NotificacoesBell />}
          <ThemeToggle />
          <Link href={logado ? '/conta' : '/funcionario/login'} aria-label={logado ? 'Minha conta' : 'Entrar'} className={contaIconClass}>
            <User size={19} />
          </Link>
          <CarrinhoIcon />
        </div>

        {/* Botão hambúrguer — mobile */}
        <button
          type="button"
          onClick={() => setMenuAberto((v) => !v)}
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuAberto}
          className="md:hidden flex items-center justify-center w-10 h-10 -mr-2 text-white flex-shrink-0"
        >
          {menuAberto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Linha 2 — abas de navegação (desktop) */}
      <div className="hidden md:block border-t border-white/10">
        <nav className="px-4 md:px-6 flex items-center gap-1 py-2">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
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
            <div className="flex items-center gap-1">
              {logado && <NotificacoesBell />}
              <ThemeToggle />
              <CarrinhoIcon />
            </div>
            <Link href={logado ? '/conta' : '/funcionario/login'} aria-label={logado ? 'Minha conta' : 'Entrar'} className={contaIconClass}>
              <User size={19} />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
