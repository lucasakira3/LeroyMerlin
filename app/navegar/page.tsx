import { Suspense } from 'react'
import NavegacaoLoja from '@/components/NavegacaoLoja'

export const metadata = { title: 'Navegação na loja — Leroy Merlin' }

// Navegação guiada dentro da loja (simulada), aberta pelo QR code do mapa da busca.
// Tela cheia no celular: o cabeçalho, o rodapé e o tour do site não aparecem aqui
// (ver NavBar, Footer e TourGuiado).
export default function NavegarPage() {
  return (
    <Suspense fallback={null}>
      <NavegacaoLoja />
    </Suspense>
  )
}
