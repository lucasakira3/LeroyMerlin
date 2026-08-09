'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import ProductCard from '@/components/ProductCard'
import ProductCardSkeleton from '@/components/ProductCardSkeleton'
import { getFavoritosIds } from '@/lib/clientFavoritos'
import { getHistoricoIds } from '@/lib/clientHistorico'
import { getUsuarioLogado, logoutUsuario } from '@/lib/clientAuth'
import type { SearchResult } from '@/types/produto'

async function buscarProdutos(ids: string[]): Promise<SearchResult[]> {
  const respostas = await Promise.all(
    ids.map(async (id) => {
      const resposta = await fetch(`/api/produto/${id}`)
      if (!resposta.ok) return null
      const produto = await resposta.json()
      return { produto, score: 1 } as SearchResult
    })
  )
  return respostas.filter((item): item is SearchResult => item !== null)
}

function SecaoProdutos({
  titulo,
  ids,
  mensagemVazia,
}: {
  titulo: string
  ids: string[]
  mensagemVazia: string
}) {
  const [produtos, setProdutos] = useState<SearchResult[] | null>(null)

  useEffect(() => {
    let cancelado = false
    if (ids.length === 0) {
      setProdutos([])
      return
    }
    buscarProdutos(ids).then((resultado) => {
      if (!cancelado) setProdutos(resultado)
    })
    return () => {
      cancelado = true
    }
  }, [ids])

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{titulo}</h2>
      {produtos === null && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <ProductCardSkeleton key={i} />)}
        </div>
      )}
      {produtos !== null && produtos.length === 0 && (
        <p className="text-sm text-gray-500 py-6">{mensagemVazia}</p>
      )}
      {produtos !== null && produtos.length > 0 && (
        <div className="space-y-3">
          {produtos.map((resultado, i) => (
            <div key={resultado.produto.id} className="animate-fade-in-up" style={{ '--stagger-delay': `${Math.min(i, 15) * 30}ms` } as React.CSSProperties}>
              <ProductCard result={resultado} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default function ContaPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<{ email: string } | null>(null)
  const [favoritosIds, setFavoritosIds] = useState<string[]>([])
  const [historicoIds, setHistoricoIds] = useState<string[]>([])

  useEffect(() => {
    const usuarioLogado = getUsuarioLogado()
    if (!usuarioLogado) {
      router.push('/funcionario/login')
      return
    }
    setUsuario(usuarioLogado)
    setFavoritosIds(getFavoritosIds())
    setHistoricoIds(getHistoricoIds())
  }, [router])

  const handleSair = () => {
    logoutUsuario()
    window.location.href = '/'
  }

  if (!usuario) {
    return null
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <PageHeader
          title="Minha Conta"
          description={`Olá, ${usuario.email}`}
          action={
            <Button variant="ghost" size="sm" onClick={handleSair}>
              <LogOut size={16} />
              Sair
            </Button>
          }
        />
        <SecaoProdutos
          titulo="Favoritos"
          ids={favoritosIds}
          mensagemVazia="Você ainda não favoritou nenhum produto."
        />
        <SecaoProdutos
          titulo="Vistos recentemente"
          ids={historicoIds}
          mensagemVazia="Nenhum produto visitado ainda — suas buscas vão aparecer aqui."
        />
      </div>
    </main>
  )
}
