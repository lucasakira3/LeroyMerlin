import type { Pedido } from './clientPedidos'

// Status simulado a partir do tempo real decorrido desde `pedido.data` — sem
// integração de rastreamento de verdade (não existe backend/transportadora aqui), mas
// determinístico e real (não é um valor aleatório por pedido), no mesmo espírito de
// lib/ofertas.ts. Retirada tem só 2 estágios (não faz sentido "enviar" pra loja);
// entrega tem a progressão completa. `etapa`/`etapas` existem pra dar pra desenhar uma
// linha do tempo visual (ver app/conta/page.tsx), não só o badge de texto.
const HORA = 60 * 60 * 1000

const ETAPAS_RETIRADA = ['Confirmado', 'Pronto para retirada']
const ETAPAS_ENTREGA = ['Confirmado', 'Em preparação', 'Enviado', 'Entregue']

export interface StatusPedido {
  label: string
  cor: 'blue' | 'amber' | 'purple' | 'green'
  etapa: number
  etapas: string[]
}

export function getStatusPedido(pedido: Pedido): StatusPedido {
  const decorrido = Date.now() - new Date(pedido.data).getTime()

  if (pedido.metodo === 'retirada') {
    const etapa = decorrido < 2 * HORA ? 0 : 1
    return {
      label: ETAPAS_RETIRADA[etapa],
      cor: etapa === 0 ? 'blue' : 'green',
      etapa,
      etapas: ETAPAS_RETIRADA,
    }
  }

  const etapa = decorrido < 2 * HORA ? 0 : decorrido < 24 * HORA ? 1 : decorrido < 72 * HORA ? 2 : 3
  const cores: StatusPedido['cor'][] = ['blue', 'amber', 'purple', 'green']
  return {
    label: ETAPAS_ENTREGA[etapa],
    cor: cores[etapa],
    etapa,
    etapas: ETAPAS_ENTREGA,
  }
}
