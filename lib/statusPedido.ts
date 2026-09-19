import type { Pedido } from './clientPedidos'
import { getEtapaManual } from './statusPedidoFuncionario'

// Status simulado a partir do tempo real decorrido desde `pedido.data` — sem
// integração de rastreamento de verdade (não existe backend/transportadora aqui), mas
// determinístico e real (não é um valor aleatório por pedido), no mesmo espírito de
// lib/ofertas.ts. Retirada tem só 2 estágios (não faz sentido "enviar" pra loja);
// entrega tem a progressão completa. `etapa`/`etapas` existem pra dar pra desenhar uma
// linha do tempo visual (ver app/conta/page.tsx), não só o badge de texto.
const HORA = 60 * 60 * 1000

// 'Retirado' nunca é atingido só pelo tempo: só o funcionário marca (lib/statusPedidoFuncionario.ts).
const ETAPAS_RETIRADA = ['Confirmado', 'Em separação', 'Pronto para retirada', 'Retirado']
const ETAPAS_ENTREGA = ['Confirmado', 'Em preparação', 'Enviado', 'Entregue']

// Deslocamento (em ms desde `pedido.data`) em que cada etapa começa — os mesmos
// limiares usados pra calcular `etapa` abaixo, só que guardados pra dar pra mostrar
// "previsto para" em cada passo da linha do tempo, não só qual já passou.
const OFFSETS_RETIRADA = [0, HORA / 2, 2 * HORA, 2 * HORA]
const OFFSETS_ENTREGA = [0, 2 * HORA, 24 * HORA, 72 * HORA]

export interface StatusPedido {
  label: string
  cor: 'blue' | 'amber' | 'purple' | 'green'
  etapa: number
  etapas: string[]
  /** Data/hora prevista (ou já ocorrida) de cada etapa, mesma ordem de `etapas`. */
  previsoes: Date[]
}

// Etapa avançada à mão pelo funcionário já aconteceu, mesmo que o horário "previsto" pelo
// relógio ainda esteja no futuro — nesse caso mostra agora, não um horário que ainda não chegou.
function previsao(momento: number, jaAconteceu: boolean): Date {
  return new Date(jaAconteceu ? Math.min(momento, Date.now()) : momento)
}

export function getStatusPedido(pedido: Pedido): StatusPedido {
  const dataPedido = new Date(pedido.data).getTime()
  const decorrido = Date.now() - dataPedido

  if (pedido.metodo === 'retirada') {
    const manual = getEtapaManual(pedido.numero)
    const etapa = manual !== null ? Math.min(manual, ETAPAS_RETIRADA.length - 1) : decorrido < HORA / 2 ? 0 : decorrido < 2 * HORA ? 1 : 2
    const coresRetirada: StatusPedido['cor'][] = ['blue', 'amber', 'green', 'green']
    return {
      label: ETAPAS_RETIRADA[etapa],
      cor: coresRetirada[etapa],
      etapa,
      etapas: ETAPAS_RETIRADA,
      previsoes: OFFSETS_RETIRADA.map((offset, i) => previsao(dataPedido + offset, i <= etapa && manual !== null)),
    }
  }

  const manualEntrega = getEtapaManual(pedido.numero)
  const etapa =
    manualEntrega !== null
      ? Math.min(manualEntrega, ETAPAS_ENTREGA.length - 1)
      : decorrido < 2 * HORA ? 0 : decorrido < 24 * HORA ? 1 : decorrido < 72 * HORA ? 2 : 3
  const cores: StatusPedido['cor'][] = ['blue', 'amber', 'purple', 'green']
  return {
    label: ETAPAS_ENTREGA[etapa],
    cor: cores[etapa],
    etapa,
    etapas: ETAPAS_ENTREGA,
    previsoes: OFFSETS_ENTREGA.map((offset, i) => previsao(dataPedido + offset, i <= etapa && manualEntrega !== null)),
  }
}
