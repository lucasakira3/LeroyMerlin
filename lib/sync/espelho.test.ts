import { describe, it, expect } from 'vitest'
import { estadoVazio, hashDaLinha, idDaMensagem, linhasLocais, mesclarRemoto, type EstadoLocal } from './espelho'
import type { Lote } from './tabelas'

const ANA = 'ana@teste.com'

function pedido(numero: string, data = '2026-10-05T12:00:00.000Z') {
  return { numero, data, itens: [{ produtoId: 'LM-0001', nome: 'Furadeira', preco: 189.9, quantidade: 1 }], metodo: 'retirada' as const, loja: 'Interlagos', total: 189.9 }
}

function agendamento(id: string, status: 'confirmado' | 'cancelado' = 'confirmado') {
  return { id, servico: 'cozinha', servicoLabel: 'Projeto de cozinha', loja: 'Interlagos', data: '10/10/2026', horario: '10:00', nome: 'Ana', telefone: '11999990000', email: ANA, observacao: '', criadoEm: '05/10/2026, 12:00:00', status }
}

// O que um aparelho manda vira o que o outro recebe: as linhas do aparelho A, do jeito que
// o banco as devolveria (com `atualizado_em`), entregues ao aparelho B.
function comoVemDoBanco(estado: EstadoLocal): Lote {
  const linhas = linhasLocais(estado)
  return Object.fromEntries(
    Object.entries(linhas).map(([tabela, lista]) => [tabela, lista.map(l => ({ ...l, atualizado_em: '2026-10-05T12:00:01.000000+00:00' }))])
  ) as Lote
}

describe('linhasLocais', () => {
  it('nunca manda a senha da conta pro banco', () => {
    const estado = estadoVazio()
    ;(estado.contas as Record<string, unknown>)[ANA] = { nome: 'Ana', senha: 'segredo', criadoEm: '2026-10-01T00:00:00.000Z' }
    const { clientes } = linhasLocais(estado)
    expect(clientes).toEqual([{ id: ANA, nome: 'Ana', criado_em: '2026-10-01T00:00:00.000Z' }])
    expect(JSON.stringify(clientes)).not.toContain('segredo')
  })

  it('pedido antigo sem "metodo" vai como entrega, e pedido com data inválida fica de fora', () => {
    const estado = estadoVazio()
    const semMetodo = { ...pedido('LM1') } as Record<string, unknown>
    delete semMetodo.metodo
    estado.pedidos[ANA] = [semMetodo as never, pedido('LM2', 'não é data')]
    const { pedidos } = linhasLocais(estado)
    expect(pedidos.map(p => [p.id, p.metodo])).toEqual([['LM1', 'entrega']])
  })

  it('a etapa do pedido leva o e-mail do dono (pra o cliente recebê-la); etapa de pedido que não está no aparelho não é enviada', () => {
    const estado = estadoVazio()
    estado.pedidos[ANA] = [pedido('LM1')]
    estado.status = { LM1: { etapa: 2, atualizadoEm: '2026-10-05T13:00:00.000Z' }, LMX: { etapa: 1, atualizadoEm: '2026-10-05T13:00:00.000Z' } }
    const { pedidos_status } = linhasLocais(estado)
    expect(pedidos_status).toEqual([
      { id: 'LM1', cliente_email: ANA, etapa: 2, definida_em: '2026-10-05T13:00:00.000Z' },
    ])
  })
})

