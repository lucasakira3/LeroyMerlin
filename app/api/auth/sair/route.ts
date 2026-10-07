import { NextRequest, NextResponse } from 'next/server'
import { cookieDeSaida } from '@/lib/servidor/sessao'
import { lerCorpo } from '@/lib/servidor/respostasAuth'

export const dynamic = 'force-dynamic'

// Sair: apaga o cookie de sessão do papel pedido. Não precisa de banco (o cookie é
// conferido só pela assinatura), então funciona mesmo com o Supabase fora do ar.
export async function POST(req: NextRequest) {
  const { papel } = await lerCorpo(req)
  const resposta = NextResponse.json({ ok: true })
  if (papel === 'cliente' || papel === 'funcionario') resposta.cookies.set(cookieDeSaida(papel))
  return resposta
}
