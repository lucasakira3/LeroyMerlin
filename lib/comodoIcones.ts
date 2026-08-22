import { ChefHat, Bath, BedDouble, Sofa, TreePine, Car, Briefcase, LayoutGrid, type LucideIcon } from 'lucide-react'

export const COMODOS_DISPONIVEIS = [
  'Cozinha',
  'Banheiro',
  'Quarto',
  'Sala',
  'Jardim ou Área externa',
  'Garagem',
  'Escritório',
  'Casa toda / Geral',
] as const

const ICONES_POR_COMODO: Record<string, LucideIcon> = {
  cozinha: ChefHat,
  banheiro: Bath,
  quarto: BedDouble,
  dormitorio: BedDouble,
  sala: Sofa,
  jardim: TreePine,
  varanda: TreePine,
  'área externa': TreePine,
  'area externa': TreePine,
  garagem: Car,
  escritorio: Briefcase,
  escritório: Briefcase,
}

export function getIconeComodo(comodo: string): LucideIcon {
  const lower = comodo.toLowerCase()
  const key = Object.keys(ICONES_POR_COMODO).find(k => lower.includes(k))
  return key ? ICONES_POR_COMODO[key] : LayoutGrid
}
