import { describe, it, expect } from 'vitest'
import { pontuarProduto, ORCAMENTO_PARA_FAIXA, EXPERIENCIA_PARA_COMPLEXIDADE } from './perfilSugestoes'
import type { Produto } from '@/types/produto'
import type { Perfil } from '@/types/perfil'

function produtoFixture(overrides: Partial<Produto> = {}): Produto {
  return {
    id: 'LM-0001',
    categoria: 'Jardim',
    produto: 'Produto de teste',
    pergunta: '',
    resposta_ia: '',
    corredor: 'Corredor 01',
    corredor_normalizado: 'corredor-01',
    complexidade: 'DIY',
    especificacoes: '',
    tags: [],
    estoque: 10,
    preco: 50,
    sustentabilidade: 'N/A',
    embedding: [],
    embedding_text: '',
    ...overrides,
  }
}

function perfilFixture(overrides: Partial<Perfil> = {}): Perfil {
  return {
    moradia: 'Casa',
    experiencia: 'Iniciante',
    areas: [],
    orcamento: 'Até R$100',
    sustentabilidade: 'Pouco importante',
    respondidoEm: new Date().toISOString(),
    ...overrides,
  }
}

describe('pontuarProduto', () => {
  it('produto que bate em tudo (categoria da moradia, complexidade compatível, dentro do orçamento, em estoque) pontua o máximo', () => {
    const perfil = perfilFixture({ moradia: 'Casa', experiencia: 'Iniciante', orcamento: 'Até R$100' })
    const produto = produtoFixture({ categoria: 'Jardim', complexidade: 'DIY', preco: 50, estoque: 5 })
    // moradia (1) + complexidade (2) + orçamento (1) + estoque (1) = 5, sem bônus de sustentabilidade
    expect(pontuarProduto(produto, perfil)).toBe(5)
  })

  it('produto sem estoque nunca ganha o ponto de disponibilidade', () => {
    const perfil = perfilFixture()
    const comEstoque = produtoFixture({ estoque: 5 })
    const semEstoque = produtoFixture({ estoque: 0 })
    expect(pontuarProduto(semEstoque, perfil)).toBe(pontuarProduto(comEstoque, perfil) - 1)
  })

  it('sustentabilidade só conta ponto extra quando o perfil marcou "Muito importante" E o produto é Prata/Ouro', () => {
    const perfilExigente = perfilFixture({ sustentabilidade: 'Muito importante' })
    const perfilIndiferente = perfilFixture({ sustentabilidade: 'Pouco importante' })
    const produtoOuro = produtoFixture({ sustentabilidade: 'Ouro' })
    const produtoSemSelo = produtoFixture({ sustentabilidade: 'N/A' })

    expect(pontuarProduto(produtoOuro, perfilExigente)).toBe(pontuarProduto(produtoSemSelo, perfilExigente) + 1)
    expect(pontuarProduto(produtoOuro, perfilIndiferente)).toBe(pontuarProduto(produtoSemSelo, perfilIndiferente))
  })

  it('faixas de orçamento cobrem toda a distribuição real sem buraco entre elas (regressão da recalibração de 2026-08-23)', () => {
    const faixas = Object.values(ORCAMENTO_PARA_FAIXA).sort((a, b) => a[0] - b[0])
    for (let i = 1; i < faixas.length; i++) {
      expect(faixas[i][0]).toBe(faixas[i - 1][1])
    }
    expect(faixas[faixas.length - 1][1]).toBe(Infinity)
  })

  it('cada nível de experiência mapeia pra pelo menos uma complexidade que o catálogo real usa (DIY/Profissional/Especialista)', () => {
    const valoresReais = ['DIY', 'Profissional', 'Especialista']
    for (const complexidades of Object.values(EXPERIENCIA_PARA_COMPLEXIDADE)) {
      expect(complexidades.length).toBeGreaterThan(0)
      for (const c of complexidades) expect(valoresReais).toContain(c)
    }
  })
})
