'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, MapPin, Tag, Zap, Leaf, Package, BadgeCheck, SendHorizonal, Bot, Heart, ShoppingCart, Scale } from 'lucide-react'
import { getMarca, getUnidade } from '@/lib/marcas'
import { getImagemCategoria } from '@/lib/categoriaImagens'
import { isFavorito, toggleFavorito } from '@/lib/clientFavoritos'
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'
import { estaNoComparador, toggleComparador } from '@/lib/clientComparador'
import { addAoHistorico } from '@/lib/clientHistorico'
import { formatarParcelamento } from '@/lib/parcelamento'
import { showToast } from '@/lib/toast'
import AvaliacoesProduto from './AvaliacoesProduto'
import type { SearchResult } from '@/types/produto'

interface Mensagem {
  role: 'user' | 'ai'
  texto: string
}

type Produto = SearchResult['produto']

interface Props {
  produto: Produto | null
  onClose: () => void
}

const COMPLEXIDADE_COR: Record<string, string> = {
  'Baixa':        'bg-green-100 text-green-700',
  'DIY':          'bg-blue-100 text-blue-700',
  'Média':        'bg-yellow-100 text-yellow-700',
  'Alta':         'bg-orange-100 text-orange-700',
  'Profissional': 'bg-red-100 text-red-700',
  'Especialista': 'bg-purple-100 text-purple-700',
}

const SUST_COR: Record<string, string> = {
  'Bronze': 'bg-amber-100 text-amber-700',
  'Prata':  'bg-gray-100 text-gray-600',
  'Ouro':   'bg-yellow-100 text-yellow-700',
}

