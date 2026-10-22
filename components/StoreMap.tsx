'use client'

import { useEffect, useRef, useState } from 'react'
export { getCorredorRowIndex } from '@/lib/corredores'
import Link from 'next/link'
import { ShoppingCart, Check, ZoomIn, ZoomOut, Maximize2, QrCode, Navigation } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'
import type { SearchResult } from '@/types/produto'
import { trackProductView } from '@/lib/hooks/useProductTracker'
import { getImagemProduto, ajusteFoto } from '@/lib/categoriaImagens'
import type { ParadaRota } from '@/lib/rotaLoja'
import Pagination from '@/components/ui/Pagination'
import { VW, VH, DesenhoPlantaLoja, CORES_DOS_PINS as PIN_COLORS, posicaoDoCorredor as getPos } from './PlantaLoja'

// Celular: abaixo desta largura a planta inteira não dá pra ler, e ela passa a abrir "de
// perto" com esta altura fixa (ver `dePerto` no componente).
const LARGURA_ESTREITA = 560
const ALTURA_DE_PERTO = 420

// Quantos produtos a lista embaixo do mapa mostra de cada vez (ver `pinsDaPagina`).
const PRODUTOS_POR_PAGINA = 10


interface Props {
  resultados: SearchResult[]
  loja: string
  totalEstimado?: number
  onSelect?: (produto: SearchResult['produto']) => void
  rota?: ParadaRota[]
  /** Esconde o botão de carrinho (uso do funcionário, que não compra pelo mapa). */
  semCarrinho?: boolean
  /** Mostra o botão "Navegar no celular" (QR code que abre /navegar com os produtos da página). */
  navegacaoNoCelular?: boolean
}

// Endereço que o QR code abre. Rodando no computador de quem desenvolve (localhost), o celular
// não alcançaria esse endereço — então aponta pro site publicado.
function enderecoDoSite(): string {
  if (typeof window === 'undefined') return ''
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)
  return local ? 'https://leroy-merlin.vercel.app' : window.location.origin
}

