'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingCart, MapPin, CheckCircle2, CreditCard, QrCode, Barcode, Loader2, Check, Map as MapIcon } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { getCarrinho, atualizarQuantidade, removerDoCarrinho, limparCarrinho, adicionarAoCarrinho, type CartItem } from '@/lib/clientCarrinho'
import { salvarPedido, gerarNumeroPedido, type Pedido, type ItemPedido, type PagamentoInfo } from '@/lib/clientPedidos'
import { adicionarNotificacao } from '@/lib/clientNotificacoes'
import { getUsuarioLogado } from '@/lib/clientAuth'
import { buscarProdutosPorIds, type ProdutoResolvido } from '@/lib/produtosCliente'
import { clearProductHistory } from '@/lib/hooks/useProductTracker'
import { getImagemCategoria } from '@/lib/categoriaImagens'
import { formatarParcelamento, getOpcoesParcelamento } from '@/lib/parcelamento'
import CartItemSkeleton from '@/components/CartItemSkeleton'
import StoreMap from '@/components/StoreMap'
import { calcularRota } from '@/lib/rotaLoja'
import { showToast } from '@/lib/toast'
import {
  getEnderecos, salvarEndereco, formatarEndereco,
  type Endereco, type NovoEndereco,
} from '@/lib/clientEnderecos'
import { formatarCep, buscarCep } from '@/lib/cep'
import {
  formatarNumeroCartao, formatarValidade, formatarCvv,
  detectarBandeira, cartaoValido,
} from '@/lib/pagamento'

const LOJAS = [
  'Interlagos — São Paulo/SP',
  'Osasco — Osasco/SP',
  'Aricanduva — São Paulo/SP',
  'Santo André — Santo André/SP',
  'Guarulhos — Guarulhos/SP',
  'Campinas — Campinas/SP',
  'Alphaville — Barueri/SP',
  'São Bernardo do Campo — SBC/SP',
  'Sorocaba — Sorocaba/SP',
  'Belo Horizonte Norte — BH/MG',
  'Barra da Tijuca — Rio de Janeiro/RJ',
  'Curitiba — Curitiba/PR',
  'Porto Alegre — Porto Alegre/RS',
  'Brasília — DF',
  'Goiânia — Goiânia/GO',
]

const ENDERECO_VAZIO: NovoEndereco = {
  rotulo: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
}

async function buscarProdutos(ids: string[]): Promise<Record<string, ProdutoResolvido>> {
  const produtos = await buscarProdutosPorIds(ids)
  const mapa: Record<string, ProdutoResolvido> = {}
  for (const p of produtos) mapa[p.id] = p
  return mapa
}

