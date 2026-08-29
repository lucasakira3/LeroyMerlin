// Fonte única de verdade pra "categoria" no app: slug de URL (?categoria=iluminacao),
// nome de exibição (Iluminação) e termos de busca, todos derivados daqui. Usado por
// /api/categoria/[slug], /api/ofertas (?categoria=) e a home (tiles + VitrineOfertas).
// `todos: []` é intencional — array vazio de termos = "não filtra por categoria nenhuma"
// (ver app/api/categoria/[slug]/route.ts), não "categoria sem nenhum termo válido".
export const CATEGORIA_TERMOS: Record<string, string[]> = {
  ferramentas: ["ferramentas", "máquinas", "manutenção", "equipamentos"],
  eletrica:    ["elétrica", "eletrica", "energia", "fios", "cabos"],
  hidraulica:  ["hidráulica", "hidraulica", "banheiro", "encanamento", "sanitário", "tubulação"],
  pintura:     ["pintura", "tinta", "acabamento", "verniz", "massa"],
  jardim:      ["jardim", "planta", "exterior", "paisag", "biofílica", "flores"],
  iluminacao:  ["iluminação", "iluminacao", "luminária", "led", "lâmpada"],
  construcao:  ["construção", "material de construção", "madeira", "cimento", "concreto", "tijolos"],
  decoracao:   ["decoração", "decoracao", "decorativo", "enfeite"],
  todos:       [],
}

export const CATEGORIA_LABELS: Record<string, string> = {
  ferramentas: 'Ferramentas',
  eletrica: 'Elétrica',
  hidraulica: 'Hidráulica',
  pintura: 'Pintura',
  jardim: 'Jardim',
  iluminacao: 'Iluminação',
  construcao: 'Construção',
  decoracao: 'Decoração',
}

export const SLUG_POR_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORIA_LABELS).map(([slug, label]) => [label, slug])
)
