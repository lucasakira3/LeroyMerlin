'use client'

import type { SearchResult } from '@/types/produto'
import { getIconeComodo } from '@/lib/comodoIcones'
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

  // Numeração global (não reinicia por cômodo), mesmo espírito do StoreMap — só que aqui a
  // "legenda" não fica embaixo da planta, mora na aba Lista completa (ListaMateriaisCompacta),
  // pra essa aba ficar só com a planta, enxuta.
  let contador = 0
  const comComodos = gruposComProdutos.map(grupo => {
    const visiveis = grupo.produtosUnicos.slice(0, MAX_BOLINHAS_POR_COMODO)
    const restantes = grupo.produtosUnicos.length - visiveis.length
    const numerados = visiveis.map(entry => ({ ...entry, numero: ++contador }))
    return { comodo: grupo.comodo, numerados, restantes }
  })

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
    </div>
  )
}
