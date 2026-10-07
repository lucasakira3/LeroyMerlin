import { describe, it, expect, beforeEach } from 'vitest'
import { conferirSenha, gerarHash, senhaValida } from './senha'
import { criarToken, emailValido, lerToken, normalizarEmail } from './sessao'
import { podeGravar } from '../sync/tabelas'

describe('senha', () => {
  it('confere a senha certa e recusa a errada, sem nunca guardar a senha', () => {
    const guardado = gerarHash('minha senha 123')
    expect(guardado).not.toContain('minha senha 123')
    expect(conferirSenha('minha senha 123', guardado)).toBe(true)
    expect(conferirSenha('minha senha 124', guardado)).toBe(false)
    expect(conferirSenha('', guardado)).toBe(false)
  })

  it('a mesma senha dá resultados diferentes (sal aleatório): não dá pra ver que duas pessoas usam a mesma', () => {
    const a = gerarHash('demo123')
    const b = gerarHash('demo123')
    expect(a).not.toBe(b)
    expect(conferirSenha('demo123', a) && conferirSenha('demo123', b)).toBe(true)
  })

  it('texto que não é um resultado do scrypt nunca confere (em vez de dar erro)', () => {
    expect(conferirSenha('x', '')).toBe(false)
    expect(conferirSenha('x', 'senha em texto puro')).toBe(false)
    expect(conferirSenha('x', 'scrypt$16384$8$1$$')).toBe(false)
  })

  it('aceita senhas de 4 a 200 caracteres', () => {
    expect(senhaValida('123')).toBe(false)
    expect(senhaValida('1234')).toBe(true)
    expect(senhaValida('a'.repeat(201))).toBe(false)
    expect(senhaValida(1234)).toBe(false)
  })
})

describe('sessão (cookie assinado)', () => {
  beforeEach(() => {
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_de_teste'
  })

  it('o crachá vale pro papel e o e-mail com que foi emitido', () => {
    const token = criarToken('cliente', 'ana@teste.com')!
    expect(lerToken(token, 'cliente')).toEqual({ email: 'ana@teste.com' })
    // crachá de cliente não abre o painel do funcionário
    expect(lerToken(token, 'funcionario')).toBeNull()
  })

  it('trocar o e-mail dentro do crachá invalida a assinatura', () => {
    const token = criarToken('cliente', 'ana@teste.com')!
    const [, assinatura] = token.split('.')
    const forjado = Buffer.from(JSON.stringify({ p: 'cliente', e: 'bruno@teste.com', x: 9999999999 })).toString('base64url')
    expect(lerToken(`${forjado}.${assinatura}`, 'cliente')).toBeNull()
    expect(lerToken(forjado, 'cliente')).toBeNull()
    expect(lerToken(undefined, 'cliente')).toBeNull()
  })

  it('crachá assinado com outra chave (outro projeto) não vale', () => {
    const token = criarToken('funcionario', 'loja@teste.com')!
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_outra'
    expect(lerToken(token, 'funcionario')).toBeNull()
  })

  it('vence depois de 30 dias', () => {
    const emitidoEm = Date.UTC(2026, 9, 1)
    const token = criarToken('cliente', 'ana@teste.com', emitidoEm)!
    expect(lerToken(token, 'cliente', emitidoEm + 29 * 24 * 3600 * 1000)).toEqual({ email: 'ana@teste.com' })
    expect(lerToken(token, 'cliente', emitidoEm + 31 * 24 * 3600 * 1000)).toBeNull()
  })

  it('sem a chave secreta configurada não existe sessão', () => {
    delete process.env.SUPABASE_SECRET_KEY
    expect(criarToken('cliente', 'ana@teste.com')).toBeNull()
  })

  it('e-mail é comparado sempre em minúsculas e sem espaços', () => {
    expect(normalizarEmail('  Ana@Teste.COM ')).toBe('ana@teste.com')
    expect(normalizarEmail(42)).toBe('')
    expect(emailValido('ana@teste.com')).toBe(true)
    expect(emailValido('ana@teste')).toBe(false)
    expect(emailValido('ana teste@x.com')).toBe(false)
  })
})

describe('podeGravar — o que cada papel pode gravar no banco', () => {
  const ANA = 'ana@teste.com'

  it('cliente grava só o que é do e-mail com que fez login', () => {
    expect(podeGravar('cliente', ANA, 'pedidos', { id: 'LM1', cliente_email: ANA })).toBe(true)
    expect(podeGravar('cliente', ANA, 'pedidos', { id: 'LM1', cliente_email: 'Ana@Teste.com' })).toBe(true)
    expect(podeGravar('cliente', ANA, 'pedidos', { id: 'LM2', cliente_email: 'bruno@teste.com' })).toBe(false)
    expect(podeGravar('cliente', ANA, 'clientes', { id: 'bruno@teste.com' })).toBe(false)
    expect(podeGravar('cliente', ANA, 'conversas', { id: 'bruno@teste.com' })).toBe(false)
  })

  it('ninguém se passa pelo outro lado da conversa', () => {
    expect(podeGravar('cliente', ANA, 'mensagens', { id: 'm1', cliente_email: ANA, autor: 'cliente' })).toBe(true)
    expect(podeGravar('cliente', ANA, 'mensagens', { id: 'm2', cliente_email: ANA, autor: 'funcionario' })).toBe(false)
    expect(podeGravar('funcionario', '', 'mensagens', { id: 'm2', cliente_email: ANA, autor: 'funcionario' })).toBe(true)
    expect(podeGravar('funcionario', '', 'mensagens', { id: 'm1', cliente_email: ANA, autor: 'cliente' })).toBe(false)
  })

  it('etapa do pedido e anotações do chamado são só do funcionário', () => {
    for (const tabela of ['pedidos_status', 'chamados'] as const) {
      expect(podeGravar('funcionario', '', tabela, { id: 'x' })).toBe(true)
      expect(podeGravar('cliente', ANA, tabela, { id: 'x', cliente_email: ANA })).toBe(false)
      expect(podeGravar('visitante', '', tabela, { id: 'x' })).toBe(false)
    }
  })

  it('quem não fez login só pede ajuda no corredor e agenda visita', () => {
    expect(podeGravar('visitante', '', 'ajuda_corredor', { id: 'AJ-1', atendido: false })).toBe(true)
    expect(podeGravar('visitante', '', 'agendamentos', { id: 'AG-1' })).toBe(true)
    expect(podeGravar('visitante', '', 'pedidos', { id: 'LM1', cliente_email: '' })).toBe(false)
    expect(podeGravar('visitante', '', 'conversas', { id: '' })).toBe(false)
    expect(podeGravar('visitante', '', 'clientes', { id: '' })).toBe(false)
  })

  it('marcar pedido de ajuda como atendido é só do funcionário', () => {
    expect(podeGravar('cliente', ANA, 'ajuda_corredor', { id: 'AJ-1', atendido: true })).toBe(false)
    expect(podeGravar('visitante', '', 'ajuda_corredor', { id: 'AJ-1', atendido: true })).toBe(false)
    expect(podeGravar('funcionario', '', 'ajuda_corredor', { id: 'AJ-1', atendido: true })).toBe(true)
  })

  it('o painel não altera pedido, agendamento nem cadastro de cliente', () => {
    expect(podeGravar('funcionario', '', 'pedidos', { id: 'LM1', cliente_email: ANA })).toBe(false)
    expect(podeGravar('funcionario', '', 'agendamentos', { id: 'AG-1' })).toBe(false)
    expect(podeGravar('funcionario', '', 'clientes', { id: ANA })).toBe(false)
  })
})
