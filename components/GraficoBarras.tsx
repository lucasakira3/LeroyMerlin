interface Props {
  dados: { label: string; valor: number }[]
}

// Barra em CSS puro (sem lib de gráfico — projeto não tem nenhuma instalada, ver
// package.json) — suficiente pra uma comparação simples entre poucas categorias.
export default function GraficoBarras({ dados }: Props) {
  const max = Math.max(1, ...dados.map(d => d.valor))

  return (
    <div className="space-y-2.5">
      {dados.map(d => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs text-gray-600 w-28 flex-shrink-0 truncate">{d.label}</span>
          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-lm-green rounded-full transition-all duration-500"
              style={{ width: `${(d.valor / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-700 w-14 flex-shrink-0 text-right">
            {d.valor.toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  )
}
