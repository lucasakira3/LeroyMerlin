'use client'

import { useEffect, useState } from 'react'
import { PaintBucket, Layers, Boxes, Ruler, ShoppingCart, Check, Loader2, Calculator } from 'lucide-react'
import {
  calcularTinta, calcularPiso, calcularCimento, calcularPapelParede,
  type TipoCalculo, type ResultadoCalculo,
} from '@/lib/calculadoraMateriais'
import { buscarProdutos } from '@/lib/buscarProdutos'
import { getImagemProduto } from '@/lib/categoriaImagens'
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'
import type { ProdutoResolvido } from '@/lib/produtosCliente'

const TIPOS: { valor: TipoCalculo; label: string; icone: typeof PaintBucket }[] = [
  { valor: 'tinta', label: 'Tinta', icone: PaintBucket },
  { valor: 'piso', label: 'Piso', icone: Layers },
  { valor: 'cimento', label: 'Cimento', icone: Boxes },
  { valor: 'papel_parede', label: 'Papel de parede', icone: Ruler },
]

// Popup da "bancada de ferramentas" do Projeto Guiado — cálculo de quanto material comprar
// (tinta, piso, cimento, papel de parede). A conta em si é sempre determinística
// (lib/calculadoraMateriais.ts), nunca pedida à IA — só a sugestão de produtos reais que
// combinam com o resultado usa busca semântica (mesma infra do comparador/busca da loja).
export default function CalculadoraMateriais() {
  const [tipo, setTipo] = useState<TipoCalculo>('tinta')

  // Campos — um estado por tipo, todos com valor inicial plausível pra já mostrar um
  // resultado de exemplo sem o cliente precisar preencher nada primeiro.
  const [areaTinta, setAreaTinta] = useState('20')
  const [demaos, setDemaos] = useState('2')

  const [areaPiso, setAreaPiso] = useState('15')
  const [perdaPiso, setPerdaPiso] = useState('10')

  const [areaCimento, setAreaCimento] = useState('12')
  const [comReboco, setComReboco] = useState(true)

  const [larguraPapel, setLarguraPapel] = useState('4')
  const [alturaPapel, setAlturaPapel] = useState('2.7')

  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null)
  const [produtos, setProdutos] = useState<ProdutoResolvido[] | null>(null)
  const [buscandoProdutos, setBuscandoProdutos] = useState(false)
  const [adicionadoId, setAdicionadoId] = useState<string | null>(null)

  function calcular() {
    let novoResultado: ResultadoCalculo
    if (tipo === 'tinta') {
      novoResultado = calcularTinta(Number(areaTinta) || 0, Number(demaos) || 1)
    } else if (tipo === 'piso') {
      novoResultado = calcularPiso(Number(areaPiso) || 0, Number(perdaPiso) || 0)
    } else if (tipo === 'cimento') {
      novoResultado = calcularCimento(Number(areaCimento) || 0, comReboco)
    } else {
      novoResultado = calcularPapelParede(Number(larguraPapel) || 0, Number(alturaPapel) || 1)
    }
    setResultado(novoResultado)
  }

  // Recalcula automaticamente ao trocar de material ou editar um campo — sem precisar
  // clicar em "Calcular" toda vez, já que os campos vêm pré-preenchidos com um exemplo.
  useEffect(() => {
    calcular()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, areaTinta, demaos, areaPiso, perdaPiso, areaCimento, comReboco, larguraPapel, alturaPapel])

  useEffect(() => {
    if (!resultado) return
    let cancelado = false
    setBuscandoProdutos(true)
    buscarProdutos(resultado.buscaSugerida, 4).then(({ resultados }) => {
      if (cancelado) return
      // Catálogo nem sempre tem o material exato (ex.: não existe "papel de parede" nos
      // dados) — a busca semântica então devolve o mais parecido que encontrar, mesmo que
      // seja um score baixo (~0.6) claramente não relacionado (ex.: quadro decorativo pra
      // "papel de parede"). Corta abaixo de 0.68 — calibrado comparando um match bom real
      // (tinta → tinta, ~0.73-0.76) com esse caso de fallback ruim (~0.60-0.61) — pra não
      // sugerir produto errado só porque não achou nada melhor.
      setProdutos(resultados.filter(r => r.score >= 0.68).map(r => r.produto))
      setBuscandoProdutos(false)
    })
    return () => { cancelado = true }
  }, [resultado?.buscaSugerida])

  function handleAdicionar(produtoId: string, estoque: number) {
    if (estoque === 0) return
    adicionarAoCarrinho(produtoId)
    setAdicionadoId(produtoId)
    setTimeout(() => setAdicionadoId(prev => prev === produtoId ? null : prev), 1500)
  }

  return (
    <div className="flex flex-col md:flex-row h-full min-h-0">
      {/* Formulário */}
      <div className="md:w-72 flex-shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-gray-400 dark:border-zinc-800 p-4 gap-3">
        <div className="grid grid-cols-2 gap-1 bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
          {TIPOS.map(({ valor, label, icone: Icone }) => (
            <button
              key={valor}
              onClick={() => setTipo(valor)}
              className={`flex items-center justify-center gap-1 text-[11px] font-semibold px-1.5 py-1.5 rounded-md transition-colors ${
                tipo === valor
                  ? 'bg-white dark:bg-zinc-700 text-lm-green shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-lm-green'
              }`}
            >
              <Icone size={12} className="flex-shrink-0" /> {label}
            </button>
          ))}
        </div>

        {tipo === 'tinta' && (
          <>
            <Campo label="Área a pintar (m²)" value={areaTinta} onChange={setAreaTinta} />
            <Campo label="Número de demãos" value={demaos} onChange={setDemaos} step="1" />
          </>
        )}

        {tipo === 'piso' && (
          <>
            <Campo label="Área do ambiente (m²)" value={areaPiso} onChange={setAreaPiso} />
            <Campo label="Margem de perda (%)" value={perdaPiso} onChange={setPerdaPiso} step="1" />
          </>
        )}

        {tipo === 'cimento' && (
          <>
            <Campo label="Área de parede (m²)" value={areaCimento} onChange={setAreaCimento} />
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-300 mt-1">
              <input
                type="checkbox"
                checked={comReboco}
                onChange={e => setComReboco(e.target.checked)}
                className="rounded border-gray-300 text-lm-green focus:ring-lm-green/30"
              />
              Incluir reboco (2 lados)
            </label>
          </>
        )}

        {tipo === 'papel_parede' && (
          <>
            <Campo label="Largura da parede (m)" value={larguraPapel} onChange={setLarguraPapel} />
            <Campo label="Altura da parede (m)" value={alturaPapel} onChange={setAlturaPapel} />
          </>
        )}

        <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-auto pt-2 leading-relaxed">
          Estimativa aproximada — para obras estruturais ou grandes áreas, confirme com um especialista antes de comprar.
        </p>
      </div>

      {/* Resultado */}
      <div className="flex-1 p-4 overflow-y-auto">
        {resultado && (
          <>
            <div className="flex items-center gap-3 bg-lm-green/10 border border-lm-green/20 rounded-xl p-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-lm-green text-white flex items-center justify-center flex-shrink-0">
                <Calculator size={18} />
              </div>
              <div>
                <p className="text-2xl font-black text-lm-dark dark:text-zinc-50">
                  {resultado.quantidade} <span className="text-sm font-semibold text-gray-500 dark:text-zinc-400">{resultado.unidade}</span>
                </p>
              </div>
            </div>

            <div className="space-y-1.5 mb-5">
              {resultado.linhas.map(linha => (
                <div key={linha.label} className="flex items-center justify-between text-xs px-1">
                  <span className="text-gray-500 dark:text-zinc-400">{linha.label}</span>
                  <span className="font-semibold text-gray-800 dark:text-zinc-200">{linha.valor}</span>
                </div>
              ))}
            </div>

            <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-2">Produtos que combinam</p>

            {buscandoProdutos && (
              <div className="flex justify-center py-6">
                <Loader2 size={18} className="animate-spin text-gray-300" />
              </div>
            )}

            {!buscandoProdutos && produtos?.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-zinc-500 py-2">
                Não achamos esse material no catálogo — tente buscar manualmente na aba Buscar.
              </p>
            )}

            {!buscandoProdutos && (
              <div className="space-y-1.5">
                {produtos?.map(produto => (
                  <div
                    key={produto.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-400 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                  >
                    <img
                      src={getImagemProduto(produto)}
                      alt={produto.categoria}
                      className="w-9 h-9 rounded-md object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 dark:text-zinc-100 truncate">{produto.produto}</p>
                      <p className="text-gray-500 dark:text-zinc-400">
                        {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAdicionar(produto.id, produto.estoque)}
                      disabled={produto.estoque === 0}
                      aria-label="Adicionar ao carrinho"
                      className="w-7 h-7 rounded-lg bg-lm-green text-white flex items-center justify-center flex-shrink-0 hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {adicionadoId === produto.id ? <Check size={13} /> : <ShoppingCart size={13} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Campo({ label, value, onChange, step = '0.1' }: { label: string; value: string; onChange: (v: string) => void; step?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600 dark:text-zinc-300">{label}</span>
      <input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-9 mt-1 px-3 rounded-lg border border-gray-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-lm-green/30"
      />
    </label>
  )
}
