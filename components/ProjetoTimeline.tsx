'use client'

import { useState } from 'react'
import {
  Route, Hammer, PaintRoller, Zap, Droplets, Layers, Sparkles, Ruler, ListOrdered,
  Check, ChevronRight, MapPin, type LucideIcon,
} from 'lucide-react'
import Card from './ui/Card'
import { getImagemProduto, ajusteFoto } from '@/lib/categoriaImagens'
import type { ItemProjeto } from './ProjetoMosaico'
import type { SearchResult } from '@/types/produto'

// O nome da etapa vem de texto livre da IA ("Preparação da parede", "Pintura"...), então o
// ícone é escolhido por palavra-chave, com ListOrdered como fallback — mesmo padrão de
// lib/comodoIcones.ts.
const ICONES_POR_PALAVRA: [string[], LucideIcon][] = [
  [['pintur', 'tinta', 'massa'], PaintRoller],
  [['elétric', 'eletric', 'fiação', 'fiacao', 'ilumin'], Zap],
  [['hidr', 'encanament', 'água', 'agua', 'vedaç', 'vedac'], Droplets],
  [['piso', 'revestiment', 'azulejo', 'rejunte', 'contrapiso', 'impermeabil'], Layers],
  [['acabament', 'limpez', 'finaliz', 'instalaç', 'instalac', 'louça', 'louca'], Sparkles],
  [['medi', 'planej', 'marcaç', 'marcac'], Ruler],
  [['prepar', 'demoli', 'remoç', 'remoc', 'estrutur', 'obra', 'ferramenta'], Hammer],
]

function iconeDaEtapa(nome: string): LucideIcon {
  const lower = nome.toLowerCase()
  const achado = ICONES_POR_PALAVRA.find(([palavras]) => palavras.some(p => lower.includes(p)))
  return achado ? achado[1] : ListOrdered
}

interface Etapa {
  ordem: number
  nome: string
  itens: ItemProjeto[]
}

interface Props {
  itens: ItemProjeto[]
  selecionados: Set<string>
  // Etapas concluídas vivem em ListaDeCompras (lá são gravadas no projeto salvo)
  concluidas: Set<number>
  onAlternarConcluida: (ordem: number) => void
  onSelecionarProduto: (produto: SearchResult['produto']) => void
}

const moeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Road map do projeto: uma trilha de cartões (um por etapa, em ordem). Clicar num cartão
// abre embaixo o passo a passo daquela etapa — cada material vira um passo numerado, com a
// quantidade e a observação que a IA deu, mais o produto escolhido (foto, preço, corredor).
// Marcar a etapa como concluída só persiste se o projeto foi salvo (Minha Conta > Projetos).
export default function ProjetoTimeline({ itens, selecionados, concluidas, onAlternarConcluida, onSelecionarProduto }: Props) {
  const [ativa, setAtiva] = useState<number | null>(null)

  const etapasMap = new Map<number, Etapa>()
  for (const item of itens) {
    if (!item.etapa_nome) continue
    const ordem = item.etapa_ordem ?? 1
    const atual = etapasMap.get(ordem)
    if (atual) atual.itens.push(item)
    else etapasMap.set(ordem, { ordem, nome: item.etapa_nome, itens: [item] })
  }
  const etapas = Array.from(etapasMap.values()).sort((a, b) => a.ordem - b.ordem)

  if (etapas.length < 2) return null

  const ordemAtiva = ativa ?? etapas[0].ordem
  const etapaAtiva = etapas.find(e => e.ordem === ordemAtiva) ?? etapas[0]
  const feitas = etapas.filter(e => concluidas.has(e.ordem)).length

  return (
    <Card className="mb-2" padding="none">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <div className="flex items-center gap-2">
          <Route size={16} className="text-lm-green" />
          <h3 className="text-sm font-bold text-gray-900">Road map do projeto</h3>
        </div>
        <span className="text-xs text-gray-500">{feitas} de {etapas.length} etapas concluídas</span>
      </div>

      {/* Trilha de cartões — rola na horizontal quando não cabe */}
      <div className="flex items-stretch gap-0 overflow-x-auto px-4 py-4 snap-x">
        {etapas.map((etapa, i) => {
          const Icone = iconeDaEtapa(etapa.nome)
          const selecionada = etapa.ordem === etapaAtiva.ordem
          const feita = concluidas.has(etapa.ordem)
          return (
            <div key={etapa.ordem} className="flex items-center flex-shrink-0 snap-start">
              <button
                type="button"
                onClick={() => setAtiva(etapa.ordem)}
                aria-pressed={selecionada}
                className={`relative w-40 h-full text-left rounded-2xl border-2 p-3 transition-all hover:-translate-y-0.5 ${
                  selecionada
                    ? 'border-lm-green bg-lm-green/10 shadow-sm'
                    : 'border-gray-500 bg-white hover:border-lm-green/50'
                }`}
              >
                <span className={`absolute -top-2 -left-2 w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center ${
                  feita ? 'bg-lm-yellow text-lm-dark' : 'bg-lm-green text-white'
                }`}>
                  {feita ? <Check size={13} strokeWidth={3} /> : etapa.ordem}
                </span>
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors ${
                  selecionada ? 'bg-lm-green text-white' : 'bg-gray-100 text-lm-green'
                }`}>
                  <Icone size={20} />
                </span>
                <span className={`block text-sm font-bold leading-snug line-clamp-2 min-h-[2.5rem] ${feita ? 'text-gray-400 line-through' : 'text-lm-dark'}`}>
                  {etapa.nome}
                </span>
                <span className="block text-[11px] text-gray-500 mt-1">
                  {etapa.itens.length} {etapa.itens.length === 1 ? 'material' : 'materiais'}
                </span>
              </button>
              {i < etapas.length - 1 && (
                <span className="flex items-center flex-shrink-0 px-1 text-lm-green/50" aria-hidden="true">
                  <span className="w-3 h-0.5 bg-lm-green/30" />
                  <ChevronRight size={16} />
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Passo a passo da etapa escolhida */}
      <div className="border-t border-gray-500 px-4 py-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-lm-green">Etapa {etapaAtiva.ordem} de {etapas.length}</p>
            <h4 className="text-base font-black text-lm-dark">{etapaAtiva.nome}</h4>
          </div>
          <button
            type="button"
            onClick={() => onAlternarConcluida(etapaAtiva.ordem)}
            className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              concluidas.has(etapaAtiva.ordem)
                ? 'bg-lm-green text-white border-lm-green'
                : 'bg-white text-gray-600 border-gray-500 hover:border-lm-green/50'
            }`}
          >
            <Check size={13} strokeWidth={3} />
            {concluidas.has(etapaAtiva.ordem) ? 'Concluída' : 'Marcar como concluída'}
          </button>
        </div>

        <ol className="space-y-2.5">
          {etapaAtiva.itens.map((item, idx) => {
            // Produto que o cliente escolheu pra esse material; senão o primeiro sugerido.
            const escolhido = item.resultados.find(r => selecionados.has(r.produto.id)) ?? item.resultados[0]
            const produto = escolhido?.produto
            const preco = produto ? (produto as any).preco as number | undefined : undefined
            return (
              <li key={`${item.material}-${idx}`} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-lm-green text-white text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-1">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0 rounded-xl border border-gray-500 p-3 flex items-start gap-3">
                  {produto && (
                    <button
                      type="button"
                      onClick={() => onSelecionarProduto(produto)}
                      aria-label={`Ver ${produto.produto}`}
                      className="flex-shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImagemProduto(produto)}
                        alt=""
                        className={`w-14 h-14 rounded-lg bg-white ${ajusteFoto(produto, 'p-1')}`}
                      />
                    </button>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-lm-dark">
                      {item.material}
                      {item.quantidade && <span className="font-medium text-gray-500"> · {item.quantidade}</span>}
                    </p>
                    {item.observacao && <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{item.observacao}</p>}
                    {produto && (
                      <button
                        type="button"
                        onClick={() => onSelecionarProduto(produto)}
                        className="mt-1.5 flex items-center gap-2 flex-wrap text-left text-xs text-gray-500 hover:text-lm-green transition-colors"
                      >
                        <span className="font-semibold text-gray-700 truncate max-w-full">{produto.produto}</span>
                        {preco != null && <span className="font-bold text-lm-green">{moeda(Number(preco))}</span>}
                        <span className="flex items-center gap-0.5"><MapPin size={10} /> {produto.corredor}</span>
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </Card>
  )
}
