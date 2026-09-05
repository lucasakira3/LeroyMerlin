'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getImagemCategoria } from '@/lib/categoriaImagens'

interface Slide {
  badge: string
  badgeClasse: string
  titulo: string
  subtitulo: string
  categoria: string
  href: string
}

const SLIDES: Slide[] = [
  {
    badge: 'OFERTA DA SEMANA',
    badgeClasse: 'bg-lm-yellow text-black',
    titulo: 'Até 30% off',
    subtitulo: 'em ferramentas elétricas selecionadas',
    categoria: 'Ferramentas',
    href: '/produtos?categoria=ferramentas',
  },
  {
    badge: 'NOVIDADE',
    badgeClasse: 'bg-white text-lm-green',
    titulo: 'Projeto Guiado',
    subtitulo: 'Descreva sua reforma, a IA monta a lista completa de materiais',
    categoria: 'Construção',
    href: '/projeto',
  },
  {
    badge: 'PRA VOCÊ',
    badgeClasse: 'bg-white text-lm-green',
    titulo: 'Entrevista guiada',
    subtitulo: 'Responda 5 perguntas e receba sugestões pensadas pra você',
    categoria: 'Decoração',
    href: '/conta',
  },
  {
    badge: '24H',
    badgeClasse: 'bg-white text-lm-green',
    titulo: 'Tire suas dúvidas',
    subtitulo: 'Pergunte sobre materiais e técnicas antes de comprar, com a IA',
    categoria: 'Jardim',
    href: '/duvidas',
  },
]

const INTERVALO_MS = 5000

export default function BannerCarrossel() {
  const [slide, setSlide] = useState(0)
  const [pausado, setPausado] = useState(false)

  useEffect(() => {
    if (pausado) return
    const id = setInterval(() => {
      setSlide(s => (s + 1) % SLIDES.length)
    }, INTERVALO_MS)
    return () => clearInterval(id)
  }, [slide, pausado])

  const atual = SLIDES[slide]

  function irParaAnterior() {
    setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length)
  }

  function irParaProximo() {
    setSlide(s => (s + 1) % SLIDES.length)
  }

  const conteudo = (
    <div className="relative h-full flex flex-col justify-center px-6 sm:px-10 max-w-xs sm:max-w-sm">
      <span className={`inline-block w-fit text-[10px] font-extrabold px-2.5 py-1 rounded-md mb-2 tracking-wide ${atual.badgeClasse}`}>
        {atual.badge}
      </span>
      <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">{atual.titulo}</h2>
      <p className="text-sm text-white/85 mt-1">{atual.subtitulo}</p>
    </div>
  )

  return (
    <div
      className="relative h-40 sm:h-44 mb-8 overflow-hidden rounded-card bg-gradient-to-r from-green-800 to-lm-green"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getImagemCategoria(atual.categoria)}
        alt=""
        className="pointer-events-none absolute -right-4 -top-2 h-[120%] w-3/5 object-cover"
      />

      <Link href={atual.href} className="block h-full">
        {conteudo}
      </Link>

      <button
        type="button"
        onClick={irParaAnterior}
        aria-label="Slide anterior"
        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={irParaProximo}
        aria-label="Próximo slide"
        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
      >
        <ChevronRight size={18} />
      </button>

      <div className="absolute bottom-3 left-6 sm:left-10 flex items-center gap-1.5 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSlide(i)}
            aria-label={`Slide ${i + 1}`}
            aria-current={i === slide ? 'true' : undefined}
            className={`rounded-full transition-all ${i === slide ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/30 hover:bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  )
}