export default function StoreMap({ resultados, loja, totalEstimado, onSelect, rota, semCarrinho, navegacaoNoCelular }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [adicionadoId, setAdicionadoId] = useState<string | null>(null)

  // A lista embaixo do mapa (e os pins) vai em páginas de 10: numa busca ampla ou num projeto
  // grande eram 20, 30 cartões numa tela só. Volta pra página 1 sempre que os produtos mudam
  // (busca nova, filtro, item marcado ou trocado no Projeto Guiado).
  const [pagina, setPagina] = useState(1)
  const raiz = useRef<HTMLDivElement>(null)
  const [qr, setQr] = useState<{ imagem: string; endereco: string } | null>(null)
  const chaveDosResultados = resultados.map(r => r.produto.id).join('|')
  useEffect(() => { setPagina(1) }, [chaveDosResultados])

  // Zoom/pan do mapa — permite aproximar de um corredor específico e arrastar pra
  // navegar, útil quando o carrinho tem muitos itens espalhados pela loja inteira.
  const ZOOM_MIN = 1
  const ZOOM_MAX = 5
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [arrastando, setArrastando] = useState(false)
  const arrastoRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)

  function clampZoom(valor: number) {
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, valor))
  }

  function aplicarZoom(delta: number) {
    setZoom(z => {
      const novo = clampZoom(z + delta)
      if (novo === 1) setPan({ x: 0, y: 0 })
      return novo
    })
  }

  function resetZoom() {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Zoom via scroll da roda do mouse atrapalhava a rolagem normal da página (o usuário
  // só queria rolar a tela e o mapa dava zoom sem querer). Trocado por duplo clique:
  // aproxima num nível fixo e confortável, duplo clique de novo volta ao normal.
  const ZOOM_DUPLO_CLIQUE = 2.5

  function handleDoubleClick() {
    if (zoom > 1) {
      resetZoom()
    } else {
      setZoom(ZOOM_DUPLO_CLIQUE)
    }
  }

  // ── Celular ──
  // Numa tela estreita a planta inteira fica com ~150px de altura e os números dos
  // corredores somem. Então no celular ela abre "de perto": altura fixa, mais larga que a
  // tela, e o cliente desliza de lado com o dedo (rolagem normal do navegador, então a página
  // continua rolando pra cima e pra baixo). O botão do canto alterna pra "loja inteira".
  // O zoom com arraste, abaixo, fica só pras telas largas.
  const moldura = useRef<HTMLDivElement>(null)
  const [estreito, setEstreito] = useState(false)
  const [lojaInteira, setLojaInteira] = useState(false)
  const dePerto = estreito && !lojaInteira

  useEffect(() => {
    const el = moldura.current
    if (!el) return
    const medir = () => setEstreito(el.clientWidth < LARGURA_ESTREITA)
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (estreito || zoom <= 1) return
    setArrastando(true)
    arrastoRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!arrastoRef.current) return
    const { x, y, panX, panY } = arrastoRef.current
    setPan({ x: panX + (e.clientX - x), y: panY + (e.clientY - y) })
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    setArrastando(false)
    arrastoRef.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  function handleAdicionar(produtoId: string, estoque: number, e?: React.MouseEvent) {
    e?.stopPropagation()
    if (estoque === 0) return
    adicionarAoCarrinho(produtoId)
    setAdicionadoId(produtoId)
    setTimeout(() => setAdicionadoId(prev => prev === produtoId ? null : prev), 1500)
  }

  // QR code da navegação guiada: leva a loja e os produtos da página que está na tela, cada um
  // com o número do pin, pra a tela do celular (components/NavegacaoLoja.tsx) mostrar os mesmos.
  async function abrirQrDaNavegacao() {
    const produtos = pinsDaPagina.map(p => `${p.produto.id}:${p.idx}`).join(',')
    const caminho = `/navegar?loja=${encodeURIComponent(loja)}&p=${encodeURIComponent(produtos)}`
    const endereco = enderecoDoSite() + caminho
    const QRCode = (await import('qrcode')).default
    const imagem = await QRCode.toDataURL(endereco, { margin: 1, width: 280, color: { dark: '#111827', light: '#ffffff' } })
    setQr({ imagem, endereco: caminho })
  }

  function mudarPagina(nova: number) {
    setPagina(nova)
    // Os botões de página ficam no fim da lista. Se o topo do mapa já saiu da tela, volta até
    // ele: é lá que aparecem os pins da página nova, com a lista dela logo abaixo.
    const el = raiz.current
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const ordemPorCorredor = rota
    ? new Map(rota.map((p, i) => [p.corredorNormalizado, i + 1]))
    : null

  const pins = resultados
    .map((r, i) => {
      const pos = getPos(r.produto.corredor_normalizado)
      if (!pos) return null
      const idx = ordemPorCorredor?.get(r.produto.corredor_normalizado) ?? i + 1
      return { ...r, pos, color: PIN_COLORS[i % PIN_COLORS.length], idx }
    })
    .filter(Boolean) as Array<SearchResult & { pos: {x:number;y:number}; color:string; idx:number }>

  // Quando há rota calculada, a legenda abaixo do mapa deve seguir a mesma ordem de
  // visita (não a ordem em que os produtos entraram na busca/carrinho).
  if (ordemPorCorredor) pins.sort((a, b) => a.idx - b.idx)

  const totalPaginas = Math.max(1, Math.ceil(pins.length / PRODUTOS_POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const pinsDaPagina = pins.slice((paginaAtual - 1) * PRODUTOS_POR_PAGINA, paginaAtual * PRODUTOS_POR_PAGINA)
  // No mapa entram só os pins da página (a numeração continua: 11 a 20 na página 2), pra
  // planta não virar um amontoado e os números baterem com a lista que está na tela.
  // Exceção: com rota desenhada (carrinho) ficam todos, senão a linha da rota passaria por
  // corredores sem pin.
  const pinsNoMapa = rota && rota.length > 0 ? pins : pinsDaPagina

  const pontosRota = rota
    ? (rota.map(p => getPos(p.corredorNormalizado)).filter(Boolean) as Array<{ x: number; y: number }>)
    : []

  // Vários produtos no mesmo corredor caem exatamente nas mesmas coordenadas — sem isso,
  // o pin desenhado por último cobre os outros por completo e eles somem do mapa. Espalha
  // os pins de um mesmo grupo num pequeno círculo ao redor do ponto original. O raio cresce
  // com o tamanho do grupo (regra: raio tal que a distância entre pins vizinhos no círculo
  // fique perto do diâmetro do próprio pin) — com raio fixo, grupos de 4-5 produtos no
  // mesmo corredor (comum quando a busca traz muitas variações do mesmo item) continuavam
  // se sobrepondo bastante mesmo espalhados.
  const gruposPorPosicao = new Map<string, typeof pins>()
  pinsNoMapa.forEach(p => {
    const chave = `${p.pos.x},${p.pos.y}`
    gruposPorPosicao.set(chave, [...(gruposPorPosicao.get(chave) ?? []), p])
  })
  gruposPorPosicao.forEach(grupo => {
    if (grupo.length <= 1) return
    const raio = grupo.length <= 2 ? 12 : Math.min(22, 10 / Math.sin(Math.PI / grupo.length))
    grupo.forEach((p, gi) => {
      const angulo = (2 * Math.PI * gi) / grupo.length - Math.PI / 2
      p.pos = { x: p.pos.x + raio * Math.cos(angulo), y: p.pos.y + raio * Math.sin(angulo) }
    })
  })

  function handlePinClick(pin: typeof pins[0]) {
    // Quando existe um `onSelect` (ex.: busca, mapa com detalhes habilitados), o clique no
    // pin já abre o modal de detalhes do produto diretamente.
    if (onSelect) {
      trackProductView({ id: pin.produto.id, nome: pin.produto.produto, categoria: pin.produto.categoria })
      setSelectedId(pin.produto.id)
      onSelect(pin.produto)
      return
    }
    setSelectedId(prev => prev === pin.produto.id ? null : pin.produto.id)
  }

  // No modo "de perto" a planta desliza sozinha até o produto escolhido (ou, ao abrir, até o
  // primeiro da lista) ficar no meio da tela.
  const alvo = pinsNoMapa.find(p => p.produto.id === selectedId) ?? pinsDaPagina[0]
  const alvoX = alvo ? alvo.pos.x : null
  useEffect(() => {
    const el = moldura.current
    if (!dePerto || !el || alvoX === null) return
    const escala = ALTURA_DE_PERTO / VH
    el.scrollTo({ left: alvoX * escala - el.clientWidth / 2, behavior: 'smooth' })
  }, [dePerto, alvoX])

  return (
    <div ref={raiz} className="w-full scroll-mt-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 mb-2">
        <div>
          <span className="text-xs font-bold text-gray-700">{loja}</span>
          <span className="hidden sm:inline ml-2 text-xs text-gray-600">Planta da loja · 50 corredores</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {navegacaoNoCelular && pinsDaPagina.length > 0 && (
            <button
              type="button"
              onClick={abrirQrDaNavegacao}
              className="text-xs font-semibold flex items-center gap-1.5 px-3 h-8 rounded-full bg-gray-900 text-white hover:bg-lm-green transition-colors"
            >
              <QrCode size={14} /> Navegar no celular
            </button>
          )}
          {pins.length > 0 && (
            <span className="text-xs bg-lm-green/10 text-lm-green border border-lm-green/20 px-2 py-0.5 rounded-full font-semibold">
              {pins.length} produto{pins.length > 1 ? 's' : ''} localizado{pins.length > 1 ? 's' : ''}
            </span>
          )}
          {totalEstimado != null && totalEstimado > 0 && (
            <span className="text-xs bg-lm-green text-white px-3 py-0.5 rounded-full font-bold shadow-sm">
              Total: {totalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          )}
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-500 rounded-card overflow-hidden shadow-soft bg-white relative select-none">
        {estreito && (
          <button
            type="button"
            onClick={() => setLojaInteira(v => !v)}
            className="absolute z-30 top-2 right-2 h-9 px-3 rounded-full flex items-center gap-1.5 bg-gray-900/80 backdrop-blur-sm text-white text-xs font-semibold shadow-md"
          >
            {lojaInteira ? <><ZoomIn size={14} /> Ver de perto</> : <><Maximize2 size={13} /> Loja inteira</>}
          </button>
        )}
        {/* Controles de zoom — pílula flutuante escura sobre a planta clara (mesmo padrão
            visual dos ícones de favoritar/comparar sobre a foto do produto em
            ProdutoDrawer.tsx), em vez de quadrados soltos. Fixo em tom escuro de propósito:
            o SVG da planta da loja não inverte com o tema (ver [[project-dev-workflow]]),
            então um controle neutro em cima dela fica legível nos dois modos. */}
        {!estreito && <div className="absolute z-30 top-2 right-2 flex flex-col gap-0.5 bg-gray-900/80 backdrop-blur-sm rounded-full p-1 shadow-md">
          <button
            type="button"
            onClick={() => aplicarZoom(0.5)}
            disabled={zoom >= ZOOM_MAX}
            aria-label="Aumentar zoom"
            className="w-7 h-7 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            onClick={() => aplicarZoom(-0.5)}
            disabled={zoom <= ZOOM_MIN}
            aria-label="Diminuir zoom"
            className="w-7 h-7 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            disabled={zoom === 1}
            aria-label="Restaurar zoom"
            className="w-7 h-7 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Maximize2 size={13} />
          </button>
        </div>}

        {/* Moldura da planta: no celular "de perto" é ela que rola de lado; nas telas largas
            é onde se arrasta a planta com zoom. O dedo só fica preso ao mapa quando há zoom —
            com touch-action sempre desligado, a página não rolava com o dedo sobre a planta. */}
        <div
          ref={moldura}
          className={dePerto ? 'overflow-x-auto overscroll-x-contain' : undefined}
          onDoubleClick={estreito ? undefined : handleDoubleClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={estreito ? undefined : { touchAction: zoom > 1 ? 'none' : 'auto', cursor: zoom > 1 ? (arrastando ? 'grabbing' : 'grab') : 'default' }}
        >
        <div
          style={estreito ? undefined : {
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: arrastando ? 'none' : 'transform 0.15s ease-out',
          }}
        >
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className={dePerto ? undefined : 'w-full'}
          style={dePerto
            ? { display: 'block', height: ALTURA_DE_PERTO, width: (ALTURA_DE_PERTO * VW) / VH, maxWidth: 'none' }
            : { display: 'block' }}
        >
          <DesenhoPlantaLoja />

          {/* Rota de compra sugerida */}
          {pontosRota.length > 1 && (
            <polyline
              points={pontosRota.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#16a34a"
              strokeWidth="3"
              strokeDasharray="7 5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
          )}

          {/* Pins — o selecionado é redesenhado por último (SVG pinta na ordem do DOM) pra
              nunca ficar escondido embaixo de outros pins do mesmo corredor. */}
          {[...pinsNoMapa].sort((a, b) => Number(a.produto.id === selectedId) - Number(b.produto.id === selectedId)).map(pin => {
            const isSel = selectedId === pin.produto.id
            return (
              <g key={pin.produto.id}
                onClick={() => handlePinClick(pin)}
                style={{ cursor: 'pointer' }}>
                <circle cx={pin.pos.x} cy={pin.pos.y} r="24" fill="transparent" />
                <circle cx={pin.pos.x} cy={pin.pos.y+2} r="11" fill="rgba(0,0,0,0.2)" />
                {isSel && (
                  <circle cx={pin.pos.x} cy={pin.pos.y} r="18" fill={pin.color} opacity="0.25" />
                )}
                <circle cx={pin.pos.x} cy={pin.pos.y} r="15" fill={pin.color} opacity="0">
                  <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={pin.pos.x} cy={pin.pos.y} r={isSel ? 13 : 11}
                  fill={pin.color} stroke="white" strokeWidth={isSel ? 3 : 2.5} />
                <text x={pin.pos.x} y={pin.pos.y+4} textAnchor="middle"
                  fontSize="10" fontWeight="800" fill="white" fontFamily="Inter,sans-serif">{pin.idx}</text>
              </g>
            )
          })}
        </svg>
        </div>
        </div>
      </div>
      {dePerto && (
        <p className="mt-1.5 text-xs text-gray-600 text-center">Deslize a planta para o lado para ver a loja toda</p>
      )}

      {/* Legenda — quando há rota calculada, os cards já vêm na ordem de visita (ver
          `ordemPorCorredor` acima), então esse título é só um rótulo pro que já está
          visível ali embaixo, não uma segunda lista repetindo a mesma informação em texto. */}
      {rota && rota.length > 0 && pins.length > 0 && (
        <p className="mt-3 text-xs font-bold text-gray-700 dark:text-zinc-300 flex items-center gap-1">
          🧭 Ordem sugerida da rota
        </p>
      )}
      {pins.length > 0 && (
        // Grade de colunas iguais (e não flex-wrap): com flex cada cartão ficava da largura do
        // próprio nome do produto, e a legenda virava uma fileira de caixas de tamanhos diferentes.
        // 340px é o mínimo pra caber nome + marca sem cortar; o min(100%, …) evita que a coluna
        // estoure a tela em celular, onde o espaço é menor que isso.
        <div className={`${rota && rota.length > 0 ? 'mt-1.5' : 'mt-3'} grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-2`}>
          {pinsDaPagina.map((pin, i) => {
            const isSel = selectedId === pin.produto.id
            return (
              <div key={pin.produto.id}
                onClick={() => handlePinClick(pin)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all animate-fade-in-up ${
                  isSel ? 'shadow-md scale-[1.02]' : 'hover:shadow-sm'
                }`}
                style={{ borderColor: pin.color, backgroundColor: `${pin.color}12`, '--stagger-delay': `${Math.min(i, 15) * 25}ms` } as React.CSSProperties}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                  style={{ backgroundColor: pin.color }}>{pin.idx}</span>
                <img
                  src={getImagemProduto(pin.produto)}
                  alt={pin.produto.categoria}
                  className={`w-9 h-9 rounded-md ${ajusteFoto(pin.produto, 'p-0.5')} flex-shrink-0`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 line-clamp-2 sm:line-clamp-1">{pin.produto.produto}</p>
                  <p className="text-gray-700 truncate">{pin.produto.corredor}<span className="hidden sm:inline"> · {pin.produto.categoria}</span></p>
                  {(pin.produto as any).preco != null && (
                    <p className="text-xs font-bold text-lm-green mt-0.5">
                      {Number((pin.produto as any).preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                  {!semCarrinho && <button
                    onClick={(e) => handleAdicionar(pin.produto.id, pin.produto.estoque, e)}
                    disabled={pin.produto.estoque === 0}
                    aria-label="Adicionar ao carrinho"
                    className="w-9 h-9 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: pin.color }}
                  >
                    {adicionadoId === pin.produto.id ? <Check size={14} /> : <ShoppingCart size={14} />}
                  </button>}
                  {onSelect && (
                    <span className="text-xs font-bold shrink-0" style={{ color: pin.color }}>
                      Ver →
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <Modal open={qr !== null} onClose={() => setQr(null)} title="Navegar na loja pelo celular" maxWidthClass="md:max-w-md">
        {qr && (
          <div className="p-6 flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.imagem} alt="QR code da navegação na loja" className="w-60 h-60 rounded-xl border border-gray-200 bg-[#ffffff] p-2" />
            <p className="text-base text-gray-800 mt-4">
              Aponte a câmera do celular para o QR code. Abre o mapa da loja <strong>{loja}</strong> com a rota até
              {pinsDaPagina.length === 1 ? ' o produto' : ` os ${pinsDaPagina.length} produtos`} desta página, como num aplicativo de trânsito.
            </p>
            <p className="text-sm text-gray-600 mt-2">Simulação: o ponto azul anda sozinho pelos corredores, sem GPS.</p>
            <Link
              href={qr.endereco}
              className="mt-5 w-full h-11 rounded-xl bg-lm-green text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
            >
              <Navigation size={16} /> Abrir neste aparelho
            </Link>
          </div>
        )}
      </Modal>
      {totalPaginas > 1 && (
        <div className="mt-3 flex flex-col items-center gap-2">
          <p className="text-xs text-gray-600">
            Produtos {(paginaAtual - 1) * PRODUTOS_POR_PAGINA + 1}–{Math.min(paginaAtual * PRODUTOS_POR_PAGINA, pins.length)} de {pins.length}
          </p>
          <Pagination page={paginaAtual} totalPages={totalPaginas} onChange={mudarPagina} />
        </div>
      )}

    </div>
  )
}