'use client'

import { useState } from 'react'
import { MapPin, CheckCircle2, Circle, Map, ShoppingBag, Lightbulb, CalendarCheck, ChevronDown, ChevronUp, X } from 'lucide-react'
import StoreMap from './StoreMap'
import type { SearchResult } from '@/types/produto'
import Link from 'next/link'

const LOJAS = [
  'Interlagos — São Paulo/SP', 'Osasco — Osasco/SP', 'Aricanduva — São Paulo/SP',
  'Santo André — Santo André/SP', 'Guarulhos — Guarulhos/SP', 'Campinas — Campinas/SP',
  'Alphaville — Barueri/SP', 'Belo Horizonte Norte — BH/MG',
  'Barra da Tijuca — Rio de Janeiro/RJ', 'Curitiba — Curitiba/PR',
]

const PRIORIDADE: Record<string, string> = {
  essencial:   'bg-red-50 text-red-600 border-red-200',
  recomendado: 'bg-amber-50 text-amber-600 border-amber-200',
  opcional:    'bg-gray-50 text-gray-500 border-gray-200',
}

interface Projeto {
  titulo: string
  resumo: string
  orcamento_estimado: string
  complexidade: string
  dica_especialista: string
  itens: Array<{
    material: string
    categoria: string
    quantidade: string
    prioridade: string
    observacao: string
    resultados: SearchResult[]
  }>
}

