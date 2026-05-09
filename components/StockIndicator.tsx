interface StockIndicatorProps {
  estoque: number
}

export default function StockIndicator({ estoque }: StockIndicatorProps) {
  if (estoque === 0) {
    return <span className="text-xs text-gray-400">Sem estoque</span>
  }
  if (estoque < 10) {
    return <span className="text-xs text-lm-orange font-medium">Últimas {estoque} unidades</span>
  }
  return <span className="text-xs text-lm-green font-medium">✓ Disponível</span>
}
