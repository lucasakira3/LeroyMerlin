'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, ChevronDown, ChevronUp, ClipboardList, Store, Truck, MapPin, Check, ArrowRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { getStatusPedido } from '@/lib/statusPedido'
import { definirEtapaManual } from '@/lib/statusPedidoFuncionario'
import { calcularRota } from '@/lib/rotaLoja'
import { aplicarAjustes } from '@/lib/ajustesFuncionario'
import type { Pedido } from '@/lib/clientPedidos'
import type { Produto } from '@/types/produto'

interface PedidoDoCliente extends Pedido {
  email: string
  nomeCliente: string
}

type Filtro = 'todos' | 'ativos' | 'prontos' | 'concluidos'

const STATUS_COR: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber-100 text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
  green: 'bg-green-100 text-green-700',
}

const FILTROS: { valor: Filtro; label: string }[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'ativos', label: 'A separar / em andamento' },
  { valor: 'prontos', label: 'Prontos' },
  { valor: 'concluidos', label: 'Concluídos' },
]

// Texto do botão de "próximo passo" de cada etapa, por tipo de pedido. Índice = etapa atual
// (ver ETAPAS_* em lib/statusPedido.ts); a última etapa não tem ação (pedido concluído).
const PROXIMO_PASSO_RETIRADA = ['Iniciar separação', 'Marcar como pronto para retirada', 'Confirmar retirada pelo cliente']
const PROXIMO_PASSO_ENTREGA = ['Iniciar preparo', 'Marcar como enviado', 'Confirmar entrega']

function formatarBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

