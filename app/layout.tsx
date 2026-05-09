import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Leroy Merlin — Encontre na loja',
  description: 'Busque produtos, tire dúvidas e agende visitas nas lojas Leroy Merlin',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-lm-light min-h-screen`}>
        <NavBar />
        {children}
      </body>
    </html>
  )
}
