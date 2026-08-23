'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getImagemCategoria } from '@/lib/categoriaImagens'

type AcaoSlide =
  | { tipo: 'link'; href: string }
  | { tipo: 'categoria'; slug: string; label: string }

interface Slide {
  badge: string
  badgeClasse: string
  titulo: string
  subtitulo: string
  categoria: string
  acao: AcaoSlide
}

const SLIDES: Slide[] = [
  {
    badge: 'OFERTA DA SEMANA',
    badgeClasse: 'bg-lm-yellow text-black',
    titulo: 'Até 30% off',
    subtitulo: 'em ferramentas elétricas selecionadas',
    categoria: 'Ferramentas',
    acao: { tipo: 'categoria', slug: 'ferramentas', label: 'Ferramentas' },
  },
  {
    badge: 'NOVIDADE',
    badgeClasse: 'bg-white text-lm-green',
    titulo: 'Projeto Guiado',
    subtitulo: 'Descreva sua reforma, a IA monta a lista completa de materiais',
    categoria: 'Construção',
    acao: { tipo: 'link', href: '/projeto' },
  },
  {
    badge: 'PRA VOCÊ',
    badgeClasse: 'bg-white text-lm-green',
    titulo: 'Entrevista guiada',
    subtitulo: 'Responda 5 perguntas e receba sugestões pensadas pra você',
    categoria: 'Decoração',
    acao: { tipo: 'link', href: '/conta' },
  },
  {
    badge: '24H',
    badgeClasse: 'bg-white text-lm-green',
    titulo: 'Tire suas dúvidas',
    subtitulo: 'Pergunte sobre materiais e técnicas antes de comprar, com a IA',
    categoria: 'Jardim',
    acao: { tipo: 'link', href: '/duvidas' },
  },
]

const INTERVALO_MS = 5000

interface BannerCarrosselProps {
  onCategoriaClick: (categoria: { slug: string; label: string }) => void
}

export default function BannerCarrossel({ onCategoriaClick }: BannerCarrosselProps) {
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
  const acao = atual.acao

  const conteudo = (
    <div className="relative h-full flex flex-col justify-center px-6 sm:px-10 max-w-xs sm:max-w-sm">
      <span className={`inline-block w-fit text-[10px] font-extrabold px-2.5 py-1 rounded-md mb-2 tracking-wide ${atual.badgeClasse}`}>
        {atual.badge}
      </span>
      <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">{atual.titulo}</h1>
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
        className="absolute -right-4 -top-2 h-[120%] w-3/5 object-cover"
      />

      {acao.tipo === 'link' ? (
        <Link href={acao.href} className="block h-full">
          {conteudo}
        </Link>
      ) : (
        <div className="h-full cursor-pointer" onClick={() => onCategoriaClick({ slug: acao.slug, label: acao.label })}>
          {conteudo}
        </div>
      )}

      <div className="absolute bottom-3 left-6 sm:left-10 flex items-center gap-1.5 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSlide(i)}
            aria-label={`Slide ${i + 1}`}
            className={`rounded-full transition-all ${i === slide ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/30 hover:bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  )
}
