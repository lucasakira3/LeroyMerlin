// Respostas das rotas de login (app/api/auth/*), num lugar só pra as telas poderem contar
// com o mesmo formato. Só no servidor.
import { NextResponse } from 'next/server'
import type { RespostaAuth } from '@/lib/authTipos'

export type { RespostaAuth }

export function semBanco(motivo: RespostaAuth['motivo']) {
  return NextResponse.json<RespostaAuth>({ ativo: false, motivo })
}

export function recusar(erro: NonNullable<RespostaAuth['erro']>, status: number) {
  return NextResponse.json<RespostaAuth>({ ativo: true, erro }, { status })
}

export async function lerCorpo(req: Request): Promise<Record<string, unknown>> {
  try {
    const corpo = await req.json()
    return corpo && typeof corpo === 'object' ? corpo : {}
  } catch {
    return {}
  }
}
