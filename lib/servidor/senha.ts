// Guarda e confere senhas SEM guardar a senha. Só no servidor (usa o módulo `crypto` do Node).
//
// O que vai pro banco é o resultado do scrypt: uma conta de mão única, lenta de propósito e
// com um "sal" aleatório por senha. Dá pra refazer a conta com a senha digitada e comparar,
// mas não dá pra voltar do resultado pra senha — nem pra descobrir que duas pessoas usam a
// mesma senha (o sal faz o resultado sair diferente).
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

// Parâmetros recomendados pro scrypt em login interativo. Ficam escritos junto do resultado
// ("scrypt$N$r$p$sal$hash") pra poderem aumentar no futuro sem invalidar as senhas antigas.
const N = 16384
const R = 8
const P = 1
const TAMANHO = 32

export const SENHA_MINIMA = 4
export const SENHA_MAXIMA = 200

export function senhaValida(senha: unknown): senha is string {
  return typeof senha === 'string' && senha.length >= SENHA_MINIMA && senha.length <= SENHA_MAXIMA
}

export function gerarHash(senha: string): string {
  const sal = randomBytes(16)
  const hash = scryptSync(senha, sal, TAMANHO, { N, r: R, p: P })
  return ['scrypt', N, R, P, sal.toString('base64'), hash.toString('base64')].join('$')
}

export function conferirSenha(senha: string, guardado: string): boolean {
  const [algoritmo, n, r, p, sal, hash] = guardado.split('$')
  if (algoritmo !== 'scrypt' || !sal || !hash) return false
  try {
    const esperado = Buffer.from(hash, 'base64')
    const obtido = scryptSync(senha, Buffer.from(sal, 'base64'), esperado.length, { N: Number(n), r: Number(r), p: Number(p) })
    // Comparação em tempo constante: não revela, pelo tempo de resposta, quantos bytes bateram.
    return obtido.length === esperado.length && timingSafeEqual(obtido, esperado)
  } catch {
    return false
  }
}
