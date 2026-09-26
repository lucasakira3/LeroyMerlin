'use client'

import { useEffect, useState } from 'react'
import { Map, ShoppingBag, Lightbulb, CalendarCheck, ChevronDown, ChevronUp, X, Share2, Wallet, Package, Wrench } from 'lucide-react'
import StoreMap from './StoreMap'
import ProjetoTimeline from './ProjetoTimeline'
import { type Projeto, type ItemProjeto } from './ProjetoMosaico'
import PlantaCasa from './PlantaCasa'
import ListaMateriaisCompacta from './ListaMateriaisCompacta'
import ProdutoDrawer from './ProdutoDrawer'
import type { SearchResult } from '@/types/produto'
import Link from 'next/link'
import Card from './ui/Card'
import Button from './ui/Button'
import { codificarLista } from '@/lib/listaCompartilhada'
import { getOrcamento } from '@/lib/clientOrcamento'

const LOJAS = [
  'Interlagos — São Paulo/SP', 'Osasco — Osasco/SP', 'Aricanduva — São Paulo/SP',
  'Santo André — Santo André/SP', 'Guarulhos — Guarulhos/SP', 'Campinas — Campinas/SP',
  'Alphaville — Barueri/SP', 'Belo Horizonte Norte — BH/MG',
  'Barra da Tijuca — Rio de Janeiro/RJ', 'Curitiba — Curitiba/PR',
]

