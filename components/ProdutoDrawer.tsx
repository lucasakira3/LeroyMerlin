'use client'

import { useEffect, useRef, useState } from 'react'
import { X, MapPin, Tag, Zap, Leaf, Package, BadgeCheck, SendHorizonal, Bot, Heart, ShoppingCart, Scale } from 'lucide-react'
import { getMarca, getUnidade } from '@/lib/marcas'
import { isFavorito, toggleFavorito } from '@/lib/clientFavoritos'
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'
import { estaNoComparador, toggleComparador } from '@/lib/clientComparador'
import { addAoHistorico } from '@/lib/clientHistorico'
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
  useEffect(() => {
    if (!produto) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [produto, onClose])

  const visible = produto !== null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Painel lateral */}
      <div>
          <div
          className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white rounded-l-card shadow-soft-lg flex flex-col transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {produto && <DrawerContent produto={produto} onClose={onClose} />}
        </div>
      </div>
      
    </>
  )
}

function DrawerContent({ produto, onClose }: { produto: Produto; onClose: () => void }) {
  const marca = getMarca(produto.categoria, produto.id)
  const unidade = getUnidade(produto.produto)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [inputChat, setInputChat] = useState('')
  const [loadingChat, setLoadingChat] = useState(false)
  const [favorito, setFavorito] = useState(false)
  const [adicionado, setAdicionado] = useState(false)
  const [noComparador, setNoComparador] = useState(false)
  const [comparadorMsg, setComparadorMsg] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMensagens([])
    setInputChat('')
    setFavorito(isFavorito(produto.id))
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

  return (
    <>
      {/* Header */}
      <div className="bg-lm-green px-5 pt-5 pb-4 text-white flex-shrink-0">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-white/50">{produto.id}</span>
              <span className="text-[10px] text-white/50">·</span>
              <span className="text-[10px] text-white/70 uppercase tracking-wide">{produto.categoria}</span>
            </div>
            <h2 className="text-lg font-bold leading-snug">{produto.produto}</h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setFavorito(toggleFavorito(produto.id))}
              className="mt-0.5 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              aria-label={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              aria-pressed={favorito}
            >
              <Heart size={16} className={favorito ? 'fill-red-500 text-red-500' : 'text-white'} />
            </button>
            <button
              onClick={handleComparar}
              className="mt-0.5 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors relative"
              aria-label={noComparador ? 'Remover da comparação' : 'Adicionar à comparação'}
              aria-pressed={noComparador}
            >
              <Scale size={16} className={noComparador ? 'text-lm-yellow' : 'text-white'} />
            </button>
            <button
              onClick={onClose}
              className="mt-0.5 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {comparadorMsg && (
          <p className="text-[11px] text-lm-yellow text-right -mt-2 mb-2">{comparadorMsg}</p>
        )}

        {/* Marca + Unidade */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 bg-white/15 rounded-full px-3 py-1 text-xs font-semibold">
            <BadgeCheck size={12} /> {marca}
          </span>
          <span className="bg-white/15 rounded-full px-3 py-1 text-xs font-semibold">
            {unidade}
          </span>
        </div>
      </div>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto">

        {/* Preço + Localização */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wide">Preço</p>
            {precoStr
              ? <p className="text-2xl font-black text-lm-green">{precoStr}</p>
              : <p className="text-sm text-gray-400 italic">Consultar loja</p>
            }
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
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap gap-2">
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
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-lm-green uppercase tracking-widest mb-2">
              O que o especialista diz
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">{produto.resposta_ia}</p>
          </div>
        )}

        {/* Especificações */}
        {produto.especificacoes && (
          <div className="px-5 py-4 border-b border-gray-100">
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
          <div className="px-5 py-4 border-b border-gray-100">
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

        {/* Chat com IA */}
        <div className="px-5 py-4 border-b border-gray-100">
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

        <AvaliacoesProduto produtoId={produto.id} />
      </div>
    </>
  )
}
