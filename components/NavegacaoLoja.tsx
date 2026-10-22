'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ArrowUp, CornerUpLeft, CornerUpRight, Undo2, MapPin, Flag, Play, Pause, Check, Map as MapaIcone,
  Navigation, X, ShoppingCart, Footprints, ListChecks, Route,
} from 'lucide-react'
import { VW, VH, DesenhoPlantaLoja, CORES_DOS_PINS } from './PlantaLoja'
import { buscarProdutosPorIds, type ProdutoResolvido } from '@/lib/produtosCliente'
import { getImagemProduto, ajusteFoto } from '@/lib/categoriaImagens'
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'
import {
  ENTRADA, comprimento, emMetros, instrucaoAgora, montarRoteiro, paradasDosProdutos, posicaoNoTrecho,
  textoDaInstrucao, type Instrucao, type Parada, type Trecho,
} from '@/lib/navegacaoLoja'

// Navegação guiada dentro da loja, no celular (/navegar). Chega pelo QR code do mapa da
// busca (components/StoreMap.tsx), com a loja e os produtos no endereço:
//   /navegar?loja=Interlagos — São Paulo/SP&p=LM-0001:1,LM-0340:2
// (id do produto : número do pin no mapa da busca, pra os números baterem nas duas telas).
//
// É uma SIMULAÇÃO, sem GPS: o ponto azul anda sozinho pelos corredores, pelo caminho que
// lib/navegacaoLoja.ts calcula, com as instruções de um aplicativo de trânsito. A planta é a
// mesma do mapa da busca (components/PlantaLoja.tsx), deitada em perspectiva: a câmera fica
// atrás do ponto azul e gira pra que o sentido da caminhada aponte sempre pra cima.

const ESCALA = 2.3            // px na tela por unidade do desenho da planta
const INCLINACAO = 50         // graus que a planta "deita"
const PERSPECTIVA = 1100      // distância da "câmera" (px): maior = menos achatado ao longe
const ANCORA_Y = '58%'        // altura da tela onde fica o ponto azul (acima do painel de baixo)
const VELOCIDADE_BASE = 55    // unidades do desenho por segundo na simulação (~3,6 m/s: acelerado)
const CAMINHADA_M_POR_S = 1.1 // ritmo de uma pessoa andando, pra estimar o tempo de verdade

// 'escolhendo' = tela "Monte sua rota": o cliente marca os produtos que vai buscar antes de
// a simulação começar.
type Estado = 'carregando' | 'vazio' | 'escolhendo' | 'pronto' | 'andando' | 'pausado' | 'chegou' | 'fim'

function lerProdutosDoEndereco(p: string | null): { id: string; numero: number }[] {
  if (!p) return []
  return p.split(',').slice(0, 20).map((par, i) => {
    const [id, numero] = par.split(':')
    return { id: id?.trim() ?? '', numero: Number(numero) || i + 1 }
  }).filter(x => /^LM-\d{4}$/.test(x.id))
}

const corDoNumero = (numero: number) => CORES_DOS_PINS[(numero - 1) % CORES_DOS_PINS.length]

function IconeDaManobra({ instrucao, destinoCaixas }: { instrucao: Instrucao; destinoCaixas: boolean }) {
  const p = { size: 34, strokeWidth: 2.6 }
  if (instrucao.manobra === 'chegou') return destinoCaixas ? <Flag {...p} /> : <MapPin {...p} />
  if (instrucao.manobra === 'esquerda') return <CornerUpLeft {...p} />
  if (instrucao.manobra === 'direita') return <CornerUpRight {...p} />
  if (instrucao.manobra === 'meia-volta') return <Undo2 {...p} />
  return <ArrowUp {...p} />
}

