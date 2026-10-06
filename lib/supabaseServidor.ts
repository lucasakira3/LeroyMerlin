// Conexão com o Supabase usada SÓ no servidor (rotas em app/api). Usa a chave secreta, que
// passa por cima do RLS — por isso este arquivo nunca pode ser importado por um componente
// de tela: a chave iria junto pro navegador. `import 'server-only'` não é usado porque o
// projeto não tem esse pacote; a proteção é a variável não começar com NEXT_PUBLIC_ (o Next
// não a entrega ao navegador).
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cliente: SupabaseClient | null | undefined

// null = variáveis não preenchidas (ex.: ainda não cadastradas na Vercel). Quem chama trata
// isso como "banco desligado" e o site segue só com os dados do aparelho.
export function supabaseServidor(): SupabaseClient | null {
  if (cliente !== undefined) return cliente
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const chave = process.env.SUPABASE_SECRET_KEY?.trim()
  cliente = url && chave
    ? createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } })
    : null
  return cliente
}
