// Fotos de categoria — Wikimedia Commons, licença livre, curadas manualmente.
// Fonte de cada arquivo (pra referência futura, não usado em runtime):
// ferramentas: Cordless Power Drill (49253538983).jpg
// eletrica: Electrical Outlet.jpg
// hidraulica: Kupferfittings 4062.jpg
// iluminacao: Philips LED bulbs.jpg
// jardim: Flower nursery or garden...tiered shelves.jpg
// pisos-ceramica: Garnet red ceramic cemented clean tile pattern floor ground texture.jpg
// banheiro: Washbasins of the restrooms in Crowne Plaza Vientiane.jpg
// pintura: Paint roller 4.jpg
// construcao: Brick and Flint facade of house under construction.jpg
// decoracao: Furnished living room (Unsplash).jpg

const IMAGENS_POR_CATEGORIA: Record<string, string> = {
  'Ferramentas': '/categorias/ferramentas.jpg',
  'Elétrica': '/categorias/eletrica.jpg',
  'Hidráulica': '/categorias/hidraulica.jpg',
  'Iluminação': '/categorias/iluminacao.jpg',
  'Jardim': '/categorias/jardim.jpg',
  'Pisos e Cerâmica': '/categorias/pisos-ceramica.jpg',
  'Banheiro': '/categorias/banheiro.jpg',
  'Pintura': '/categorias/pintura.jpg',
  'Construção': '/categorias/construcao.jpg',
  'Decoração': '/categorias/decoracao.jpg',
}

const FALLBACK = IMAGENS_POR_CATEGORIA['Ferramentas']

export function getImagemCategoria(categoria: string): string {
  return IMAGENS_POR_CATEGORIA[categoria] ?? FALLBACK
}
