import { describe, it, expect, beforeEach } from 'vitest'
import { criarTokenDeRedefinicao, impressaoDaSenha, lerTokenDeRedefinicao } from './redefinicao'
import { gerarHash } from './senha'

describe('link de "Esqueci minha senha"', () => {
  beforeEach(() => {
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_de_teste'
  })

  it('o link diz de qual e-mail é e leva a impressão da senha atual', () => {
    const hash = gerarHash('senha-antiga')
    const token = criarTokenDeRedefinicao('ana@teste.com', hash)!
    expect(lerTokenDeRedefinicao(token)).toEqual({ email: 'ana@teste.com', impressao: impressaoDaSenha(hash) })
  })

  it('trocar a senha muda a impressão: o mesmo link não serve duas vezes', () => {
    const antes = gerarHash('senha-antiga')
    const depois = gerarHash('senha-nova')
    const lido = lerTokenDeRedefinicao(criarTokenDeRedefinicao('ana@teste.com', antes)!)!
    expect(lido.impressao).toBe(impressaoDaSenha(antes))
    expect(lido.impressao).not.toBe(impressaoDaSenha(depois))
  })

  it('vale por 30 minutos', () => {
    const agora = Date.UTC(2026, 9, 18, 12)
    const token = criarTokenDeRedefinicao('ana@teste.com', gerarHash('x1234'), agora)!
    expect(lerTokenDeRedefinicao(token, agora + 29 * 60 * 1000)).not.toBeNull()
    expect(lerTokenDeRedefinicao(token, agora + 31 * 60 * 1000)).toBeNull()
  })

  it('trocar o e-mail dentro do link invalida a assinatura', () => {
    const token = criarTokenDeRedefinicao('ana@teste.com', gerarHash('x1234'))!
    const [conteudo, assinatura] = token.split('.')
    const dados = JSON.parse(Buffer.from(conteudo, 'base64url').toString())
    const forjado = Buffer.from(JSON.stringify({ ...dados, e: 'bruno@teste.com' })).toString('base64url')
    expect(lerTokenDeRedefinicao(`${forjado}.${assinatura}`)).toBeNull()
    expect(lerTokenDeRedefinicao('lixo')).toBeNull()
    expect(lerTokenDeRedefinicao(undefined)).toBeNull()
  })

  it('o crachá de login não serve como link de redefinição (e vice-versa)', async () => {
    const { criarToken, lerToken } = await import('./sessao')
    const cracha = criarToken('cliente', 'ana@teste.com')!
    expect(lerTokenDeRedefinicao(cracha)).toBeNull()
    const link = criarTokenDeRedefinicao('ana@teste.com', gerarHash('x1234'))!
    expect(lerToken(link, 'cliente')).toBeNull()
  })

  it('assinado com a chave de outro projeto não vale', () => {
    const token = criarTokenDeRedefinicao('ana@teste.com', gerarHash('x1234'))!
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_outra'
    expect(lerTokenDeRedefinicao(token)).toBeNull()
  })
})
