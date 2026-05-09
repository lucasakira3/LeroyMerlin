import { notFound } from 'next/navigation'
import Link from 'next/link'
import { carregarProdutos } from '@/lib/produtos'
import CorridorBadge from '@/components/CorridorBadge'
import StockIndicator from '@/components/StockIndicator'
import SustainabilityBadge from '@/components/SustainabilityBadge'

interface PageProps {
  params: { id: string }
}

export default async function ProdutoPage({ params }: PageProps) {
  const produtos = await carregarProdutos()
  const produto = produtos.find((p) => p.id === params.id)

  if (!produto) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-lm-light">
      {/* Header */}
      <header className="bg-lm-green text-white px-4 py-5 shadow-md">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm mb-3 transition-colors"
          >
            ← Voltar
          </Link>
          <h1 className="text-xl font-bold leading-tight">
            {produto.produto}
          </h1>
          <p className="text-sm text-white/70 mt-1 uppercase tracking-wide">
            {produto.categoria}
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Corredor — seção mais proeminente */}
        <section className="bg-white rounded-xl border border-lm-green/20 p-6 text-center">
          <p className="text-sm text-gray-500 mb-3 uppercase tracking-wide font-medium">
            Localização na loja
          </p>
          <CorridorBadge corredor={produto.corredor} large />
        </section>

        {/* Estoque + Sustentabilidade */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
          <div>
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Estoque</p>
            <StockIndicator estoque={produto.estoque} />
          </div>
          {produto.sustentabilidade !== 'N/A' && (
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Sustentabilidade</p>
              <SustainabilityBadge sustentabilidade={produto.sustentabilidade} />
            </div>
          )}
        </div>

        {/* Resposta da IA */}
        {produto.resposta_ia && (
          <section className="bg-lm-green/5 border border-lm-green/20 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-lm-green uppercase tracking-wide mb-3">
              Informações do produto
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              {produto.resposta_ia}
            </p>
          </section>
        )}

        {/* Especificações */}
        {produto.especificacoes && (
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Especificações técnicas
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {produto.especificacoes}
            </p>
          </section>
        )}

        {/* Tags */}
        {produto.tags && produto.tags.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {produto.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-lm-light border border-gray-200 rounded-full text-xs text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Complexidade */}
        <section className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Complexidade de instalação</span>
            <span className="text-sm font-semibold text-lm-dark">{produto.complexidade}</span>
          </div>
        </section>
      </div>
    </main>
  )
}
