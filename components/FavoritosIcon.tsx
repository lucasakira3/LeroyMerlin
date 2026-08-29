'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { getFavoritosIds } from '@/lib/clientFavoritos'

export default function FavoritosIcon() {
  const [quantidade, setQuantidade] = useState(0)

  useEffect(() => {
    setQuantidade(getFavoritosIds().length)
    const atualizar = () => setQuantidade(getFavoritosIds().length)
    window.addEventListener('lm-favoritos-change', atualizar)
    return () => window.removeEventListener('lm-favoritos-change', atualizar)
  }, [])

  return (
    <Link
      href="/conta"
      className="relative flex items-center justify-center w-10 h-10 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
      aria-label={`Favoritos${quantidade > 0 ? ` (${quantidade} ${quantidade === 1 ? 'item' : 'itens'})` : ''}`}
    >
      <Heart size={19} />
      {quantidade > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-lm-yellow text-black text-[10px] font-bold flex items-center justify-center">
          {quantidade > 99 ? '99+' : quantidade}
        </span>
      )}
    </Link>
  )
}
