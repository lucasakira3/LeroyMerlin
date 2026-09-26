'use client'

import { useState } from 'react'
import {
  Route, Hammer, PaintRoller, Zap, Droplets, Layers, Sparkles, Ruler, ListOrdered,
  Check, ChevronRight, MapPin, ShoppingCart, type LucideIcon,
} from 'lucide-react'
import Card from './ui/Card'
import { getImagemProduto, ajusteFoto } from '@/lib/categoriaImagens'
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'
import { showToast } from '@/lib/toast'
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

// `indice` é a posição do item em projeto.itens — é a chave estável do progresso por item
// (o que fica gravado no projeto salvo).
interface ItemDaEtapa {
  item: ItemProjeto
  indice: number
}

interface Etapa {
  ordem: number
  nome: string
  itens: ItemDaEtapa[]
}

interface Props {
  itens: ItemProjeto[]
  selecionados: Set<string>
  // Progresso por item vive em ListaDeCompras (lá é gravado no projeto salvo)
  itensConcluidos: Set<number>
  onAlternarItem: (indice: number) => void
  onSelecionarProduto: (produto: SearchResult['produto']) => void
}

const moeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// "2 un" -> 2, "1 par" -> 1, sem número -> 1
function quantidadeDoItem(quantidade: string | undefined): number {
  const n = parseInt(String(quantidade ?? ''), 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

// Road map do projeto: uma trilha de cartões (um por etapa, em ordem). Clicar num cartão
// abre embaixo o passo a passo daquela etapa — cada material vira um passo numerado, com a
// quantidade e a observação que a IA deu, mais o produto escolhido (foto, preço, corredor),
// um botão de carrinho e um check. O progresso é POR ITEM: a etapa fica concluída sozinha
// quando todos os itens dela estão marcados. Só persiste se o projeto foi salvo (Minha
// Conta > Projetos).
export default function ProjetoTimeline({ itens, selecionados, itensConcluidos, onAlternarItem, onSelecionarProduto }: Props) {
  const [ativa, setAtiva] = useState<number | null>(null)

  const etapasMap = new Map<number, Etapa>()
  itens.forEach((item, indice) => {
    if (!item.etapa_nome) return
    const ordem = item.etapa_ordem ?? 1
    const atual = etapasMap.get(ordem)
    if (atual) atual.itens.push({ item, indice })
    else etapasMap.set(ordem, { ordem, nome: item.etapa_nome, itens: [{ item, indice }] })
  })
  const etapas = Array.from(etapasMap.values()).sort((a, b) => a.ordem - b.ordem)

  if (etapas.length < 2) return null

  const feitosDaEtapa = (e: Etapa) => e.itens.filter(i => itensConcluidos.has(i.indice)).length
  const etapaCompleta = (e: Etapa) => feitosDaEtapa(e) === e.itens.length

  const ordemAtiva = ativa ?? etapas[0].ordem
  const etapaAtiva = etapas.find(e => e.ordem === ordemAtiva) ?? etapas[0]
  const totalItens = etapas.reduce((s, e) => s + e.itens.length, 0)
  const totalFeitos = etapas.reduce((s, e) => s + feitosDaEtapa(e), 0)
  const etapasFeitas = etapas.filter(etapaCompleta).length

  function adicionarNoCarrinho(item: ItemProjeto, produto: SearchResult['produto']) {
    const estoque = (produto as any).estoque as number | undefined
    if (estoque !== undefined && estoque <= 0) {
      showToast('Produto sem estoque no momento')
      return
    }
    const qtd = Math.min(quantidadeDoItem(item.quantidade), estoque ?? Infinity)
    adicionarAoCarrinho(produto.id, qtd)
    showToast(`${produto.produto} adicionado ao carrinho`)
  }

  return (
    <Card className="mb-2" padding="none">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Route size={16} className="text-lm-green" />
          <h3 className="text-sm font-bold text-gray-900">Road map do projeto</h3>
        </div>
        <span className="text-xs text-gray-500">
          {totalFeitos} de {totalItens} itens · {etapasFeitas} de {etapas.length} etapas concluídas
        </span>
      </div>
      <div className="mx-4 mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full bg-lm-green transition-all duration-500" style={{ width: `${(totalFeitos / totalItens) * 100}%` }} />
      </div>

      {/* Trilha de cartões — rola na horizontal quando não cabe */}
      {/* justify-[safe_center]: centraliza quando os cartões cabem na largura; quando não
          cabem, cai pro alinhamento normal (começa do primeiro cartão) em vez de centralizar
          o meio da trilha e cortar as pontas — "safe center" existe exatamente pra isso. */}
      <div className="flex items-stretch justify-[safe_center] gap-0 overflow-x-auto px-4 py-4 snap-x">
        {etapas.map((etapa, i) => {
          const Icone = iconeDaEtapa(etapa.nome)
          const selecionada = etapa.ordem === etapaAtiva.ordem
          const feita = etapaCompleta(etapa)
          const feitos = feitosDaEtapa(etapa)
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
                  feita ? 'bg-lm-yellow text-black' : 'bg-lm-green text-white'
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
                  {feitos} de {etapa.itens.length} {etapa.itens.length === 1 ? 'item' : 'itens'}
                </span>
                <span className="block h-1 rounded-full bg-gray-100 overflow-hidden mt-1.5">
                  <span className="block h-full bg-lm-green transition-all duration-500" style={{ width: `${(feitos / etapa.itens.length) * 100}%` }} />
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
        <div className="mb-3 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-lm-green">
            Etapa {etapaAtiva.ordem} de {etapas.length} · {feitosDaEtapa(etapaAtiva)} de {etapaAtiva.itens.length} itens
          </p>
          <h4 className="text-base font-black text-lm-dark">{etapaAtiva.nome}</h4>
        </div>

        {/* Etapas com muitos itens rolam dentro da própria caixa, sem esticar a página */}
        <ol className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
          {etapaAtiva.itens.map(({ item, indice }, idx) => {
            // Produto que o cliente escolheu pra esse material; senão o primeiro sugerido.
            const escolhido = item.resultados.find(r => selecionados.has(r.produto.id)) ?? item.resultados[0]
            const produto = escolhido?.produto
            const preco = produto ? (produto as any).preco as number | undefined : undefined
            const feito = itensConcluidos.has(indice)
            return (
              <li key={`${item.material}-${indice}`} className="flex gap-3">
                <span className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-1 ${
                  feito ? 'bg-lm-yellow text-black' : 'bg-lm-green text-white'
                }`}>
                  {feito ? <Check size={13} strokeWidth={3} /> : idx + 1}
                </span>
                <div className={`flex-1 min-w-0 rounded-xl border p-3 flex items-start gap-3 transition-colors ${
                  feito ? 'border-lm-green/40 bg-lm-green/5' : 'border-gray-500'
                }`}>
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
                        className={`w-14 h-14 rounded-lg bg-white ${ajusteFoto(produto, 'p-1')} ${feito ? 'opacity-60' : ''}`}
                      />
                    </button>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold ${feito ? 'text-gray-400 line-through' : 'text-lm-dark'}`}>
                      {item.material}
                      {item.quantidade && <span className="font-medium text-gray-500 no-underline"> · {item.quantidade}</span>}
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

                  {/* Ações do item: carrinho e check (progresso) */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {produto && (
                      <button
                        type="button"
                        onClick={() => adicionarNoCarrinho(item, produto)}
                        aria-label={`Adicionar ${produto.produto} ao carrinho`}
                        title="Adicionar ao carrinho"
                        className="w-9 h-9 rounded-lg bg-lm-green text-white flex items-center justify-center hover:bg-green-700 transition-colors"
                      >
                        <ShoppingCart size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onAlternarItem(indice)}
                      aria-pressed={feito}
                      aria-label={feito ? `Desmarcar ${item.material}` : `Marcar ${item.material} como feito`}
                      title={feito ? 'Desmarcar' : 'Marcar como feito'}
                      className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-colors ${
                        feito
                          ? 'bg-lm-yellow border-lm-yellow text-black'
                          : 'border-gray-500 text-gray-400 hover:border-lm-green hover:text-lm-green'
                      }`}
                    >
                      <Check size={17} strokeWidth={3} />
                    </button>
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
