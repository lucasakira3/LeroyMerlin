'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, MapPin, Package, CheckCircle2, SlidersHorizontal, Info } from 'lucide-react'
import StoreMap from './StoreMap'
import ProdutoDrawer from './ProdutoDrawer'
import type { Produto, SustentabilidadeScore } from '@/types/produto'

const LOJAS = [
  'Interlagos — São Paulo/SP',
  'Osasco — Osasco/SP',
  'Aricanduva — São Paulo/SP',
  'Santo André — Santo André/SP',
  'Guarulhos — Guarulhos/SP',
  'Campinas — Campinas/SP',
  'Alphaville — Barueri/SP',
  'Belo Horizonte Norte — BH/MG',
  'Barra da Tijuca — Rio de Janeiro/RJ',
  'Curitiba — Curitiba/PR',
  'Porto Alegre — Porto Alegre/RS',
  'Brasília — DF',
]

type ProdutoSemEmbedding = Omit<Produto, 'embedding' | 'embedding_text'>

interface Props {
  slug: string
  label: string
  onBack: () => void
}

const COMPLEXIDADE_ORDER = ['Baixa', 'DIY', 'Média', 'Alta', 'Profissional', 'Especialista']

export default function CategoriaView({ slug, label, onBack }: Props) {
  const [produtos, setProdutos] = useState<ProdutoSemEmbedding[]>([])
  const [loading, setLoading] = useState(true)
  const [selecionados, setSelecionados] = useState<ProdutoSemEmbedding[]>([])
  const [loja, setLoja] = useState(LOJAS[0])
  const [mostrarMapa, setMostrarMapa] = useState(false)
  const mapaRef = useRef<HTMLDivElement>(null)
  const [filtroComplexidade, setFiltroComplexidade] = useState<string>('Todos')
  const [filtroEstoque, setFiltroEstoque] = useState(false)
  const [produtoDrawer, setProdutoDrawer] = useState<ProdutoSemEmbedding | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/categoria/${slug}`)
      .then(r => r.json())
      .then(data => { setProdutos(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug])

  function toggleSelecionado(p: ProdutoSemEmbedding) {
    setSelecionados(prev => {
      const exists = prev.find(s => s.id === p.id)
      if (exists) return prev.filter(s => s.id !== p.id)
      return [...prev, p]
    })
    setMostrarMapa(false)
  }

  const complexidades = ['Todos', ...COMPLEXIDADE_ORDER]
  const produtosFiltrados = produtos
    .filter(p => filtroComplexidade === 'Todos' || p.complexidade === filtroComplexidade)
    .filter(p => !filtroEstoque || p.estoque > 0)

  const mapResultados = selecionados.map(p => ({ produto: p, score: 1 }))

  return (
    <div>
      <ProdutoDrawer
        produto={produtoDrawer as any}
        onClose={() => setProdutoDrawer(null)}
      />
      {/* Header da categoria */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-lm-green transition-colors">
            <ArrowLeft size={16} /> Voltar
          </button>
          <span className="text-gray-300">|</span>
          <h2 className="text-lg font-bold text-lm-dark">{label}</h2>
          {!loading && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {produtosFiltrados.length} produtos
            </span>
          )}
        </div>

        {/* Seletor de loja */}
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-lm-green flex-shrink-0" />
          <select value={loja} onChange={e => setLoja(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green">
            {LOJAS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Mapa — aparece no topo com destaque */}
      {mostrarMapa && selecionados.length > 0 && (
        <div ref={mapaRef} className="mb-6 bg-white border-2 border-lm-green rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-lm-green animate-pulse" />
              <h3 className="text-sm font-bold text-lm-dark">
                {selecionados.length} produto{selecionados.length > 1 ? 's' : ''} no mapa
              </h3>
            </div>
            <button onClick={() => setMostrarMapa(false)}
              className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1 hover:bg-gray-50 transition-colors">
              Fechar mapa
            </button>
          </div>
          <StoreMap resultados={mapResultados} loja={loja} />
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal size={13} className="text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Complexidade:</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {complexidades.map(c => (
            <button key={c} onClick={() => setFiltroComplexidade(c)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                filtroComplexidade === c
                  ? 'bg-lm-green text-white border-lm-green'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-lm-green/40'
              }`}>{c}</button>
          ))}
        </div>
        <button onClick={() => setFiltroEstoque(v => !v)}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ml-auto ${
            filtroEstoque
              ? 'bg-lm-green text-white border-lm-green'
              : 'bg-white text-gray-500 border-gray-200 hover:border-lm-green/40'
          }`}>
          ✓ Só disponíveis
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-lm-green border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Grid de produtos */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
          {produtosFiltrados.map(p => {
            const sel = selecionados.some(s => s.id === p.id)
            return (
              <button key={p.id} onClick={() => toggleSelecionado(p)}
                className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                  sel
                    ? 'border-lm-green bg-lm-green/5 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-lm-green/40'
                }`}>
                {/* Categoria + ID */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">{p.categoria}</span>
                  <span className="text-[10px] text-gray-300 font-mono">{p.id}</span>
                </div>

                {/* Nome */}
                <p className="text-sm font-semibold text-lm-dark leading-snug mb-2 line-clamp-2">
                  {p.produto}
                </p>

                {/* Corredor destaque */}
                <div className={`flex items-center gap-1.5 mb-2 ${sel ? 'text-lm-green' : 'text-lm-green'}`}>
                  <MapPin size={12} strokeWidth={2.5} />
                  <span className="text-xs font-bold">{p.corredor}</span>
                </div>

                {/* Preço */}
                {'preco' in p && (
                  <p className="text-base font-bold text-lm-dark mb-1.5">
                    {Number(p.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-medium ${
                    p.estoque === 0 ? 'text-gray-400' :
                    p.estoque < 10 ? 'text-lm-orange' : 'text-lm-green'
                  }`}>
                    {p.estoque === 0 ? 'Sem estoque' :
                     p.estoque < 10 ? `Últ. ${p.estoque} un.` : `${p.estoque} un.`}
                  </span>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {p.complexidade}
                  </span>
                </div>

                {/* Rodapé do card */}
                <div className="mt-2 flex items-center justify-between">
                  {sel ? (
                    <div className="flex items-center gap-1 text-lm-green text-[11px] font-semibold">
                      <CheckCircle2 size={13} /> Selecionado
                    </div>
                  ) : <span />}
                  <button
                    onClick={e => { e.stopPropagation(); setProdutoDrawer(p) }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-lm-green border border-lm-green/30 rounded-full px-2 py-0.5 hover:bg-lm-green/10 transition-colors"
                  >
                    <Info size={11} /> Detalhes
                  </button>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Barra flutuante de selecionados */}
      {selecionados.length > 0 && (
        <div className="sticky bottom-4 z-10">
          <div className="bg-white border-2 border-lm-green rounded-2xl shadow-xl px-5 py-3 flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-lm-green" />
              <span className="text-sm font-semibold text-lm-dark">
                {selecionados.length} produto{selecionados.length > 1 ? 's' : ''} selecionado{selecionados.length > 1 ? 's' : ''}
              </span>
              <span className="text-xs text-gray-400 hidden sm:block">— {loja.split(' — ')[0]}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelecionados([])}
                className="text-xs px-3 py-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
                Limpar
              </button>
              <button
                onClick={() => {
                  setMostrarMapa(true)
                  setTimeout(() => mapaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
                }}
                className="flex items-center gap-2 text-sm font-semibold bg-lm-green text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors">
                <MapPin size={14} /> Ver no Mapa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
