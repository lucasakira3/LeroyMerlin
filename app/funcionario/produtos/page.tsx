'use client'

import { useMemo, useState } from 'react'
import { Search, Plus, Edit2, Package, Tag, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

// Simulando alguns produtos
const initialProducts = [
  { id: '1', nome: 'Furadeira de Impacto Bosch 650W', preco: 299.90, estoque: 15, categoria: 'Ferramentas' },
  { id: '2', nome: 'Tinta Acrílica Fosca Suvinil Branco 18L', preco: 389.90, estoque: 8, categoria: 'Tintas' },
  { id: '3', nome: 'Piso Cerâmico Artens 60x60', preco: 45.90, estoque: 120, categoria: 'Pisos' },
  { id: '4', nome: 'Chuveiro Eletrônico Acqua Duo Lorenzetti', preco: 189.90, estoque: 3, categoria: 'Banheiro' },
]

type SortKey = 'nome' | 'categoria' | 'preco' | 'estoque'
type SortDir = 'asc' | 'desc'

function SortIcon({ ativo, dir }: { ativo: boolean; dir: SortDir }) {
  if (!ativo) return <ArrowUpDown size={13} className="text-gray-300" />
  return dir === 'asc' ? <ArrowUp size={13} className="text-lm-green" /> : <ArrowDown size={13} className="text-lm-green" />
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState(initialProducts)
  const [busca, setBusca] = useState('')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const filtrados = produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))

  const ordenados = useMemo(() => {
    if (!sortKey) return filtrados
    const sinal = sortDir === 'asc' ? 1 : -1
    return [...filtrados].sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sinal
      return String(va).localeCompare(String(vb), 'pt-BR') * sinal
    })
  }, [filtrados, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const alterarEstoque = (id: string, delta: number) => {
    setProdutos(produtos.map(p => {
      if (p.id === id) {
        return { ...p, estoque: Math.max(0, p.estoque + delta) }
      }
      return p
    }))
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Estoque e Produtos"
        description="Controle o inventário e adicione novos itens."
        action={
          <Button>
            <Plus size={18} /> Adicionar produto
          </Button>
        }
      />

      <Card padding="none">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar produto por nome ou código..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-lm-green focus:ring-1 focus:ring-lm-green transition-all"
            />
          </div>
          <Button variant="secondary">
            <Tag size={16} /> Categorias
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">
                  <button onClick={() => handleSort('nome')} className="flex items-center gap-1.5 hover:text-lm-green transition-colors">
                    Produto <SortIcon ativo={sortKey === 'nome'} dir={sortDir} />
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
              {ordenados.map(produto => (
                <tr key={produto.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-lm-dark text-sm">{produto.nome}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Cód: {produto.id.padStart(6, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge tone="gray">{produto.categoria}</Badge>
                  </td>
                  <td className="p-4 text-right font-medium text-sm text-gray-700">
                    {produto.preco.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => alterarEstoque(produto.id, -1)}
                        className="w-7 h-7 !p-0 rounded-full"
                      >-</Button>
                      {produto.estoque < 10 ? (
                        <Badge tone="red" className="font-bold w-10 justify-center">
                          {produto.estoque}
                        </Badge>
                      ) : (
                        <span className="font-bold w-10 text-center text-lm-dark">
                          {produto.estoque}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => alterarEstoque(produto.id, 1)}
                        className="w-7 h-7 !p-0 rounded-full"
                      >+</Button>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 hover:text-lm-green hover:bg-green-50 rounded-lg transition-colors text-gray-400">
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {ordenados.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
