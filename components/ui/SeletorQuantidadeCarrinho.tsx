'use client'

import { useEffect, useState } from 'react'
import { Minus, Plus, ShoppingCart, Check } from 'lucide-react'
import { getCarrinho, adicionarAoCarrinho, atualizarQuantidade } from '@/lib/clientCarrinho'

interface Props {
  produtoId: string
  estoque: number
  size?: 'sm' | 'lg'
  className?: string
}

// Substitui o antigo botão "Adicionar" -> "Adicionado ✓" (que ficava preso nesse estado
// por 1.5s e, se clicado de novo nesse meio-tempo, duplicava a quantidade sem dar
// feedback nenhum de quantos itens já tinham ido pro carrinho). Agora, assim que o item
// entra no carrinho, o próprio botão vira o stepper +/- com a quantidade visível — mesmo
// padrão visual/funcional do stepper em app/carrinho/page.tsx — então nunca há ambiguidade
// sobre quanto já foi adicionado nem risco de adicionar em duplicidade sem querer.
export default function SeletorQuantidadeCarrinho({ produtoId, estoque, size = 'sm', className = '' }: Props) {
  const [quantidade, setQuantidade] = useState(0)

  useEffect(() => {
    const sincronizar = () => {
      const item = getCarrinho().find(i => i.produtoId === produtoId)
      setQuantidade(item?.quantidade ?? 0)
    }
    sincronizar()
    window.addEventListener('lm-carrinho-change', sincronizar)
    return () => window.removeEventListener('lm-carrinho-change', sincronizar)
  }, [produtoId])

  function mudar(delta: number, e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    const nova = Math.min(Math.max(quantidade + delta, 0), estoque)
    if (nova === quantidade) return
    if (quantidade === 0) {
      adicionarAoCarrinho(produtoId, nova)
    } else {
      atualizarQuantidade(produtoId, nova)
    }
  }

  const alturaBotao = size === 'lg' ? 'w-full py-2.5' : 'px-3 py-1.5'
  const alturaStepper = size === 'lg' ? 'h-10' : 'h-8'

  if (quantidade === 0) {
    return (
      <button
        type="button"
        onClick={e => mudar(1, e)}
        disabled={estoque === 0}
        className={`flex items-center justify-center gap-1.5 text-white font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-lm-dark hover:bg-lm-green ${
          size === 'lg' ? 'text-sm rounded-xl bg-lm-green hover:bg-green-700' : 'text-xs'
        } ${alturaBotao} ${className}`}
      >
        <ShoppingCart size={size === 'lg' ? 15 : 13} />
        {size === 'lg' ? 'Adicionar ao carrinho' : 'Adicionar'}
      </button>
    )
  }

  return (
    <div className={size === 'lg' ? 'w-full' : className} onClick={e => e.stopPropagation()}>
      <p className={`flex items-center gap-1 font-semibold text-lm-green mb-1 ${size === 'lg' ? 'text-[11px]' : 'text-[9px] whitespace-nowrap overflow-hidden text-ellipsis'}`}>
        <Check size={size === 'lg' ? 11 : 9} className="flex-shrink-0" />
        {size === 'lg' ? 'Já adicionado ao carrinho' : 'Já no carrinho'}
      </p>
      <div className={`flex items-center justify-between gap-1 bg-lm-green/10 border border-lm-green/30 rounded-lg ${alturaStepper} ${size === 'lg' ? 'w-full px-2' : `px-1.5 ${className}`}`}>
        <button
          type="button"
          onClick={e => mudar(-1, e)}
          aria-label="Diminuir quantidade"
          className="w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center text-lm-green hover:bg-lm-green/15"
        >
          <Minus size={13} />
        </button>
        <span className="text-sm font-bold text-lm-green flex-1 text-center">{quantidade}</span>
        <button
          type="button"
          onClick={e => mudar(1, e)}
          disabled={quantidade >= estoque}
          aria-label="Aumentar quantidade"
          className="w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center text-lm-green hover:bg-lm-green/15 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  )
}