export default function CarrinhoPage() {
  const [itens, setItens] = useState<CartItem[]>([])
  const [produtos, setProdutos] = useState<Record<string, ProdutoResolvido> | null>(null)
  const [usuario, setUsuario] = useState<{ email: string } | null>(null)
  const [metodo, setMetodo] = useState<'retirada' | 'entrega'>('retirada')
  const [loja, setLoja] = useState(LOJAS[0])
  const [verRota, setVerRota] = useState(false)

  // Endereço de entrega
  const [enderecosSalvos, setEnderecosSalvos] = useState<Endereco[]>([])
  const [enderecoSelecionadoId, setEnderecoSelecionadoId] = useState<string | null>(null)
  const [enderecoForm, setEnderecoForm] = useState<NovoEndereco>(ENDERECO_VAZIO)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [salvarNovoEndereco, setSalvarNovoEndereco] = useState(false)

  // Pagamento
  const [formaPagamento, setFormaPagamento] = useState<'cartao' | 'pix' | 'boleto'>('cartao')
  const [numeroCartao, setNumeroCartao] = useState('')
  const [nomeCartao, setNomeCartao] = useState('')
  const [validadeCartao, setValidadeCartao] = useState('')
  const [cvv, setCvv] = useState('')
  const [parcelas, setParcelas] = useState(1)

  const [pedidoConfirmado, setPedidoConfirmado] = useState<Pedido | null>(null)

  useEffect(() => {
    const usuarioLogado = getUsuarioLogado()
    setUsuario(usuarioLogado)
    if (usuarioLogado) {
      const salvos = getEnderecos(usuarioLogado.email)
      setEnderecosSalvos(salvos)
      const padrao = salvos.find(e => e.padrao)
      setEnderecoSelecionadoId(padrao ? padrao.id : salvos.length === 0 ? 'novo' : null)
    }
    const carrinho = getCarrinho()
    setItens(carrinho)
    if (carrinho.length === 0) {
      setProdutos({})
      return
    }
    buscarProdutos(carrinho.map(i => i.produtoId)).then(setProdutos)
  }, [])

  function recarregarCarrinho() {
    setItens(getCarrinho())
  }

  function mudarQuantidade(produtoId: string, delta: number) {
    const item = itens.find(i => i.produtoId === produtoId)
    const produto = produtos?.[produtoId]
    if (!item || !produto) return
    const nova = Math.min(item.quantidade + delta, produto.estoque)
    atualizarQuantidade(produtoId, Math.max(0, nova))
    recarregarCarrinho()
  }

  function remover(produtoId: string) {
    const item = itens.find(i => i.produtoId === produtoId)
    removerDoCarrinho(produtoId)
    recarregarCarrinho()
    if (item) {
      showToast('Produto removido do carrinho', () => {
        adicionarAoCarrinho(produtoId, item.quantidade)
        recarregarCarrinho()
      })
    }
  }

  async function handleCepChange(valor: string) {
    const formatado = formatarCep(valor)
    setEnderecoForm(f => ({ ...f, cep: formatado }))
    if (formatado.replace(/\D/g, '').length === 8) {
      setBuscandoCep(true)
      const resultado = await buscarCep(formatado)
      setBuscandoCep(false)
      if (resultado) {
        setEnderecoForm(f => ({ ...f, rua: resultado.logradouro, bairro: resultado.bairro, cidade: resultado.localidade, uf: resultado.uf }))
      }
    }
  }

  const itensResolvidos = produtos
    ? itens
        .map(item => ({ item, produto: produtos[item.produtoId] }))
        .filter((x): x is { item: CartItem; produto: ProdutoResolvido } => x.produto !== undefined)
    : []

  const total = itensResolvidos.reduce((soma, { item, produto }) => soma + (produto.preco ?? 0) * item.quantidade, 0)

  const resultadosMapa = itensResolvidos.map(({ produto }) => ({ produto, score: 1 }))
  const rotaCalculada = calcularRota(itensResolvidos.map(({ produto }) => produto.corredor_normalizado))

  const parcelamentoStr = formatarParcelamento(total)
  const opcoesParcelamento = getOpcoesParcelamento(total)

  const enderecoSelecionado = enderecosSalvos.find(e => e.id === enderecoSelecionadoId) ?? null

  const enderecoValido = enderecoSelecionado
    ? true
    : Boolean(enderecoForm.rua.trim() && enderecoForm.numero.trim() && enderecoForm.cidade.trim())

  const pagamentoValido =
    formaPagamento !== 'cartao' || cartaoValido(numeroCartao, validadeCartao, cvv, nomeCartao)

  const podeConfirmar =
    (metodo === 'retirada' || enderecoValido) && pagamentoValido

  function confirmarPedido() {
    if (!usuario || !podeConfirmar) return

    let enderecoStr: string | undefined
    if (metodo === 'entrega') {
      if (enderecoSelecionado) {
        enderecoStr = formatarEndereco(enderecoSelecionado)
      } else {
        enderecoStr = formatarEndereco(enderecoForm)
        if (salvarNovoEndereco) {
          salvarEndereco(usuario.email, enderecoForm)
        }
      }
    }

    const pagamento: PagamentoInfo =
      formaPagamento === 'cartao'
        ? {
            metodo: 'cartao',
            parcelas,
            ultimosDigitos: numeroCartao.replace(/\D/g, '').slice(-4),
            bandeira: detectarBandeira(numeroCartao),
          }
        : { metodo: formaPagamento }

    const itensPedido: ItemPedido[] = itensResolvidos.map(({ item, produto }) => ({
      produtoId: produto.id,
      nome: produto.produto,
      preco: produto.preco,
      quantidade: item.quantidade,
    }))

    const pedido: Pedido = {
      numero: gerarNumeroPedido(),
      data: new Date().toISOString(),
      itens: itensPedido,
      metodo,
      loja: metodo === 'retirada' ? loja : undefined,
      endereco: enderecoStr,
      pagamento,
      total,
    }

    salvarPedido(usuario.email, pedido)
    try {
      adicionarNotificacao(usuario.email, {
        tipo: 'pedido',
        titulo: 'Pedido confirmado',
        mensagem: `Pedido #${pedido.numero} confirmado com sucesso.`,
        href: '/conta',
      })
    } catch {}
    limparCarrinho()
    clearProductHistory()
    setPedidoConfirmado(pedido)
  }

  if (pedidoConfirmado) {
    const pag = pedidoConfirmado.pagamento
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-xl mx-auto px-4 py-10">
          <Card className="text-center">
            <CheckCircle2 size={40} className="text-lm-green mx-auto mb-3" />
            <h1 className="text-xl font-bold text-gray-900 mb-1">Pedido confirmado!</h1>
            <p className="text-sm text-gray-500 mb-4">Número do pedido: <span className="font-mono font-semibold text-gray-700">{pedidoConfirmado.numero}</span></p>

            <div className="text-left bg-gray-50 rounded-xl p-4 mb-4 space-y-1.5">
              {pedidoConfirmado.itens.map(i => (
                <div key={i.produtoId} className="flex justify-between text-sm">
                  <span className="text-gray-600">{i.quantidade}× {i.nome}</span>
                  <span className="font-medium text-gray-900">
                    {(i.preco * i.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-sm">
                <span>Total</span>
                <span>{pedidoConfirmado.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            </div>

            <div className="text-left space-y-1 mb-6">
              <p className="text-xs text-gray-500">
                {pedidoConfirmado.metodo === 'retirada'
                  ? `Retirada em: ${pedidoConfirmado.loja}`
                  : `Entrega em: ${pedidoConfirmado.endereco}`}
              </p>
              {pag && (
                <p className="text-xs text-gray-500">
                  Pagamento:{' '}
                  {pag.metodo === 'cartao'
                    ? `${pag.bandeira} final ${pag.ultimosDigitos}${pag.parcelas && pag.parcelas > 1 ? ` · ${pag.parcelas}x` : ''}`
                    : pag.metodo === 'pix'
                    ? 'Pix'
                    : 'Boleto bancário'}
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-center">
              <Link href="/conta"><Button variant="secondary">Ver meus pedidos</Button></Link>
              <Link href="/"><Button variant="primary">Continuar comprando</Button></Link>
            </div>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <PageHeader title="Carrinho" description={itens.length > 0 ? `${itens.length} ${itens.length === 1 ? 'item' : 'itens'}` : undefined} />

        {produtos === null && (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <CartItemSkeleton key={i} />)}
          </div>
        )}

        {produtos !== null && itensResolvidos.length === 0 && (
          <Card className="text-center py-10">
            <ShoppingCart size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">Seu carrinho está vazio.</p>
            <Link href="/"><Button variant="primary">Ver produtos</Button></Link>
          </Card>
        )}

        {itensResolvidos.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setVerRota(v => !v)}
              className="w-full flex items-center justify-center gap-2 mb-4 h-10 rounded-xl border border-lm-green/30 text-lm-green text-sm font-semibold bg-lm-green/5 hover:bg-lm-green/10 transition-colors"
            >
              <MapIcon size={15} /> {verRota ? 'Esconder rota no mapa' : 'Ver rota no mapa'}
            </button>

            {verRota && (
              <Card className="mb-6">
                <StoreMap resultados={resultadosMapa} loja={loja} totalEstimado={total} rota={rotaCalculada} />
              </Card>
            )}

            <div className="space-y-3 mb-6">
              {itensResolvidos.map(({ item, produto }) => (
                <Card key={produto.id} padding="sm" className="flex items-center gap-3">
                  <img
                    src={getImagemCategoria(produto.categoria, produto.id)}
                    alt={produto.categoria}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{produto.produto}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-lm-green font-bold">
                        <MapPin size={10} /> {produto.corredor}
                      </span>
                      <span className="text-xs text-gray-400">{produto.estoque} disp.</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => mudarQuantidade(produto.id, -1)}
                      className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                      aria-label="Diminuir quantidade"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-medium w-5 text-center">{item.quantidade}</span>
                    <button
                      onClick={() => mudarQuantidade(produto.id, 1)}
                      disabled={item.quantidade >= produto.estoque}
                      className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <span className="text-sm font-bold text-gray-900 w-20 text-right flex-shrink-0">
                    {(produto.preco * item.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>

                  <button
                    onClick={() => remover(produto.id)}
                    className="text-gray-300 hover:text-red-500 flex-shrink-0"
                    aria-label="Remover do carrinho"
                  >
                    <Trash2 size={16} />
                  </button>
                </Card>
              ))}
            </div>

            <Card className="mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <div className="text-right">
                  <span className="text-xl font-black text-lm-green block">
                    {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  {parcelamentoStr && (
                    <span className="text-xs text-gray-400">{parcelamentoStr}</span>
                  )}
                </div>
              </div>
            </Card>

            {!usuario && (
              <Card className="text-center">
                <p className="text-sm text-gray-600 mb-3">Faça login para finalizar o pedido.</p>
                <Link href="/funcionario/login"><Button variant="primary">Fazer login</Button></Link>
              </Card>
            )}

            {usuario && (
              <div className="space-y-4">
                {/* 1. Entrega */}
                <Card>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">1. Entrega</h3>

                  <div className="flex rounded-xl bg-gray-100 p-1 mb-4">
                    <button
                      type="button"
                      onClick={() => setMetodo('retirada')}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        metodo === 'retirada' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Retirar na loja
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodo('entrega')}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        metodo === 'entrega' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Entrega em casa
                    </button>
                  </div>

                  {metodo === 'retirada' ? (
                    <select
                      value={loja}
                      onChange={e => setLoja(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lm-green/30 bg-white"
                    >
                      {LOJAS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  ) : (
                    <>
                      {enderecosSalvos.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {enderecosSalvos.map(end => (
                            <button
                              key={end.id}
                              type="button"
                              onClick={() => setEnderecoSelecionadoId(end.id)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                                enderecoSelecionadoId === end.id
                                  ? 'bg-lm-green text-white border-lm-green'
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-lm-green/40'
                              }`}
                            >
                              {end.rotulo}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setEnderecoSelecionadoId('novo')}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                              enderecoSelecionadoId === 'novo'
                                ? 'bg-lm-green text-white border-lm-green'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-lm-green/40'
                            }`}
                          >
                            + Novo endereço
                          </button>
                        </div>
                      )}

                      {enderecoSelecionado ? (
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
                          {formatarEndereco(enderecoSelecionado)}
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          <div className="relative w-32">
                            <input
                              type="text"
                              value={enderecoForm.cep}
                              onChange={e => handleCepChange(e.target.value)}
                              placeholder="CEP"
                              inputMode="numeric"
                              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
                            />
                            {buscandoCep && <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={enderecoForm.rua}
                              onChange={e => setEnderecoForm(f => ({ ...f, rua: e.target.value }))}
                              placeholder="Rua"
                              className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
                            />
                            <input
                              type="text"
                              value={enderecoForm.numero}
                              onChange={e => setEnderecoForm(f => ({ ...f, numero: e.target.value }))}
                              placeholder="Número"
                              className="w-24 h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
                            />
                          </div>
                          <input
                            type="text"
                            value={enderecoForm.complemento}
                            onChange={e => setEnderecoForm(f => ({ ...f, complemento: e.target.value }))}
                            placeholder="Complemento (opcional)"
                            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={enderecoForm.bairro}
                              onChange={e => setEnderecoForm(f => ({ ...f, bairro: e.target.value }))}
                              placeholder="Bairro"
                              className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
                            />
                            <input
                              type="text"
                              value={enderecoForm.cidade}
                              onChange={e => setEnderecoForm(f => ({ ...f, cidade: e.target.value }))}
                              placeholder="Cidade"
                              className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
                            />
                            <input
                              type="text"
                              value={enderecoForm.uf}
                              onChange={e => setEnderecoForm(f => ({ ...f, uf: e.target.value.toUpperCase().slice(0, 2) }))}
                              placeholder="UF"
                              className="w-14 h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
                            />
                          </div>
                          <label className="flex items-center gap-2 text-xs text-gray-500 pt-1">
                            <input
                              type="checkbox"
                              checked={salvarNovoEndereco}
                              onChange={e => setSalvarNovoEndereco(e.target.checked)}
                              className="rounded border-gray-300 text-lm-green focus:ring-lm-green/30"
                            />
                            Salvar este endereço pra próxima compra
                          </label>
                        </div>
                      )}
                    </>
                  )}
                </Card>

                {/* 2. Pagamento */}
                <Card>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">2. Pagamento</h3>

                  <div className="flex rounded-xl bg-gray-100 p-1 mb-4">
                    <button
                      type="button"
                      onClick={() => setFormaPagamento('cartao')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        formaPagamento === 'cartao' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <CreditCard size={13} /> Cartão
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormaPagamento('pix')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        formaPagamento === 'pix' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <QrCode size={13} /> Pix
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormaPagamento('boleto')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        formaPagamento === 'boleto' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Barcode size={13} /> Boleto
                    </button>
                  </div>

                  {formaPagamento === 'cartao' && (
                    <div className="space-y-2.5">
                      <input
                        type="text"
                        value={numeroCartao}
                        onChange={e => setNumeroCartao(formatarNumeroCartao(e.target.value))}
                        placeholder="Número do cartão"
                        inputMode="numeric"
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
                      />
                      <input
                        type="text"
                        value={nomeCartao}
                        onChange={e => setNomeCartao(e.target.value)}
                        placeholder="Nome impresso no cartão"
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={validadeCartao}
                          onChange={e => setValidadeCartao(formatarValidade(e.target.value))}
                          placeholder="MM/AA"
                          inputMode="numeric"
                          className="w-24 h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
                        />
                        <input
                          type="text"
                          value={cvv}
                          onChange={e => setCvv(formatarCvv(e.target.value))}
                          placeholder="CVV"
                          inputMode="numeric"
                          className="w-20 h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
                        />
                        <select
                          value={parcelas}
                          onChange={e => setParcelas(Number(e.target.value))}
                          className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
                        >
                          {opcoesParcelamento.map(op => (
                            <option key={op.parcelas} value={op.parcelas}>
                              {op.parcelas}x de {op.valorParcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              {op.parcelas === 1 ? ' à vista' : ' sem juros'}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Cartão fictício — nenhum pagamento real é processado neste projeto.
                      </p>
                    </div>
                  )}

                  {formaPagamento === 'pix' && (
                    <div className="text-center bg-gray-50 rounded-xl p-5">
                      <div className="w-28 h-28 mx-auto mb-3 rounded-lg bg-white border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <QrCode size={48} className="text-gray-300" />
                      </div>
                      <p className="text-xs text-gray-500">
                        QR Code Pix simulado — gerado após confirmar o pedido, pagamento em até 30 minutos.
                      </p>
                    </div>
                  )}

                  {formaPagamento === 'boleto' && (
                    <div className="text-center bg-gray-50 rounded-xl p-5">
                      <Barcode size={40} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-xs text-gray-500">
                        Boleto simulado — gerado após confirmar o pedido, vencimento em 3 dias úteis.
                      </p>
                    </div>
                  )}
                </Card>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={confirmarPedido}
                  disabled={!podeConfirmar}
                >
                  <Check size={16} /> Confirmar pedido
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
