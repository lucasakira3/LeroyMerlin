import { Suspense } from 'react'
import RedefinirSenha from '@/components/RedefinirSenha'

export const metadata = { title: 'Esqueci minha senha — Leroy Merlin' }

// Esqueci minha senha: pedir o link por e-mail e, abrindo o link, criar a senha nova.
// Suspense porque a tela lê ?token= e ?email= do endereço (useSearchParams).
export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RedefinirSenha />
    </Suspense>
  )
}
