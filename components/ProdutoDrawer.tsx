'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X, MapPin, Tag, Zap, Leaf, Package, BadgeCheck, SendHorizonal, Bot,
  Heart, ShoppingCart, Scale, Star, ChevronDown, ChevronUp,
} from 'lucide-react'
import { getMarca, getUnidade } from '@/lib/marcas'
import { getGaleriaCategoria } from '@/lib/categoriaImagens'
import { isFavorito, toggleFavorito } from '@/lib/clientFavoritos'
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'
import { estaNoComparador, toggleComparador } from '@/lib/clientComparador'
import { addAoHistorico } from '@/lib/clientHistorico'
import { formatarParcelamento } from '@/lib/parcelamento'
import { showToast } from '@/lib/toast'
import { getIconeEspecificacao, parseEspecificacoes } from '@/lib/especificacaoIcones'
import { getMedia } from '@/lib/clientAvaliacoes'
import AvaliacoesProduto from './AvaliacoesProduto'
import BotaoAjudaCorredor from './BotaoAjudaCorredor'
import StarRating from './ui/StarRating'
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

      <div className="fixed inset-0 z-50 flex items-center justify-center md:p-4 pointer-events-none">

        <div
          className={`bg-white w-full h-full md:h-auto md:max-h-[92vh] md:max-w-5xl md:rounded-card shadow-soft-lg overflow-hidden flex flex-col transition-all duration-300 ease-out ${
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
  const [fotoAtiva, setFotoAtiva] = useState(0)
  const [adicionado, setAdicionado] = useState(false)
  const [noComparador, setNoComparador] = useState(false)
  const [comparadorMsg, setComparadorMsg] = useState<string | null>(null)
  const [avaliacoesAbertas, setAvaliacoesAbertas] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMensagens([])
    setInputChat('')
    setFavorito(isFavorito(produto.id))
    setZoomAberto(false)
    setFotoAtiva(0)
    setAdicionado(false)
    setNoComparador(estaNoComparador(produto.id))
    setComparadorMsg(null)
    setAvaliacoesAbertas(false)
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
  const galeria = getGaleriaCategoria(produto.categoria, produto.id, 4)
  const { media: mediaAvaliacoes, total: totalAvaliacoes } = getMedia(produto.id)

  return (
    <>

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
          src={galeria[fotoAtiva]}
          alt={produto.categoria}
          onClick={e => e.stopPropagation()}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>,
      document.body
    )}


    <div className="flex-1 overflow-y-auto md:overflow-visible">
      <div className="md:grid md:grid-cols-[minmax(0,42%)_minmax(0,58%)] md:gap-x-6 md:items-start md:p-5">

        {/* Coluna esquerda — imagem + chat */}
        <div className="flex flex-col md:h-full">
          {/* Foto da categoria, com ações flutuantes no canto */}
          <div className="relative flex-shrink-0">
            <img
              src={galeria[fotoAtiva]}
              alt={produto.categoria}
              onClick={() => setZoomAberto(true)}
              className="w-full h-44 md:h-52 object-cover md:rounded-card cursor-zoom-in"
            />
            {galeria.length > 1 && (
              <div className="absolute bottom-2 left-2 right-16 flex gap-1.5">
                {galeria.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setFotoAtiva(i)}
                    aria-label={`Ver foto ${i + 1}`}
                    aria-current={fotoAtiva === i}
                    className={`h-9 w-9 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                      fotoAtiva === i ? 'border-white shadow-md scale-105' : 'border-white/40 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {/* Favoritar / comparar / fechar — canto superior direito, como no modelo */}
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

          <div className="px-5 py-3 md:px-0 md:pt-3 flex flex-col flex-shrink-0">
            <h3 className="text-xs font-bold text-lm-green uppercase tracking-widest mb-2 flex items-center gap-1.5 flex-shrink-0">
              <Bot size={13} /> Pergunte sobre este produto
            </h3>


            <div className="rounded-xl border border-gray-100 bg-gray-50/70 h-56 md:h-64 flex flex-col overflow-hidden">
              <div
                className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {mensagens.length === 0 ? (
                  <div className="h-full flex items-center justify-center px-6 text-center">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Tire dúvidas técnicas sobre este produto com o especialista virtual — instalação, garantia, compatibilidade e mais.
                    </p>
                  </div>
                ) : (
                  <>
                    {mensagens.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                          m.role === 'user'
                            ? 'bg-lm-green text-white rounded-br-sm'
                            : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                        }`}>
                          {m.texto}
                        </div>
                      </div>
                    ))}
                    {loadingChat && (
                      <div className="flex justify-start">
                        <div className="bg-white shadow-sm rounded-2xl rounded-bl-sm px-4 py-2.5 flex gap-1">
                          {[0,1,2].map(i => (
                            <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="flex gap-2 flex-shrink-0 mt-2">
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

        {/* Coluna direita — nome, preço, especificações, tags, avaliações — tudo em
            blocos compactos e agrupados */}
        <div className="px-5 py-4 md:px-0 md:py-0 space-y-3">
          {/* Nome + id/categoria + marca/unidade */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-gray-400">{produto.id}</span>
              <span className="text-[10px] text-gray-300">·</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">{produto.categoria}</span>
            </div>
            <h2 className="text-lg font-bold text-lm-dark leading-snug mb-1.5">{produto.produto}</h2>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 bg-lm-green/10 text-lm-green rounded-full px-2.5 py-0.5 text-xs font-semibold">
                <BadgeCheck size={12} /> {marca}
              </span>
              <span className="bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                {unidade}
              </span>
            </div>
          </div>


          <div className="bg-gray-50 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">Preço</p>
              {precoStr
                ? <p className="text-xl font-black text-lm-green leading-none">{precoStr}</p>
                : <p className="text-sm text-gray-400 italic">Consultar loja</p>
              }
              {parcelamentoStr && <p className="text-[11px] text-gray-400 mt-1">{parcelamentoStr}</p>}
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">Localização</p>
              <div className="flex items-center gap-1.5 text-lm-green justify-end">
                <MapPin size={13} strokeWidth={2.5} />
                <span className="text-sm font-bold">{produto.corredor}</span>
              </div>
              <div className="mt-1.5 flex justify-end">
                <BotaoAjudaCorredor produtoId={produto.id} produtoNome={produto.produto} corredor={produto.corredor} />
              </div>
            </div>
          </div>

          <button
            onClick={handleAdicionarCarrinho}
            disabled={produto.estoque === 0}
            className="w-full flex items-center justify-center gap-1.5 bg-lm-green text-white text-sm font-semibold px-3 py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={15} />
            {adicionado ? 'Adicionado ✓' : 'Adicionar ao carrinho'}
          </button>

          {/* Badges — Estoque, Complexidade, Sustentabilidade */}
          <div className="flex flex-wrap gap-1.5">
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              produto.estoque === 0 ? 'bg-gray-100 text-gray-500' :
              produto.estoque < 10 ? 'bg-orange-100 text-orange-700' :
              'bg-green-100 text-green-700'
            }`}>
              <Package size={11} />
              {produto.estoque === 0 ? 'Sem estoque' :
               produto.estoque < 10 ? `Últimas ${produto.estoque} un.` :
               `${produto.estoque} em estoque`}
            </span>

            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${COMPLEXIDADE_COR[produto.complexidade] ?? 'bg-gray-100 text-gray-600'}`}>
              <Zap size={11} />
              {produto.complexidade}
            </span>

            {produto.sustentabilidade !== 'N/A' && (
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${SUST_COR[produto.sustentabilidade] ?? 'bg-gray-100 text-gray-500'}`}>
                <Leaf size={11} />
                {produto.sustentabilidade}
              </span>
            )}
          </div>

          {/* Especificações — ilustradas com ícone por rótulo em vez de texto corrido.
              Limitado a 6 pra não empurrar avaliações pra fora da
              tela — o modal não tem mais um espaço "solto" pra crescer sem limite. */}
          {produto.especificacoes && (
            <div>
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Especificações
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {parseEspecificacoes(produto.especificacoes).slice(0, 6).map((item, i) => {
                  const Icone = getIconeEspecificacao(item.rotulo)
                  return (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <div className="w-7 h-7 rounded-lg bg-lm-green/10 text-lm-green flex items-center justify-center flex-shrink-0">
                        <Icone size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-gray-400 truncate leading-tight">{item.rotulo}</p>
                        <p className="text-[11px] font-semibold text-gray-800 truncate leading-tight">{item.valor}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {produto.tags && produto.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-0.5">
                <Tag size={10} /> Tags
              </span>
              {produto.tags.slice(0, 6).map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded-full text-[11px] text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Avaliações — resumo compacto (média + estrelas) a lista
              completa e o formulário de avaliação só aparecem se a pessoa expandir, economizando espaço */}
          <div className="border-t border-gray-100 pt-3">
            {/* div (não button) porque o conteúdo já inclui o StarRating, que renderiza
                seus próprios <button> por estrela — button dentro de button é HTML inválido */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setAvaliacoesAbertas(v => !v)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setAvaliacoesAbertas(v => !v)}
              className="w-full flex items-center justify-between gap-2 cursor-pointer"
              aria-expanded={avaliacoesAbertas}
            >
              <span className="flex items-center gap-2">
                <StarRating value={mediaAvaliacoes} size={16} />
                {totalAvaliacoes > 0 ? (
                  <span className="text-xs text-gray-600">
                    {mediaAvaliacoes.toFixed(1)} · {totalAvaliacoes} avaliaç{totalAvaliacoes > 1 ? 'ões' : 'ão'}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 italic">Seja o primeiro a avaliar</span>
                )}
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-lm-green flex-shrink-0">
                {avaliacoesAbertas ? 'Fechar' : 'Ver / avaliar'}
                {avaliacoesAbertas ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </div>

            {avaliacoesAbertas && (
              <div className="mt-3 max-h-64 overflow-y-auto pr-1">
                <AvaliacoesProduto produtoId={produto.id} />
              </div>
            )}
          </div>

        {/* Elemento agora depois das avaliações, para não disputar o espaço diretamente com o preço*/}
          {produto.resposta_ia && (
            <div className="bg-lm-green/5 border border-lm-green/10 rounded-xl p-3">
              <h3 className="text-[10px] font-bold text-lm-green uppercase tracking-widest mb-1 flex items-center gap-1">
                <Star size={11} className="fill-lm-green text-lm-green" /> O que o especialista diz
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{produto.resposta_ia}</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}