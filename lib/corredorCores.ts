// Paleta de cores por faixa de corredor — a mesma do mapa da loja (StoreMap), pra que
// o selo do corredor nos cards use a mesma cor que o cliente vai ver nas prateleiras.
export function shelfColor(n: number): { fill: string; stroke: string } {
  if (n <= 8)  return { fill: '#fef3c7', stroke: '#d97706' }
  if (n <= 15) return { fill: '#fef9c3', stroke: '#ca8a04' }
  if (n <= 22) return { fill: '#dbeafe', stroke: '#2563eb' }
  if (n <= 28) return { fill: '#fff7ed', stroke: '#ea580c' }
  if (n <= 35) return { fill: '#dcfce7', stroke: '#16a34a' }
  if (n <= 43) return { fill: '#f1f5f9', stroke: '#64748b' }
  if (n <= 47) return { fill: '#e0f2fe', stroke: '#0284c7' }
  return               { fill: '#fdf4ff', stroke: '#9333ea' }
}

// "corredor-12" -> 12. Corredores com letra (a-3 etc.) não têm número: devolve null e o
// chamador cai no verde padrão.
export function numeroDoCorredor(corredorNormalizado: string): number | null {
  const m = corredorNormalizado.match(/^corredor-(\d+)$/)
  return m ? parseInt(m[1], 10) : null
}
