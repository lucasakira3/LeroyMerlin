// Fórmulas de cobertura/consumo por material — cálculo 100% determinístico, não pedido à IA.
// A IA "adivinhar" litros de tinta ou sacos de cimento é exatamente o tipo de erro que não
// dá pra revisar visualmente (diferente de identificar um produto numa foto): um número
// errado aqui vira compra errada de verdade. Os coeficientes são estimativas de mercado
// (rendimento de tinta, consumo de argamassa/cimento) — arredondados sempre pra cima, porque
// faltar material é pior que sobrar um pouco.

export type TipoCalculo = 'tinta' | 'piso' | 'cimento' | 'papel_parede'

export interface ResultadoCalculo {
  quantidade: number
  unidade: string
  linhas: { label: string; valor: string }[]
  buscaSugerida: string
}

function arredondarPara(valor: number, passo: number): number {
  return Math.ceil(valor / passo) * passo
}

// Tinta: rendimento médio de ~10m² por litro, por demão (látex acrílico em superfície lisa
// — valor conservador; tinta de melhor cobertura rende mais, mas é melhor sobrar que faltar).
const RENDIMENTO_TINTA_M2_POR_LITRO = 10

export function calcularTinta(areaM2: number, demaos: number): ResultadoCalculo {
  const litros = arredondarPara((areaM2 * demaos) / RENDIMENTO_TINTA_M2_POR_LITRO, 0.5)
  return {
    quantidade: litros,
    unidade: 'litros de tinta',
    linhas: [
      { label: 'Área a pintar', valor: `${areaM2} m²` },
      { label: 'Demãos', valor: String(demaos) },
      { label: 'Rendimento considerado', valor: `${RENDIMENTO_TINTA_M2_POR_LITRO} m²/L por demão` },
    ],
    buscaSugerida: 'tinta látex parede',
  }
}

// Piso/porcelanato: perda por corte e quebra (padrão de mercado 10-15%, aqui fixo em 10% +
// o que o cliente informar como margem extra) + estimativa de argamassa e rejunte por m².
const ARGAMASSA_KG_POR_M2 = 5      // desempenadeira média
const REJUNTE_KG_POR_M2 = 0.3      // junta estreita (porcelanato)

export function calcularPiso(areaM2: number, perdaPercentual: number): ResultadoCalculo {
  const areaComPerda = arredondarPara(areaM2 * (1 + perdaPercentual / 100), 0.1)
  const sacosArgamassa = Math.ceil((areaComPerda * ARGAMASSA_KG_POR_M2) / 20) // saco 20kg
  const rejunteKg = arredondarPara(areaComPerda * REJUNTE_KG_POR_M2, 0.5)
  return {
    quantidade: areaComPerda,
    unidade: 'm² de piso/porcelanato',
    linhas: [
      { label: 'Área do ambiente', valor: `${areaM2} m²` },
      { label: 'Margem de perda', valor: `${perdaPercentual}%` },
      { label: 'Argamassa estimada', valor: `${sacosArgamassa} saco${sacosArgamassa > 1 ? 's' : ''} de 20kg` },
      { label: 'Rejunte estimado', valor: `${rejunteKg} kg` },
    ],
    buscaSugerida: 'porcelanato piso',
  }
}

// Cimento/argamassa de alvenaria: estimativa combinada de assentamento (~1 saco de 50kg a
// cada 4m² de parede) e, se marcado, reboco nos dois lados (quase dobra o consumo).
const M2_POR_SACO_ASSENTAMENTO = 4
const M2_POR_SACO_REBOCO = 2.2

export function calcularCimento(areaM2: number, comReboco: boolean): ResultadoCalculo {
  const sacosAssentamento = Math.ceil(areaM2 / M2_POR_SACO_ASSENTAMENTO)
  const sacosReboco = comReboco ? Math.ceil(areaM2 / M2_POR_SACO_REBOCO) : 0
  const total = sacosAssentamento + sacosReboco
  return {
    quantidade: total,
    unidade: `saco${total > 1 ? 's' : ''} de cimento (50kg)`,
    linhas: [
      { label: 'Área de parede', valor: `${areaM2} m²` },
      { label: 'Assentamento', valor: `${sacosAssentamento} saco${sacosAssentamento > 1 ? 's' : ''}` },
      ...(comReboco ? [{ label: 'Reboco (2 lados)', valor: `${sacosReboco} saco${sacosReboco > 1 ? 's' : ''}` }] : []),
    ],
    buscaSugerida: 'cimento argamassa',
  }
}

// Papel de parede: rolo padrão brasileiro 0,53m × 10m. O cálculo por área pura subestima
// (sobra de corte a cada tira cortada na altura da parede), então calcula por tiras de fato
// aproveitáveis por rolo — mais fiel ao que a loja realmente vende.
const ROLO_LARGURA_M = 0.53
const ROLO_COMPRIMENTO_M = 10

export function calcularPapelParede(larguraM2: number, alturaM: number): ResultadoCalculo {
  const tirasPorRolo = Math.max(1, Math.floor(ROLO_COMPRIMENTO_M / alturaM))
  const larguraCobertaPorRolo = tirasPorRolo * ROLO_LARGURA_M
  const rolos = Math.ceil((larguraM2 / larguraCobertaPorRolo) * 1.1) // +10% pra casamento de estampa
  return {
    quantidade: rolos,
    unidade: `rolo${rolos > 1 ? 's' : ''} de papel de parede`,
    linhas: [
      { label: 'Largura da parede', valor: `${larguraM2} m` },
      { label: 'Altura da parede', valor: `${alturaM} m` },
      { label: 'Tiras por rolo', valor: String(tirasPorRolo) },
    ],
    buscaSugerida: 'papel de parede',
  }
}
