import { describe, it, expect, vi } from 'vitest'
import { GoogleGenerativeAIFetchError } from '@google/generative-ai'
import { ehErroTransitorio, comRetry } from './gemini'

describe('ehErroTransitorio', () => {
  it('reconhece 503 (model overloaded) como transitório', () => {
    expect(ehErroTransitorio(new GoogleGenerativeAIFetchError('sobrecarregado', 503, 'Service Unavailable'))).toBe(true)
  })

  it('reconhece 429 (rate limit) e 500 como transitórios', () => {
    expect(ehErroTransitorio(new GoogleGenerativeAIFetchError('rate limit', 429, 'Too Many Requests'))).toBe(true)
    expect(ehErroTransitorio(new GoogleGenerativeAIFetchError('erro interno', 500, 'Internal Server Error'))).toBe(true)
  })

  it('não trata um erro de verdade (400, prompt/chave inválida) como transitório', () => {
    expect(ehErroTransitorio(new GoogleGenerativeAIFetchError('chave inválida', 400, 'Bad Request'))).toBe(false)
  })

  it('cai no fallback de texto quando não é um GoogleGenerativeAIFetchError', () => {
    expect(ehErroTransitorio(new Error('[503 Service Unavailable] model overloaded'))).toBe(true)
    expect(ehErroTransitorio(new Error('algo genérico deu errado'))).toBe(false)
  })
})

describe('comRetry', () => {
  it('retorna o resultado direto quando a primeira tentativa já funciona', async () => {
    const chamada = vi.fn().mockResolvedValue('ok')
    expect(await comRetry(chamada, 1)).toBe('ok')
    expect(chamada).toHaveBeenCalledTimes(1)
  })

  it('tenta de novo em erro transitório e devolve o resultado assim que funcionar', async () => {
    const chamada = vi.fn()
      .mockRejectedValueOnce(new GoogleGenerativeAIFetchError('sobrecarregado', 503, 'Service Unavailable'))
      .mockResolvedValueOnce('ok na segunda tentativa')
    expect(await comRetry(chamada, 1)).toBe('ok na segunda tentativa')
    expect(chamada).toHaveBeenCalledTimes(2)
  })

  it('desiste depois de 3 tentativas transitórias e propaga o último erro', async () => {
    const erro = new GoogleGenerativeAIFetchError('sobrecarregado', 503, 'Service Unavailable')
    const chamada = vi.fn().mockRejectedValue(erro)
    await expect(comRetry(chamada, 1)).rejects.toBe(erro)
    expect(chamada).toHaveBeenCalledTimes(3)
  })

  it('não insiste num erro que não é transitório — falha já na primeira tentativa', async () => {
    const erro = new GoogleGenerativeAIFetchError('chave inválida', 400, 'Bad Request')
    const chamada = vi.fn().mockRejectedValue(erro)
    await expect(comRetry(chamada, 1)).rejects.toBe(erro)
    expect(chamada).toHaveBeenCalledTimes(1)
  })
})
