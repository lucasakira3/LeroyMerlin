'use client'

import { useState } from 'react'
import { Search, Plus, Edit2, Package, Tag } from 'lucide-react'

// Simulando alguns produtos
const initialProducts = [
  { id: '1', nome: 'Furadeira de Impacto Bosch 650W', preco: 299.90, estoque: 15, categoria: 'Ferramentas' },
  { id: '2', nome: 'Tinta Acrílica Fosca Suvinil Branco 18L', preco: 389.90, estoque: 8, categoria: 'Tintas' },
  { id: '3', nome: 'Piso Cerâmico Artens 60x60', preco: 45.90, estoque: 120, categoria: 'Pisos' },
  { id: '4', nome: 'Chuveiro Eletrônico Acqua Duo Lorenzetti', preco: 189.90, estoque: 3, categoria: 'Banheiro' },
]

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState(initialProducts)
  const [busca, setBusca] = useState('')

  const filtrados = produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))

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
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-black text-lm-dark">Estoque e Produtos</h1>
          <p className="text-gray-500 mt-1">Controle o inventário e adicione novos itens.</p>
        </div>
        <button className="flex items-center gap-2 bg-lm-green text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#007034] transition-colors">
          <Plus size={18} /> Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Tag size={16} /> Categorias
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Produto</th>
                <th className="p-4 font-bold">Categoria</th>
                <th className="p-4 font-bold text-right">Preço (R$)</th>
                <th className="p-4 font-bold text-center">Estoque</th>
                <th className="p-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map(produto => (
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
                    <span className="inline-block bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-medium">
                      {produto.categoria}
                    </span>
                  </td>
                  <td className="p-4 text-right font-medium text-sm text-gray-700">
                    {produto.preco.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button 
                        onClick={() => alterarEstoque(produto.id, -1)}
                        className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold flex items-center justify-center"
                      >-</button>
                      <span className={`font-bold w-6 text-center ${produto.estoque < 10 ? 'text-red-500' : 'text-lm-dark'}`}>
                        {produto.estoque}
                      </span>
                      <button 
                        onClick={() => alterarEstoque(produto.id, 1)}
                        className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold flex items-center justify-center"
                      >+</button>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 hover:text-lm-green hover:bg-green-50 rounded-lg transition-colors text-gray-400">
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
