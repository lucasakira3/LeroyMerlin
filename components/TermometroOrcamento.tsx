'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Wallet, Pencil, TrendingDown, X, Check, ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react'
import { getCarrinho, removerDoCarrinho, adicionarAoCarrinho, atualizarQuantidade } from '@/lib/clientCarrinho'
import { buscarProdutosPorIds, type ProdutoResolvido } from '@/lib/produtosCliente'
import { getOrcamento, definirOrcamento } from '@/lib/clientOrcamento'
import { buscarSugestaoTroca, type SugestaoTroca } from '@/lib/sugestaoEconomia'
import { getUsuarioLogado } from '@/lib/clientAuth'
import { getPerfil } from '@/lib/clientPerfil'
import { ORCAMENTO_PARA_FAIXA } from '@/lib/perfilSugestoes'

const formatarMoeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Paleta cíclica pra cada segmento de item na barra — cores da marca (tailwind.config.js)
// mais alguns tons neutros pra quando o carrinho tem mais itens que cores dedicadas.
const PALETA_SEGMENTOS = [
  'bg-lm-green', 'bg-lm-orange', 'bg-lm-yellow', 'bg-sky-500',
  'bg-purple-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500',
]

// Barra viva de orçamento (ver docs/backlog-fluxo-loja-fisica.md, "Termômetro de Orçamento
// Vivo"): fica sticky no topo de toda página de cliente, escuta os mesmos eventos globais
// que o carrinho já dispara (lm-carrinho-change) mais um novo (lm-orcamento-change), e
// quando o total passa de 90% do teto sugere trocar o item mais caro por uma alternativa
// mais barata da mesma categoria (lib/sugestaoEconomia.ts).
export default function TermometroOrcamento() {
  const pathname = usePathname()
  const [itens, setItens] = useState<{ produto: ProdutoResolvido; quantidade: number }[]>([])
  const [orcamento, setOrcamento] = useState<number | null>(null)
  const [editando, setEditando] = useState(false)
  const [valorInput, setValorInput] = useState('')
  const [sugestao, setSugestao] = useState<SugestaoTroca | null>(null)
  const [sugestaoDispensada, setSugestaoDispensada] = useState(false)
  const [expandido, setExpandido] = useState(false)
  const [confirmandoRemocaoId, setConfirmandoRemocaoId] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    const carrinho = getCarrinho()
    if (carrinho.length === 0) {
      setItens([])
      return
    }
    const produtos = await buscarProdutosPorIds(carrinho.map(i => i.produtoId))
    const mapa = Object.fromEntries(produtos.map(p => [p.id, p]))
    setItens(
      carrinho
        .filter(i => mapa[i.produtoId])
        .map(i => ({ produto: mapa[i.produtoId], quantidade: i.quantidade }))
    )
  }, [])

  useEffect(() => {
    let valor = getOrcamento()
    if (valor === null) {
      const usuario = getUsuarioLogado()
      const perfil = usuario ? getPerfil(usuario.email) : null
      if (perfil) {
        const [min, max] = ORCAMENTO_PARA_FAIXA[perfil.orcamento]
        valor = Number.isFinite(max) ? max : min * 2
      }
    }
    setOrcamento(valor)
    recarregar()

    const aoMudarCarrinho = () => { setSugestaoDispensada(false); recarregar() }
    const aoMudarOrcamento = () => { setSugestaoDispensada(false); setOrcamento(getOrcamento()) }
    window.addEventListener('lm-carrinho-change', aoMudarCarrinho)
    window.addEventListener('lm-orcamento-change', aoMudarOrcamento)
    return () => {
      window.removeEventListener('lm-carrinho-change', aoMudarCarrinho)
      window.removeEventListener('lm-orcamento-change', aoMudarOrcamento)
    }
  }, [recarregar])

  const total = itens.reduce((soma, i) => soma + i.produto.preco * i.quantidade, 0)
  const percentual = orcamento ? total / orcamento : 0

  useEffect(() => {
    if (!orcamento || percentual < 0.9 || itens.length === 0 || sugestaoDispensada) {
      setSugestao(null)
      return
    }
    let cancelado = false
    buscarSugestaoTroca(itens).then(resultado => {
      if (!cancelado) setSugestao(resultado)
    })
    return () => { cancelado = true }
  }, [orcamento, itens, sugestaoDispensada, percentual])

  if (pathname.startsWith('/funcionario')) return null

  function salvarOrcamento() {
    const valor = Number(valorInput.replace(',', '.'))
    if (Number.isFinite(valor) && valor > 0) {
      definirOrcamento(valor)
      setOrcamento(valor)
    }
    setEditando(false)
  }

  function mudarQuantidade(produtoId: string, delta: number) {
    const item = itens.find(i => i.produto.id === produtoId)
    if (!item) return
    // Diminuir de 1 pra 0 removeria o item sem aviso — em vez disso, pede confirmação
    // inline na própria linha (handleConfirmarRemocao / handleCancelarRemocao abaixo).
    if (delta === -1 && item.quantidade === 1) {
      setConfirmandoRemocaoId(produtoId)
      return
    }
    const nova = Math.min(Math.max(item.quantidade + delta, 0), item.produto.estoque)
    if (nova === item.quantidade) return
    atualizarQuantidade(produtoId, nova)
    recarregar()
  }

  function confirmarRemocao(produtoId: string) {
    removerDoCarrinho(produtoId)
    setConfirmandoRemocaoId(null)
    recarregar()
  }

  function trocarItem() {
    if (!sugestao) return
    const quantidade = itens.find(i => i.produto.id === sugestao.itemAtual.id)?.quantidade ?? 1
    removerDoCarrinho(sugestao.itemAtual.id)
    adicionarAoCarrinho(sugestao.alternativa.id, quantidade)
    setSugestao(null)
    setSugestaoDispensada(false)
    recarregar()
  }

  const corBarra =
    percentual >= 1 ? 'bg-red-500' : percentual >= 0.7 ? 'bg-amber-500' : 'bg-lm-green'
  const corTexto =
    percentual >= 1 ? 'text-red-600 dark:text-red-400' : percentual >= 0.7 ? 'text-amber-600 dark:text-amber-400' : 'text-lm-green'

  return (
    <div className="sticky top-0 z-20 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3">
        <Wallet size={16} className="text-gray-400 dark:text-zinc-500 flex-shrink-0" />
        {!editando && orcamento !== null && (
          <button
            onClick={() => { setValorInput(String(orcamento)); setEditando(true) }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 flex-shrink-0"
            aria-label="Editar orçamento"
          >
            <Pencil size={14} />
          </button>
        )}

        {editando || orcamento === null ? (
          <form
            onSubmit={e => { e.preventDefault(); salvarOrcamento() }}
            className="flex items-center gap-2 flex-1"
          >
            <span className="text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">Meu orçamento é</span>
            <input
              autoFocus
              type="text"
              inputMode="decimal"
              value={valorInput}
              onChange={e => setValorInput(e.target.value)}
              placeholder="ex: 500"
              className="w-24 h-8 px-2 rounded-lg border border-gray-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-lm-green/30"
            />
            <button type="submit" className="text-lm-green hover:text-green-700 flex-shrink-0" aria-label="Salvar orçamento">
              <Check size={16} />
            </button>
            {orcamento !== null && (
              <button type="button" onClick={() => setEditando(false)} className="text-gray-400 hover:text-gray-600 flex-shrink-0" aria-label="Cancelar">
                <X size={16} />
              </button>
            )}
          </form>
        ) : (
          <>
            <div className="flex-1 h-2.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden flex">
              {itens.length === 0 ? (
                <div className={`h-full transition-all duration-500 ${corBarra}`} style={{ width: `${Math.min(percentual * 100, 100)}%` }} />
              ) : (
                itens.map((item, i) => {
                  const largura = (item.produto.preco * item.quantidade / orcamento) * 100
                  return (
                    <div
                      key={item.produto.id}
                      title={`${item.produto.produto} — ${formatarMoeda(item.produto.preco * item.quantidade)}`}
                      className={`h-full ${PALETA_SEGMENTOS[i % PALETA_SEGMENTOS.length]} transition-all duration-500 ${i > 0 ? 'border-l border-white/40 dark:border-zinc-900/40' : ''}`}
                      style={{ width: `${largura}%` }}
                    />
                  )
                })
              )}
            </div>
            <span className={`text-xs font-semibold whitespace-nowrap ${corTexto}`}>
              {formatarMoeda(total)} de {formatarMoeda(orcamento)}
            </span>
            {itens.length > 0 && (
              <button
                onClick={() => setExpandido(v => !v)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 flex-shrink-0"
                aria-label={expandido ? 'Esconder itens' : 'Ver itens'}
              >
                {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          </>
        )}
      </div>

      {expandido && itens.length > 0 && orcamento !== null && (
        <div className="max-w-6xl mx-auto px-4 pb-2 space-y-1.5">
          {itens.map((item, i) => {
            const subtotal = item.produto.preco * item.quantidade
            const fatia = (subtotal / orcamento) * 100

            if (confirmandoRemocaoId === item.produto.id) {
              return (
                <div key={item.produto.id} className="flex items-center gap-2 text-xs bg-red-50 dark:bg-red-950/30 rounded-lg px-2 py-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PALETA_SEGMENTOS[i % PALETA_SEGMENTOS.length]}`} />
                  <span className="flex-1 truncate text-gray-700 dark:text-zinc-300">
                    Remover <strong className="text-gray-900 dark:text-zinc-50">{item.produto.produto}</strong> do carrinho?
                  </span>
                  <button
                    onClick={() => confirmarRemocao(item.produto.id)}
                    className="font-semibold text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded-md flex-shrink-0"
                  >
                    Remover
                  </button>
                  <button
                    onClick={() => setConfirmandoRemocaoId(null)}
                    className="font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 px-2 py-1 rounded-md flex-shrink-0"
                  >
                    Cancelar
                  </button>
                </div>
              )
            }

            return (
              <div key={item.produto.id} className="flex items-center gap-2 text-xs">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PALETA_SEGMENTOS[i % PALETA_SEGMENTOS.length]}`} />
                <span className="flex-1 truncate text-gray-700 dark:text-zinc-300">
                  {item.produto.produto}
                  {item.quantidade > 1 && <span className="text-gray-400 dark:text-zinc-500"> ×{item.quantidade}</span>}
                </span>
                <span className="text-gray-500 dark:text-zinc-400 whitespace-nowrap">{fatia.toFixed(0)}% do orçamento</span>
                <span className="font-semibold text-gray-900 dark:text-zinc-50 whitespace-nowrap">{formatarMoeda(subtotal)}</span>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => mudarQuantidade(item.produto.id, -1)}
                    className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-lm-green hover:bg-lm-green/10"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="text-xs font-semibold w-4 text-center text-gray-700 dark:text-zinc-300">{item.quantidade}</span>
                  <button
                    onClick={() => mudarQuantidade(item.produto.id, 1)}
                    disabled={item.quantidade >= item.produto.estoque}
                    className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-lm-green hover:bg-lm-green/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {sugestao && !sugestaoDispensada && (
        <div className="max-w-6xl mx-auto px-4 pb-2 flex items-center gap-3 text-xs">
          <TrendingDown size={14} className={`flex-shrink-0 ${percentual >= 1 ? 'text-red-500' : 'text-lm-green'}`} />
          <p className="flex-1 text-gray-600 dark:text-zinc-300">
            {percentual >= 1 ? 'Você passou do limite do orçamento.' : 'Você está perto do limite.'} Troque <strong className="text-gray-900 dark:text-zinc-50">{sugestao.itemAtual.produto}</strong> por{' '}
            <strong className="text-gray-900 dark:text-zinc-50">{sugestao.alternativa.produto}</strong> e economize{' '}
            <strong className="text-lm-green">{formatarMoeda(sugestao.economia)}</strong>.
          </p>
          <button
            onClick={trocarItem}
            className="bg-lm-green text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-green-700 flex-shrink-0"
          >
            Trocar
          </button>
          <button
            onClick={() => setSugestaoDispensada(true)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 flex-shrink-0"
            aria-label="Dispensar sugestão"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
