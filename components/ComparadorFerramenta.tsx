'use client'

import { useEffect, useState } from 'react'
import { Store, ShoppingCart, Heart, Plus, Check, Search, Loader2, Scale } from 'lucide-react'
import ComparadorResultado from './ComparadorResultado'
import ComparadorCardSkeleton from './ComparadorCardSkeleton'
import { getImagemProduto } from '@/lib/categoriaImagens'
import { buscarProdutos } from '@/lib/buscarProdutos'
import { buscarProdutosPorIds, type ProdutoResolvido } from '@/lib/produtosCliente'
import { getCarrinho } from '@/lib/clientCarrinho'
import { getFavoritosIds } from '@/lib/clientFavoritos'
import { getComparador, toggleComparador, removerDoComparador } from '@/lib/clientComparador'
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'

type Aba = 'loja' | 'carrinho' | 'favoritos'

const ABAS: { valor: Aba; label: string; icone: typeof Store }[] = [
  { valor: 'loja', label: 'Loja', icone: Store },
  { valor: 'carrinho', label: 'Carrinho', icone: ShoppingCart },
  { valor: 'favoritos', label: 'Favoritos', icone: Heart },
]

// Conteúdo do popup de comparador aberto a partir da "bancada de ferramentas" do Projeto
// Guiado — diferente da tela cheia em /comparar (que só mostra o resultado, presumindo que o
// produto já foi selecionado em outro lugar do app), aqui o cliente também ESCOLHE os
// produtos sem sair do popup: busca na loja inteira (mesma busca semântica da aba Buscar),
// ou pega direto do carrinho/favoritos que já tem. `toggleComparador` já limita a 3 itens
// sozinho (lib/clientComparador.ts) — só precisamos avisar quando ele recusar.
export default function ComparadorFerramenta() {
  const [aba, setAba] = useState<Aba>('carrinho')
  const [ids, setIds] = useState<string[]>(() => getComparador())
  const [produtos, setProdutos] = useState<ProdutoResolvido[] | null>(null)
  const [adicionadoId, setAdicionadoId] = useState<string | null>(null)
  const [cheio, setCheio] = useState(false)

  const [query, setQuery] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultadosBusca, setResultadosBusca] = useState<ProdutoResolvido[]>([])
  const [itensCarrinho, setItensCarrinho] = useState<ProdutoResolvido[] | null>(null)
  const [itensFavoritos, setItensFavoritos] = useState<ProdutoResolvido[] | null>(null)

  useEffect(() => {
    // Cliques rápidos no picker mudam `ids` várias vezes em sequência, cada uma disparando
    // seu próprio fetch — sem essa guarda, a resposta de um clique anterior podia chegar
    // depois da mais recente (rede não garante ordem) e sobrescrever o resultado certo com
    // um estado velho (às vezes até vazio, se o clique anterior tinha menos produtos).
    let cancelado = false
    if (ids.length === 0) { setProdutos([]); return }
    buscarProdutosPorIds(ids).then(resultado => {
      if (!cancelado) setProdutos(resultado)
    })
    return () => { cancelado = true }
  }, [ids])

  useEffect(() => {
    if (aba === 'carrinho' && itensCarrinho === null) {
      buscarProdutosPorIds(getCarrinho().map(i => i.produtoId)).then(setItensCarrinho)
    }
    if (aba === 'favoritos' && itensFavoritos === null) {
      buscarProdutosPorIds(getFavoritosIds()).then(setItensFavoritos)
    }
  }, [aba, itensCarrinho, itensFavoritos])

  useEffect(() => {
    if (aba !== 'loja' || !query.trim()) { setResultadosBusca([]); return }
    setBuscando(true)
    const timeout = setTimeout(() => {
      buscarProdutos(query, 10).then(({ resultados }) => {
        setResultadosBusca(resultados.map(r => r.produto))
        setBuscando(false)
      })
    }, 400)
    return () => clearTimeout(timeout)
  }, [aba, query])

  function handleToggle(produtoId: string) {
    const resultado = toggleComparador(produtoId)
    if (resultado === 'full') {
      setCheio(true)
      setTimeout(() => setCheio(false), 2000)
      return
    }
    setIds(getComparador())
  }

  function handleRemover(produtoId: string) {
    removerDoComparador(produtoId)
    setIds(getComparador())
  }

  function handleAdicionarCarrinho(produtoId: string) {
    adicionarAoCarrinho(produtoId)
    setAdicionadoId(produtoId)
    setTimeout(() => setAdicionadoId(prev => prev === produtoId ? null : prev), 1500)
  }

  const listaAtual = aba === 'loja' ? resultadosBusca : aba === 'carrinho' ? itensCarrinho : itensFavoritos
  const carregandoLista = aba === 'loja' ? buscando : listaAtual === null

  return (
    <div className="flex flex-col md:flex-row h-full min-h-0">
      {/* Seletor de produtos */}
      <div className="md:w-72 flex-shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-gray-500 dark:border-zinc-800 p-4 gap-3 max-h-[45vh] md:max-h-none">
        <div className="flex gap-1 bg-gray-100 dark:bg-zinc-800 rounded-lg p-1 flex-shrink-0">
          {ABAS.map(({ valor, label, icone: Icone }) => (
            <button
              key={valor}
              onClick={() => setAba(valor)}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-2 py-1.5 rounded-md transition-colors ${
                aba === valor
                  ? 'bg-white dark:bg-zinc-700 text-lm-green shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-lm-green'
              }`}
            >
              <Icone size={13} /> {label}
            </button>
          ))}
        </div>

        {aba === 'loja' && (
          <div className="relative flex-shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar produto na loja..."
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-gray-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-lm-green/30"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {carregandoLista && (
            <div className="flex justify-center py-6">
              <Loader2 size={18} className="animate-spin text-gray-300" />
            </div>
          )}

          {!carregandoLista && listaAtual?.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6 leading-relaxed">
              {aba === 'loja' && !query.trim() && 'Digite pra buscar um produto.'}
              {aba === 'loja' && query.trim() && 'Nenhum produto encontrado.'}
              {aba === 'carrinho' && 'Seu carrinho está vazio.'}
              {aba === 'favoritos' && 'Você ainda não favoritou nada.'}
            </p>
          )}

          {!carregandoLista && listaAtual?.map(produto => {
            const selecionado = ids.includes(produto.id)
            return (
              <button
                key={produto.id}
                onClick={() => handleToggle(produto.id)}
                className={`w-full flex items-center gap-2.5 rounded-lg p-2 text-left transition-colors ${
                  selecionado ? 'bg-lm-green/10' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
              >
                <img
                  src={getImagemProduto(produto)}
                  alt={produto.categoria}
                  className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-lm-dark dark:text-zinc-50 truncate">{produto.produto}</p>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                    {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  selecionado ? 'bg-lm-green text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-400'
                }`}>
                  {selecionado ? <Check size={13} /> : <Plus size={13} />}
                </div>
              </button>
            )
          })}
        </div>

        {cheio && (
          <p className="text-[11px] text-amber-600 flex-shrink-0">Comparador cheio (máx. 3) — remova um item antes de adicionar outro.</p>
        )}
      </div>

      {/* Resultado */}
      <div className="flex-1 p-4 overflow-x-auto min-h-0">
        {produtos === null ? (
          <div className="flex gap-4">
            {[0, 1].map(i => <ComparadorCardSkeleton key={i} />)}
          </div>
        ) : produtos.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10 h-full">
            <Scale size={28} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Escolha até 3 produtos ao lado pra comparar.</p>
          </div>
        ) : (
          <ComparadorResultado
            produtos={produtos}
            onRemover={handleRemover}
            onAdicionarCarrinho={handleAdicionarCarrinho}
            adicionadoId={adicionadoId}
          />
        )}
      </div>
    </div>
  )
}
