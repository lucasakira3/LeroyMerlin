import { describe, it, expect, beforeEach } from 'vitest'
import { exportarDadosCliente, apagarDadosCliente } from './privacidadeDados'

// Stub mínimo de localStorage — não instalamos jsdom só pra isso (escopo "básico" de
// testes), esse mock cobre exatamente a API usada por lib/privacidadeDados.ts.
function criarLocalStorageFake() {
  const dados = new Map<string, string>()
  return {
    getItem: (k: string) => dados.get(k) ?? null,
    setItem: (k: string, v: string) => { dados.set(k, v) },
    removeItem: (k: string) => { dados.delete(k) },
    clear: () => dados.clear(),
  }
}

beforeEach(() => {
  ;(globalThis as any).window = { localStorage: criarLocalStorageFake(), dispatchEvent: () => true }
})

function semear(chave: string, valor: unknown) {
  window.localStorage.setItem(chave, JSON.stringify(valor))
}

describe('apagarDadosCliente', () => {
  it('remove só a entrada do e-mail apagado, preserva os outros clientes no mesmo mapa', () => {
    semear('lm_contas_cliente', {
      'ana@teste.com': { nome: 'Ana', senha: '123', criadoEm: '2026-01-01' },
      'bruno@teste.com': { nome: 'Bruno', senha: '456', criadoEm: '2026-01-02' },
    })

    apagarDadosCliente('ana@teste.com')

    const restante = JSON.parse(window.localStorage.getItem('lm_contas_cliente')!)
    expect(restante).not.toHaveProperty('ana@teste.com')
    expect(restante).toHaveProperty('bruno@teste.com')
  })

  it('avaliações: filtra só as do e-mail apagado dentro de cada produto, mantém as de outros clientes', () => {
    semear('lm_avaliacoes_produtos', {
      'LM-0001': [
        { email: 'ana@teste.com', nota: 5 },
        { email: 'bruno@teste.com', nota: 3 },
      ],
      'LM-0002': [{ email: 'ana@teste.com', nota: 4 }],
    })

    apagarDadosCliente('ana@teste.com')

    const restante = JSON.parse(window.localStorage.getItem('lm_avaliacoes_produtos')!)
    expect(restante['LM-0001']).toEqual([{ email: 'bruno@teste.com', nota: 3 }])
    // Produto onde só a Ana tinha avaliado fica sem chave nenhuma, não um array vazio solto
    expect(restante).not.toHaveProperty('LM-0002')
  })

  it('limpa os dados globais do navegador (carrinho, favoritos, comparador etc.)', () => {
    semear('lm_carrinho', [{ produtoId: 'LM-0001', quantidade: 2 }])
    semear('lm_favoritos_produtos', ['LM-0001'])

    apagarDadosCliente('ana@teste.com')

    expect(window.localStorage.getItem('lm_carrinho')).toBeNull()
    expect(window.localStorage.getItem('lm_favoritos_produtos')).toBeNull()
  })

  it('desloga o cliente ao apagar a própria conta', () => {
    semear('lm_usuario_logado', { email: 'ana@teste.com', nome: 'Ana' })
    apagarDadosCliente('ana@teste.com')
    expect(window.localStorage.getItem('lm_usuario_logado')).toBeNull()
  })
})

describe('exportarDadosCliente', () => {
  it('nunca inclui a senha da conta no export, mesmo sendo texto puro no armazenamento', () => {
    semear('lm_contas_cliente', { 'ana@teste.com': { nome: 'Ana', senha: 'segredo123', criadoEm: '2026-01-01' } })
    const dados = exportarDadosCliente('ana@teste.com')
    expect(JSON.stringify(dados)).not.toContain('segredo123')
    expect(dados.conta).toEqual({ nome: 'Ana', criadoEm: '2026-01-01' })
  })

  it('só traz as avaliações do próprio e-mail, com o produtoId anexado', () => {
    semear('lm_avaliacoes_produtos', {
      'LM-0001': [
        { email: 'ana@teste.com', nota: 5 },
        { email: 'bruno@teste.com', nota: 3 },
      ],
    })
    const dados = exportarDadosCliente('ana@teste.com')
    expect(dados.avaliacoes).toEqual([{ produtoId: 'LM-0001', email: 'ana@teste.com', nota: 5 }])
  })

  it('não quebra quando o cliente não tem nada gravado ainda', () => {
    const dados = exportarDadosCliente('novo@teste.com')
    expect(dados.conta).toBeNull()
    expect(dados.pedidos).toEqual([])
    expect(dados.avaliacoes).toEqual([])
  })
})