describe('mesclarRemoto — o que chega de outro aparelho', () => {
  it('pedido feito no celular do cliente aparece no aparelho do funcionário', () => {
    const celular = estadoVazio()
    celular.pedidos[ANA] = [pedido('LM1')]

    const { estado, alteradas } = mesclarRemoto(estadoVazio(), comoVemDoBanco(celular))
    expect(estado.pedidos[ANA].map(p => p.numero)).toEqual(['LM1'])
    expect(alteradas).toEqual(['pedidos'])
  })

  it('receber a mesma coisa duas vezes não duplica nem acusa mudança', () => {
    const celular = estadoVazio()
    celular.pedidos[ANA] = [pedido('LM1')]
    celular.ajuda = [{ id: 'AJ-1', produtoId: 'LM-0001', produtoNome: 'Furadeira', corredor: 'Corredor 03', criadoEm: '2026-10-05T12:00:00.000Z', atendido: false }]
    celular.agendamentos = [agendamento('AG-1759665600000')]
    celular.conversas[ANA] = { clienteEmail: ANA, clienteNome: 'Ana', mensagens: [{ autor: 'cliente', texto: 'Oi', data: '2026-10-05T12:00:00.000Z' }], atendida: false, atualizadoEm: '2026-10-05T12:00:00.000Z' }
    const doBanco = comoVemDoBanco(celular)

    const primeira = mesclarRemoto(estadoVazio(), doBanco)
    const segunda = mesclarRemoto(primeira.estado, doBanco)
    expect(segunda.alteradas).toEqual([])
    expect(segunda.estado).toEqual(primeira.estado)
    expect(segunda.estado.conversas[ANA].mensagens).toHaveLength(1)
  })

  it('o aparelho que recebeu fica com linhas iguais às de quem mandou (não devolve o que acabou de receber)', () => {
    const origem = estadoVazio()
    origem.pedidos[ANA] = [pedido('LM1')]
    origem.status = { LM1: { etapa: 1, atualizadoEm: '2026-10-05T13:00:00.000Z' } }
    origem.ajuda = [{ id: 'AJ-1', produtoId: 'LM-0001', produtoNome: 'Furadeira', corredor: 'Corredor 03', clienteNome: 'Ana', criadoEm: '2026-10-05T12:00:00.000Z', atendido: true }]
    origem.agendamentos = [agendamento('AG-1759665600000', 'cancelado')]
    origem.chamados = { 'AG-1759665600000': { atendido: true, notas: [{ texto: 'Liguei', data: '2026-10-05T12:30:00.000Z' }] } }
    origem.conversas[ANA] = { clienteEmail: ANA, clienteNome: 'Ana', mensagens: [{ autor: 'cliente', texto: 'Oi', data: '2026-10-05T12:00:00.000Z' }, { autor: 'funcionario', texto: 'Olá', data: '2026-10-05T12:01:00.000Z' }], atendida: true, atendidaEm: '2026-10-05T12:05:00.000Z', atualizadoEm: '2026-10-05T12:01:00.000Z' }

    const { estado: destino } = mesclarRemoto(estadoVazio(), comoVemDoBanco(origem))
    const impressoes = (e: EstadoLocal) => Object.fromEntries(Object.entries(linhasLocais(e)).map(([t, ls]) => [t, ls.map(hashDaLinha)]))
    const a = impressoes(origem)
    const b = impressoes(destino)
    // `clientes` fica de fora: quem recebe guarda os nomes em outra gaveta e não os reenvia.
    for (const tabela of ['pedidos', 'pedidos_status', 'ajuda_corredor', 'agendamentos', 'chamados', 'conversas', 'mensagens']) {
      expect(b[tabela], tabela).toEqual(a[tabela])
    }
  })

  it('aceita as datas do jeito que o Postgres devolve (+00:00 no lugar de Z)', () => {
    const local = estadoVazio()
    local.conversas[ANA] = { clienteEmail: ANA, clienteNome: 'Ana', mensagens: [{ autor: 'cliente', texto: 'Oi', data: '2026-10-05T12:00:00.123Z' }], atendida: false, atualizadoEm: '2026-10-05T12:00:00.123Z' }
    const id = idDaMensagem(ANA, local.conversas[ANA].mensagens[0])

    const { estado, alteradas } = mesclarRemoto(local, {
      mensagens: [{ id, cliente_email: ANA, autor: 'cliente', texto: 'Oi', enviada_em: '2026-10-05T12:00:00.123+00:00' }],
      pedidos_status: [{ id: 'LM1', cliente_email: ANA, etapa: 2, definida_em: '2026-10-05T13:00:00+00:00' }],
    })
    expect(estado.conversas[ANA].mensagens).toHaveLength(1)
    expect(estado.status.LM1).toEqual({ etapa: 2, atualizadoEm: '2026-10-05T13:00:00.000Z' })
    expect(alteradas).toEqual(['status'])
  })
})

