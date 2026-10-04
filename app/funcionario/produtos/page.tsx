'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Edit2, ArrowUp, ArrowDown, ArrowUpDown, Check, X, SlidersHorizontal } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import DetalheProdutoFuncionario from '@/components/DetalheProdutoFuncionario'
import { ajustarEstoque, definirPreco, aplicarAjustes } from '@/lib/ajustesFuncionario'
import { getImagemProduto, ajusteFoto } from '@/lib/categoriaImagens'
import { normalizar } from '@/lib/texto'
import type { SearchResult } from '@/types/produto'

// Produto inteiro (e não só nome/preço/estoque): a ficha aberta ao clicar no produto precisa
// de foto, especificações, corredor e resposta pronta.
type ProdutoCatalogo = SearchResult['produto']
type SortKey = 'produto' | 'categoria' | 'preco' | 'estoque'
type SortDir = 'asc' | 'desc'
type EstoqueFiltro = 'todos' | 'em_estoque' | 'baixo' | 'sem_estoque'

const ITENS_POR_PAGINA = 20

const OPCOES_ESTOQUE: { valor: EstoqueFiltro; label: string }[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'em_estoque', label: 'Em estoque' },
  { valor: 'baixo', label: 'Baixo (< 10)' },
  { valor: 'sem_estoque', label: 'Sem estoque' },
]

function SortIcon({ ativo, dir }: { ativo: boolean; dir: SortDir }) {
  if (!ativo) return <ArrowUpDown size={13} className="text-gray-300" />
  return dir === 'asc' ? <ArrowUp size={13} className="text-lm-green" /> : <ArrowDown size={13} className="text-lm-green" />
}

