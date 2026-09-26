'use client'

import { usePathname } from 'next/navigation'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    // flex-1 flex flex-col: deixa páginas que têm seu próprio wrapper "flex-1" (carrinho,
    // comparar, produto, lista/pedido compartilhados — ver app/layout.tsx) de fato esticarem
    // até a altura disponível, empurrando o Footer pro fim real da tela em vez de deixá-lo
    // colado logo abaixo de um conteúdo curto. Não afeta páginas comuns (bloco único, altura
    // natural) — só passa adiante a altura que o layout já reserva.
    <div key={pathname} className="animate-fade-in-up flex-1 flex flex-col">
      {children}
    </div>
  )
}