describe('mesclarRemoto — quem ganha quando os dois lados mexeram', () => {
  it('etapa do pedido: vale a definida por último, e uma mais antiga que chega atrasada é ignorada', () => {
    const local = estadoVazio()
    local.status = { LM1: { etapa: 2, atualizadoEm: '2026-10-05T13:00:00.000Z' } }

    const atrasada = mesclarRemoto(local, { pedidos_status: [{ id: 'LM1', etapa: 1, definida_em: '2026-10-05T12:00:00.000Z' }] })
    expect(atrasada.estado.status.LM1.etapa).toBe(2)
    expect(atrasada.alteradas).toEqual([])

    const maisNova = mesclarRemoto(local, { pedidos_status: [{ id: 'LM1', etapa: 3, definida_em: '2026-10-05T14:00:00.000Z' }] })
    expect(maisNova.estado.status.LM1).toEqual({ etapa: 3, atualizadoEm: '2026-10-05T14:00:00.000Z' })
  })

  it('pedido de ajuda atendido não volta a pendente', () => {
    const local = estadoVazio()
    local.ajuda = [{ id: 'AJ-1', produtoId: 'LM-0001', produtoNome: 'Furadeira', corredor: 'Corredor 03', criadoEm: '2026-10-05T12:00:00.000Z', atendido: true }]
    const { estado } = mesclarRemoto(local, { ajuda_corredor: [{ id: 'AJ-1', produto_id: 'LM-0001', produto_nome: 'Furadeira', corredor: 'Corredor 03', pedido_em: '2026-10-05T12:00:00.000Z', atendido: false }] })
    expect(estado.ajuda[0].atendido).toBe(true)
  })

  it('pedido de ajuda novo entra com o mais recente primeiro', () => {
    const local = estadoVazio()
    local.ajuda = [{ id: 'AJ-1', produtoId: 'LM-0001', produtoNome: 'Furadeira', corredor: 'Corredor 03', criadoEm: '2026-10-05T12:00:00.000Z', atendido: false }]
    const { estado } = mesclarRemoto(local, { ajuda_corredor: [{ id: 'AJ-2', produto_id: 'LM-0007', produto_nome: 'Nível', corredor: 'Corredor 02', cliente_nome: 'Bruno', pedido_em: '2026-10-05T12:10:00.000Z', atendido: false }] })
    expect(estado.ajuda.map(p => p.id)).toEqual(['AJ-2', 'AJ-1'])
    expect(estado.ajuda[0]).toMatchObject({ produtoId: 'LM-0007', clienteNome: 'Bruno', atendido: false })
  })

  it('agendamento cancelado pelo cliente chega cancelado no funcionário, e não volta a confirmado', () => {
    const funcionario = estadoVazio()
    funcionario.agendamentos = [agendamento('AG-1')]

    const cancelado = mesclarRemoto(funcionario, { agendamentos: [{ id: 'AG-1', status: 'cancelado', dados: agendamento('AG-1', 'cancelado') }] })
    expect(cancelado.estado.agendamentos[0].status).toBe('cancelado')

    const reenvioVelho = mesclarRemoto(cancelado.estado, { agendamentos: [{ id: 'AG-1', status: 'confirmado', dados: agendamento('AG-1') }] })
    expect(reenvioVelho.estado.agendamentos[0].status).toBe('cancelado')
  })

  it('notas do chamado feitas em dois aparelhos se somam, sem repetir', () => {
    const local = estadoVazio()
    local.chamados = { 'AG-1': { atendido: false, notas: [{ texto: 'Liguei', data: '2026-10-05T12:30:00.000Z' }] } }
    const { estado } = mesclarRemoto(local, { chamados: [{ id: 'AG-1', atendido: true, notas: [{ texto: 'Liguei', data: '2026-10-05T12:30:00.000Z' }, { texto: 'Cliente confirmou', data: '2026-10-05T12:40:00.000Z' }] }] })
    expect(estado.chamados['AG-1']).toEqual({
      atendido: true,
      notas: [{ texto: 'Liguei', data: '2026-10-05T12:30:00.000Z' }, { texto: 'Cliente confirmou', data: '2026-10-05T12:40:00.000Z' }],
    })
  })

  it('conversa: mensagens dos dois lados se juntam em ordem, e a encerrada reabre se o cliente escrever depois', () => {
    const funcionario = estadoVazio()
    funcionario.conversas[ANA] = {
      clienteEmail: ANA, clienteNome: 'Ana', atendida: true, atendidaEm: '2026-10-05T12:05:00.000Z', atualizadoEm: '2026-10-05T12:01:00.000Z',
      mensagens: [{ autor: 'cliente', texto: 'Oi', data: '2026-10-05T12:00:00.000Z' }, { autor: 'funcionario', texto: 'Olá', data: '2026-10-05T12:01:00.000Z' }],
    }
    const nova = { autor: 'cliente' as const, texto: 'Mais uma dúvida', data: '2026-10-05T12:10:00.000Z' }

    const { estado } = mesclarRemoto(funcionario, { mensagens: [{ id: idDaMensagem(ANA, nova), cliente_email: ANA, autor: 'cliente', texto: nova.texto, enviada_em: nova.data }] })
    expect(estado.conversas[ANA].mensagens.map(m => m.texto)).toEqual(['Oi', 'Olá', 'Mais uma dúvida'])
    expect(estado.conversas[ANA].atendida).toBe(false)
    expect(estado.conversas[ANA].atualizadoEm).toBe(nova.data)
  })

  it('conversa encerrada pelo funcionário chega encerrada no outro aparelho', () => {
    const outro = estadoVazio()
    outro.conversas[ANA] = { clienteEmail: ANA, clienteNome: 'Ana', atendida: false, atualizadoEm: '2026-10-05T12:00:00.000Z', mensagens: [{ autor: 'cliente', texto: 'Oi', data: '2026-10-05T12:00:00.000Z' }] }
    const { estado } = mesclarRemoto(outro, { conversas: [{ id: ANA, cliente_nome: 'Ana', atendida_em: '2026-10-05T12:05:00+00:00' }] })
    expect(estado.conversas[ANA].atendida).toBe(true)
    expect(estado.conversas[ANA].atendidaEm).toBe('2026-10-05T12:05:00.000Z')
  })

  it('conversa antiga encerrada (sem a hora do encerramento) não reabre só por chegar uma linha do banco', () => {
    const local = estadoVazio()
    local.conversas[ANA] = { clienteEmail: ANA, clienteNome: 'Ana', atendida: true, atualizadoEm: '2026-10-05T12:00:00.000Z', mensagens: [{ autor: 'cliente', texto: 'Oi', data: '2026-10-05T12:00:00.000Z' }] }
    const { estado } = mesclarRemoto(local, { conversas: [{ id: ANA, cliente_nome: 'Ana', atendida_em: null }] })
    expect(estado.conversas[ANA].atendida).toBe(true)
  })
})

