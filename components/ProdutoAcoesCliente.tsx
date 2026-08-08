'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { addAoHistorico } from '@/lib/clientHistorico'
import { isFavorito, toggleFavorito } from '@/lib/clientFavoritos'

interface ProdutoAcoesClienteProps {
  produtoId: string
}

export default function ProdutoAcoesCliente({ produtoId }: ProdutoAcoesClienteProps) {
  const [favorito, setFavorito] = useState(false)

  useEffect(() => {
    addAoHistorico(produtoId)
    setFavorito(isFavorito(produtoId))
  }, [produtoId])

  return (
    <button
      type="button"
      onClick={() => setFavorito(toggleFavorito(produtoId))}
      aria-label={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      aria-pressed={favorito}
      className="shrink-0 p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
    >
      <Heart size={20} className={favorito ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
    </button>
  )
}
