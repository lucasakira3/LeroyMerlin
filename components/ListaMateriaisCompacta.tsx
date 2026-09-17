'use client'

import { useState } from 'react'
import { ChevronDown, ShoppingCart, Check } from 'lucide-react'
import type { SearchResult } from '@/types/produto'
import { getImagemProduto } from '@/lib/categoriaImagens'
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'
import { resolverProdutoSelecionado, type ItemProjeto } from './ProjetoMosaico'

const PRIORIDADE_COR: Record<string, string> = {
  essencial: 'bg-red-500',
  recomendado: 'bg-amber-500',
  opcional: 'bg-gray-300',
}

interface Props {
  itens: ItemProjeto[]
  selecionados: Set<string>
  onTrocarAlternativa: (item: ItemProjeto, produtoId: string) => void
  onSelecionarProduto: (produto: SearchResult['produto']) => void
}

// Versão enxuta da lista de materiais (substituiu um card grande por item, com badge de
// prioridade por extenso e um aviso de "sem estoque" sempre visível) — pedido do usuário:
// "mais enxuta e visual possível", numa caixa com scroll interno em vez de esticar a página
// inteira. Uma linha por item (foto + nome + preço), prioridade vira só um pontinho colorido
// (não mais um badge de texto), e trocar de alternativa é opcional — só aparece um "trocar"
// quando o item realmente tem mais de uma opção, expandindo inline em vez de já vir aberto.
export default function ListaMateriaisCompacta({ itens, selecionados, onTrocarAlternativa, onSelecionarProduto }: Props) {
  const [expandidoIdx, setExpandidoIdx] = useState<number | null>(null)
  const [adicionadoId, setAdicionadoId] = useState<string | null>(null)

  function handleAdicionar(produtoId: string, estoque: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (estoque === 0) return
    adicionarAoCarrinho(produtoId)
    setAdicionadoId(produtoId)
    setTimeout(() => setAdicionadoId(prev => prev === produtoId ? null : prev), 1500)
  }

  return (
    <div className="max-h-[420px] overflow-y-auto pr-1 space-y-1.5">
      {itens.map((item, idx) => {
        const produto = resolverProdutoSelecionado(item, selecionados)
        if (!produto) {
          return (
            <div key={idx} className="px-3 py-2.5 rounded-lg border border-dashed border-gray-200 dark:border-zinc-700">
              <p className="text-xs text-gray-400 italic">{item.material} — peça ao vendedor da seção {item.categoria}</p>
            </div>
          )
        }

        const temAlternativas = item.resultados.length > 1
        const expandido = expandidoIdx === idx

        return (
          <div key={idx}>
            <div
              onClick={() => onSelecionarProduto(produto)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs cursor-pointer hover:shadow-sm transition-shadow"
            >
              <span
                title={item.prioridade}
                className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORIDADE_COR[item.prioridade] || 'bg-gray-300'}`}
              />
              <img
                src={getImagemProduto(produto)}
                alt={produto.categoria}
                className="w-9 h-9 rounded-md object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-800 dark:text-zinc-100 truncate">{produto.produto}</p>
                <p className="text-gray-500 dark:text-zinc-400 flex items-center gap-1.5">
                  {produto.estoque === 0
                    ? <span className="text-red-500 font-medium">Sem estoque</span>
                    : (produto as any).preco != null
                      ? Number((produto as any).preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : produto.categoria}
                </p>
              </div>
              {temAlternativas && (
                <button
                  onClick={(e) => { e.stopPropagation(); setExpandidoIdx(expandido ? null : idx) }}
                  className="text-[11px] font-semibold text-lm-green flex items-center gap-0.5 flex-shrink-0 px-1"
                >
                  Trocar <ChevronDown size={12} className={`transition-transform ${expandido ? 'rotate-180' : ''}`} />
                </button>
              )}
              <button
                onClick={(e) => handleAdicionar(produto.id, produto.estoque, e)}
                disabled={produto.estoque === 0}
                aria-label="Adicionar ao carrinho"
                className="w-7 h-7 rounded-lg bg-lm-green text-white flex items-center justify-center flex-shrink-0 hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {adicionadoId === produto.id ? <Check size={13} /> : <ShoppingCart size={13} />}
              </button>
            </div>

            {expandido && temAlternativas && (
              <div className="pl-6 pr-1 pt-1.5 pb-1 space-y-1">
                {item.resultados.map(r => {
                  const sel = r.produto.id === produto.id
                  return (
                    <button
                      key={r.produto.id}
                      onClick={() => onTrocarAlternativa(item, r.produto.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-[11px] transition-colors ${
                        sel ? 'bg-lm-green/10 text-lm-dark dark:text-zinc-50' : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {sel ? <Check size={11} className="text-lm-green flex-shrink-0" /> : <span className="w-[11px] flex-shrink-0" />}
                      <span className="truncate flex-1">{r.produto.produto}</span>
                      {(r.produto as any).preco != null && (
                        <span className="flex-shrink-0 font-medium">
                          {Number((r.produto as any).preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
