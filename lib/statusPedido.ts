import type { Pedido } from './clientPedidos'

// Status simulado a partir do tempo real decorrido desde `pedido.data` — sem
// integração de rastreamento de verdade (não existe backend/transportadora aqui), mas
// determinístico e real (não é um valor aleatório por pedido), no mesmo espírito de
// lib/ofertas.ts. Retirada tem só 2 estágios (não faz sentido "enviar" pra loja);
// entrega tem a progressão completa.
const HORA = 60 * 60 * 1000

export interface StatusPedido {
  label: string
  cor: 'blue' | 'amber' | 'purple' | 'green'
}

export function getStatusPedido(pedido: Pedido): StatusPedido {
  const decorrido = Date.now() - new Date(pedido.data).getTime()

  if (pedido.metodo === 'retirada') {
    return decorrido < 2 * HORA
      ? { label: 'Confirmado', cor: 'blue' }
      : { label: 'Pronto para retirada', cor: 'green' }
  }

  if (decorrido < 2 * HORA) return { label: 'Confirmado', cor: 'blue' }
  if (decorrido < 24 * HORA) return { label: 'Em preparação', cor: 'amber' }
  if (decorrido < 72 * HORA) return { label: 'Enviado', cor: 'purple' }
  return { label: 'Entregue', cor: 'green' }
}
