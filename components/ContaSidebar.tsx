'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Package, HelpCircle, Star, Heart, Route } from 'lucide-react'
import { logoutUsuario } from '@/lib/clientAuth'

interface Props {
  nome: string
  email: string
}

const ITENS = [
  { href: '/conta/pedidos', label: 'Pedidos', icone: Package },
  { href: '/conta/perguntas', label: 'Perguntas', icone: HelpCircle },
  { href: '/conta/avaliacoes', label: 'Opiniões', icone: Star },
  { href: '/conta/favoritos', label: 'Favoritos', icone: Heart },
  { href: '/conta/projetos', label: 'Projetos', icone: Route },
]

// Barra lateral persistente em todo /conta/* (ver app/conta/layout.tsx) — navegação por
// URL própria pra cada seção, igual ao padrão que já existia pra Avaliações/Favoritos.
export default function ContaSidebar({ nome, email }: Props) {
  const pathname = usePathname()
  const inicial = (nome.trim()[0] ?? 'U').toUpperCase()

  function sair() {
    logoutUsuario()
    window.location.href = '/'
  }

  return (
    <aside className="w-full lg:w-56 flex-shrink-0">
      <div className="flex items-center gap-3 mb-6 px-1">
        <div className="w-11 h-11 rounded-full bg-lm-green text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
          {inicial}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{nome}</p>
          <p className="text-xs text-gray-400 truncate">{email}</p>
        </div>
      </div>

      <nav className="flex flex-wrap lg:flex-col gap-1">
        {ITENS.map(({ href, label, icone: Icone }) => {
          const ativo = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base whitespace-nowrap transition-colors ${
                ativo
                  ? 'bg-lm-green/10 text-lm-green font-semibold'
                  : 'text-gray-600 font-medium hover:bg-gray-100'
              }`}
            >
              <Icone size={20} />
              {label}
            </Link>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={sair}
        className="flex items-center gap-3 px-3.5 py-2.5 mt-4 rounded-xl text-base font-medium text-gray-500 hover:bg-gray-100 transition-colors w-full"
      >
        <LogOut size={20} /> Sair
      </button>
    </aside>
  )
}
