'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, MapPin, Copy, Check, Tag, Lightbulb, Repeat, Map as MapaIcone, X } from 'lucide-react'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import StoreMap from '@/components/StoreMap'
import { calcularRota } from '@/lib/rotaLoja'
import { LOJAS, getLojaFuncionario, salvarLojaFuncionario } from '@/lib/lojas'
import { aplicarAjustes } from '@/lib/ajustesFuncionario'
import { getInfoOferta } from '@/lib/ofertas'
import { getImagemProduto, ajusteFoto, fundoFoto } from '@/lib/categoriaImagens'
import type { Produto } from '@/types/produto'

const MAX_RESULTADOS = 30

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function formatarBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ConsultaRapidaPage() {
  const [catalogo, setCatalogo] = useState<Produto[] | null>(null)
  const [busca, setBusca] = useState('')
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
  const [copiado, setCopiado] = useState<string | null>(null)
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

  const detalhe = useMemo(() => {
    if (!selecionado || !catalogo) return null
    const atual = aplicarAjustes(selecionado)
    const oferta = getInfoOferta(selecionado.id, atual.preco)

    // Alternativas: mesma categoria, em estoque, ranqueadas por tags em comum e depois pela
    // proximidade de preço — o que o vendedor oferece quando o item pedido acabou ou está caro.
    const tagsSel = new Set(selecionado.tags)
    // Mesmo "tipo" (1ª palavra do nome: Furadeira, Rejunte, Lâmpada...) vem antes de tudo,
    // senão uma furadeira sugeriria um conjunto de brocas só porque partilham tags.
    const tipo = normalizar(selecionado.produto.split(' ')[0])
    const candidatas = catalogo
      .filter(p => p.id !== selecionado.id && p.categoria === selecionado.categoria)
      .map(p => ({
        p,
        atual: aplicarAjustes(p),
        comuns: p.tags.filter(t => tagsSel.has(t)).length,
        mesmoTipo: normalizar(p.produto.split(' ')[0]) === tipo,
      }))
      .filter(x => x.atual.estoque > 0)
    const doMesmoTipo = candidatas.filter(x => x.mesmoTipo)
    const alternativas = (doMesmoTipo.length > 0 ? doMesmoTipo : candidatas.filter(x => x.comuns > 0))
      .sort((a, b) => b.comuns - a.comuns || Math.abs(a.atual.preco - atual.preco) - Math.abs(b.atual.preco - atual.preco))
      .slice(0, 3)

    return { atual, oferta, alternativas }
  }, [selecionado, catalogo])

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

  async function copiar(chave: string, texto: string) {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(chave)
      setTimeout(() => setCopiado(c => (c === chave ? null : c)), 2000)
    } catch {
      // Sem permissão de clipboard: o botão só não confirma.
    }
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
          className="h-9 px-2.5 rounded-lg border border-gray-500 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
        >
          {LOJAS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 items-start">
      <Card padding="none">
        <div className="p-4 border-b border-gray-500">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              ref={inputRef}
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Nome, código (LM-0042) ou tipo de produto..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-500 rounded-xl text-sm outline-none focus:border-lm-green focus:ring-1 focus:ring-lm-green transition-all"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Consulta de balcão: preço, estoque e corredor na hora, sem sair do atendimento.</p>
        </div>

        {catalogo === null ? (
          <p className="p-4 text-sm text-gray-500">Carregando catálogo...</p>
        ) : busca.trim() === '' ? (
          <EmptyState icon={Search} title="Digite para consultar" description="Ex.: furadeira, LM-0042, rejunte cinza" />
        ) : resultados.length === 0 ? (
          <EmptyState icon={Search} title="Nada encontrado" description="Tente outras palavras ou o código do produto." />
        ) : (
          <ul className="divide-y divide-gray-500 max-h-[70vh] overflow-y-auto">
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
                      <span className="block text-xs text-gray-500">{p.id} · {p.corredor}</span>
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
      </Card>

      <Card padding="none" className="lg:sticky lg:top-4">
        {!selecionado || !detalhe ? (
          <EmptyState icon={Lightbulb} title="Escolha um produto" description="Os detalhes e uma resposta pronta para o cliente aparecem aqui." />
        ) : (
          <div>
            <div className={`rounded-t-card ${fundoFoto(selecionado)}`}>
              <img
                src={getImagemProduto(selecionado)}
                alt={selecionado.produto}
                className={`w-full h-48 rounded-t-card ${ajusteFoto(selecionado, 'p-3')}`}
              />
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-gray-500">{selecionado.id} · {selecionado.categoria}</p>
                <h2 className="text-lg font-bold text-gray-900">{selecionado.produto}</h2>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-gray-50 border border-gray-500 p-3">
                  <p className="text-[11px] text-gray-500">Preço</p>
                  {detalhe.oferta.emOferta ? (
                    <>
                      <p className="text-lg font-black text-lm-green">{formatarBRL(detalhe.oferta.precoComDesconto)}</p>
                      <p className="text-[11px] text-gray-400 line-through">{formatarBRL(detalhe.atual.preco)}</p>
                    </>
                  ) : (
                    <p className="text-lg font-black text-gray-900">{formatarBRL(detalhe.atual.preco)}</p>
                  )}
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-500 p-3">
                  <p className="text-[11px] text-gray-500">Estoque</p>
                  <p className={`text-lg font-black ${detalhe.atual.estoque === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {detalhe.atual.estoque === 0 ? 'Zerado' : `${detalhe.atual.estoque} un.`}
                  </p>
                </div>
                <div className="rounded-xl bg-lm-green/10 border border-lm-green/30 p-3">
                  <p className="text-[11px] text-gray-500">Onde fica</p>
                  <p className="text-lg font-black text-lm-green inline-flex items-center gap-1">
                    <MapPin size={16} /> {selecionado.corredor.replace('Corredor ', '')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => alternarNoMapa(selecionado.id)}
                aria-pressed={noMapaIds.includes(selecionado.id)}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  noMapaIds.includes(selecionado.id)
                    ? 'bg-lm-green/10 text-lm-green border border-lm-green/40'
                    : 'bg-lm-green text-white hover:bg-lm-green/90'
                }`}
              >
                <MapaIcone size={16} />
                {noMapaIds.includes(selecionado.id) ? 'No mapa — clique para tirar' : 'Mostrar no mapa da loja'}
              </button>

              {detalhe.oferta.emOferta && (
                <p className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-full px-3 py-1">
                  <Tag size={13} /> Em oferta: -{detalhe.oferta.percentualDesconto}% para o cliente
                </p>
              )}

              {selecionado.especificacoes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Especificações</p>
                  <p className="text-sm text-gray-700">{selecionado.especificacoes}</p>
                </div>
              )}

              <div className="rounded-xl border border-lm-green/30 bg-lm-green/5 p-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold text-lm-green uppercase tracking-wider inline-flex items-center gap-1.5">
                    <Lightbulb size={13} /> Resposta pronta para o cliente
                  </p>
                  <button
                    type="button"
                    onClick={() => copiar('resposta', selecionado.resposta_ia)}
                    className="text-xs font-semibold text-lm-green hover:underline inline-flex items-center gap-1"
                  >
                    {copiado === 'resposta' ? <Check size={13} /> : <Copy size={13} />} {copiado === 'resposta' ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                {selecionado.pergunta && <p className="text-xs text-gray-500 mb-1">Pergunta comum: “{selecionado.pergunta}”</p>}
                <p className="text-sm text-gray-800">{selecionado.resposta_ia}</p>
              </div>

              {detalhe.alternativas.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 inline-flex items-center gap-1.5">
                    <Repeat size={13} /> Alternativas em estoque
                  </p>
                  <ul className="space-y-1.5">
                    {detalhe.alternativas.map(({ p, atual }) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => setSelecionadoId(p.id)}
                          className="w-full flex items-center gap-3 rounded-xl border border-gray-500 p-2.5 text-left hover:border-lm-green/50 transition-colors"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-gray-900 truncate">{p.produto}</span>
                            <span className="block text-xs text-gray-500">{p.corredor} · {atual.estoque} un.</span>
                          </span>
                          <span className="text-sm font-bold text-gray-900">{formatarBRL(atual.preco)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
      </div>

      <div ref={mapaRef} className="scroll-mt-4">
      <Card padding="none">
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-500">
          <span className="inline-flex items-center gap-2 font-bold text-gray-900">
            <MapaIcone size={17} className="text-lm-green" /> Mapa da loja
          </span>
          <span className="text-xs text-gray-500">{loja}</span>
          {mapa.resultados.length > 0 && (
            <button type="button" onClick={() => setNoMapaIds([])} className="ml-auto text-xs text-gray-400 hover:text-lm-green">
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
                <span key={produto.id} className="inline-flex items-center gap-1.5 rounded-full border border-gray-500 pl-3 pr-1.5 py-1 text-xs text-gray-700">
                  {produto.produto}
                  <button
                    type="button"
                    onClick={() => alternarNoMapa(produto.id)}
                    aria-label={`Tirar ${produto.produto} do mapa`}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50"
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