export default function NavegacaoLoja() {
  const params = useSearchParams()
  const loja = params.get('loja') || 'Leroy Merlin'
  const pedidos = useMemo(() => lerProdutosDoEndereco(params.get('p')), [params])

  const [produtos, setProdutos] = useState<ProdutoResolvido[] | null>(null)
  const [estado, setEstado] = useState<Estado>('carregando')
  const [trechoAtual, setTrechoAtual] = useState(0)
  const [velocidade, setVelocidade] = useState<1 | 2>(1)
  const [visaoGeral, setVisaoGeral] = useState(false)
  const [coletados, setColetados] = useState<Set<string>>(new Set())
  const [noCarrinho, setNoCarrinho] = useState<Set<string>>(new Set())
  const [escolhidos, setEscolhidos] = useState<Set<string>>(new Set())
  const [instrucao, setInstrucao] = useState<Instrucao>({ manobra: 'siga', metros: 0, rua: '' })
  const [faltaMetros, setFaltaMetros] = useState(0)

  const mundoRef = useRef<HTMLDivElement>(null)
  const andadoRef = useRef(0)
  const rumoRef = useRef(0)
  const pontoRef = useRef(ENTRADA)

  useEffect(() => {
    if (pedidos.length === 0) { setEstado('vazio'); return }
    buscarProdutosPorIds(pedidos.map(p => p.id)).then(lista => {
      setProdutos(lista)
      // Começa com todos marcados; o cliente desmarca o que não vai buscar.
      setEscolhidos(new Set(lista.map(p => p.id)))
      setEstado(lista.length ? 'escolhendo' : 'vazio')
    })
  }, [pedidos])

  // Lugar de cada produto: calculado com TODOS os da busca (assim um produto não muda de
  // lugar no corredor quando outro é desmarcado); a rota usa só os escolhidos.
  const { todasAsParadas, foraDoMapa } = useMemo(() => {
    if (!produtos) return { todasAsParadas: [] as Parada[], foraDoMapa: [] as ProdutoResolvido[] }
    const numeroDe = new Map(pedidos.map(p => [p.id, p.numero]))
    const r = paradasDosProdutos(produtos.map(p => ({ id: p.id, numero: numeroDe.get(p.id) ?? 0, corredorNormalizado: p.corredor_normalizado })))
    return { todasAsParadas: r.paradas, foraDoMapa: produtos.filter(p => r.foraDoMapa.some(f => f.id === p.id)) }
  }, [produtos, pedidos])
  const paradas = useMemo(() => todasAsParadas.filter(p => escolhidos.has(p.id)), [todasAsParadas, escolhidos])
  const trechos = useMemo<Trecho[]>(() => montarRoteiro(paradas), [paradas])

  const produtoPorId = useMemo(() => new Map((produtos ?? []).map(p => [p.id, p])), [produtos])
  const trecho = trechos[trechoAtual]
  const destino = trecho && trecho.destino !== 'caixas' ? trecho.destino : null
  const produtoDestino = destino ? produtoPorId.get(destino.id) : undefined
  const nomeDoDestino = destino ? (produtoDestino?.produto ?? 'produto') : 'os caixas'
  const totalDoTrecho = useMemo(() => (trecho ? comprimento(trecho.pontos) : 0), [trecho])
  const faltaNoRoteiro = useMemo(
    () => trechos.slice(trechoAtual + 1).reduce((s, t) => s + comprimento(t.pontos), 0),
    [trechos, trechoAtual],
  )

  // Põe a câmera no lugar: o ponto atual no ponto azul e o sentido da caminhada pra cima.
  // Mexe direto no estilo (sem passar pelo React) porque roda a cada quadro da animação.
  const aplicarCamera = useCallback((dt: number) => {
    if (!trecho || !mundoRef.current) return
    const { ponto, rumo } = posicaoNoTrecho(trecho.pontos, andadoRef.current)
    pontoRef.current = ponto
    // Gira suave nas curvas, sempre pelo lado mais curto.
    const diferenca = ((rumo - rumoRef.current + 540) % 360) - 180
    rumoRef.current += dt <= 0 ? diferenca : diferenca * Math.min(1, dt * 5)
    const r = rumoRef.current
    const mundo = mundoRef.current
    mundo.style.transform = `rotateX(${INCLINACAO}deg) rotateZ(${-r}deg) translate(${-ponto.x * ESCALA}px, ${-ponto.y * ESCALA}px)`
    mundo.style.setProperty('--rumo', `${r}deg`)
  }, [trecho])

  const atualizarTextos = useCallback(() => {
    if (!trecho) return
    setInstrucao(instrucaoAgora(trecho.pontos, andadoRef.current))
    setFaltaMetros(emMetros(totalDoTrecho - andadoRef.current))
  }, [trecho, totalDoTrecho])

  // Trecho novo — ou o mapa acabou de aparecer (saindo de "Monte sua rota") —: câmera e
  // textos no começo dele, já virada pro lado certo. Sem o mapaNaTela, voltar da escolha sem
  // mudar a rota deixava a planta fora do lugar (a câmera só era posta quando o trecho mudava,
  // e na tela de escolha o mapa nem existe).
  const mapaNaTela = estado !== 'carregando' && estado !== 'vazio' && estado !== 'escolhendo'
  useEffect(() => {
    if (!trecho || !mapaNaTela) return
    aplicarCamera(0)
    atualizarTextos()
  }, [trecho, mapaNaTela, aplicarCamera, atualizarTextos])

  // A caminhada simulada.
  useEffect(() => {
    if (estado !== 'andando' || !trecho) return
    let anterior = performance.now()
    let ultimoTexto = 0
    let quadro = requestAnimationFrame(function passo(agora) {
      const dt = Math.min(0.1, (agora - anterior) / 1000)
      anterior = agora
      andadoRef.current = Math.min(totalDoTrecho, andadoRef.current + VELOCIDADE_BASE * velocidade * dt)
      aplicarCamera(dt)
      if (agora - ultimoTexto > 200) { atualizarTextos(); ultimoTexto = agora }
      if (andadoRef.current >= totalDoTrecho) {
        atualizarTextos()
        setEstado(trecho.destino === 'caixas' ? 'fim' : 'chegou')
        return
      }
      quadro = requestAnimationFrame(passo)
    })
    return () => cancelAnimationFrame(quadro)
  }, [estado, trecho, velocidade, totalDoTrecho, aplicarCamera, atualizarTextos])

  // Tela acesa enquanto anda (sem isto o celular apaga a tela no meio da demonstração).
  useEffect(() => {
    if (estado !== 'andando' || !('wakeLock' in navigator)) return
    let trava: { release: () => Promise<void> } | null = null
    ;(navigator as Navigator & { wakeLock: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } })
      .wakeLock.request('screen').then(t => { trava = t }).catch(() => {})
    return () => { trava?.release().catch(() => {}) }
  }, [estado])

  function peguei() {
    if (destino) setColetados(prev => new Set(prev).add(destino.id))
    andadoRef.current = 0
    setTrechoAtual(i => i + 1)
    setEstado('andando')
  }

  function colocarNoCarrinho() {
    if (!destino) return
    adicionarAoCarrinho(destino.id)
    setNoCarrinho(prev => new Set(prev).add(destino.id))
  }

  if (estado === 'carregando') {
    return <div className="h-[100dvh] flex items-center justify-center bg-[#dfe6ee] text-gray-700">Montando a rota na loja...</div>
  }

  if (estado === 'escolhendo') {
    return (
      <MonteSuaRota
        loja={loja}
        produtos={(produtos ?? []).filter(p => !foraDoMapa.includes(p))}
        foraDoMapa={foraDoMapa}
        paradas={todasAsParadas}
        escolhidos={escolhidos}
        trechos={trechos}
        onAlternar={id => setEscolhidos(prev => { const novo = new Set(prev); if (novo.has(id)) novo.delete(id); else novo.add(id); return novo })}
        onTodos={todos => setEscolhidos(todos ? new Set(todasAsParadas.map(p => p.id)) : new Set())}
        onConfirmar={() => {
          andadoRef.current = 0
          setColetados(new Set())
          setNoCarrinho(new Set())
          setTrechoAtual(0)
          setEstado('pronto')
        }}
      />
    )
  }

  if (estado === 'vazio' || !trecho) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center gap-4 p-6 text-center bg-white">
        <Navigation size={40} className="text-lm-green" />
        <p className="text-lg font-bold text-gray-900">Nenhum produto para navegar</p>
        <p className="text-sm text-gray-700">Abra esta tela pelo QR code do mapa, na busca do site.</p>
        <Link href="/buscar" className="text-sm font-semibold text-lm-green hover:underline">Ir para a busca</Link>
      </div>
    )
  }

  const destinoCaixas = trecho.destino === 'caixas'
  const minutos = Math.max(1, Math.round(((faltaMetros + emMetros(faltaNoRoteiro)) / CAMINHADA_M_POR_S) / 60))
  const ordemDasParadas = trechos.filter(t => t.destino !== 'caixas').map(t => t.destino as Parada)

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-gradient-to-b from-[#b9c6d6] via-[#d5dde7] to-[#e6ebf1] select-none">
      {/* ── Mapa em perspectiva ── */}
      <div className="absolute inset-0 overflow-hidden" style={{ perspective: `${PERSPECTIVA}px`, perspectiveOrigin: `50% ${ANCORA_Y}` }}>
        <div className="absolute" style={{ left: '50%', top: ANCORA_Y, transformStyle: 'preserve-3d' }}>
          <div
            ref={mundoRef}
            className="absolute left-0 top-0"
            style={{ width: VW * ESCALA, height: VH * ESCALA, transformOrigin: '0 0', transformStyle: 'preserve-3d', willChange: 'transform' }}
          >
            <svg viewBox={`0 0 ${VW} ${VH}`} width={VW * ESCALA} height={VH * ESCALA} style={{ display: 'block' }}>
              <DesenhoPlantaLoja />
              <polyline
                points={trecho.pontos.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none" stroke="#1d4ed8" strokeOpacity="0.85" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
            {/* Pins em pé, sempre de frente pra câmera (desfazem o giro e a inclinação da planta). */}
            {paradas.map(p => {
              const atual = destino?.id === p.id
              const feito = coletados.has(p.id)
              return (
                <div
                  key={p.id}
                  className="absolute"
                  style={{ left: p.ponto.x * ESCALA, top: p.ponto.y * ESCALA, transformOrigin: '0 0', transform: `rotateZ(var(--rumo)) rotateX(${-INCLINACAO}deg)` }}
                >
                  <div className="flex flex-col items-center -translate-x-1/2 -translate-y-full">
                    <span
                      className={`rounded-full border-[3px] border-white shadow-lg flex items-center justify-center font-black text-white ${atual ? 'w-12 h-12 text-lg ring-4 ring-white/70 animate-pulse' : 'w-9 h-9 text-sm'} ${feito ? 'opacity-60' : ''}`}
                      style={{ backgroundColor: feito ? '#16a34a' : corDoNumero(p.numero) }}
                    >
                      {feito ? <Check size={18} strokeWidth={3} /> : p.numero}
                    </span>
                    <span className="w-1 h-5 bg-gray-700/70 rounded-b" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {/* Você está aqui: fica parado na tela; quem anda é a planta. */}
        <div className="absolute pointer-events-none" style={{ left: '50%', top: ANCORA_Y }}>
          <div className="-translate-x-1/2 -translate-y-1/2 relative w-16 h-16 flex items-center justify-center">
            <span className="absolute w-16 h-16 rounded-full bg-blue-500/20" />
            <span className="absolute -top-3 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[18px] border-l-transparent border-r-transparent border-b-blue-600" />
            <span className="w-6 h-6 rounded-full bg-blue-600 border-[3px] border-white shadow-lg" />
          </div>
        </div>
      </div>

      {/* ── Instrução (topo) ── */}
      {/* z-20: fica por cima do mapa e da vista "Loja inteira" (z-10) */}
      <div className="absolute top-0 inset-x-0 z-20 p-3 pointer-events-none max-w-lg mx-auto">
        <div className="pointer-events-auto bg-lm-green text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
          <IconeDaManobra instrucao={instrucao} destinoCaixas={destinoCaixas} />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-black leading-snug">
              {textoDaInstrucao(instrucao, destinoCaixas ? 'caixas' : `produto ${destino?.numero}`, destinoCaixas)}
            </p>
            <p className="text-sm text-white/80 truncate">
              {destinoCaixas ? 'Compra completa — siga para o pagamento' : `${nomeDoDestino} · ${produtoDestino?.corredor ?? ''}`}
            </p>
          </div>
          <Link href="/buscar" aria-label="Sair da navegação" className="self-start -mr-1 -mt-1 w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/15">
            <X size={20} />
          </Link>
        </div>
        <div className="mt-2 flex justify-between items-start">
          <span className="pointer-events-auto bg-white/90 text-gray-800 text-xs font-semibold rounded-full px-3 py-1.5 shadow">
            Simulação · {loja.split(' — ')[0]}
          </span>
          <button
            type="button"
            onClick={() => setVisaoGeral(v => !v)}
            className="pointer-events-auto bg-gray-900/85 text-white text-xs font-semibold rounded-full px-3 h-9 flex items-center gap-1.5 shadow"
          >
            {visaoGeral ? <><Navigation size={14} /> Navegação</> : <><MapaIcone size={14} /> Loja inteira</>}
          </button>
        </div>
      </div>

      {/* ── Loja inteira (vista de cima) ── */}
      {visaoGeral && (
        <div className="absolute inset-0 z-10 pt-36 pb-60 flex items-center justify-center px-3 bg-[#dfe6ee]">
          <div className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-xl border border-white bg-white">
            <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full block">
              <DesenhoPlantaLoja />
              {trechos.slice(trechoAtual).map((t, i) => (
                <polyline key={i} points={t.pontos.map(p => `${p.x},${p.y}`).join(' ')} fill="none"
                  stroke="#1d4ed8" strokeWidth={i === 0 ? 7 : 4} strokeOpacity={i === 0 ? 0.9 : 0.45} strokeDasharray={i === 0 ? undefined : '10 8'}
                  strokeLinecap="round" strokeLinejoin="round" />
              ))}
              {paradas.map(p => (
                <g key={p.id}>
                  <circle cx={p.ponto.x} cy={p.ponto.y} r="14" fill={coletados.has(p.id) ? '#16a34a' : corDoNumero(p.numero)} stroke="white" strokeWidth="3" />
                  <text x={p.ponto.x} y={p.ponto.y + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill="white" fontFamily="Inter,sans-serif">
                    {coletados.has(p.id) ? '✓' : p.numero}
                  </text>
                </g>
              ))}
              <circle cx={pontoRef.current.x} cy={pontoRef.current.y} r="12" fill="#2563eb" stroke="white" strokeWidth="4" />
            </svg>
          </div>
        </div>
      )}

      {/* ── Painel de baixo ── */}
      <div className="absolute bottom-0 inset-x-0 z-20 max-w-lg mx-auto bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.15)] px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="w-10 h-1.5 rounded-full bg-gray-300 mx-auto mb-3" />

        {estado === 'fim' ? (
          <div className="text-center pb-1">
            <p className="text-lg font-black text-gray-900">Tudo certo!</p>
            <p className="text-sm text-gray-700 mt-1">
              Você passou pelos {ordemDasParadas.length} produtos e chegou aos caixas.
              {noCarrinho.size > 0 && ` ${noCarrinho.size} ${noCarrinho.size === 1 ? 'foi para' : 'foram para'} o carrinho.`}
            </p>
            <div className="flex gap-2 mt-4">
              <Link href="/buscar" className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 flex items-center justify-center">Nova busca</Link>
              <Link href="/carrinho" className="flex-1 h-11 rounded-xl bg-lm-green text-white text-sm font-semibold flex items-center justify-center gap-1.5"><ShoppingCart size={16} /> Ver carrinho</Link>
            </div>
          </div>
        ) : (
          <>
            {destino && (
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black flex-shrink-0" style={{ backgroundColor: corDoNumero(destino.numero) }}>
                  {destino.numero}
                </span>
                {produtoDestino && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getImagemProduto(produtoDestino)} alt="" className={`w-14 h-14 rounded-xl flex-shrink-0 ${ajusteFoto(produtoDestino, 'p-1')}`} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 line-clamp-2">{nomeDoDestino}</p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-lm-green">{produtoDestino?.corredor}</span>
                    {produtoDestino && ` · ${produtoDestino.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                  </p>
                </div>
              </div>
            )}
            {!destino && <p className="text-sm font-bold text-gray-900">Indo para os caixas</p>}

            <div className="flex items-center justify-between text-xs text-gray-600 mt-3">
              <span className="flex items-center gap-1"><Footprints size={14} /> {faltaMetros} m até {destino ? 'o produto' : 'os caixas'} · ~{minutos} min no total</span>
              <span>{destino ? `${Math.min(trechoAtual + 1, ordemDasParadas.length)} de ${ordemDasParadas.length}` : 'última etapa'}</span>
            </div>

            {/* Progresso: as paradas na ordem da rota */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
              {ordemDasParadas.map((p, i) => (
                <span
                  key={p.id}
                  className={`flex-shrink-0 w-7 h-7 rounded-full text-[11px] font-black flex items-center justify-center text-white ${i === trechoAtual ? 'ring-2 ring-offset-1 ring-gray-900' : ''}`}
                  style={{ backgroundColor: coletados.has(p.id) ? '#16a34a' : corDoNumero(p.numero), opacity: coletados.has(p.id) || i === trechoAtual ? 1 : 0.55 }}
                >
                  {coletados.has(p.id) ? <Check size={13} strokeWidth={3} /> : p.numero}
                </span>
              ))}
              <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-gray-800 text-white ${destinoCaixas ? 'ring-2 ring-offset-1 ring-gray-900' : 'opacity-55'}`}>
                <Flag size={13} />
              </span>
            </div>

            <div className="flex gap-2 mt-3">
              {estado === 'chegou' ? (
                <>
                  <button type="button" onClick={colocarNoCarrinho} disabled={!!destino && noCarrinho.has(destino.id)}
                    className="h-12 px-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 flex items-center gap-1.5 disabled:text-lm-green disabled:border-lm-green/40">
                    {destino && noCarrinho.has(destino.id) ? <><Check size={16} /> No carrinho</> : <><ShoppingCart size={16} /> Carrinho</>}
                  </button>
                  <button type="button" onClick={peguei} className="flex-1 h-12 rounded-xl bg-lm-green text-white font-bold flex items-center justify-center gap-2">
                    <Check size={18} /> Peguei, próximo
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setEstado(estado === 'andando' ? 'pausado' : 'andando')}
                    className={`flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2 ${estado === 'andando' ? 'bg-gray-100 text-gray-900' : 'bg-lm-green text-white'}`}
                  >
                    {estado === 'andando' ? <><Pause size={18} /> Pausar</> : <><Play size={18} /> {estado === 'pronto' ? 'Iniciar navegação' : 'Continuar'}</>}
                  </button>
                  {estado === 'pronto' && (
                    <button
                      type="button"
                      onClick={() => setEstado('escolhendo')}
                      aria-label="Editar os produtos da rota"
                      className="h-12 w-12 rounded-xl border border-gray-200 text-gray-800 flex items-center justify-center"
                    >
                      <ListChecks size={20} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setVelocidade(v => (v === 1 ? 2 : 1))}
                    aria-label="Velocidade da simulação"
                    className="h-12 w-14 rounded-xl border border-gray-200 text-sm font-black text-gray-800"
                  >
                    {velocidade}x
                  </button>
                </>
              )}
            </div>
            {foraDoMapa.length > 0 && (
              <p className="text-xs text-gray-600 mt-2">
                {foraDoMapa.length === 1 ? '1 produto não tem' : `${foraDoMapa.length} produtos não têm`} corredor no mapa: {foraDoMapa.map(p => p.produto).join(', ')}.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Monte sua rota ──────────────────────────────────────────────────────────────
// Antes da simulação: o cliente marca o que vai buscar. O mapinha mostra onde fica cada
// produto (marcados coloridos, desmarcados em cinza) e a rota que vai ser feita; embaixo, a
// distância e o tempo a pé estimados.
function MonteSuaRota({ loja, produtos, foraDoMapa, paradas, escolhidos, trechos, onAlternar, onTodos, onConfirmar }: {
  loja: string
  produtos: ProdutoResolvido[]
  foraDoMapa: ProdutoResolvido[]
  paradas: Parada[]
  escolhidos: Set<string>
  trechos: Trecho[]
  onAlternar: (id: string) => void
  onTodos: (todos: boolean) => void
  onConfirmar: () => void
}) {
  const numeroDe = new Map(paradas.map(p => [p.id, p.numero]))
  const ordenados = [...produtos].sort((a, b) => (numeroDe.get(a.id) ?? 0) - (numeroDe.get(b.id) ?? 0))
  const quantos = ordenados.filter(p => escolhidos.has(p.id)).length
  const metros = emMetros(trechos.reduce((s, t) => s + comprimento(t.pontos), 0))
  const minutos = Math.max(1, Math.round(metros / CAMINHADA_M_POR_S / 60))
  const todosMarcados = quantos === ordenados.length

  return (
    <div className="h-[100dvh] flex flex-col bg-white">
      <div className="bg-lm-green text-white px-4 pt-3 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold bg-white/15 rounded-full px-3 py-1">Simulação · {loja.split(' — ')[0]}</span>
            <Link href="/buscar" aria-label="Sair" className="w-9 h-9 -mr-2 flex items-center justify-center rounded-full hover:bg-black/15">
              <X size={20} />
            </Link>
          </div>
          <h1 className="text-2xl font-black mt-2">Monte sua rota</h1>
          <p className="text-sm text-white/85">Marque os produtos que você vai buscar na loja. A rota passa só por eles.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4">
          {/* Mapinha: onde fica cada produto e a rota com os marcados */}
          <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200 bg-[#ffffff]">
            <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full block">
              <DesenhoPlantaLoja />
              {trechos.map((t, i) => (
                <polyline key={i} points={t.pontos.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#1d4ed8"
                  strokeOpacity="0.55" strokeWidth="5" strokeDasharray="12 8" strokeLinecap="round" strokeLinejoin="round" />
              ))}
              <circle cx={ENTRADA.x} cy={ENTRADA.y - 4} r="11" fill="#2563eb" stroke="white" strokeWidth="4" />
              {paradas.map(p => {
                const marcado = escolhidos.has(p.id)
                return (
                  <g key={p.id} opacity={marcado ? 1 : 0.7}>
                    <circle cx={p.ponto.x} cy={p.ponto.y} r={marcado ? 15 : 11} fill={marcado ? corDoNumero(p.numero) : '#cbd5e1'} stroke="white" strokeWidth="3" />
                    <text x={p.ponto.x} y={p.ponto.y + (marcado ? 5 : 4)} textAnchor="middle" fontSize={marcado ? 14 : 11} fontWeight="800"
                      fill={marcado ? 'white' : '#475569'} fontFamily="Inter,sans-serif">{p.numero}</text>
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="flex items-center justify-between mt-4 mb-2">
            <p className="text-sm font-bold text-gray-900">{quantos} de {ordenados.length} produtos marcados</p>
            <button type="button" onClick={() => onTodos(!todosMarcados)} className="text-sm font-semibold text-lm-green hover:underline">
              {todosMarcados ? 'Desmarcar todos' : 'Marcar todos'}
            </button>
          </div>

          <ul className="space-y-2 pb-4">
            {ordenados.map(p => {
              const numero = numeroDe.get(p.id) ?? 0
              const marcado = escolhidos.has(p.id)
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onAlternar(p.id)}
                    aria-pressed={marcado}
                    className={`w-full flex items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition-colors ${marcado ? 'border-lm-green bg-lm-green/5' : 'border-gray-200 bg-white'}`}
                  >
                    <span className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${marcado ? 'bg-lm-green border-lm-green text-white' : 'border-gray-300 text-transparent'}`}>
                      <Check size={16} strokeWidth={3} />
                    </span>
                    <span className="w-7 h-7 rounded-full text-xs font-black text-white flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: marcado ? corDoNumero(numero) : '#94a3b8' }}>{numero}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getImagemProduto(p)} alt="" className={`w-11 h-11 rounded-lg flex-shrink-0 ${ajusteFoto(p, 'p-0.5')}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900 line-clamp-2">{p.produto}</span>
                      <span className="block text-xs text-gray-700"><span className="font-semibold text-lm-green">{p.corredor}</span> · {p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {foraDoMapa.length > 0 && (
            <p className="text-xs text-gray-600 pb-4">
              Sem corredor no mapa (não entram na rota): {foraDoMapa.map(p => p.produto).join(', ')}.
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto">
          <p className="text-xs text-gray-600 flex items-center gap-1.5 mb-2">
            <Footprints size={14} />
            {quantos === 0 ? 'Marque pelo menos um produto.' : `Rota da entrada até os caixas: ~${metros} m · ~${minutos} min a pé`}
          </p>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={quantos === 0}
            className="w-full h-12 rounded-xl bg-lm-green text-white font-bold flex items-center justify-center gap-2 hover:bg-lm-green-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Route size={18} /> Traçar rota{quantos > 0 ? ` com ${quantos} ${quantos === 1 ? 'produto' : 'produtos'}` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
