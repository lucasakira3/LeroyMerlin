import {
  Layers, Palette, Tag, Ruler, Weight, Sparkles, TrendingUp, Plug,
  Paintbrush, Droplet, Wrench, Package, Clock, Shield, Gauge,
  Thermometer, Info, CircleDot, Compass, Zap, type LucideIcon,
} from 'lucide-react'

// `especificacoes` é sempre "Rótulo: valor" por linha (confirmado auditando
// data/produtos.json — 288 rótulos distintos, sem enum fechado), por isso o match é por
// substring da chave em vez de igualdade exata, com fallback genérico igual ao padrão já
// usado em lib/comodoIcones.ts. Só os ~25 rótulos mais frequentes têm ícone dedicado —
// cobrem a maioria das ocorrências reais, o resto cai no fallback (Info), não quebra.
const ICONES_POR_ROTULO: Record<string, LucideIcon> = {
  material: Layers,
  cor: Palette,
  tipo: Tag,
  potência: Zap,
  potencia: Zap,
  uso: Wrench,
  comprimento: Ruler,
  largura: Ruler,
  altura: Ruler,
  diâmetro: Ruler,
  diametro: Ruler,
  dimens: Ruler,
  tamanho: Ruler,
  bitola: Ruler,
  base: Layers,
  peso: Weight,
  estilo: Sparkles,
  rendimento: TrendingUp,
  tensão: Plug,
  tensao: Plug,
  voltagem: Plug,
  bivolt: Plug,
  corrente: Plug,
  acabamento: Paintbrush,
  volume: Droplet,
  capacidade: Droplet,
  pressão: Gauge,
  pressao: Gauge,
  velocidade: Gauge,
  torque: Gauge,
  instalação: Wrench,
  instalacao: Wrench,
  fixação: Wrench,
  fixacao: Wrench,
  padrão: Package,
  padrao: Package,
  formato: Package,
  apresentação: Package,
  apresentacao: Package,
  'vida útil': Clock,
  'vida util': Clock,
  pei: Shield,
  furo: CircleDot,
  ângulo: Compass,
  angulo: Compass,
  temperatura: Thermometer,
}

export function getIconeEspecificacao(rotulo: string): LucideIcon {
  const lower = rotulo.toLowerCase()
  const key = Object.keys(ICONES_POR_ROTULO).find(k => lower.includes(k))
  return key ? ICONES_POR_ROTULO[key] : Info
}

export interface EspecificacaoItem {
  rotulo: string
  valor: string
}

// Espera o formato "Rótulo: valor" por linha; uma linha sem ":" vira um item com rótulo
// vazio (fallback pra não perder o texto, mas isso não acontece nos dados reais hoje).
export function parseEspecificacoes(texto: string): EspecificacaoItem[] {
  return texto
    .split('\n')
    .map(linha => linha.trim())
    .filter(Boolean)
    .map(linha => {
      const idx = linha.indexOf(':')
      if (idx === -1) return { rotulo: '', valor: linha }
      return { rotulo: linha.slice(0, idx).trim(), valor: linha.slice(idx + 1).trim() }
    })
}
