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
import SeletorQuantidadeCarrinho from '@/components/ui/SeletorQuantidadeCarrinho'
import { ajusteFoto, fundoFoto, getImagemProduto } from '@/lib/categoriaImagens'
import { formatarParcelamento } from '@/lib/parcelamento'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProdutoPage({ params }: PageProps) {
  const { id } = await params
  const produtos = await carregarProdutos()
  const produto = produtos.find((p) => p.id === id)

  if (!produto) {
    notFound()
  }

  return (
    <main className="flex-1">
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
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-sm text-gray-700 flex-wrap">
            <li><Link href="/produtos" className="hover:text-lm-green-dark hover:underline transition-colors">Produtos</Link></li>
            <li aria-hidden="true">/</li>
            <li>{produto.categoria}</li>
            <li aria-hidden="true">/</li>
            <li className="text-gray-700 font-medium truncate max-w-[200px]" aria-current="page">{produto.produto}</li>
          </ol>
        </nav>
        <PageHeader
          title={produto.produto}
          description={produto.categoria}
          action={<ProdutoAcoesCliente produtoId={produto.id} />}
        />

        {/* Foto, preço e botão de compra. Sem este bloco a página dizia onde o produto fica,
            mas não quanto custa nem deixava pôr no carrinho (a ficha que abre nas vitrines já
            tinha tudo isso; esta página é a que abre pelos links da conta e dos favoritos). */}
        <Card padding="none" className="sm:flex">
          <div className={`sm:w-56 flex-shrink-0 ${fundoFoto(produto)}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getImagemProduto(produto)}
              alt={produto.categoria}
              className={`w-full h-48 sm:h-full ${ajusteFoto(produto, 'p-3')}`}
            />
          </div>
          <div className="flex-1 min-w-0 p-5 flex flex-col justify-center gap-3">
            <div>
              <p className="text-sm text-gray-600 uppercase tracking-wide">Preço</p>
              <p className="text-2xl font-black text-lm-green leading-tight">
                {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              {formatarParcelamento(produto.preco) && (
                <p className="text-sm text-gray-600">{formatarParcelamento(produto.preco)}</p>
              )}
            </div>
            <SeletorQuantidadeCarrinho produtoId={produto.id} estoque={produto.estoque} size="lg" />
          </div>
        </Card>

        {/* Corredor — seção mais proeminente */}
        <Card className="text-center">
          <p className="text-base text-gray-700 mb-3 uppercase tracking-wide font-medium">
            Localização na loja
          </p>
          <CorridorBadge corredor={produto.corredor} large />
        </Card>

        {/* Estoque + Sustentabilidade */}
        <Card padding="sm" className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1 uppercase tracking-wide">Estoque</p>
            <StockIndicator estoque={produto.estoque} />
          </div>
          {produto.sustentabilidade !== 'N/A' && (
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1 uppercase tracking-wide">Sustentabilidade</p>
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
                  className="px-3 py-1 bg-gray-50 border border-gray-200 dark:border-gray-500 rounded-full text-xs text-gray-600"
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
            <span className="text-base text-gray-700">Complexidade de instalação</span>
            <span className="text-sm font-semibold text-gray-900">{produto.complexidade}</span>
          </div>
        </Card>
      </div>
    </main>
  )
}
