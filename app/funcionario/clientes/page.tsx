'use client'

import { Search, MoreVertical, Edit2, Trash2 } from 'lucide-react'

export default function ClientesPage() {
  const clientes = [
    { id: '1', nome: 'João Silva', email: 'joao@email.com', telefone: '(11) 98765-4321', compras: 12, status: 'Ativo' },
    { id: '2', nome: 'Maria Oliveira', email: 'maria@email.com', telefone: '(11) 91234-5678', compras: 4, status: 'Ativo' },
    { id: '3', nome: 'Carlos Souza', email: 'carlos@email.com', telefone: '(11) 99876-5432', compras: 1, status: 'Inativo' },
    { id: '4', nome: 'Ana Costa', email: 'ana@email.com', telefone: '(11) 94567-8901', compras: 25, status: 'VIP' },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-black text-lm-dark">Clientes</h1>
          <p className="text-gray-500 mt-1">Gerencie a base de clientes da loja.</p>
        </div>
        <button className="bg-lm-green text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#007034] transition-colors">
          + Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome, email ou CPF..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-lm-green focus:ring-1 focus:ring-lm-green transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Nome</th>
                <th className="p-4 font-bold">Contato</th>
                <th className="p-4 font-bold text-center">Compras</th>
                <th className="p-4 font-bold text-center">Status</th>
                <th className="p-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.map(cliente => (
                <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-lm-dark">{cliente.nome}</p>
                    <p className="text-xs text-gray-500 mt-0.5">ID: {cliente.id}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-gray-700">{cliente.email}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{cliente.telefone}</p>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">
                      {cliente.compras}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      cliente.status === 'VIP' ? 'bg-purple-100 text-purple-700' :
                      cliente.status === 'Ativo' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {cliente.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-gray-400">
                      <button className="p-1.5 hover:text-lm-green hover:bg-green-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                      <button className="p-1.5 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      <button className="p-1.5 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><MoreVertical size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