export default function ListaDeCompras({ projeto }: { projeto: Projeto; descricaoOriginal: string }) {
  const [loja, setLoja] = useState(LOJAS[0])
  const [selecionados, setSelecionados] = useState<Set<string>>(
    () => new Set(projeto.itens.flatMap(i => i.resultados.slice(0, 1).map(r => r.produto.id)))
  )
  const [mapaAberto, setMapaAberto] = useState(false)

  const toggle = (id: string) => setSelecionados(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  const mapResultados: SearchResult[] = projeto.itens
    .flatMap(i => i.resultados)
    .filter(r => selecionados.has(r.produto.id))
    .reduce((acc, r) => acc.find(a => a.produto.id === r.produto.id) ? acc : [...acc, r], [] as SearchResult[])

  const totalEstimado = mapResultados.reduce((sum, r) => sum + ((r.produto as any).preco ?? 0), 0)

  return (
    <div>
      {/* Header verde */}
      <div className="bg-lm-green rounded-2xl p-5 text-white mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag size={16} className="text-lm-yellow flex-shrink-0" />
              <h2 className="font-bold text-xl">{projeto.titulo}</h2>
            </div>
            <p className="text-white/80 text-sm mb-3">{projeto.resumo}</p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">💰 {projeto.orcamento_estimado}</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">📋 {projeto.itens.length} materiais</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">🔧 {projeto.complexidade}</span>
            </div>
            {totalEstimado > 0 && (
              <div className="mt-3 bg-white/15 border border-white/25 rounded-xl px-4 py-2.5 inline-flex items-center gap-3">
                <div>
                  <p className="text-white/60 text-[10px] uppercase tracking-wide">Total estimado dos itens selecionados</p>
                  <p className="text-2xl font-black text-white">
                    {totalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <p className="text-white/60 text-[10px] mb-1">Loja</p>
            <select value={loja} onChange={e => setLoja(e.target.value)}
              className="text-xs bg-white/15 border border-white/30 text-white rounded-lg px-2 py-1.5 focus:outline-none max-w-[200px]">
              {LOJAS.map(l => <option key={l} value={l} className="text-gray-800">{l}</option>)}
            </select>
          </div>
        </div>
        {projeto.dica_especialista && (
          <div className="mt-4 bg-lm-yellow/20 border border-lm-yellow/40 rounded-xl p-3 flex items-start gap-2">
            <Lightbulb size={14} className="text-lm-yellow flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/90">
              <span className="font-bold text-lm-yellow">Dica: </span>{projeto.dica_especialista}
            </p>
          </div>
        )}
      </div>

      {/* Layout 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── Coluna esquerda: lista ────────────────────── */}
        <div className="lg:col-span-3 space-y-3">
          <h3 className="text-sm font-bold text-lm-dark">Lista de materiais</h3>

          {projeto.itens.map((item, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono text-gray-400 flex-shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                  <span className="font-semibold text-sm text-lm-dark truncate">{item.material}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">· {item.quantidade}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ml-2 ${PRIORIDADE[item.prioridade] || ''}`}>
                  {item.prioridade}
                </span>
              </div>

              {item.resultados.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {item.resultados.map(r => {
                    const sel = selecionados.has(r.produto.id)
                    return (
                      <button key={r.produto.id} onClick={() => toggle(r.produto.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${sel ? 'bg-lm-green/5' : 'hover:bg-gray-50'}`}>
                        {sel
                          ? <CheckCircle2 size={17} className="text-lm-green flex-shrink-0" />
                          : <Circle size={17} className="text-gray-300 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-lm-dark truncate">{r.produto.produto}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1 text-xs text-lm-green font-bold">
                              <MapPin size={10} /> {r.produto.corredor}
                            </span>
                            <span className={`text-xs ${r.produto.estoque === 0 ? 'text-gray-400' : r.produto.estoque < 10 ? 'text-lm-orange' : 'text-gray-400'}`}>
                              {r.produto.estoque === 0 ? 'Sem estoque' : r.produto.estoque < 10 ? `Últ. ${r.produto.estoque}` : `${r.produto.estoque} un.`}
                            </span>
                          </div>
                        </div>
                        {(r.produto as any).preco != null && (
                          <span className="text-sm font-bold text-lm-dark flex-shrink-0">
                            {Number((r.produto as any).preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="px-4 py-2.5 text-xs text-gray-400 italic">Peça ao vendedor da seção {item.categoria}</p>
              )}

              {item.observacao && (
                <div className="px-4 py-2 bg-lm-green/5 border-t border-lm-green/10">
                  <p className="text-xs text-gray-500">💡 {item.observacao}</p>
                </div>
              )}
            </div>
          ))}

          {/* CTA Agendamento */}
          <div className="bg-lm-yellow/10 border border-lm-yellow/30 rounded-2xl p-5 mt-2">
            <p className="text-sm font-bold text-lm-dark mb-1">Quer ajuda especializada?</p>
            <p className="text-xs text-gray-500 mb-4">
              Nossos consultores avaliam seu projeto na loja, sem custo e sem compromisso.
            </p>
            <Link href="/agendamento"
              className="flex items-center justify-center gap-2 w-full bg-lm-green text-white py-3 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors">
              <CalendarCheck size={16} /> Agendar consulta com especialista
            </Link>
          </div>
        </div>

        {/* ── Coluna direita: mapa (sticky) ─────────────── */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-4 space-y-3">

            {/* Botão toggle mapa */}
            <button onClick={() => setMapaAberto(v => !v)}
              className="w-full flex items-center justify-between bg-lm-green text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors shadow-sm">
              <div className="flex items-center gap-2">
                <Map size={16} />
                {mapaAberto ? 'Fechar mapa' : `Ver no mapa · ${mapResultados.length} produtos`}
              </div>
              {mapaAberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {mapaAberto && (
              <div className="bg-white border-2 border-lm-green rounded-2xl p-3 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-lm-dark">{loja.split(' — ')[0]}</span>
                  <button onClick={() => setMapaAberto(false)}>
                    <X size={14} className="text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
                <StoreMap resultados={mapResultados} loja={loja} totalEstimado={totalEstimado} />
              </div>
            )}

            {/* Roteiro na loja */}
            {mapResultados.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-600 mb-3">📍 Roteiro sugerido</p>
                <div className="space-y-2">
                  {mapResultados.map((r, i) => (
                    <div key={r.produto.id} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-white bg-lm-green rounded px-1.5 py-0.5 flex-shrink-0 font-mono">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-xs font-bold text-lm-green flex-shrink-0 w-20">{r.produto.corredor}</span>
                      <span className="text-xs text-gray-600 truncate">{r.produto.produto}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <Link href="/agendamento"
                    className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-lm-green border border-lm-green/30 py-2 rounded-lg hover:bg-lm-green/5 transition-colors">
                    <CalendarCheck size={13} /> Agendar visita presencial
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