describe('mesclarRemoto — relógio errado no aparelho', () => {
  it('a hora da mensagem passa a ser a do banco, inclusive pra quem enviou: a resposta não aparece antes da pergunta', () => {
    // Celular do cliente 18s adiantado: ele pergunta às 12:00:00 (pra ele, 12:00:18) e o
    // funcionário responde 5s depois. Pela hora de cada aparelho a resposta viria primeiro.
    const celular = estadoVazio()
    celular.conversas[ANA] = { clienteEmail: ANA, clienteNome: 'Ana', atendida: false, atualizadoEm: '2026-10-05T12:00:18.000Z', mensagens: [{ id: 'MS-1', autor: 'cliente', texto: 'Tem em estoque?', data: '2026-10-05T12:00:18.000Z' }] }

    const { estado } = mesclarRemoto(celular, { mensagens: [
      { id: 'MS-1', cliente_email: ANA, autor: 'cliente', texto: 'Tem em estoque?', enviada_em: '2026-10-05T12:00:00+00:00' },
      { id: 'MS-2', cliente_email: ANA, autor: 'funcionario', texto: 'Tem sim', enviada_em: '2026-10-05T12:00:05+00:00' },
    ] })
    expect(estado.conversas[ANA].mensagens.map(m => [m.id, m.texto, m.data])).toEqual([
      ['MS-1', 'Tem em estoque?', '2026-10-05T12:00:00.000Z'],
      ['MS-2', 'Tem sim', '2026-10-05T12:00:05.000Z'],
    ])
    expect(linhasLocais(estado).mensagens.map(l => l.id)).toEqual(['MS-1', 'MS-2'])
  })

  it('mensagem antiga (sem id) guarda a identidade antes de ter a hora corrigida, e não vira outra mensagem', () => {
    const local = estadoVazio()
    const antiga = { autor: 'cliente' as const, texto: 'Oi', data: '2026-10-05T12:00:18.000Z' }
    local.conversas[ANA] = { clienteEmail: ANA, clienteNome: 'Ana', atendida: false, atualizadoEm: antiga.data, mensagens: [antiga] }
    const id = idDaMensagem(ANA, antiga)
    const doBanco = { mensagens: [{ id, cliente_email: ANA, autor: 'cliente', texto: 'Oi', enviada_em: '2026-10-05T12:00:00+00:00' }] }

    const primeira = mesclarRemoto(local, doBanco)
    expect(primeira.estado.conversas[ANA].mensagens).toEqual([{ id, autor: 'cliente', texto: 'Oi', data: '2026-10-05T12:00:00.000Z' }])
    expect(linhasLocais(primeira.estado).mensagens[0].id).toBe(id)

    const segunda = mesclarRemoto(primeira.estado, doBanco)
    expect(segunda.alteradas).toEqual([])
    expect(segunda.estado.conversas[ANA].mensagens).toHaveLength(1)
  })
})

