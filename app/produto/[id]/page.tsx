import { notFound } from 'next/navigation'
import Link from 'next/link'
import { carregarProdutos } from '@/lib/produtos'
import CorridorBadge from '@/components/CorridorBadge'
import StockIndicator from '@/components/StockIndicator'
import SustainabilityBadge from '@/components/SustainabilityBadge'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import ProdutoAcoesCliente from '@/components/ProdutoAcoesCliente'
import TrackProduct from '@/components/TrackProduct'

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
    <main className="min-h-screen bg-gray-50">
      <TrackProduct id={produto.id} nome={produto.produto} categoria={produto.categoria} />
      {/* Header */}
      <header className="bg-lm-green text-white px-4 py-5 shadow-md">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm transition-colors"
          >
            ← Voltar
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <PageHeader
          title={produto.produto}
          description={produto.categoria}
          action={<ProdutoAcoesCliente produtoId={produto.id} />}
        />

        {/* Corredor — seção mais proeminente */}
        <Card className="text-center">
          <p className="text-sm text-gray-500 mb-3 uppercase tracking-wide font-medium">
            Localização na loja
          </p>
          <CorridorBadge corredor={produto.corredor} large />
        </Card>

        {/* Estoque + Sustentabilidade */}
        <Card padding="sm" className="flex items-center justify-between gap-4">
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
        </Card>

        {/* Resposta da IA */}
        {produto.resposta_ia && (
          <Card className="bg-lm-green/5 border-lm-green/20">
            <h2 className="text-sm font-semibold text-lm-green uppercase tracking-wide mb-3">
              Informações do produto
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              {produto.resposta_ia}
            </p>
          </Card>
        )}

        {/* Especificações */}
        {produto.especificacoes && (
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Especificações técnicas
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {produto.especificacoes}
            </p>
          </Card>
        )}

        {/* Tags */}
        {produto.tags && produto.tags.length > 0 && (
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {produto.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Complexidade */}
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Complexidade de instalação</span>
            <span className="text-sm font-semibold text-gray-900">{produto.complexidade}</span>
          </div>
        </Card>
      </div>
    </main>
  )
}