export default function ProdutosPage() {
  const [produtosBase, setProdutosBase] = useState<ProdutoCatalogo[] | null>(null)
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas')
  const [estoqueFiltro, setEstoqueFiltro] = useState<EstoqueFiltro>('todos')
  const [precoMin, setPrecoMin] = useState('')
  const [precoMax, setPrecoMax] = useState('')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [pagina, setPagina] = useState(1)
  const [editandoPrecoId, setEditandoPrecoId] = useState<string | null>(null)
  const [precoForm, setPrecoForm] = useState('')
  // Produto com a ficha aberta (popup). Guarda o id, não o objeto, pra sempre mostrar o
  // produto do catálogo carregado.
  const [detalheId, setDetalheId] = useState<string | null>(null)
  const fichaRef = useRef<HTMLDivElement>(null)
  // Incrementado a cada ajuste pra forçar recálculo de aplicarAjustes (que lê direto do
  // localStorage, fora do ciclo normal de estado do React).
  const [versaoAjustes, setVersaoAjustes] = useState(0)

  useEffect(() => {
    fetch('/api/funcionario/produtos')
      .then(r => r.json())
      .then((dados: ProdutoCatalogo[]) => setProdutosBase(dados))
  }, [])

  useEffect(() => {
    setPagina(1)
  }, [busca, categoriaFiltro, estoqueFiltro, precoMin, precoMax])

  // As alternativas ficam no fim da ficha: ao trocar de produto por elas, o popup volta pro
  // topo (senão o produto novo abriria já rolado até o fim).
  useEffect(() => {
    fichaRef.current?.scrollIntoView({ block: 'start' })
  }, [detalheId])

  const produtos = useMemo(() => {
    if (!produtosBase) return []
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return produtosBase.map(p => aplicarAjustes(p))
  }, [produtosBase, versaoAjustes])

  // Categorias vêm do próprio catálogo carregado (não de um enum fixo) — o rótulo
  // gravado em cada produto pode não bater 1:1 com o agrupamento usado na busca por
  // texto do cliente (lib/categorias.ts), então listar as opções reais evita um filtro
  // que promete uma categoria e nunca bate com nenhum produto.
  const categorias = useMemo(
    () => ['Todas', ...Array.from(new Set(produtos.map(p => p.categoria))).sort((a, b) => a.localeCompare(b, 'pt-BR'))],
    [produtos]
  )

  const min = precoMin ? Number(precoMin) : null
  const max = precoMax ? Number(precoMax) : null

  // Busca por nome OU código, sem ligar pra acento/maiúscula e com as palavras em qualquer
  // ordem. O código entra também sem o hífen, pra "lm0007" achar "LM-0007" (e "0007" acha os dois).
  const textoDeBusca = useMemo(
    () => new Map((produtosBase ?? []).map(p => [p.id, normalizar(`${p.produto} ${p.id} ${p.id.replace('-', '')}`)])),
    [produtosBase]
  )
  const termos = normalizar(busca).split(/\s+/).filter(Boolean)

  const filtrados = produtos.filter(p => {
    const texto = textoDeBusca.get(p.id) ?? ''
    if (!termos.every(termo => texto.includes(termo))) return false
    if (categoriaFiltro !== 'Todas' && p.categoria !== categoriaFiltro) return false
    if (estoqueFiltro === 'em_estoque' && p.estoque <= 0) return false
    if (estoqueFiltro === 'baixo' && (p.estoque === 0 || p.estoque >= 10)) return false
    if (estoqueFiltro === 'sem_estoque' && p.estoque !== 0) return false
    if (min !== null && p.preco < min) return false
    if (max !== null && p.preco > max) return false
    return true
  })

  const temFiltroAtivo = categoriaFiltro !== 'Todas' || estoqueFiltro !== 'todos' || precoMin !== '' || precoMax !== ''

  function limparFiltros() {
    setCategoriaFiltro('Todas')
    setEstoqueFiltro('todos')
    setPrecoMin('')
    setPrecoMax('')
  }

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

  function abrirEdicaoPreco(produto: ProdutoCatalogo) {
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

  const produtoDetalhe = detalheId ? produtosBase?.find(p => p.id === detalheId) ?? null : null

  // As peças de uma linha (produto, preço, estoque, editar) servem à tabela da tela larga e
  // aos blocos empilhados do celular — escritas uma vez só pra as duas versões não divergirem.

  // Foto + nome + código abrem a ficha do produto. Só esta peça é o botão (e não a linha
  // inteira) pra não brigar com os botões de estoque e de editar preço, que ficam ao lado.
  const botaoProduto = (produto: ProdutoCatalogo) => (
    <button
      type="button"
      onClick={() => setDetalheId(produto.id)}
      aria-label={`Ver detalhes de ${produto.produto}`}
      className="group flex items-center gap-3 text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-lm-green/40"
    >
      <img
        src={getImagemProduto(produto)}
        alt=""
        loading="lazy"
        className={`w-10 h-10 rounded-lg flex-shrink-0 ${ajusteFoto(produto, 'p-0.5')}`}
      />
      <span>
        <span className="block font-bold text-lm-dark text-sm group-hover:text-lm-green group-hover:underline">{produto.produto}</span>
        <span className="block text-sm text-gray-700 mt-0.5">
          Cód: {produto.id}
          {/* No celular não há coluna de categoria: ela vem junto do código. */}
          <span className="md:hidden"> · {produto.categoria}</span>
        </span>
      </span>
    </button>
  )

  const precoDoProduto = (produto: ProdutoCatalogo) =>
    editandoPrecoId === produto.id ? (
      <span className="inline-flex items-center justify-end gap-1.5">
        <input
          type="text"
          value={precoForm}
          onChange={e => setPrecoForm(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') salvarPreco(produto.id)
            if (e.key === 'Escape') setEditandoPrecoId(null)
          }}
          aria-label={`Novo preço de ${produto.produto}`}
          className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-500 rounded-lg text-sm text-right bg-white focus:outline-none focus:ring-1 focus:ring-lm-green"
          autoFocus
        />
        <button onClick={() => salvarPreco(produto.id)} aria-label="Salvar preço" className="text-lm-green hover:bg-green-50 p-1 rounded">
          <Check size={14} />
        </button>
        <button onClick={() => setEditandoPrecoId(null)} aria-label="Cancelar" className="text-gray-600 hover:bg-gray-100 p-1 rounded">
          <X size={14} />
        </button>
      </span>
    ) : (
      produto.preco.toFixed(2).replace('.', ',')
    )

  const controleEstoque = (produto: ProdutoCatalogo) => (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => handleAjustarEstoque(produto.id, -1)}
        aria-label={`Tirar 1 do estoque de ${produto.produto}`}
        className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-500 hover:bg-gray-50 text-gray-600 transition-colors"
      >-</button>
      {produto.estoque < 10 ? (
        <Badge tone="red" className="font-bold w-10 justify-center">{produto.estoque}</Badge>
      ) : (
        <span className="font-bold w-10 text-center text-lm-dark">{produto.estoque}</span>
      )}
      <button
        onClick={() => handleAjustarEstoque(produto.id, 1)}
        aria-label={`Somar 1 ao estoque de ${produto.produto}`}
        className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-500 hover:bg-gray-50 text-gray-600 transition-colors"
      >+</button>
    </div>
  )

  const botaoEditarPreco = (produto: ProdutoCatalogo) => (
    <button
      onClick={() => abrirEdicaoPreco(produto)}
      aria-label="Editar preço"
      className="p-2 hover:text-lm-green hover:bg-green-50 rounded-lg transition-colors text-gray-600"
    >
      <Edit2 size={16} />
    </button>
  )

  const avisoVazio = (
    <EmptyState
      icon={Search}
      title="Nenhum produto encontrado"
      description={busca || temFiltroAtivo ? 'Tente ajustar a busca ou os filtros.' : 'Ainda não há produtos no catálogo.'}
    />
  )

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <Card padding="none">
        <div className="p-4 border-b border-gray-200 dark:border-gray-500 space-y-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou código (LM-0007)..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 dark:border-gray-500 rounded-xl text-sm outline-none focus:border-lm-green focus:ring-1 focus:ring-lm-green transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-gray-600">
              <SlidersHorizontal size={13} />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>

            <select
              value={categoriaFiltro}
              aria-label="Filtrar por categoria"
              onChange={e => setCategoriaFiltro(e.target.value)}
              className={`h-8 px-2.5 rounded-lg border text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30 ${categoriaFiltro !== 'Todas' ? 'border-lm-green font-semibold' : 'border-gray-200 dark:border-gray-500'}`}
            >
              {categorias.map(c => (
                <option key={c} value={c}>{c === 'Todas' ? 'Todas as categorias' : c}</option>
              ))}
            </select>

            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Min R$"
                value={precoMin}
                onChange={e => setPrecoMin(e.target.value)}
                className="w-20 h-8 px-2 rounded-lg border border-gray-200 dark:border-gray-500 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-lm-green/30 bg-white"
              />
              <span className="text-xs text-gray-300">—</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Máx R$"
                value={precoMax}
                onChange={e => setPrecoMax(e.target.value)}
                className="w-20 h-8 px-2 rounded-lg border border-gray-200 dark:border-gray-500 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-lm-green/30 bg-white"
              />
            </div>

            {/* No celular a tabela vira blocos e some o cabeçalho clicável: a ordem vem daqui. */}
            <select
              value={sortKey ? `${sortKey}:${sortDir}` : ''}
              aria-label="Ordenar produtos"
              onChange={e => {
                const [chave, direcao] = e.target.value.split(':')
                setSortKey(chave ? (chave as SortKey) : null)
                setSortDir(direcao === 'desc' ? 'desc' : 'asc')
              }}
              className="md:hidden h-8 px-2.5 rounded-lg border border-gray-200 dark:border-gray-500 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
            >
              <option value="">Ordem do catálogo</option>
              <option value="produto:asc">Nome (A–Z)</option>
              <option value="preco:asc">Menor preço</option>
              <option value="preco:desc">Maior preço</option>
              <option value="estoque:asc">Menor estoque</option>
              <option value="estoque:desc">Maior estoque</option>
            </select>

            <div className="flex flex-wrap gap-1.5">
              {OPCOES_ESTOQUE.map(o => (
                <button
                  key={o.valor}
                  type="button"
                  onClick={() => setEstoqueFiltro(o.valor)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    estoqueFiltro === o.valor
                      ? 'bg-lm-green text-white border-lm-green'
                      : 'bg-white text-gray-700 border-gray-200 dark:border-gray-500 hover-verde'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {temFiltroAtivo && (
              <button type="button" onClick={limparFiltros} className="text-sm text-gray-600 hover:text-lm-green ml-auto">
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* Tela estreita (celular e tablet em pé): um bloco por produto (nome em cima, preço e estoque embaixo). A tabela de
            5 colunas com botões não cabe em tela estreita sem rolar de lado. */}
        <ul className="md:hidden divide-y divide-gray-200 dark:divide-gray-500">
          {!produtosBase && <li className="p-8 text-center text-gray-700">Carregando catálogo...</li>}
          {produtosBase && paginados.map(produto => (
            <li key={produto.id} className="p-4 space-y-3">
              {botaoProduto(produto)}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                  <span>R$</span> {precoDoProduto(produto)}
                  {editandoPrecoId !== produto.id && botaoEditarPreco(produto)}
                </div>
                {controleEstoque(produto)}
              </div>
            </li>
          ))}
          {produtosBase && paginados.length === 0 && <li>{avisoVazio}</li>}
        </ul>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-700 text-sm uppercase tracking-wider">
                <th className="p-4 font-bold">
                  <button onClick={() => handleSort('produto')} className="flex items-center gap-1.5 uppercase hover:text-lm-green transition-colors">
                    Produto <SortIcon ativo={sortKey === 'produto'} dir={sortDir} />
                  </button>
                </th>
                <th className="p-4 font-bold">
                  <button onClick={() => handleSort('categoria')} className="flex items-center gap-1.5 uppercase hover:text-lm-green transition-colors">
                    Categoria <SortIcon ativo={sortKey === 'categoria'} dir={sortDir} />
                  </button>
                </th>
                <th className="p-4 font-bold text-right">
                  <button onClick={() => handleSort('preco')} className="flex items-center gap-1.5 ml-auto uppercase hover:text-lm-green transition-colors">
                    Preço (R$) <SortIcon ativo={sortKey === 'preco'} dir={sortDir} />
                  </button>
                </th>
                <th className="p-4 font-bold text-center">
                  <button onClick={() => handleSort('estoque')} className="flex items-center gap-1.5 mx-auto uppercase hover:text-lm-green transition-colors">
                    Estoque <SortIcon ativo={sortKey === 'estoque'} dir={sortDir} />
                  </button>
                </th>
                <th className="p-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-500">
              {!produtosBase && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-700">Carregando catálogo...</td>
                </tr>
              )}
              {produtosBase && paginados.map(produto => (
                <tr key={produto.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">{botaoProduto(produto)}</td>
                  <td className="p-4">
                    <Badge tone="gray">{produto.categoria}</Badge>
                  </td>
                  <td className="p-4 text-right font-medium text-sm text-gray-700">{precoDoProduto(produto)}</td>
                  <td className="p-4 text-center">{controleEstoque(produto)}</td>
                  <td className="p-4 text-right">{botaoEditarPreco(produto)}</td>
                </tr>
              ))}
              {produtosBase && paginados.length === 0 && (
                <tr>
                  <td colSpan={5}>{avisoVazio}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {produtosBase && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-500">
            <Pagination page={pagina} totalPages={totalPaginas} onChange={setPagina} />
          </div>
        )}
      </Card>

      {/* Mesma ficha da Consulta rápida, aqui dentro de um popup. Clicar numa alternativa
          troca o produto mostrado sem fechar. */}
      <Modal open={produtoDetalhe !== null} onClose={() => setDetalheId(null)} title="Detalhes do produto" maxWidthClass="md:max-w-2xl">
        {produtoDetalhe && produtosBase && (
          <div ref={fichaRef}>
            <DetalheProdutoFuncionario
              key={produtoDetalhe.id}
              produto={produtoDetalhe}
              catalogo={produtosBase}
              onSelecionar={setDetalheId}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
