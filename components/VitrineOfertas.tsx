'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getImagemCategoria } from '@/lib/categoriaImagens'
import { SLUG_POR_LABEL } from '@/lib/categorias'

interface DestaqueCategoria {
  slug: string
  label: string
  maxDesconto: number
}

interface OfertaResumo {
  categoria: string
  percentualDesconto: number
}

export default function VitrineOfertas() {
  const [destaques, setDestaques] = useState<DestaqueCategoria[] | null>(null)

  useEffect(() => {
    fetch('/api/ofertas')
      .then(r => r.json())
      .then((produtos: OfertaResumo[]) => {
        const maxPorCategoria = new Map<string, number>()
        for (const p of produtos) {
          const atual = maxPorCategoria.get(p.categoria) ?? 0
          if (p.percentualDesconto > atual) maxPorCategoria.set(p.categoria, p.percentualDesconto)
        }

        const ranking = [...maxPorCategoria.entries()]
          .map(([label, maxDesconto]) => {
            const slug = SLUG_POR_LABEL[label]
            return slug ? { slug, label, maxDesconto } : null
          })
          .filter((d): d is DestaqueCategoria => d !== null)
          .sort((a, b) => b.maxDesconto - a.maxDesconto)
          .slice(0, 4)

        setDestaques(ranking)
      })
      .catch(() => setDestaques([]))
  }, [])

  if (!destaques || destaques.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
        Ofertas em destaque
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {destaques.map(({ slug, label, maxDesconto }) => (
          <Link
            key={slug}
            href={`/ofertas?categoria=${slug}`}
            className="group relative rounded-card overflow-hidden h-32 hover:shadow-soft transition-shadow"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getImagemCategoria(label)}
              alt={label}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
            <div className="relative h-full flex flex-col justify-center px-6">
              <span className="text-white text-lg font-black leading-tight">{label}</span>
              <span className="text-lm-yellow text-sm font-bold">até {maxDesconto}% de desconto</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
