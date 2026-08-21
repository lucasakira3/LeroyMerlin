import type { SearchResult } from '@/types/produto'
import { getImagemCategoria } from '@/lib/categoriaImagens'
import Badge from './ui/Badge'
import Card from './ui/Card'

export interface ItemProjeto {
  material: string
  categoria: string
  quantidade: string
  prioridade: string
  observacao: string
  comodo: string
  resultados: SearchResult[]
  etapa_ordem?: number
  etapa_nome?: string
}

export interface Projeto {
  titulo: string
  resumo: string
  orcamento_estimado: string
  complexidade: string
  dica_especialista: string
  itens: ItemProjeto[]
}

export interface GrupoComodo {
  comodo: string
  itens: ItemProjeto[]
}

export function agruparPorComodo(itens: ItemProjeto[]): GrupoComodo[] {
  const ordem: string[] = []
  const grupos = new Map<string, ItemProjeto[]>()

  for (const item of itens) {
    const nome = item.comodo || 'Geral'
    if (!grupos.has(nome)) {
      grupos.set(nome, [])
      ordem.push(nome)
    }
    grupos.get(nome)!.push(item)
  }

  const semGeral = ordem.filter(n => n !== 'Geral')
  const ordemFinal = ordem.includes('Geral') ? [...semGeral, 'Geral'] : semGeral

  return ordemFinal.map(nome => ({ comodo: nome, itens: grupos.get(nome)! }))
}

export function resolverProdutoSelecionado(
  item: ItemProjeto,
  selecionados: Set<string>
): SearchResult['produto'] | null {
  const selecionado = item.resultados.find(r => selecionados.has(r.produto.id))
  if (selecionado) return selecionado.produto
  return item.resultados[0]?.produto ?? null
}

const PRIORIDADE_ANEL: Record<string, string> = {
  essencial: 'ring-red-400',
  recomendado: 'ring-amber-400',
  opcional: 'ring-gray-300',
}

const MAX_FOTOS_VISIVEIS = 6

interface ProjetoMosaicoProps {
  itens: ItemProjeto[]
  selecionados: Set<string>
  onSelecionarProduto: (produto: SearchResult['produto']) => void
  onVerMais?: () => void
}

export default function ProjetoMosaico({ itens, selecionados, onSelecionarProduto, onVerMais }: ProjetoMosaicoProps) {
  const grupos = agruparPorComodo(itens)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {grupos.map(grupo => {
        const produtosDoGrupo = grupo.itens
          .map(item => ({ item, produto: resolverProdutoSelecionado(item, selecionados) }))
          .filter((x): x is { item: ItemProjeto; produto: SearchResult['produto'] } => x.produto !== null)

        const visiveis = produtosDoGrupo.slice(0, MAX_FOTOS_VISIVEIS)
        const restantes = produtosDoGrupo.length - visiveis.length

        return (
          <Card
            key={grupo.comodo}
            padding="sm"
            className={grupos.length === 1 ? 'sm:col-span-2 lg:col-span-3' : ''}
          >
            <p className="text-sm font-bold text-gray-900 mb-3">{grupo.comodo}</p>
            <div className="grid grid-cols-3 gap-2">
              {visiveis.map(({ item, produto }) => (
                <button
                  key={produto.id}
                  onClick={() => onSelecionarProduto(produto)}
                  className="text-left"
                >
                  <div className={`relative aspect-square rounded-lg overflow-hidden ring-2 ${PRIORIDADE_ANEL[item.prioridade] || 'ring-gray-200'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getImagemCategoria(produto.categoria, produto.id)}
                      alt={produto.categoria}
                      className="w-full h-full object-cover"
                    />
                    {produto.estoque === 0 && (
                      <span className="absolute top-1 right-1">
                        <Badge tone="red" className="px-1.5 py-0.5 text-[9px]">Sem estoque</Badge>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-gray-700 mt-1 truncate">
                    {produto.preco != null
                      ? Number(produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : ''}
                  </p>
                </button>
              ))}
              {restantes > 0 && (
                <button
                  onClick={onVerMais}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-400 hover:border-lm-green hover:text-lm-green transition-colors"
                >
                  +{restantes}
                </button>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
