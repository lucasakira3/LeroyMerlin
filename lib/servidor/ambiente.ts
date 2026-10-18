// Endereço e chave secreta do Supabase, lidos das variáveis de ambiente (só no servidor).
//
// Aceita os dois jeitos de nomear que existem no projeto: o do site (NEXT_PUBLIC_SUPABASE_URL)
// e o do backend do app Android (SUPABASE_URL; ver lib/mobile/store.ts). Os dois apontam pro
// mesmo banco. Em 18/10/2026 o site publicado ficou sem banco porque na Vercel só sobrou o
// nome do app — o login de verdade e a sincronização caíram pro modo "só no aparelho".
//
// SUPABASE_SERVICE_ROLE_KEY é a chave secreta no formato antigo, aceita como reserva (o app
// faz igual).
export function urlDoSupabase(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim() || '').replace(/\/$/, '')
}

export function chaveSecretaDoSupabase(): string {
  return process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ''
}

// Pro diagnóstico de GET /api/sync: SÓ os nomes do que falta, nunca valores.
export function configuracaoFaltando(): string[] {
  const faltando: string[] = []
  if (!urlDoSupabase()) faltando.push('NEXT_PUBLIC_SUPABASE_URL (ou SUPABASE_URL)')
  if (!chaveSecretaDoSupabase()) faltando.push('SUPABASE_SECRET_KEY')
  return faltando
}
