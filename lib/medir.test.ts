import { describe, it, expect } from 'vitest'
import { OBJETOS_REFERENCIA, getObjetoReferencia } from './medir'

describe('getObjetoReferencia', () => {
  it('encontra cada objeto de referência pelo próprio id', () => {
    for (const objeto of OBJETOS_REFERENCIA) {
      expect(getObjetoReferencia(objeto.id)).toEqual(objeto)
    }
  })

  it('retorna undefined pra um id que não existe (evita medir com referência inválida)', () => {
    expect(getObjetoReferencia('garrafa_pet')).toBeUndefined()
  })

  it('todos os objetos têm dimensões reais positivas', () => {
    for (const objeto of OBJETOS_REFERENCIA) {
      expect(objeto.larguraCm).toBeGreaterThan(0)
      expect(objeto.alturaCm).toBeGreaterThan(0)
    }
  })
})
