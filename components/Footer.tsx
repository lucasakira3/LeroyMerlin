'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle, Phone, Clock } from 'lucide-react'
import { tabs } from './NavBar'

// Rodapé global (app/layout.tsx). Escondido em /funcionario/* pelo mesmo motivo do NavBar
// (components/NavBar.tsx) — o painel do funcionário já tem sua própria casca de tela cheia
// com sidebar, um rodapé de site público ali não faz sentido.
//
// Contato e horário são os mesmos números reais já usados em app/duvidas/page.tsx — nunca
// duplicar com valores diferentes, sempre copiar de lá se precisar ajustar.
export default function Footer() {
  const pathname = usePathname()
  if (pathname.startsWith('/funcionario')) return null

  return (
    <footer className="bg-white dark:bg-zinc-900 border-t border-gray-500 dark:border-zinc-800 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Marca */}
        <div>
          <Link href="/" className="inline-block mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/leroy-logo.png" alt="Leroy Merlin" className="h-9 w-auto object-contain" />
          </Link>
          <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed max-w-xs">
            A loja que entende você — inteligência artificial que transforma a jornada do cliente dentro da loja física.
          </p>
        </div>

        {/* Navegação */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3">Navegue</h3>
          <ul className="space-y-2">
            {tabs.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="text-sm text-gray-600 dark:text-zinc-300 hover:text-lm-green transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contato */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3">Atendimento</h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a
                href="https://wa.me/551140071380"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 dark:text-zinc-300 hover:text-lm-green transition-colors"
              >
                <MessageCircle size={15} className="flex-shrink-0" /> WhatsApp
              </a>
            </li>
            <li>
              <a href="tel:40205376" className="flex items-center gap-2 text-gray-600 dark:text-zinc-300 hover:text-lm-green transition-colors">
                <Phone size={15} className="flex-shrink-0" /> 4020-5376
              </a>
            </li>
            <li>
              <Link href="/duvidas" className="flex items-center gap-2 text-gray-600 dark:text-zinc-300 hover:text-lm-green transition-colors">
                <Clock size={15} className="flex-shrink-0" /> Tire suas dúvidas
              </Link>
            </li>
          </ul>
        </div>

        {/* Horário */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3">Horário de atendimento</h3>
          <ul className="space-y-1.5 text-sm text-gray-600 dark:text-zinc-300">
            <li className="flex justify-between gap-3"><span>Segunda a Sábado</span><span className="font-medium">08h – 20h</span></li>
            <li className="flex justify-between gap-3"><span>Domingo</span><span className="font-medium">10h – 18h</span></li>
            <li className="flex justify-between gap-3"><span>Feriados</span><span className="font-medium">10h – 16h</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-500 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400 dark:text-zinc-500">
          <p>© {new Date().getFullYear()} Leroy Merlin. Loja fictícia para fins de demonstração.</p>
          <p>Projeto acadêmico — FIAP Challenge 2026</p>
        </div>
      </div>
    </footer>
  )
}
