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

// O nome do cômodo vem de texto livre gerado pela IA (campo "comodo" da resposta do
// /api/projeto), não de um enum fechado — por isso o match é por substring, não igualdade
// exata, e sempre cai num ícone genérico (LayoutGrid) em vez de quebrar quando não bate.
export function getIconeComodo(comodo: string): LucideIcon {
  const lower = String(comodo).toLowerCase()
  const key = Object.keys(ICONES_POR_COMODO).find(k => lower.includes(k))
  return key ? ICONES_POR_COMODO[key] : LayoutGrid
}