export default function PedidosFuncionarioPage() {
  const [pedidos, setPedidos] = useState<PedidoDoCliente[]>([])
  const [catalogo, setCatalogo] = useState<Record<string, Produto>>({})
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('ativos')
  const [expandido, setExpandido] = useState<string | null>(null)
  // Itens já separados (checkbox), por número do pedido — só na sessão da tela; separar é
  // uma ação de minutos, não precisa sobreviver a recarregar a página.
  const [separados, setSeparados] = useState<Record<string, string[]>>({})
  // Muda a cada avanço de etapa pra recalcular getStatusPedido (que lê do localStorage).
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    function carregar() {
      // Dado real: junta contas (nome) + pedidos já salvos neste navegador pelos clientes.
      const contas: Record<string, { nome: string }> = JSON.parse(localStorage.getItem('lm_contas_cliente') ?? '{}')
      const porEmail: Record<string, Pedido[]> = JSON.parse(localStorage.getItem('lm_pedidos_cliente') ?? '{}')
      const todos: PedidoDoCliente[] = Object.entries(porEmail).flatMap(([email, lista]) =>
        lista.map(p => ({ ...p, email, nomeCliente: contas[email.trim().toLowerCase()]?.nome ?? contas[email]?.nome ?? email }))
      )
      todos.sort((a, b) => b.data.localeCompare(a.data))
      setPedidos(todos)
    }
    carregar()
    window.addEventListener('lm-status-pedido-change', carregar)
    window.addEventListener('storage', carregar)
    return () => {
      window.removeEventListener('lm-status-pedido-change', carregar)
      window.removeEventListener('storage', carregar)
    }
  }, [])

  useEffect(() => {
    fetch('/api/funcionario/produtos')
      .then(r => r.json())
      .then((lista: Produto[]) => setCatalogo(Object.fromEntries(lista.map(p => [p.id, p]))))
      .catch(() => setCatalogo({}))
  }, [])

  const comStatus = useMemo(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    () => pedidos.map(p => ({ pedido: p, status: getStatusPedido(p) })),
    [pedidos, versao]
  )

  const contagem = useMemo(() => {
    const ativos = comStatus.filter(x => x.status.etapa < x.status.etapas.length - 1)
    return {
      ativos: ativos.length,
      prontos: comStatus.filter(x => x.status.label === 'Pronto para retirada').length,
      concluidos: comStatus.length - ativos.length,
    }
  }, [comStatus])

  const filtrados = comStatus.filter(({ pedido, status }) => {
    const ultima = status.etapa === status.etapas.length - 1
    if (filtro === 'ativos' && ultima) return false
    if (filtro === 'prontos' && status.label !== 'Pronto para retirada') return false
    if (filtro === 'concluidos' && !ultima) return false
    const q = busca.trim().toLowerCase()
    if (!q) return true
    return (
      pedido.numero.toLowerCase().includes(q) ||
      pedido.nomeCliente.toLowerCase().includes(q) ||
      pedido.email.toLowerCase().includes(q)
    )
  })

  function avancar(pedido: PedidoDoCliente, etapaAtual: number) {
    definirEtapaManual(pedido.numero, etapaAtual + 1)
    setVersao(v => v + 1)
  }

  function alternarSeparado(numero: string, produtoId: string) {
    setSeparados(atual => {
      const lista = atual[numero] ?? []
      return { ...atual, [numero]: lista.includes(produtoId) ? lista.filter(id => id !== produtoId) : [...lista, produtoId] }
    })
  }

  // Itens na ordem em que o funcionário deve percorrer a loja (serpentina, mesma lógica da
  // Rota de Compra do cliente), com o corredor de cada um. Sem corredor conhecido vai no fim.
  function itensEmOrdemDeRota(pedido: PedidoDoCliente) {
    const rota = calcularRota(
      pedido.itens.map(i => catalogo[i.produtoId]?.corredor_normalizado).filter((c): c is string => !!c)
    )
    const posicao = new Map(rota.map((r, i) => [r.corredorNormalizado, i]))
    return [...pedido.itens].sort((a, b) => {
      const pa = posicao.get(catalogo[a.produtoId]?.corredor_normalizado ?? '') ?? 999
      const pb = posicao.get(catalogo[b.produtoId]?.corredor_normalizado ?? '') ?? 999
      return pa - pb
    })
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card padding="sm">
          <p className="text-xs text-gray-500">Em andamento</p>
          <p className="text-2xl font-black text-gray-900">{contagem.ativos}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-gray-500">Prontos para retirada</p>
          <p className="text-2xl font-black text-lm-green">{contagem.prontos}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-gray-500">Concluídos</p>
          <p className="text-2xl font-black text-gray-900">{contagem.concluidos}</p>
        </Card>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-gray-500 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nº do pedido ou cliente..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-500 rounded-xl text-sm outline-none focus:border-lm-green focus:ring-1 focus:ring-lm-green transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTROS.map(f => (
              <button
                key={f.valor}
                type="button"
                onClick={() => setFiltro(f.valor)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  filtro === f.valor ? 'bg-lm-green text-white border-lm-green' : 'bg-white text-gray-500 border-gray-500 hover:border-lm-green/40'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtrados.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={pedidos.length === 0 ? 'Nenhum pedido ainda' : 'Nenhum pedido nesse filtro'}
            description={
              pedidos.length === 0
                ? 'Quando um cliente finalizar uma compra neste navegador, o pedido aparece aqui para você separar.'
                : 'Troque o filtro ou a busca.'
            }
          />
        ) : (
          <ul className="divide-y divide-gray-500">
            {filtrados.map(({ pedido, status }) => {
              const aberto = expandido === pedido.numero
              const ultima = status.etapa === status.etapas.length - 1
              const passos = pedido.metodo === 'retirada' ? PROXIMO_PASSO_RETIRADA : PROXIMO_PASSO_ENTREGA
              const feitos = separados[pedido.numero] ?? []
              return (
                <li key={pedido.numero}>
                  <div className="flex flex-wrap items-center gap-3 p-4">
                    <button
                      type="button"
                      onClick={() => setExpandido(aberto ? null : pedido.numero)}
                      className="flex-1 min-w-[240px] flex items-center gap-3 text-left"
                      aria-expanded={aberto}
                    >
                      <span className="w-9 h-9 rounded-lg bg-lm-green/10 text-lm-green flex items-center justify-center flex-shrink-0">
                        {pedido.metodo === 'retirada' ? <Store size={18} /> : <Truck size={18} />}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-semibold text-gray-900">{pedido.numero}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COR[status.cor]}`}>{status.label}</span>
                        </span>
                        <span className="block text-xs text-gray-500 truncate">
                          {pedido.nomeCliente} · {pedido.metodo === 'retirada' ? 'Retirada na loja' : 'Entrega'} · {formatarData(pedido.data)}
                        </span>
                      </span>
                    </button>
                    <span className="text-sm font-bold text-gray-900">{formatarBRL(pedido.total)}</span>
                    {!ultima && (
                      <Button size="sm" onClick={() => avancar(pedido, status.etapa)}>
                        {passos[Math.min(status.etapa, passos.length - 1)]} <ArrowRight size={13} />
                      </Button>
                    )}
                    {ultima && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-lm-green">
                        <Check size={14} /> Concluído
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setExpandido(aberto ? null : pedido.numero)}
                      aria-label={aberto ? 'Recolher pedido' : 'Ver itens do pedido'}
                      className="text-gray-400 hover:text-lm-green"
                    >
                      {aberto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>

                  {aberto && (
                    <div className="px-4 pb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Lista de separação — na ordem do caminho pela loja
                        {feitos.length > 0 && ` · ${feitos.length}/${pedido.itens.length} separados`}
                      </p>
                      <ul className="rounded-xl border border-gray-500 divide-y divide-gray-500">
                        {itensEmOrdemDeRota(pedido).map(item => {
                          const base = catalogo[item.produtoId]
                          const estoqueAtual = base ? aplicarAjustes(base).estoque : null
                          const marcado = feitos.includes(item.produtoId)
                          const faltando = estoqueAtual !== null && estoqueAtual < item.quantidade
                          return (
                            <li key={item.produtoId} className="flex items-center gap-3 p-3">
                              <input
                                type="checkbox"
                                checked={marcado}
                                onChange={() => alternarSeparado(pedido.numero, item.produtoId)}
                                aria-label={`Separado: ${item.nome}`}
                                className="w-4 h-4 accent-lm-green flex-shrink-0"
                              />
                              <span className="min-w-0 flex-1">
                                <span className={`block text-sm font-medium ${marcado ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                  {item.quantidade}× {item.nome}
                                </span>
                                <span className="block text-xs text-gray-500">
                                  {item.produtoId}
                                  {estoqueAtual !== null && ` · ${estoqueAtual} em estoque`}
                                </span>
                              </span>
                              {faltando && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                  Estoque insuficiente
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-lm-green flex-shrink-0">
                                <MapPin size={12} /> {base?.corredor ?? 'Corredor ?'}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                      {pedido.metodo === 'entrega' && pedido.endereco && (
                        <p className="text-xs text-gray-500 mt-2">Entrega em: {pedido.endereco}</p>
                      )}
                      {pedido.metodo === 'retirada' && pedido.loja && (
                        <p className="text-xs text-gray-500 mt-2">Retirada em: {pedido.loja}</p>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
