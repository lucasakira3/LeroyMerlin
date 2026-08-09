'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Search, Camera, Sparkles, MessageCircleQuestion, ArrowRight, MapPin, Brain, Clock, ChevronRight } from 'lucide-react'

const TOUR_KEY = 'lm_tour_completo'

const BG = 'linear-gradient(160deg, #1a4731 0%, #00843d 60%, #2d9e5f 100%)'

const GRID_PATTERN = (
  <div className="absolute inset-0 opacity-10 pointer-events-none">
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-lm" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-lm)" />
    </svg>
  </div>
)

export default function TourGuiado() {
  const [visivel, setVisivel] = useState(false)
  const [passo, setPasso] = useState(0)
  const [saindo, setSaindo] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) setVisivel(true)
  }, [])

  function fechar() {
    setSaindo(true)
    setTimeout(() => {
      localStorage.setItem(TOUR_KEY, '1')
      setVisivel(false)
      setSaindo(false)
    }, 300)
  }

  const pathname = usePathname()
  if (pathname.startsWith('/funcionario')) return null;
  if (!visivel) return null

  const isUltimo = passo === 3

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${saindo ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={fechar} />

      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: BG }}
      >
        {GRID_PATTERN}

        {/* Header fixo */}
        <div className="relative z-10 flex items-center justify-between px-6 pt-5">
          <span className="text-xs font-bold text-white/50 tracking-widest uppercase">FIAP Challenge 2026</span>
          <button onClick={fechar} className="text-xs text-white/40 hover:text-white/70 transition-colors">
            Pular
          </button>
        </div>

        {/* Conteúdo do slide */}
        <div className="relative z-10 px-6 pt-4 pb-4 min-h-[400px] flex flex-col">

          {/* — SLIDE 0: Hero — */}
          {passo === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-5">
              <div className="bg-white rounded-2xl px-5 py-3 inline-block shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/leroy-logo.png" alt="Leroy Merlin" className="h-10 w-auto object-contain" />
              </div>

              <div>
                <h1 className="text-3xl font-black text-white leading-tight">
                  A loja que<br />entende você
                </h1>
                <p className="text-white/70 text-sm mt-2 leading-relaxed max-w-xs mx-auto">
                  Inteligência artificial que transforma a jornada do cliente dentro da loja física.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 w-full">
                {[
                  { icon: Brain, label: 'IA Conversacional' },
                  { icon: MapPin, label: 'Mapa em tempo real' },
                  { icon: Clock, label: 'Autoatendimento 24h' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
                    <Icon size={20} className="text-lm-yellow mx-auto mb-1.5" />
                    <p className="text-white text-xs font-semibold leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* — SLIDE 1: Problema — */}
          {passo === 1 && (
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <p className="text-lm-yellow text-xs font-bold tracking-widest uppercase mb-1">O desafio</p>
                <h2 className="text-2xl font-black text-white leading-tight">
                  3 barreiras que fazem<br />o cliente desistir
                </h2>
              </div>

              <div className="flex flex-col gap-3 flex-1 justify-center">
                {[
                  {
                    num: '01',
                    titulo: 'Assimetria de informação',
                    desc: 'O cliente não conhece os termos técnicos. O conhecimento está preso com o vendedor.',
                  },
                  {
                    num: '02',
                    titulo: 'O problema do "último metro"',
                    desc: 'Loja de ~10.000m². Saber que o produto existe não resolve — encontrá-lo é outra batalha.',
                  },
                  {
                    num: '03',
                    titulo: 'Inércia do suporte',
                    desc: 'Linguagem técnica e sistemas legados geram abandono. O cliente desiste e vai embora.',
                  },
                ].map(({ num, titulo, desc }) => (
                  <div key={num} className="bg-white/10 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-lm-yellow text-2xl font-black leading-none shrink-0">{num}</span>
                    <div>
                      <p className="text-white font-bold text-sm">{titulo}</p>
                      <p className="text-white/60 text-xs mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* — SLIDE 2: Solução — */}
          {passo === 2 && (
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <p className="text-lm-yellow text-xs font-bold tracking-widest uppercase mb-1">A solução</p>
                <h2 className="text-2xl font-black text-white leading-tight">
                  4 ferramentas.<br />Uma experiência.
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 flex-1 content-center">
                {[
                  { icon: Search, titulo: 'Busca inteligente', desc: 'Linguagem natural, sem termos técnicos.' },
                  { icon: Camera, titulo: 'Busca por foto', desc: 'Fotografe e identifique qualquer produto.' },
                  { icon: Sparkles, titulo: 'Projeto Guiado', desc: 'Descreva a reforma, receba a lista.' },
                  { icon: MessageCircleQuestion, titulo: 'Tire Dúvidas', desc: 'Especialista virtual 24 horas.' },
                ].map(({ icon: Icon, titulo, desc }) => (
                  <div key={titulo} className="bg-white/10 rounded-2xl p-4 flex flex-col gap-2">
                    <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                      <Icon size={18} className="text-lm-yellow" />
                    </div>
                    <p className="text-white font-bold text-sm leading-tight">{titulo}</p>
                    <p className="text-white/60 text-xs leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* — SLIDE 3: CTA — */}
          {passo === 3 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-5">
              <div className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center text-4xl">
                🚀
              </div>

              <div>
                <h2 className="text-3xl font-black text-white leading-tight">
                  O MVP está<br />pronto pra você
                </h2>
                <p className="text-white/70 text-sm mt-2 leading-relaxed max-w-xs mx-auto">
                  Conectado a mais de 5.000 produtos reais da Leroy Merlin.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 w-full">
                {[
                  { valor: '5k+', label: 'Produtos' },
                  { valor: '4', label: 'Features de IA' },
                  { valor: '50', label: 'Corredores' },
                ].map(({ valor, label }) => (
                  <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-white text-xl font-black">{valor}</p>
                    <p className="text-white/60 text-xs">{label}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={fechar}
                className="w-full bg-lm-yellow text-black text-base font-black py-4 rounded-2xl hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2"
              >
                Explorar o MVP <ArrowRight size={18} />
              </button>
            </div>
          )}

        </div>

        {/* Footer fixo */}
        <div className="relative z-10 px-6 pb-5 flex items-center justify-between">
          <Dots total={4} atual={passo} onClick={setPasso} />
          <div className="flex gap-2">
            {passo > 0 && (
              <button
                onClick={() => setPasso(p => p - 1)}
                className="px-4 py-2.5 rounded-xl border border-white/20 text-white/60 text-sm hover:border-white/40 transition-colors"
              >
                Voltar
              </button>
            )}
            {!isUltimo && (
              <button
                onClick={() => setPasso(p => p + 1)}
                className="flex items-center gap-2 bg-lm-yellow text-black text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-yellow-300 transition-colors"
              >
                {passo === 0 ? 'Conhecer' : 'Próximo'} <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

function Dots({ total, atual, onClick }: { total: number; atual: number; onClick: (i: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onClick(i)}
          className={`rounded-full transition-all ${i === atual ? 'w-5 h-2 bg-lm-yellow' : 'w-2 h-2 bg-white/20 hover:bg-white/40'}`}
          aria-label={`Slide ${i + 1}`}
        />
      ))}
    </div>
  )
}
