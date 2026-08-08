'use client'

import { useState } from 'react'
import { MapPin, CheckCircle2, Circle, Map, ShoppingBag, Lightbulb, CalendarCheck, ChevronDown, ChevronUp, X, Share2 } from 'lucide-react'
import StoreMap from './StoreMap'
import type { SearchResult } from '@/types/produto'
import Link from 'next/link'
import Card from './ui/Card'
import Button from './ui/Button'

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

  function compartilharWhatsApp() {
    const linhas: string[] = []

    linhas.push(`🏗️ *Projeto: ${projeto.titulo}*`)
    linhas.push(`_${projeto.resumo}_`)
    linhas.push('')
    linhas.push(`📋 *Lista de Materiais — ${loja.split(' — ')[0]}*`)
    linhas.push('')

    let num = 1
    for (const item of projeto.itens) {
      const selecionadosDoItem = item.resultados.filter(r => selecionados.has(r.produto.id))
      if (selecionadosDoItem.length === 0) continue
      for (const r of selecionadosDoItem) {
        const preco = (r.produto as any).preco
        const precoStr = preco != null
          ? Number(preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          : ''
        linhas.push(`${String(num).padStart(2, '0')}. ✅ *${r.produto.produto}*`)
        linhas.push(`   📍 ${r.produto.corredor} · ${item.quantidade}${precoStr ? ` · ${precoStr}` : ''}`)
        num++
      }
    }

    linhas.push('')
    if (totalEstimado > 0) {
      linhas.push(`💰 *Total estimado: ${totalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}*`)
    }
    linhas.push(`🔧 Complexidade: ${projeto.complexidade}`)
    linhas.push(`📦 Orçamento previsto: ${projeto.orcamento_estimado}`)

    if (projeto.dica_especialista) {
      linhas.push('')
      linhas.push(`💡 *Dica do especialista:* ${projeto.dica_especialista}`)
    }

    linhas.push('')
    linhas.push('_Lista gerada pelo Assistente Leroy Merlin 🟢_')

    const texto = linhas.join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

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
          <div className="flex-shrink-0 flex flex-col gap-2 items-end">
            <div>
              <p className="text-white/60 text-[10px] mb-1">Loja</p>
              <select value={loja} onChange={e => setLoja(e.target.value)}
                className="text-xs bg-white/15 border border-white/30 text-white rounded-lg px-2 py-1.5 focus:outline-none max-w-[200px]">
                {LOJAS.map(l => <option key={l} value={l} className="text-gray-800">{l}</option>)}
              </select>
            </div>
            <button
              onClick={compartilharWhatsApp}
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              {/* WhatsApp icon */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Compartilhar lista
            </button>
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
          <h3 className="text-sm font-bold text-gray-900">Lista de materiais</h3>

          {projeto.itens.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono text-gray-400 flex-shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                  <span className="font-semibold text-sm text-gray-900 truncate">{item.material}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">· {item.quantidade}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ml-2 ${PRIORIDADE[item.prioridade] || ''}`}>
                  {item.prioridade}
                </span>
              </div>

              {item.resultados.length > 0 ? (
                <div className="space-y-2">
                  {item.resultados.map(r => {
                    const sel = selecionados.has(r.produto.id)
                    return (
                      <button key={r.produto.id} onClick={() => toggle(r.produto.id)} className="w-full text-left block">
                        <Card
                          padding="sm"
                          hoverable
                          className={`flex items-center gap-3 transition-colors ${sel ? 'ring-2 ring-lm-green/40 bg-lm-green/5' : ''}`}
                        >
                          {sel
                            ? <CheckCircle2 size={17} className="text-lm-green flex-shrink-0" />
                            : <Circle size={17} className="text-gray-300 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{r.produto.produto}</p>
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
                            <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                              {Number((r.produto as any).preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          )}
                        </Card>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="px-1 text-xs text-gray-400 italic">Peça ao vendedor da seção {item.categoria}</p>
              )}

              {item.observacao && (
                <div className="px-4 py-2 bg-lm-green/5 border border-lm-green/10 rounded-xl">
                  <p className="text-xs text-gray-500">💡 {item.observacao}</p>
                </div>
              )}
            </div>
          ))}

          {/* CTA Agendamento */}
          <Card className="bg-lm-yellow/10 border-lm-yellow/30 mt-2">
            <p className="text-sm font-bold text-gray-900 mb-1">Quer ajuda especializada?</p>
            <p className="text-xs text-gray-500 mb-4">
              Nossos consultores avaliam seu projeto na loja, sem custo e sem compromisso.
            </p>
            <Link href="/agendamento" className="block">
              <Button variant="primary" className="w-full">
                <CalendarCheck size={16} /> Agendar consulta com especialista
              </Button>
            </Link>
          </Card>
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
                  <span className="text-xs font-semibold text-gray-900">{loja.split(' — ')[0]}</span>
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
