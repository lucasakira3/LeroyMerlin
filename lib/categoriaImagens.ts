// Fotos de categoria — Wikimedia Commons, licença livre, curadas manualmente.
// Fonte de cada arquivo (pra referência futura, não usado em runtime):
// ferramentas: Cordless Power Drill (49253538983).jpg | Woodworking hand tools on timber planks 01.jpg | Hand-tool set with bits and accessories arranged on a white surface..jpg | MacAllister cordless screwdriver 01.jpg | Repair tool kit.jpg
// eletrica: Electrical Outlet.jpg | Stab-Lok circuit breaker panel interior .jpg | White light switch.jpg | Electrician 02.jpg | Outdoor wiring.JPG
// hidraulica: Kupferfittings 4062.jpg | PVC plumbing fittings in Awka.jpg | Plumbing fittings.jpg | Water faucet 2.jpg | Pipe wrench.JPG
// iluminacao: Philips LED bulbs.jpg | LED bulbs.jpg | Inverted pendant light.jpg | Ceiling light fixture with a brick background, Cobaia Restaurant, Lisbon, Portugal julesvernex2.jpg | Lamp with lit incandescent light bulb and black background.jpg
// jardim: Flower nursery or garden...tiered shelves.jpg | Garden Tools.jpg | Broomhall , St Peter's Garden Centre - Potted Plants - geograph.org.uk - 2170155.jpg | Watering plants with a green watering can during a sunny day in a garden setting.jpg | Garden hose nozzle.jpg
// pisos-ceramica: Garnet red ceramic cemented clean tile pattern floor ground texture.jpg | Decorative laminate 07839.jpg | Multicolored ceramic tile.jpg | Cream speckled ceramic cemented clean tile pattern floor ground texture.jpg | Floor tile pattern in Gleeden Arcade.jpg
// banheiro: Washbasins of the restrooms in Crowne Plaza Vientiane.jpg | Old Ceramic Sink and Faucet (48456993227).jpg | Shower head.JPG | Bathroom sink.jpg | Mid-City New Orleans Bathroom - Tile in the Shower.jpg
// pintura: Paint roller 4.jpg | Paint cans in store.jpg | Paint bucket and brush.jpg | Biodegradable Paint Brushes in a Cape Town Builders Warehouse.jpg | ARRANGED PAINT BUCKET IN GOMBE.jpg
// construcao: Brick and Flint facade of house under construction.jpg | Construction site with cement silos in Berlin.jpg | Stacks of red bricks and concrete blocks at a construction site during the day in an urban environment.jpg | Carr Lane Scaffolding, Jul23.jpg | Close-Up of Stacked Concrete Blocks in Sunlight.jpg
// decoracao: Furnished living room (Unsplash).jpg | Modern kitchen and dining area with stylish furnishings and natural light in a contemporary home setting.jpg | Modern bedroom design in a stylish hotel room featuring geometric patterns and soft linens.jpg | Modern interior design featuring wooden shelves and decorative elements.jpg | Decorative wooden vase (26450223658).jpg

const IMAGENS_POR_CATEGORIA: Record<string, string[]> = {
  'Ferramentas': [
    '/categorias/ferramentas.jpg',
    '/categorias/ferramentas-2.jpg',
    '/categorias/ferramentas-3.jpg',
    '/categorias/ferramentas-4.jpg',
    '/categorias/ferramentas-5.jpg',
  ],
  'Elétrica': [
    '/categorias/eletrica.jpg',
    '/categorias/eletrica-2.jpg',
    '/categorias/eletrica-3.jpg',
    '/categorias/eletrica-4.jpg',
    '/categorias/eletrica-5.jpg',
  ],
  'Hidráulica': [
    '/categorias/hidraulica.jpg',
    '/categorias/hidraulica-2.jpg',
    '/categorias/hidraulica-3.jpg',
    '/categorias/hidraulica-4.jpg',
    '/categorias/hidraulica-5.jpg',
  ],
  'Iluminação': [
    '/categorias/iluminacao.jpg',
    '/categorias/iluminacao-2.jpg',
    '/categorias/iluminacao-3.jpg',
    '/categorias/iluminacao-4.jpg',
    '/categorias/iluminacao-5.jpg',
  ],
  'Jardim': [
    '/categorias/jardim.jpg',
    '/categorias/jardim-2.jpg',
    '/categorias/jardim-3.jpg',
    '/categorias/jardim-4.jpg',
    '/categorias/jardim-5.jpg',
  ],
  'Pisos e Cerâmica': [
    '/categorias/pisos-ceramica.jpg',
    '/categorias/pisos-ceramica-2.jpg',
    '/categorias/pisos-ceramica-3.jpg',
    '/categorias/pisos-ceramica-4.jpg',
    '/categorias/pisos-ceramica-5.jpg',
  ],
  'Banheiro': [
    '/categorias/banheiro.jpg',
    '/categorias/banheiro-2.jpg',
    '/categorias/banheiro-3.jpg',
    '/categorias/banheiro-4.jpg',
    '/categorias/banheiro-5.jpg',
  ],
  'Pintura': [
    '/categorias/pintura.jpg',
    '/categorias/pintura-2.jpg',
    '/categorias/pintura-3.jpg',
    '/categorias/pintura-4.jpg',
    '/categorias/pintura-5.jpg',
  ],
  'Construção': [
    '/categorias/construcao.jpg',
    '/categorias/construcao-2.jpg',
    '/categorias/construcao-3.jpg',
    '/categorias/construcao-4.jpg',
    '/categorias/construcao-5.jpg',
  ],
  'Decoração': [
    '/categorias/decoracao.jpg',
    '/categorias/decoracao-2.jpg',
    '/categorias/decoracao-3.jpg',
    '/categorias/decoracao-4.jpg',
    '/categorias/decoracao-5.jpg',
  ],
}

const FALLBACK = IMAGENS_POR_CATEGORIA['Ferramentas']

// Sem `seed` (banners/tiles genéricos de categoria), sempre a primeira foto. Com `seed`
// (normalmente o id do produto), hash determinístico escolhe entre as 5 fotos daquela
// categoria — o mesmo produto sempre mostra a mesma foto, mas produtos diferentes da
// mesma categoria variam entre si. Mesmo padrão reaproveitado em lib/marcas.ts e lib/ofertas.ts.
export function getImagemCategoria(categoria: string, seed?: string): string {
  const lista = IMAGENS_POR_CATEGORIA[categoria] ?? FALLBACK
  if (!seed) return lista[0]
  const hash = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return lista[hash % lista.length]
}

// Galeria pro popup de produto (components/ProdutoDrawer.tsx) — não são fotos reais do
// produto (o catálogo não tem isso), são as mesmas fotos de categoria já compartilhadas
// entre produtos, só que exibidas como um conjunto em vez de uma única foto. O índice 0
// desta lista é sempre igual ao retorno de getImagemCategoria com o mesmo seed, pra não
// haver inconsistência entre a foto "principal" usada no card e na galeria do popup.
export function getGaleriaCategoria(categoria: string, seed: string, quantidade: number = 3): string[] {
  const lista = IMAGENS_POR_CATEGORIA[categoria] ?? FALLBACK
  const hash = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const inicio = hash % lista.length
  const n = Math.min(quantidade, lista.length)
  return Array.from({ length: n }, (_, i) => lista[(inicio + i) % lista.length])
}
