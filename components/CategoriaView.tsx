'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Package, SlidersHorizontal, Scale } from 'lucide-react'
import StoreMap from './StoreMap'
import ProdutoDrawer from './ProdutoDrawer'
import ComparadorBar from './ComparadorBar'
import ProductCard from './ProductCard'
import Skeleton from './ui/Skeleton'
import Pagination from './ui/Pagination'
import { definirComparador } from '@/lib/clientComparador'
import type { Produto, SustentabilidadeScore } from '@/types/produto'
import { trackProductView } from '@/lib/hooks/useProductTracker'

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
const ITENS_POR_PAGINA = 20

export default function CategoriaView({ slug, label, onBack }: Props) {
  const router = useRouter()
  const [produtos, setProdutos] = useState<ProdutoSemEmbedding[]>([])
  const [loading, setLoading] = useState(true)
  const [selecionados, setSelecionados] = useState<ProdutoSemEmbedding[]>([])
  const [loja, setLoja] = useState(LOJAS[0])
  const [mostrarMapa, setMostrarMapa] = useState(false)
  const mapaRef = useRef<HTMLDivElement>(null)
  const [filtroComplexidade, setFiltroComplexidade] = useState<string>('Todos')
  const [filtroEstoque, setFiltroEstoque] = useState(false)
  const [filtroPrecoMin, setFiltroPrecoMin] = useState('')
  const [filtroPrecoMax, setFiltroPrecoMax] = useState('')
  const [produtoDrawer, setProdutoDrawer] = useState<ProdutoSemEmbedding | null>(null)
  const [pagina, setPagina] = useState(1)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/categoria/${slug}`)
      .then(r => r.json())
      .then(data => { setProdutos(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug])

  // Volta pra primeira página sempre que a categoria ou os filtros mudam
  useEffect(() => {
    setPagina(1)
  }, [slug, filtroComplexidade, filtroEstoque, filtroPrecoMin, filtroPrecoMax])

  function toggleSelecionado(p: ProdutoSemEmbedding) {
    setSelecionados(prev => {
      const exists = prev.find(s => s.id === p.id)
      if (exists) return prev.filter(s => s.id !== p.id)
      return [...prev, p]
    })
    setMostrarMapa(false)
  }

  const complexidades = ['Todos', ...COMPLEXIDADE_ORDER]
  const precoMinNum = filtroPrecoMin ? Number(filtroPrecoMin) : null
  const precoMaxNum = filtroPrecoMax ? Number(filtroPrecoMax) : null
  const filtrosAtivos = filtroComplexidade !== 'Todos' || filtroEstoque || filtroPrecoMin !== '' || filtroPrecoMax !== ''
  const produtosFiltrados = produtos
    .filter(p => filtroComplexidade === 'Todos' || p.complexidade === filtroComplexidade)
    .filter(p => !filtroEstoque || p.estoque > 0)
    .filter(p => precoMinNum === null || p.preco >= precoMinNum)
    .filter(p => precoMaxNum === null || p.preco <= precoMaxNum)
  const totalPaginas = Math.max(1, Math.ceil(produtosFiltrados.length / ITENS_POR_PAGINA))
  const produtosPaginados = produtosFiltrados.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA)

  function handleComparar() {
    definirComparador(selecionados.map(p => p.id))
    router.push('/comparar')
  }

  function mudarPagina(nova: number) {
    setPagina(nova)
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function limparFiltros() {
    setFiltroComplexidade('Todos')
    setFiltroEstoque(false)
    setFiltroPrecoMin('')
    setFiltroPrecoMax('')
  }

  const mapResultados = selecionados.map(p => ({ produto: p, score: 1 }))

  return (
    <div>
      <ProdutoDrawer
        produto={produtoDrawer as any}
        onClose={() => setProdutoDrawer(null)}
      />
      {/* Header da categoria */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
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
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <MapPin size={14} className="text-lm-green flex-shrink-0" />
          <select value={loja} onChange={e => setLoja(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green flex-1 sm:flex-none min-w-0">
            {LOJAS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-5">
        <ComparadorBar />
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
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Min R$"
            value={filtroPrecoMin}
            onChange={e => setFiltroPrecoMin(e.target.value)}
            className="w-20 h-7 px-2 rounded-full border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-lm-green/30 bg-white"
          />
          <span className="text-xs text-gray-300">—</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Máx R$"
            value={filtroPrecoMax}
            onChange={e => setFiltroPrecoMax(e.target.value)}
            className="w-20 h-7 px-2 rounded-full border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-lm-green/30 bg-white"
          />
        </div>

        <button onClick={() => setFiltroEstoque(v => !v)}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            filtroEstoque
              ? 'bg-lm-green text-white border-lm-green'
              : 'bg-white text-gray-500 border-gray-200 hover:border-lm-green/40'
          }`}>
          ✓ Só disponíveis
        </button>

        {filtrosAtivos && (
          <button onClick={limparFiltros}
            className="text-xs text-gray-400 hover:text-lm-green ml-auto">
            Limpar filtros
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border-2 border-gray-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="w-14 h-2" />
                <Skeleton className="w-10 h-2" />
              </div>
              <Skeleton className="w-full h-3.5" />
              <Skeleton className="w-2/3 h-3.5" />
              <Skeleton className="w-20 h-3" />
              <Skeleton className="w-24 h-4" />
              <div className="flex items-center justify-between pt-0.5">
                <Skeleton className="w-16 h-3" />
                <Skeleton className="w-12 h-4 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid de produtos */}
      {!loading && (
        <>
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6 scroll-mt-4">
            {produtosPaginados.map((p, i) => (
              <ProductCard
                key={p.id}
                produto={p}
                selected={selecionados.some(s => s.id === p.id)}
                onSelect={() => toggleSelecionado(p)}
                onDetalhes={() => {
                  trackProductView({ id: p.id, nome: p.produto, categoria: p.categoria })
                  setProdutoDrawer(p)
                }}
                className="animate-fade-in-up"
                style={{ '--stagger-delay': `${Math.min(i, 15) * 20}ms` } as React.CSSProperties}
              />
            ))}
          </div>

          <Pagination page={pagina} totalPages={totalPaginas} onChange={mudarPagina} className="mb-6" />
        </>
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
                onClick={handleComparar}
                disabled={selecionados.length > 3}
                title={selecionados.length > 3 ? 'Selecione até 3 produtos para comparar' : undefined}
                className="flex items-center gap-2 text-sm font-semibold bg-lm-yellow text-black px-4 py-2 rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <Scale size={14} /> Comparar
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
