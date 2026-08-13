import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'
import TourGuiado from '@/components/TourGuiado'
import PageTransition from '@/components/PageTransition'
import CompareToast from '@/components/CompareToast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Leroy Merlin — Encontre na loja',
  description: 'Busque produtos, tire dúvidas e agende visitas nas lojas Leroy Merlin',
}

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('lm-theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${inter.className} bg-lm-light min-h-screen`}>
        <NavBar />
        <TourGuiado />
        <PageTransition>{children}</PageTransition>
        <CompareToast />
      </body>
    </html>
  )
}
