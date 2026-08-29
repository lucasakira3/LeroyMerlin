'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Edit2, Package, ArrowUp, ArrowDown, ArrowUpDown, Check, X } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import { ajustarEstoque, definirPreco, aplicarAjustes } from '@/lib/ajustesFuncionario'
import type { Produto } from '@/types/produto'

type ProdutoResumo = Pick<Produto, 'id' | 'produto' | 'categoria' | 'preco' | 'estoque'>
type SortKey = 'produto' | 'categoria' | 'preco' | 'estoque'
type SortDir = 'asc' | 'desc'

const ITENS_POR_PAGINA = 20

function SortIcon({ ativo, dir }: { ativo: boolean; dir: SortDir }) {
  if (!ativo) return <ArrowUpDown size={13} className="text-gray-300" />
  return dir === 'asc' ? <ArrowUp size={13} className="text-lm-green" /> : <ArrowDown size={13} className="text-lm-green" />
}

export default function ProdutosPage() {
  const [produtosBase, setProdutosBase] = useState<ProdutoResumo[] | null>(null)
  const [busca, setBusca] = useState('')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [pagina, setPagina] = useState(1)
  const [editandoPrecoId, setEditandoPrecoId] = useState<string | null>(null)
  const [precoForm, setPrecoForm] = useState('')
  // Incrementado a cada ajuste pra forçar recálculo de aplicarAjustes (que lê direto do
  // localStorage, fora do ciclo normal de estado do React).
  const [versaoAjustes, setVersaoAjustes] = useState(0)

  useEffect(() => {
    fetch('/api/funcionario/produtos')
      .then(r => r.json())
      .then((dados: Produto[]) => {
        setProdutosBase(dados.map(({ id, produto, categoria, preco, estoque }) => ({ id, produto, categoria, preco, estoque })))
      })
  }, [])

  useEffect(() => {
    setPagina(1)
  }, [busca])

  const produtos = useMemo(() => {
    if (!produtosBase) return []
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return produtosBase.map(p => aplicarAjustes(p))
  }, [produtosBase, versaoAjustes])

  const filtrados = produtos.filter(p => p.produto.toLowerCase().includes(busca.toLowerCase()))

  const ordenados = useMemo(() => {
    if (!sortKey) return filtrados
    const sinal = sortDir === 'asc' ? 1 : -1
    return [...filtrados].sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sinal
      return String(va).localeCompare(String(vb), 'pt-BR') * sinal
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrados, sortKey, sortDir])

  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / ITENS_POR_PAGINA))
  const paginados = ordenados.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function handleAjustarEstoque(id: string, delta: number) {
    ajustarEstoque(id, delta)
    setVersaoAjustes(v => v + 1)
  }

  function abrirEdicaoPreco(produto: ProdutoResumo) {
    setEditandoPrecoId(produto.id)
    setPrecoForm(produto.preco.toFixed(2).replace('.', ','))
  }

  function salvarPreco(id: string) {
    const valor = Number(precoForm.replace(',', '.'))
    if (!Number.isNaN(valor) && valor > 0) {
      definirPreco(id, valor)
      setVersaoAjustes(v => v + 1)
    }
    setEditandoPrecoId(null)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Estoque e Produtos"
        description={produtosBase ? `${produtosBase.length} produtos no catálogo` : 'Controle o inventário.'}
      />

      <Card padding="none">
        <div className="p-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar produto por nome..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-lm-green focus:ring-1 focus:ring-lm-green transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">
                  <button onClick={() => handleSort('produto')} className="flex items-center gap-1.5 hover:text-lm-green transition-colors">
                    Produto <SortIcon ativo={sortKey === 'produto'} dir={sortDir} />
                  </button>
                </th>
                <th className="p-4 font-bold">
                  <button onClick={() => handleSort('categoria')} className="flex items-center gap-1.5 hover:text-lm-green transition-colors">
                    Categoria <SortIcon ativo={sortKey === 'categoria'} dir={sortDir} />
                  </button>
                </th>
                <th className="p-4 font-bold text-right">
                  <button onClick={() => handleSort('preco')} className="flex items-center gap-1.5 ml-auto hover:text-lm-green transition-colors">
                    Preço (R$) <SortIcon ativo={sortKey === 'preco'} dir={sortDir} />
                  </button>
                </th>
                <th className="p-4 font-bold text-center">
                  <button onClick={() => handleSort('estoque')} className="flex items-center gap-1.5 mx-auto hover:text-lm-green transition-colors">
                    Estoque <SortIcon ativo={sortKey === 'estoque'} dir={sortDir} />
                  </button>
                </th>
                <th className="p-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!produtosBase && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Carregando catálogo...</td>
                </tr>
              )}
              {produtosBase && paginados.map(produto => (
                <tr key={produto.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-lm-dark text-sm">{produto.produto}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Cód: {produto.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge tone="gray">{produto.categoria}</Badge>
                  </td>
                  <td className="p-4 text-right font-medium text-sm text-gray-700">
                    {editandoPrecoId === produto.id ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <input
                          type="text"
                          value={precoForm}
                          onChange={e => setPrecoForm(e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm text-right bg-white focus:outline-none focus:ring-1 focus:ring-lm-green"
                          autoFocus
                        />
                        <button onClick={() => salvarPreco(produto.id)} aria-label="Salvar preço" className="text-lm-green hover:bg-green-50 p-1 rounded">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditandoPrecoId(null)} aria-label="Cancelar" className="text-gray-400 hover:bg-gray-100 p-1 rounded">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      produto.preco.toFixed(2).replace('.', ',')
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleAjustarEstoque(produto.id, -1)}
                        className="w-7 h-7 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                      >-</button>
                      {produto.estoque < 10 ? (
                        <Badge tone="red" className="font-bold w-10 justify-center">{produto.estoque}</Badge>
                      ) : (
                        <span className="font-bold w-10 text-center text-lm-dark">{produto.estoque}</span>
                      )}
                      <button
                        onClick={() => handleAjustarEstoque(produto.id, 1)}
                        className="w-7 h-7 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                      >+</button>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => abrirEdicaoPreco(produto)}
                      aria-label="Editar preço"
                      className="p-2 hover:text-lm-green hover:bg-green-50 rounded-lg transition-colors text-gray-400"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {produtosBase && paginados.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {produtosBase && (
          <div className="p-4 border-t border-gray-100">
            <Pagination page={pagina} totalPages={totalPaginas} onChange={setPagina} />
          </div>
        )}
      </Card>
    </div>
  )
}