export default function ListaDeCompras({ projeto }: { projeto: Projeto; descricaoOriginal: string }) {
  const [loja, setLoja] = useState(LOJAS[0])
  const [selecionados, setSelecionados] = useState<Set<string>>(
    () => new Set(projeto.itens.flatMap(i => {
      const preferido = i.resultados.find(r => r.produto.estoque > 0) ?? i.resultados[0]
      return preferido ? [preferido.produto.id] : []
    }))
  )
  const [mapaAberto, setMapaAberto] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [aba, setAba] = useState<'visao-geral' | 'lista-completa'>('visao-geral')
  const [produtoDrawer, setProdutoDrawer] = useState<SearchResult['produto'] | null>(null)
  // Orçamento definido no topo da tela do Projeto Guiado (TermometroOrcamento) — lido no
  // useEffect porque vive em localStorage; e reage ao evento que o termômetro já dispara.
  const [orcamento, setOrcamento] = useState<number | null>(null)
  useEffect(() => {
    const ler = () => setOrcamento(getOrcamento())
    ler()
    window.addEventListener('lm-orcamento-change', ler)
    return () => window.removeEventListener('lm-orcamento-change', ler)
  }, [])

  // Troca exclusiva dentro das alternativas do mesmo item — garante no máximo 1 produto
  // selecionado por item: tira todas as outras opções desse item específico antes de marcar
  // a nova (diferente de um toggle simples, que deixaria acumular mais de uma selecionada).
  function trocarAlternativa(item: ItemProjeto, produtoId: string) {
    setSelecionados(prev => {
      const next = new Set(prev)
      for (const r of item.resultados) next.delete(r.produto.id)
      next.add(produtoId)
      return next
    })
  }

  const mapResultados: SearchResult[] = projeto.itens
    .flatMap(i => i.resultados)
    .filter(r => selecionados.has(r.produto.id))
    .reduce((acc, r) => acc.find(a => a.produto.id === r.produto.id) ? acc : [...acc, r], [] as SearchResult[])

  const totalEstimado = mapResultados.reduce((sum, r) => sum + ((r.produto as any).preco ?? 0), 0)

  function compartilharWhatsApp() {
    const linhas: string[] = []

    linhas.push(`🏗️ *Projeto: ${projeto.titulo}*`)
    linhas.push(`_${projeto.resumo}_`)
    linhas.push('')
    linhas.push(`📋 *Lista de Materiais — ${loja.split(' — ')[0]}*`)
    linhas.push('')

    let num = 1
    for (const item of projeto.itens) {
      const selecionadosDoItem = item.resultados.filter(r => selecionados.has(r.produto.id))
      if (selecionadosDoItem.length === 0) continue
      for (const r of selecionadosDoItem) {
        const preco = (r.produto as any).preco
        const precoStr = preco != null
          ? Number(preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          : ''
        linhas.push(`${String(num).padStart(2, '0')}. ✅ *${r.produto.produto}*`)
        linhas.push(`   📍 ${r.produto.corredor} · ${item.quantidade}${precoStr ? ` · ${precoStr}` : ''}`)
        num++
      }
    }

    linhas.push('')
    if (totalEstimado > 0) {
      linhas.push(`💰 *Total estimado: ${totalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}*`)
    }
    linhas.push(`🔧 Complexidade: ${projeto.complexidade}`)
    linhas.push(`📦 Orçamento previsto: ${projeto.orcamento_estimado}`)

    if (projeto.dica_especialista) {
      linhas.push('')
      linhas.push(`💡 *Dica do especialista:* ${projeto.dica_especialista}`)
    }

    linhas.push('')
    linhas.push('_Lista gerada pelo Assistente Leroy Merlin 🟢_')

    const texto = linhas.join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  async function copiarLink() {
    const url = `${window.location.origin}/lista?d=${encodeURIComponent(
      codificarLista({ titulo: projeto.titulo, loja, produtoIds: mapResultados.map(r => r.produto.id) })
    )}`
    await navigator.clipboard.writeText(url)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 1500)
  }

  return (
    <div>
      {/* Cabeçalho do resultado: título + 3 números grandes + barra de orçamento */}
      <div className="bg-lm-green rounded-2xl p-5 text-white mb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <ShoppingBag size={18} className="text-lm-yellow flex-shrink-0" />
            <h2 className="font-bold text-xl">{projeto.titulo}</h2>
          </div>
          <div className="flex-shrink-0">
            <p className="text-white/60 text-[10px] mb-1">Loja</p>
            <select value={loja} onChange={e => setLoja(e.target.value)}
              className="text-xs bg-white/15 border border-white/30 text-white rounded-lg px-2 py-1.5 focus:outline-none max-w-[200px]">
              {LOJAS.map(l => <option key={l} value={l} className="text-gray-800">{l}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="bg-white/15 border border-white/25 rounded-xl px-4 py-3">
            <p className="text-white/60 text-[10px] uppercase tracking-wide flex items-center gap-1"><Wallet size={11} /> Total estimado</p>
            <p className="text-2xl font-black">
              {totalEstimado > 0
                ? totalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : projeto.orcamento_estimado}
            </p>
            <p className="text-[11px] text-white/60">dos itens selecionados</p>
          </div>
          <div className="bg-white/15 border border-white/25 rounded-xl px-4 py-3">
            <p className="text-white/60 text-[10px] uppercase tracking-wide flex items-center gap-1"><Package size={11} /> Materiais</p>
            <p className="text-2xl font-black">{projeto.itens.length}</p>
            <p className="text-[11px] text-white/60">{mapResultados.length} selecionados na lista</p>
          </div>
          <div className="bg-white/15 border border-white/25 rounded-xl px-4 py-3">
            <p className="text-white/60 text-[10px] uppercase tracking-wide flex items-center gap-1"><Wrench size={11} /> Complexidade</p>
            <p className="text-2xl font-black">{projeto.complexidade}</p>
            <p className="text-[11px] text-white/60">previsto: {projeto.orcamento_estimado}</p>
          </div>
        </div>

        {/* Compara o total da lista com o orçamento que o cliente definiu no topo da tela */}
        {orcamento !== null && totalEstimado > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-white/80">
                {totalEstimado <= orcamento
                  ? `Dentro do seu orçamento — sobram ${(orcamento - totalEstimado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                  : `Passa ${(totalEstimado - orcamento).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} do seu orçamento`}
              </span>
              <span className="text-white/60">
                orçamento {orcamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${totalEstimado > orcamento ? 'bg-red-400' : 'bg-lm-yellow'}`}
                style={{ width: `${Math.min((totalEstimado / orcamento) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={compartilharWhatsApp}
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-black text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            {/* WhatsApp icon */}
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Compartilhar no WhatsApp
          </button>
          <button
            onClick={copiarLink}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Share2 size={14} />
            {linkCopiado ? 'Link copiado ✓' : 'Copiar link'}
          </button>
        </div>
      </div>

      {projeto.dica_especialista && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-lm-yellow/50 bg-lm-yellow/10 p-4">
          <span className="w-9 h-9 rounded-xl bg-lm-yellow text-lm-dark flex items-center justify-center flex-shrink-0">
            <Lightbulb size={18} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-yellow-700">Dica do especialista</p>
            <p className="text-sm text-gray-800 leading-relaxed">{projeto.dica_especialista}</p>
          </div>
        </div>
      )}

      {/* Abas */}
      <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
        <button
          type="button"
          onClick={() => setAba('visao-geral')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            aba === 'visao-geral' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Visão geral
        </button>
        <button
          type="button"
          onClick={() => setAba('lista-completa')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            aba === 'lista-completa' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Lista completa
        </button>
      </div>

      {aba === 'visao-geral' && (
        <PlantaCasa
          itens={projeto.itens}
          selecionados={selecionados}
          onSelecionarProduto={setProdutoDrawer}
          onVerMais={() => setAba('lista-completa')}
        />
      )}

      {aba === 'lista-completa' && (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── Coluna esquerda: lista ────────────────────── */}
        <div className="lg:col-span-3 space-y-3">
          <ProjetoTimeline itens={projeto.itens} />

          <h3 className="text-sm font-bold text-gray-900">Lista de materiais</h3>

          <ListaMateriaisCompacta
            itens={projeto.itens}
            selecionados={selecionados}
            onTrocarAlternativa={trocarAlternativa}
            onSelecionarProduto={setProdutoDrawer}
          />

          {/* CTA Agendamento */}
          <Card className="bg-lm-yellow/10 border-lm-yellow/30 mt-2">
            <p className="text-sm font-bold text-gray-900 mb-1">Quer ajuda especializada?</p>
            <p className="text-xs text-gray-500 mb-4">
              Nossos consultores avaliam seu projeto na loja, sem custo e sem compromisso.
            </p>
            <Link href="/agendamento" className="block">
              <Button variant="primary" className="w-full">
                <CalendarCheck size={16} /> Agendar consulta com especialista
              </Button>
            </Link>
          </Card>
        </div>

        {/* ── Coluna direita: mapa (sticky) ─────────────── */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-4 space-y-3">

            {/* Botão toggle mapa */}
            <button onClick={() => setMapaAberto(v => !v)}
              className="w-full flex items-center justify-between bg-lm-green text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors shadow-sm">
              <div className="flex items-center gap-2">
                <Map size={16} />
                {mapaAberto ? 'Fechar mapa' : `Ver no mapa · ${mapResultados.length} produtos`}
              </div>
              {mapaAberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {mapaAberto && (
              <div className="bg-white border-2 border-lm-green rounded-2xl p-3 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-900">{loja.split(' — ')[0]}</span>
                  <button onClick={() => setMapaAberto(false)}>
                    <X size={14} className="text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
                <StoreMap resultados={mapResultados} loja={loja} totalEstimado={totalEstimado} />
              </div>
            )}

            {/* Roteiro na loja */}
            {mapResultados.length > 0 && (
              <div className="bg-white border border-gray-500 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-600 mb-3">📍 Roteiro sugerido</p>
                <div className="space-y-2">
                  {mapResultados.map((r, i) => (
                    <div key={r.produto.id} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-white bg-lm-green rounded px-1.5 py-0.5 flex-shrink-0 font-mono">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-xs font-bold text-lm-green flex-shrink-0 w-20">{r.produto.corredor}</span>
                      <span className="text-xs text-gray-600 truncate">{r.produto.produto}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-500">
                  <Link href="/agendamento"
                    className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-lm-green border border-lm-green/30 py-2 rounded-lg hover:bg-lm-green/5 transition-colors">
                    <CalendarCheck size={13} /> Agendar visita presencial
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      <ProdutoDrawer produto={produtoDrawer} onClose={() => setProdutoDrawer(null)} />
    </div>
  )
}
