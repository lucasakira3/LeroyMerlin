import Badge from './ui/Badge'

interface StockIndicatorProps {
  estoque: number
}

export default function StockIndicator({ estoque }: StockIndicatorProps) {
  if (estoque === 0) {
    return <Badge tone="gray">Sem estoque</Badge>
  }
  if (estoque < 10) {
    return <Badge tone="orange">Últimas {estoque} unidades</Badge>
  }
  return <Badge tone="green">✓ Disponível</Badge>
}
