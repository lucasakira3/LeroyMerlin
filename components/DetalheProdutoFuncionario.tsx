'use client'

import { useMemo, useState } from 'react'
import { MapPin, Copy, Check, Tag, Lightbulb, Repeat, Map as MapaIcone, Zap, Leaf, History } from 'lucide-react'
import { aplicarAjustes, getAjuste } from '@/lib/ajustesFuncionario'
import { getInfoOferta } from '@/lib/ofertas'
import { getImagemProduto, ajusteFoto, fundoFoto } from '@/lib/categoriaImagens'
import { getIconeEspecificacao, parseEspecificacoes } from '@/lib/especificacaoIcones'
import { normalizar } from '@/lib/texto'
import type { SearchResult } from '@/types/produto'

type ProdutoCatalogo = SearchResult['produto']

interface Props {
  produto: ProdutoCatalogo
  // Catálogo inteiro, pra sugerir alternativas em estoque da mesma categoria.
  catalogo: ProdutoCatalogo[]
  // Clique numa alternativa — quem usa decide o que é "abrir" (trocar o produto mostrado).
  onSelecionar: (id: string) => void
  // Só a Consulta rápida tem o mapa na mesma tela; sem `onAlternarMapa` o botão não aparece.
  noMapa?: boolean
  onAlternarMapa?: () => void
}

// O catálogo guarda "DIY"/"Profissional"/"Especialista"; na ficha vai em português claro.
const QUEM_INSTALA: Record<string, string> = {
  DIY: 'o próprio cliente instala',
  Profissional: 'pede um profissional',
  Especialista: 'pede um especialista',
}

function formatarBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Ficha do produto do lado do funcionário: foto, preço/estoque/corredor atuais, especificações,
// resposta pronta pro cliente e alternativas. Um componente só pra Consulta rápida (cartão ao
// lado da busca) e pra Estoque / Produtos (popup ao clicar no produto). Não é o popup do
// cliente (ProdutoDrawer) de propósito: aquele tem carrinho, favoritos, histórico de visita e
// chat com IA, que não fazem sentido pro funcionário e gravariam dados como se fosse um cliente.
export default function DetalheProdutoFuncionario({ produto, catalogo, onSelecionar, noMapa = false, onAlternarMapa }: Props) {
  const [copiado, setCopiado] = useState(false)

  const { atual, ajuste, oferta, alternativas } = useMemo(() => {
    const atual = aplicarAjustes(produto)
    const oferta = getInfoOferta(produto.id, atual.preco)

    // Alternativas: mesma categoria, em estoque, ranqueadas por tags em comum e depois pela
    // proximidade de preço — o que o vendedor oferece quando o item pedido acabou ou está caro.
    const tagsSel = new Set(produto.tags)
    // Mesmo "tipo" (1ª palavra do nome: Furadeira, Rejunte, Lâmpada...) vem antes de tudo,
    // senão uma furadeira sugeriria um conjunto de brocas só porque partilham tags.
    const tipo = normalizar(produto.produto.split(' ')[0])
    const candidatas = catalogo
      .filter(p => p.id !== produto.id && p.categoria === produto.categoria)
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

    return { atual, ajuste: getAjuste(produto.id), oferta, alternativas }
  }, [produto, catalogo])

  const especificacoes = produto.especificacoes ? parseEspecificacoes(produto.especificacoes) : []
  // Só o que o funcionário mudou neste painel (lib/ajustesFuncionario.ts) — é o único
  // histórico que existe: o catálogo em si não guarda alterações.
  const precoAjustado = ajuste.precoOverride !== undefined && ajuste.precoOverride !== produto.preco
  const estoqueAjustado = atual.estoque !== produto.estoque

  async function copiarResposta() {
    try {
      await navigator.clipboard.writeText(produto.resposta_ia)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Sem permissão de clipboard: o botão só não confirma.
    }
  }

  return (
    <div>
      <div className={fundoFoto(produto)}>
        <img
          src={getImagemProduto(produto)}
          alt={produto.produto}
          className={`w-full h-48 ${ajusteFoto(produto, 'p-3')}`}
        />
      </div>
      <div className="p-4 space-y-4">
        <div>
          <p className="text-sm text-gray-700">{produto.id} · {produto.categoria}</p>
          <h2 className="text-lg font-bold text-gray-900">{produto.produto}</h2>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {/* Com borda: no modo escuro o bg-gray-100 fica da cor do cartão e a etiqueta sumia. */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 dark:border-gray-500">
              <Zap size={12} /> Instalação: {QUEM_INSTALA[produto.complexidade] ?? produto.complexidade}
            </span>
            {produto.sustentabilidade !== 'N/A' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                <Leaf size={12} /> Sustentabilidade: {produto.sustentabilidade}
              </span>
            )}
          </div>
        </div>

        {/* Em tela estreita o preço ocupa a linha inteira: "R$ 2.499,90" não cabe em 1/3. */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="col-span-2 sm:col-span-1 rounded-xl bg-gray-50 border border-gray-200 dark:border-gray-500 p-3">
            <p className="text-xs text-gray-700">Preço</p>
            {oferta.emOferta ? (
              <>
                <p className="text-lg font-black text-lm-green">{formatarBRL(oferta.precoComDesconto)}</p>
                <p className="text-xs text-gray-600 line-through">{formatarBRL(atual.preco)}</p>
              </>
            ) : (
              <p className="text-lg font-black text-gray-900">{formatarBRL(atual.preco)}</p>
            )}
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-200 dark:border-gray-500 p-3">
            <p className="text-xs text-gray-700">Estoque</p>
            <p className={`text-lg font-black ${atual.estoque === 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {atual.estoque === 0 ? 'Zerado' : `${atual.estoque} un.`}
            </p>
          </div>
          <div className="rounded-xl bg-lm-green/10 border border-lm-green/30 p-3">
            <p className="text-xs text-gray-700">Onde fica</p>
            <p className="text-lg font-black text-lm-green inline-flex items-center gap-1">
              <MapPin size={16} /> {produto.corredor.replace('Corredor ', '')}
            </p>
          </div>
        </div>

        {(precoAjustado || estoqueAjustado) && (
          <p className="text-sm text-gray-700 flex items-start gap-1.5">
            <History size={14} className="mt-0.5 flex-shrink-0 text-gray-600" />
            <span>
              Alterado neste painel. No catálogo original:
              {precoAjustado && ` preço ${formatarBRL(produto.preco)}`}
              {precoAjustado && estoqueAjustado && ' ·'}
              {estoqueAjustado && ` estoque ${produto.estoque} un.`}
            </span>
          </p>
        )}

        {onAlternarMapa && (
          <button
            type="button"
            onClick={onAlternarMapa}
            aria-pressed={noMapa}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              noMapa
                ? 'bg-lm-green/10 text-lm-green border border-lm-green/40'
                : 'bg-lm-green text-white hover:bg-green-700'
            }`}
          >
            <MapaIcone size={16} />
            {noMapa ? 'No mapa — clique para tirar' : 'Mostrar no mapa da loja'}
          </button>
        )}

        {oferta.emOferta && (
          <p className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-full px-3 py-1">
            <Tag size={13} /> Em oferta: -{oferta.percentualDesconto}% para o cliente
          </p>
        )}

        {especificacoes.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Especificações</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {especificacoes.map((item, i) => {
                const Icone = getIconeEspecificacao(item.rotulo)
                return (
                  <div key={i} className="flex items-center gap-2.5 rounded-xl bg-gray-50 border border-gray-200 dark:border-gray-500 px-3 py-2">
                    <span className="w-8 h-8 rounded-lg bg-lm-green/10 text-lm-green flex items-center justify-center flex-shrink-0">
                      <Icone size={15} />
                    </span>
                    <span className="min-w-0">
                      {item.rotulo && <span className="block text-xs text-gray-700">{item.rotulo}</span>}
                      <span className="block text-sm font-semibold text-gray-900">{item.valor}</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-lm-green/30 bg-lm-green/5 p-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-semibold text-lm-green uppercase tracking-wider inline-flex items-center gap-1.5">
              <Lightbulb size={13} /> Resposta pronta para o cliente
            </p>
            <button
              type="button"
              onClick={copiarResposta}
              className="text-xs font-semibold text-lm-green hover:underline inline-flex items-center gap-1"
            >
              {copiado ? <Check size={13} /> : <Copy size={13} />} {copiado ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          {produto.pergunta && <p className="text-sm text-gray-700 mb-1">Pergunta comum: “{produto.pergunta}”</p>}
          <p className="text-sm text-gray-800">{produto.resposta_ia}</p>
        </div>

        {alternativas.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2 inline-flex items-center gap-1.5">
              <Repeat size={13} /> Alternativas em estoque
            </p>
            <ul className="space-y-1.5">
              {alternativas.map(({ p, atual: alt }) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onSelecionar(p.id)}
                    className="w-full flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-500 p-2.5 text-left hover:border-lm-green/50 transition-colors"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-gray-900 truncate">{p.produto}</span>
                      <span className="block text-sm text-gray-700">{p.corredor} · {alt.estoque} un.</span>
                    </span>
                    <span className="text-sm font-bold text-gray-900">{formatarBRL(alt.preco)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
