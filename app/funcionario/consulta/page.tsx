'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, MapPin, Lightbulb, Map as MapaIcone, X } from 'lucide-react'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import StoreMap from '@/components/StoreMap'
import DetalheProdutoFuncionario from '@/components/DetalheProdutoFuncionario'
import { calcularRota } from '@/lib/rotaLoja'
import { LOJAS, getLojaFuncionario, salvarLojaFuncionario } from '@/lib/lojas'
import { aplicarAjustes } from '@/lib/ajustesFuncionario'
import { getImagemProduto, ajusteFoto } from '@/lib/categoriaImagens'
import { normalizar } from '@/lib/texto'
import type { Produto } from '@/types/produto'

const MAX_RESULTADOS = 30

export default function ConsultaRapidaPage() {
  const [catalogo, setCatalogo] = useState<Produto[] | null>(null)
  const [busca, setBusca] = useState('')
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
  const [loja, setLoja] = useState(LOJAS[0])
  // Produtos que o funcionário colocou no mapa pra mostrar ao cliente (pode ser mais de um).
  const [noMapaIds, setNoMapaIds] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const mapaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/funcionario/produtos')
      .then(r => r.json())
      .then((lista: Produto[]) => setCatalogo(lista))
      .catch(() => setCatalogo([]))
    inputRef.current?.focus()
    setLoja(getLojaFuncionario())
  }, [])

  // Índice de busca pré-normalizado (nome + código + categoria + tags) — 1000 itens, então
  // filtrar no navegador é instantâneo e não gasta cota de IA em cada tecla digitada.
  const indice = useMemo(
    () =>
      (catalogo ?? []).map(p => ({
        p,
        texto: normalizar(`${p.produto} ${p.id} ${p.categoria} ${p.tags.join(' ')}`),
      })),
    [catalogo]
  )

  const resultados = useMemo(() => {
    const termos = normalizar(busca).split(/\s+/).filter(Boolean)
    if (termos.length === 0) return []
    return indice
      .filter(({ texto }) => termos.every(t => texto.includes(t)))
      .slice(0, MAX_RESULTADOS)
      .map(({ p }) => p)
  }, [indice, busca])

  const selecionado = useMemo(
    () => (catalogo && selecionadoId ? catalogo.find(p => p.id === selecionadoId) ?? null : null),
    [catalogo, selecionadoId]
  )

  // Produtos no mapa já com preço/estoque atuais (ajustes do funcionário aplicados). A rota só
  // aparece com 2+ corredores diferentes — com um só, não há caminho a sugerir.
  const mapa = useMemo(() => {
    if (!catalogo) return { resultados: [], rota: undefined }
    const produtos = noMapaIds.map(id => catalogo.find(p => p.id === id)).filter((p): p is Produto => !!p)
    const corredores = Array.from(new Set(produtos.map(p => p.corredor_normalizado)))
    return {
      resultados: produtos.map(p => ({ produto: aplicarAjustes(p), score: 1 })),
      rota: corredores.length > 1 ? calcularRota(corredores) : undefined,
    }
  }, [catalogo, noMapaIds])

  function alternarNoMapa(id: string) {
    const adicionando = !noMapaIds.includes(id)
    setNoMapaIds(ids => (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]))
    // O mapa fica abaixo da busca; ao adicionar, leva a tela até ele pra não passar despercebido.
    if (adicionando) setTimeout(() => mapaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  function mudarLoja(nova: string) {
    setLoja(nova)
    salvarLojaFuncionario(nova)
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-4">
      <Card padding="sm" className="flex flex-wrap items-center gap-3">
        <label htmlFor="loja-funcionario" className="text-sm font-medium text-gray-700 inline-flex items-center gap-1.5">
          <MapPin size={15} className="text-lm-green" /> Loja onde você está
        </label>
        <select
          id="loja-funcionario"
          value={loja}
          onChange={e => mudarLoja(e.target.value)}
          className="h-9 px-2.5 rounded-lg border border-gray-200 dark:border-gray-500 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
        >
          {LOJAS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </Card>

      {/* Os dois cartões têm sempre a mesma altura, vazios ou preenchidos: a grade estica os
          dois (stretch) e tem altura mínima — a tela menos o que fica acima e uma faixa do
          mapa embaixo. Com um produto aberto, quem dita a altura é o cartão de detalhe. */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 lg:min-h-[max(28rem,calc(100vh_-_13rem))]">
      <Card padding="none" className="flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-500">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
            <input
              ref={inputRef}
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Nome, código (LM-0042) ou tipo de produto..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 dark:border-gray-500 rounded-xl text-sm outline-none focus:border-lm-green focus:ring-1 focus:ring-lm-green transition-all"
            />
          </div>
          <p className="text-sm text-gray-700 mt-2">Consulta de balcão: preço, estoque e corredor na hora, sem sair do atendimento.</p>
        </div>

        <div className="relative flex-1 flex flex-col justify-center">
        {catalogo === null ? (
          <p className="p-4 text-base text-gray-700 text-center">Carregando catálogo...</p>
        ) : busca.trim() === '' ? (
          <EmptyState icon={Search} size="md" title="Digite para consultar" description="Ex.: furadeira, LM-0042, rejunte cinza" />
        ) : resultados.length === 0 ? (
          <EmptyState icon={Search} size="md" title="Nada encontrado" description="Tente outras palavras ou o código do produto." />
        ) : (
          // Em tela larga a lista sai do fluxo (absolute) e rola por dentro do espaço que
          // sobra: assim 30 resultados não esticam o cartão além da altura do vizinho.
          <ul className="divide-y divide-gray-200 dark:divide-gray-500 max-h-[70vh] overflow-y-auto lg:absolute lg:inset-0 lg:max-h-none">
            {resultados.map(p => {
              const estoque = aplicarAjustes(p).estoque
              const ativo = p.id === selecionadoId
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelecionadoId(p.id)}
                    aria-current={ativo}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${ativo ? 'bg-lm-green/10' : 'hover:bg-gray-50'}`}
                  >
                    <img
                      src={getImagemProduto(p)}
                      alt=""
                      className={`w-11 h-11 rounded-lg flex-shrink-0 ${ajusteFoto(p, 'p-0.5')}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-gray-900 truncate">{p.produto}</span>
                      <span className="block text-sm text-gray-700">{p.id} · {p.corredor}</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${estoque === 0 ? 'bg-red-100 text-red-700' : estoque < 10 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {estoque === 0 ? 'Sem estoque' : `${estoque} un.`}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        </div>
      </Card>

      <Card padding="none" className="flex flex-col">
        {!selecionado || !catalogo ? (
          <div className="flex-1 flex flex-col justify-center">
            <EmptyState icon={Lightbulb} size="md" title="Escolha um produto" description="Os detalhes e uma resposta pronta para o cliente aparecem aqui." />
          </div>
        ) : (
          <DetalheProdutoFuncionario
            produto={selecionado}
            catalogo={catalogo}
            onSelecionar={setSelecionadoId}
            noMapa={noMapaIds.includes(selecionado.id)}
            onAlternarMapa={() => alternarNoMapa(selecionado.id)}
          />
        )}
      </Card>
      </div>

      <div ref={mapaRef} className="scroll-mt-4">
      <Card padding="none">
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-500">
          <span className="inline-flex items-center gap-2 font-bold text-gray-900">
            <MapaIcone size={17} className="text-lm-green" /> Mapa da loja
          </span>
          <span className="text-sm text-gray-700">{loja}</span>
          {mapa.resultados.length > 0 && (
            <button type="button" onClick={() => setNoMapaIds([])} className="ml-auto text-sm text-gray-600 hover:text-lm-green">
              Limpar mapa
            </button>
          )}
        </div>
        {mapa.resultados.length === 0 ? (
          <EmptyState
            icon={MapaIcone}
            title="Nenhum produto no mapa"
            description="Escolha um produto e clique em “Mostrar no mapa da loja”. Dá para colocar vários e ver a ordem do caminho."
          />
        ) : (
          <div className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {mapa.resultados.map(({ produto }) => (
                <span key={produto.id} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-500 pl-3 pr-1.5 py-1 text-xs text-gray-700">
                  {produto.produto}
                  <button
                    type="button"
                    onClick={() => alternarNoMapa(produto.id)}
                    aria-label={`Tirar ${produto.produto} do mapa`}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <StoreMap
              resultados={mapa.resultados}
              loja={loja}
              rota={mapa.rota}
              semCarrinho
              onSelect={p => setSelecionadoId(p.id)}
            />
          </div>
        )}
      </Card>
      </div>
    </div>
  )
}