export default function ProdutoDrawer({ produto, onClose }: Props) {
  // createPortal + este `mounted` existem por um motivo específico, não é boilerplate à
  // toa: components/PageTransition.tsx envolve toda página com uma div `animate-fade-in-up`,
  // e QUALQUER transform em ancestral (mesmo já "zerado" ao fim da animação) vira o
  // containing block de todo `position: fixed` descendente — sem o portal, este popup
  // centralizava relativo à div da animação, não à tela de verdade (achado testando o
  // popup, não óbvio por leitura de código). `document.body` escapa desse problema.
  // `mounted` evita o portal tentar acessar `document` durante SSR (Next.js roda esse
  // componente no servidor antes da primeira renderização no cliente).
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!produto) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [produto, onClose])

  const visible = produto !== null

  if (!mounted) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Popup centralizado (tela cheia no mobile, cartão centralizado a partir de md:) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center md:p-4 pointer-events-none">
        {/* pointer-events precisa acompanhar `visible`, não só a opacidade: fechado, o
            cartão só fica opacity-0/scale-95 (não sai da tela fisicamente), então sem
            isso ele continuava bloqueando cliques em tudo por baixo mesmo invisível. */}
        <div
          className={`bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl md:rounded-card shadow-soft-lg overflow-hidden flex flex-col transition-all duration-300 ease-out ${
            visible ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          {produto && <DrawerContent produto={produto} onClose={onClose} />}
        </div>
      </div>
    </>,
    document.body
  )
}

function DrawerContent({ produto, onClose }: { produto: Produto; onClose: () => void }) {
  const marca = getMarca(produto.categoria, produto.id)
  const unidade = getUnidade(produto.produto)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [inputChat, setInputChat] = useState('')
  const [loadingChat, setLoadingChat] = useState(false)
  const [favorito, setFavorito] = useState(false)
  const [zoomAberto, setZoomAberto] = useState(false)
  const [adicionado, setAdicionado] = useState(false)
  const [noComparador, setNoComparador] = useState(false)
  const [comparadorMsg, setComparadorMsg] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMensagens([])
    setInputChat('')
    setFavorito(isFavorito(produto.id))
    setZoomAberto(false)
    setAdicionado(false)
    setNoComparador(estaNoComparador(produto.id))
    setComparadorMsg(null)
    addAoHistorico(produto.id)
  }, [produto.id])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function enviarPergunta() {
    const pergunta = inputChat.trim()
    if (!pergunta || loadingChat) return

    setMensagens(prev => [...prev, { role: 'user', texto: pergunta }])
    setInputChat('')
    setLoadingChat(true)

    const contexto = [
      `Produto: ${produto.produto}`,
      `Categoria: ${produto.categoria}`,
      `Corredor: ${produto.corredor}`,
      produto.especificacoes ? `Especificações: ${produto.especificacoes}` : '',
    ].filter(Boolean).join('\n')

    try {
      const res = await fetch('/api/duvidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta, contexto }),
      })
      const data = await res.json()
      setMensagens(prev => [...prev, { role: 'ai', texto: data.resposta ?? data.error ?? 'Erro ao responder.' }])
    } catch {
      setMensagens(prev => [...prev, { role: 'ai', texto: 'Serviço temporariamente indisponível.' }])
    } finally {
      setLoadingChat(false)
    }
  }
  function handleAdicionarCarrinho() {
    adicionarAoCarrinho(produto.id)
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 1500)
  }

  function handleFavorito() {
    const novoEstado = toggleFavorito(produto.id)
    setFavorito(novoEstado)
    if (!novoEstado) {
      showToast('Removido dos favoritos', () => setFavorito(toggleFavorito(produto.id)))
    }
  }

  function handleComparar() {
    const resultado = toggleComparador(produto.id)
    if (resultado === 'full') {
      setComparadorMsg('Comparador cheio (máx. 3)')
      setTimeout(() => setComparadorMsg(null), 1500)
      return
    }
    setNoComparador(resultado === 'added')
  }

  const preco = (produto as any).preco as number | undefined
  const precoStr = preco != null
    ? Number(preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null
  const parcelamentoStr = preco != null ? formatarParcelamento(Number(preco)) : null

  return (
    <>
    {/* Zoom da imagem — portal próprio (não só um filho a mais aqui) porque o cartão do
        popup já tem `scale-100`/`scale-95` (transform não-nulo), que criaria containing
        block errado pro `position: fixed` do lightbox se ele ficasse dentro dessa árvore. */}
    {zoomAberto && createPortal(
      <div
        className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
        onClick={() => setZoomAberto(false)}
      >
        <button
          onClick={() => setZoomAberto(false)}
          aria-label="Fechar"
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
        >
          <X size={20} />
        </button>
        <img
          src={getImagemCategoria(produto.categoria, produto.id)}
          alt={produto.categoria}
          onClick={e => e.stopPropagation()}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>,
      document.body
    )}
    <div className="flex-1 overflow-y-auto">
      <div className="md:grid md:grid-cols-2 md:gap-x-8 md:items-start md:p-6">

        {/* Coluna esquerda — imagem + chat */}
        <div>
          {/* Foto da categoria, com ações flutuantes no canto */}
          <div className="relative flex-shrink-0">
            <img
              src={getImagemCategoria(produto.categoria, produto.id)}
              alt={produto.categoria}
              onClick={() => setZoomAberto(true)}
              className="w-full h-56 md:h-72 object-cover md:rounded-card cursor-zoom-in"
            />
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-lm-green/90 backdrop-blur-sm rounded-full p-1.5 shadow-md">
              <button
                onClick={handleFavorito}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                aria-label={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                aria-pressed={favorito}
              >
                <Heart size={16} className={favorito ? 'fill-red-500 text-red-500' : 'text-white'} />
              </button>
              <button
                onClick={handleComparar}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                aria-label={noComparador ? 'Remover da comparação' : 'Adicionar à comparação'}
                aria-pressed={noComparador}
              >
                <Scale size={16} className={noComparador ? 'text-lm-yellow' : 'text-white'} />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>
            {comparadorMsg && (
              <p className="absolute top-14 right-3 text-[11px] font-semibold text-white bg-black/70 px-2.5 py-1 rounded-md">
                {comparadorMsg}
              </p>
            )}
          </div>

          {/* Chat com IA */}
          <div className="px-5 py-4 md:px-0 md:pt-5">
            <h3 className="text-xs font-bold text-lm-green uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Bot size={13} /> Pergunte sobre este produto
            </h3>

            {/* Mensagens */}
            {mensagens.length > 0 && (
              <div className="mb-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                {mensagens.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-lm-green text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}>
                      {m.texto}
                    </div>
                  </div>
                ))}
                {loadingChat && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 flex gap-1">
                      {[0,1,2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputChat}
                onChange={e => setInputChat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && enviarPergunta()}
                placeholder="Ex: Como instalar? Qual a garantia?"
                disabled={loadingChat}
                className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-lm-green/40 disabled:opacity-50 bg-white"
              />
              <button
                onClick={enviarPergunta}
                disabled={!inputChat.trim() || loadingChat}
                className="w-9 h-9 rounded-xl bg-lm-green text-white flex items-center justify-center hover:bg-green-700 transition-colors disabled:opacity-40 flex-shrink-0"
              >
                <SendHorizonal size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Coluna direita — nome, preço, especificações, avaliações */}
        <div>
          {/* Nome + id/categoria + marca/unidade */}
          <div className="px-5 pt-5 pb-3 md:px-0 md:pt-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-gray-400">{produto.id}</span>
              <span className="text-[10px] text-gray-300">·</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">{produto.categoria}</span>
            </div>
            <h2 className="text-lg font-bold text-lm-dark leading-snug mb-2">{produto.produto}</h2>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 bg-lm-green/10 text-lm-green rounded-full px-3 py-1 text-xs font-semibold">
                <BadgeCheck size={12} /> {marca}
              </span>
              <span className="bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-xs font-semibold">
                {unidade}
              </span>
            </div>
          </div>

          {/* Preço + Localização — sticky pra continuar visível rolando o resto do popup
              (chat, especificações, avaliações), já que essa coluna pode ficar bem mais
              alta que a viewport do popup. */}
          <div className="sticky top-0 z-10 bg-white p-5 md:px-0 border-b border-gray-100 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wide">Preço</p>
              {precoStr
                ? <p className="text-2xl font-black text-lm-green">{precoStr}</p>
                : <p className="text-sm text-gray-400 italic">Consultar loja</p>
              }
              {parcelamentoStr && <p className="text-xs text-gray-400 mt-0.5">{parcelamentoStr}</p>}
              <button
                onClick={handleAdicionarCarrinho}
                disabled={produto.estoque === 0}
                className="mt-2 flex items-center gap-1.5 bg-lm-green text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={13} />
                {adicionado ? 'Adicionado ✓' : 'Adicionar ao carrinho'}
              </button>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Localização</p>
              <div className="flex items-center gap-1.5 text-lm-green justify-end">
                <MapPin size={14} strokeWidth={2.5} />
                <span className="text-base font-bold">{produto.corredor}</span>
              </div>
            </div>
          </div>

          {/* Badges — Estoque, Complexidade, Sustentabilidade */}
          <div className="px-5 py-4 md:px-0 border-b border-gray-100 flex flex-wrap gap-2">
            {/* Estoque */}
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              produto.estoque === 0 ? 'bg-gray-100 text-gray-500' :
              produto.estoque < 10 ? 'bg-orange-100 text-orange-700' :
              'bg-green-100 text-green-700'
            }`}>
              <Package size={12} />
              {produto.estoque === 0 ? 'Sem estoque' :
               produto.estoque < 10 ? `Últimas ${produto.estoque} unidades` :
               `${produto.estoque} em estoque`}
            </span>

            {/* Complexidade */}
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${COMPLEXIDADE_COR[produto.complexidade] ?? 'bg-gray-100 text-gray-600'}`}>
              <Zap size={12} />
              {produto.complexidade}
            </span>

            {/* Sustentabilidade */}
            {produto.sustentabilidade !== 'N/A' && (
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${SUST_COR[produto.sustentabilidade] ?? 'bg-gray-100 text-gray-500'}`}>
                <Leaf size={12} />
                {produto.sustentabilidade}
              </span>
            )}
          </div>

          {/* O que o especialista diz */}
          {produto.resposta_ia && (
            <div className="px-5 py-4 md:px-0 border-b border-gray-100">
              <h3 className="text-xs font-bold text-lm-green uppercase tracking-widest mb-2">
                O que o especialista diz
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">{produto.resposta_ia}</p>
            </div>
          )}

          {/* Especificações */}
          {produto.especificacoes && (
            <div className="px-5 py-4 md:px-0 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Especificações técnicas
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {produto.especificacoes}
              </p>
            </div>
          )}

          {/* Tags */}
          {produto.tags && produto.tags.length > 0 && (
            <div className="px-5 py-4 md:px-0 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Tag size={11} /> Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {produto.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <AvaliacoesProduto produtoId={produto.id} />
        </div>
      </div>
    </div>
    </>
  )
}
