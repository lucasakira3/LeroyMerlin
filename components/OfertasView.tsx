'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { X, Timer, Tag } from 'lucide-react'
import ProductCard from './ProductCard'
import ProdutoDrawer from './ProdutoDrawer'
import Pagination from './ui/Pagination'
import ProductCardSkeleton from './ProductCardSkeleton'
import { CATEGORIA_LABELS } from '@/lib/categorias'
import type { Produto } from '@/types/produto'

type ProdutoComOferta = Omit<Produto, 'embedding' | 'embedding_text'> & {
  precoOriginal: number
  percentualDesconto: number
}

const ITENS_POR_PAGINA = 20

// As ofertas são calculadas por produto (lib/ofertas.ts) e não têm data própria; a
// "semana de ofertas" termina no próximo domingo às 23:59:59 (horário do navegador) e a
// contagem regressiva é só o relógio até esse fim de semana.
function fimDaSemana(agora: Date): Date {
  const fim = new Date(agora)
  fim.setDate(agora.getDate() + ((7 - agora.getDay()) % 7))
  fim.setHours(23, 59, 59, 999)
  return fim
}

function Contagem() {
  const [restante, setRestante] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setRestante(Math.max(0, fimDaSemana(new Date()).getTime() - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  // Antes do primeiro tick fica em branco, pra não dar diferença entre servidor e navegador
  if (restante === null) return <div className="h-[68px]" />
  const seg = Math.floor(restante / 1000)
  const blocos = [
    { valor: Math.floor(seg / 86400), rotulo: 'dias' },
    { valor: Math.floor((seg % 86400) / 3600), rotulo: 'horas' },
    { valor: Math.floor((seg % 3600) / 60), rotulo: 'min' },
    { valor: seg % 60, rotulo: 'seg' },
  ]
  return (
    <div className="flex items-center gap-2" role="timer" aria-label="Tempo restante das ofertas da semana">
      {blocos.map(b => (
        <div key={b.rotulo} className="bg-white/15 border border-white/25 rounded-xl px-3 py-2 text-center min-w-[58px]">
          <p className="text-2xl font-black leading-none tabular-nums">{String(b.valor).padStart(2, '0')}</p>
          <p className="text-[10px] uppercase tracking-wide text-white/70 mt-1">{b.rotulo}</p>
        </div>
      ))}
    </div>
  )
}

const FAIXAS_DESCONTO = [0, 10, 20, 30]

export default function OfertasView() {
  const searchParams = useSearchParams()
  const categoriaSlug = searchParams.get('categoria')
  const categoriaLabel = categoriaSlug ? CATEGORIA_LABELS[categoriaSlug] : undefined

  const [produtos, setProdutos] = useState<ProdutoComOferta[]>([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [descontoMinimo, setDescontoMinimo] = useState(0)
  const [produtoDrawer, setProdutoDrawer] = useState<ProdutoComOferta | null>(null)

  useEffect(() => {
    setLoading(true)
    setPagina(1)
    const url = categoriaLabel ? `/api/ofertas?categoria=${categoriaSlug}` : '/api/ofertas'
    fetch(url)
      .then(r => r.json())
      .then(data => { setProdutos(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [categoriaSlug, categoriaLabel])

  const produtosFiltrados = produtos.filter(p => p.percentualDesconto >= descontoMinimo)
  const totalPaginas = Math.max(1, Math.ceil(produtosFiltrados.length / ITENS_POR_PAGINA))
  const produtosPaginados = produtosFiltrados.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA)

  const cabecalho = (
    <div className="relative overflow-hidden rounded-card bg-lm-green text-white p-6 mb-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-lm-yellow">
            <Tag size={13} /> Semana de ofertas
          </p>
          <h1 className="text-2xl md:text-3xl font-black mt-1">Descontos de até 30%</h1>
          <p className="text-sm text-white/80 mt-1 flex items-center gap-1.5">
            <Timer size={14} /> Termina no domingo — aproveite enquanto dura
          </p>
        </div>
        <Contagem />
      </div>
    </div>
  )

  const faixas = (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs font-semibold text-gray-500 mr-1">Desconto:</span>
      {FAIXAS_DESCONTO.map(f => (
        <button
          key={f}
          type="button"
          onClick={() => { setDescontoMinimo(f); setPagina(1) }}
          aria-pressed={descontoMinimo === f}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
            descontoMinimo === f
              ? 'bg-lm-green text-white border-lm-green'
              : 'bg-white text-gray-600 border-gray-500 hover:border-lm-green/50'
          }`}
        >
          {f === 0 ? 'Todas' : `${f}% ou mais`}
        </button>
      ))}
    </div>
  )

  const filtro = categoriaLabel && (
    <div className="flex items-center gap-2 mb-4 text-sm">
      <span className="text-gray-500">
        Ofertas em <strong className="text-lm-dark">{categoriaLabel}</strong>
      </span>
      <Link href="/ofertas" className="flex items-center gap-1 text-lm-green font-semibold hover:underline">
        <X size={13} /> limpar filtro
      </Link>
    </div>
  )

  if (loading) {
    return (
      <>
        {cabecalho}
        {filtro}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </>
    )
  }

  if (produtos.length === 0) {
    return (
      <>
        {cabecalho}
        {filtro}
        <p className="text-sm text-gray-500 py-10 text-center">
          {categoriaLabel ? `Nenhuma oferta em ${categoriaLabel} no momento.` : 'Nenhuma oferta disponível no momento.'}
        </p>
      </>
    )
  }

  return (
    <>
      <ProdutoDrawer produto={produtoDrawer as any} onClose={() => setProdutoDrawer(null)} />
      {cabecalho}
      {filtro}
      {faixas}
      <p className="text-xs text-gray-400 mb-4">{produtosFiltrados.length} produtos em oferta</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 mb-6">
        {produtosPaginados.map(p => (
          <ProductCard key={p.id} produto={p} onDetalhes={() => setProdutoDrawer(p)} />
        ))}
      </div>
      <Pagination page={pagina} totalPages={totalPaginas} onChange={setPagina} />
    </>
  )
}
