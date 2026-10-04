'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Package, HelpCircle, Star, Heart, Route, UserCircle } from 'lucide-react'
import { logoutUsuario } from '@/lib/clientAuth'

interface Props {
  nome: string
  email: string
}

const INICIO = '/conta'

// Telas de configuração abertas a partir da tela inicial da conta (app/conta/page.tsx). Não
// têm item próprio no menu, então quem fica marcado nelas é o "Meu perfil".
const TELAS_DO_PERFIL = ['/conta/perfil', '/conta/seguranca', '/conta/cartoes', '/conta/enderecos', '/conta/privacidade']

const ITENS = [
  { href: INICIO, label: 'Meu perfil', icone: UserCircle },
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
          <p className="text-sm text-gray-600 truncate">{email}</p>
        </div>
      </div>

      <nav className="flex flex-wrap lg:flex-col gap-1">
        {ITENS.map(({ href, label, icone: Icone }) => {
          // O início não pode usar startsWith: todo /conta/* começa com /conta e ele ficaria
          // marcado junto com qualquer outra seção.
          const ativo = href === INICIO
            ? pathname === INICIO || TELAS_DO_PERFIL.some(t => pathname === t || pathname.startsWith(t + '/'))
            : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base whitespace-nowrap transition-colors ${
                ativo
                  ? 'bg-green-50 text-lm-green font-semibold'
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
        className="flex items-center gap-3 px-3.5 py-2.5 mt-4 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-100 transition-colors w-full"
      >
        <LogOut size={20} /> Sair
      </button>
    </aside>
  )
}