describe('mesclarRemoto — o que foi apagado em outro aparelho', () => {
  it('agendamento removido some daqui junto com as anotações do funcionário sobre ele', () => {
    const local = estadoVazio()
    local.agendamentos = [agendamento('AG-1'), agendamento('AG-2')]
    local.chamados = { 'AG-1': { atendido: true, notas: [] } }
    const { estado, alteradas } = mesclarRemoto(local, {}, [{ tabela: 'agendamentos', id: 'AG-1' }])
    expect(estado.agendamentos.map(a => a.id)).toEqual(['AG-2'])
    expect(estado.chamados).toEqual({})
    expect(alteradas.sort()).toEqual(['agendamentos', 'chamados'])
  })

  it('"apagar meus dados" tira pedidos, etapa, conversa e nome do cliente dos outros aparelhos', () => {
    const local = estadoVazio()
    local.pedidos[ANA] = [pedido('LM1')]
    local.pedidos['bruno@teste.com'] = [pedido('LM2')]
    local.status = { LM1: { etapa: 1, atualizadoEm: '2026-10-05T13:00:00.000Z' } }
    local.clientesRemotos[ANA] = { nome: 'Ana', criadoEm: '' }
    local.conversas[ANA] = { clienteEmail: ANA, clienteNome: 'Ana', mensagens: [], atendida: false, atualizadoEm: '2026-10-05T12:00:00.000Z' }

    const { estado } = mesclarRemoto(local, {}, [
      { tabela: 'pedidos', id: 'LM1' }, { tabela: 'conversas', id: ANA }, { tabela: 'clientes', id: ANA },
    ])
    expect(estado.pedidos).toEqual({ 'bruno@teste.com': [pedido('LM2')] })
    expect(estado.status).toEqual({})
    expect(estado.conversas).toEqual({})
    expect(estado.clientesRemotos).toEqual({})
  })
})

describe('hashDaLinha', () => {
  it('é a mesma para a mesma linha montada em outra ordem, e muda quando o conteúdo muda', () => {
    const a = hashDaLinha({ id: 'x', atendido: false, dados: { b: 1, a: [1, 2] } })
    const b = hashDaLinha({ dados: { a: [1, 2], b: 1 }, atendido: false, id: 'x' })
    expect(a).toBe(b)
    expect(hashDaLinha({ id: 'x', atendido: true, dados: { b: 1, a: [1, 2] } })).not.toBe(a)
  })
})
