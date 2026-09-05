import { describe, it, expect } from 'vitest'
import { ordenarProdutos } from './ordenarProdutos'

interface ItemTeste {
  id: string
  preco: number
}

const getId = (i: ItemTeste) => i.id
const getPreco = (i: ItemTeste) => i.preco

const itens: ItemTeste[] = [
  { id: 'a', preco: 30 },
  { id: 'b', preco: 10 },
  { id: 'c', preco: 20 },
]

describe('ordenarProdutos', () => {
  it('relevância mantém a ordem original (sem reordenar)', () => {
    const resultado = ordenarProdutos(itens, 'relevancia', getId, getPreco)
    expect(resultado.map(getId)).toEqual(['a', 'b', 'c'])
  })

  it('menor preço ordena crescente', () => {
    const resultado = ordenarProdutos(itens, 'menor-preco', getId, getPreco)
    expect(resultado.map(getId)).toEqual(['b', 'c', 'a'])
  })

  it('maior preço ordena decrescente', () => {
    const resultado = ordenarProdutos(itens, 'maior-preco', getId, getPreco)
    expect(resultado.map(getId)).toEqual(['a', 'c', 'b'])
  })

  it('nunca muta o array original (várias telas guardam o resultado cru em estado)', () => {
    const original = [...itens]
    ordenarProdutos(itens, 'menor-preco', getId, getPreco)
    expect(itens).toEqual(original)
  })
})
