'use client'

import { ShoppingCart, Check } from 'lucide-react'
import { useState } from 'react'
import type { SearchResult } from '@/types/produto'
import { getImagemCategoria } from '@/lib/categoriaImagens'
import { getIconeComodo } from '@/lib/comodoIcones'
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'
import { agruparPorComodo, resolverProdutoSelecionado, type ItemProjeto } from './ProjetoMosaico'

const MAX_BOLINHAS_POR_COMODO = 8

interface PlantaCasaProps {
  itens: ItemProjeto[]
  selecionados: Set<string>
  onSelecionarProduto: (produto: SearchResult['produto']) => void
  onVerMais: () => void
}

// Substitui o mosaico de fotos (ProjetoMosaico.tsx) como visão geral do resultado — pedido
// do usuário: uma planta baixa fictícia da casa (não uma planta real, só um esquema de
// cômodos), com os materiais marcados como bolinhas numeradas dentro do cômodo certo, no
// mesmo espírito visual do StoreMap.tsx (pin numerado + legenda embaixo), mas redesenhado
// num estilo "blueprint" escuro que combina com a paleta do chat (fundo escuro, acento
// verde) em vez do mapa colorido da loja — decisão deliberada de manter essa carta sempre
// escura (não inverter por tema), pra funcionar como um cartão de identidade visual fixo do
// resultado, independente do modo claro/escuro do resto do app.
export default function PlantaCasa({ itens, selecionados, onSelecionarProduto, onVerMais }: PlantaCasaProps) {
  const [adicionadoId, setAdicionadoId] = useState<string | null>(null)

  const grupos = agruparPorComodo(itens)

  const gruposComProdutos = grupos
    .map(grupo => {
      const produtosDoGrupo = grupo.itens
        .map(item => ({ item, produto: resolverProdutoSelecionado(item, selecionados) }))
        .filter((x): x is { item: ItemProjeto; produto: SearchResult['produto'] } => x.produto !== null)

      const produtosUnicos: typeof produtosDoGrupo = []
      const idsVistos = new Set<string>()
      for (const entry of produtosDoGrupo) {
        if (idsVistos.has(entry.produto.id)) continue
        idsVistos.add(entry.produto.id)
        produtosUnicos.push(entry)
      }

      return { comodo: grupo.comodo, produtosUnicos }
    })
    .filter(grupo => grupo.produtosUnicos.length > 0)

  if (gruposComProdutos.length === 0) {
    return (
      <p className="text-sm text-gray-500">Nenhum produto encontrado para este projeto. Veja a Lista completa.</p>
    )
  }

  // Numeração global (não reinicia por cômodo) pra bater com a legenda embaixo, igual ao
  // StoreMap — cada bolinha na planta tem o mesmo número do item correspondente na lista.
  let contador = 0
  const comComodos = gruposComProdutos.map(grupo => {
    const visiveis = grupo.produtosUnicos.slice(0, MAX_BOLINHAS_POR_COMODO)
    const restantes = grupo.produtosUnicos.length - visiveis.length
    const numerados = visiveis.map(entry => ({ ...entry, numero: ++contador }))
    return { comodo: grupo.comodo, numerados, restantes }
  })

  const todosNumerados = comComodos.flatMap(g => g.numerados)

  function handleAdicionar(produtoId: string, estoque: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (estoque === 0) return
    adicionarAoCarrinho(produtoId)
    setAdicionadoId(produtoId)
    setTimeout(() => setAdicionadoId(prev => prev === produtoId ? null : prev), 1500)
  }

  return (
    <div>
      {/* Planta */}
      <div
        className="relative rounded-2xl border-2 border-zinc-700 bg-[#161b22] p-4 sm:p-5"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      >
        <div className={`grid gap-3 ${comComodos.length === 1 ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
          {comComodos.map(({ comodo, numerados, restantes }) => {
            const IconeComodo = getIconeComodo(comodo)
            return (
              <div
                key={comodo}
                className="rounded-xl border border-dashed border-zinc-600 bg-white/[0.02] p-3 min-h-[110px]"
              >
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-300 uppercase tracking-wide mb-2.5">
                  <IconeComodo size={13} className="text-lm-green flex-shrink-0" />
                  {comodo}
                </p>
                <div className="flex flex-wrap gap-2">
                  {numerados.map(({ produto, numero }) => (
                    <button
                      key={produto.id}
                      type="button"
                      onClick={() => onSelecionarProduto(produto)}
                      title={produto.produto}
                      className="w-9 h-9 rounded-full bg-lm-green text-white text-xs font-black flex items-center justify-center flex-shrink-0 ring-2 ring-[#161b22] hover:scale-110 hover:ring-lm-green/40 transition-transform"
                    >
                      {numero}
                    </button>
                  ))}
                  {restantes > 0 && (
                    <button
                      type="button"
                      onClick={onVerMais}
                      title={`Mais ${restantes} ${restantes > 1 ? 'itens' : 'item'}`}
                      className="w-9 h-9 rounded-full border-2 border-dashed border-zinc-500 text-zinc-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 hover:border-lm-green hover:text-lm-green transition-colors"
                    >
                      +{restantes}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Porta de entrada — puro floreio decorativo pra reforçar a leitura de "planta" */}
        <div className="flex justify-center mt-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
            <span className="w-8 h-px bg-zinc-600" />
            Entrada
            <span className="w-8 h-px bg-zinc-600" />
          </div>
        </div>
      </div>

      {/* Legenda — mesma numeração das bolinhas, mesmo padrão do StoreMap */}
      <div className="mt-4 space-y-1.5">
        {todosNumerados.map(({ produto, numero }) => (
          <div
            key={produto.id}
            onClick={() => onSelecionarProduto(produto)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs cursor-pointer hover:shadow-sm transition-shadow animate-fade-in-up"
            style={{ '--stagger-delay': `${Math.min(numero, 15) * 25}ms` } as React.CSSProperties}
          >
            <span className="w-6 h-6 rounded-full bg-lm-green text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
              {numero}
            </span>
            <img
              src={getImagemCategoria(produto.categoria, produto.id)}
              alt={produto.categoria}
              className="w-9 h-9 rounded-md object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-800 dark:text-zinc-100 truncate">{produto.produto}</p>
              <p className="text-gray-500 dark:text-zinc-400">
                {(produto as any).preco != null
                  ? Number((produto as any).preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  : produto.categoria}
              </p>
            </div>
            <button
              onClick={(e) => handleAdicionar(produto.id, produto.estoque, e)}
              disabled={produto.estoque === 0}
              aria-label="Adicionar ao carrinho"
              className="w-7 h-7 rounded-lg bg-lm-green text-white flex items-center justify-center flex-shrink-0 hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {adicionadoId === produto.id ? <Check size={13} /> : <ShoppingCart size={13} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
