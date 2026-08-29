'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import StarRating from '@/components/ui/StarRating'
import {
  getAvaliacoesDoUsuario,
  salvarAvaliacao,
  removerAvaliacao,
  type AvaliacaoComProduto,
} from '@/lib/clientAvaliacoes'
import { getUsuarioLogado } from '@/lib/clientAuth'
import { buscarProdutosPorIds, type ProdutoResolvido } from '@/lib/produtosCliente'
import { getImagemCategoria } from '@/lib/categoriaImagens'
import { showToast } from '@/lib/toast'

export default function MinhasAvaliacoesPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoComProduto[] | null>(null)
  const [produtos, setProdutos] = useState<Record<string, ProdutoResolvido>>({})

  useEffect(() => {
    const usuario = getUsuarioLogado()
    if (!usuario) {
      router.push('/funcionario/login')
      return
    }
    setEmail(usuario.email)
    carregar(usuario.email)
  }, [router])

  async function carregar(usuarioEmail: string) {
    const minhas = getAvaliacoesDoUsuario(usuarioEmail)
    setAvaliacoes(minhas)
    const resolvidos = await buscarProdutosPorIds(minhas.map(a => a.produtoId))
    const mapa: Record<string, ProdutoResolvido> = {}
    for (const p of resolvidos) mapa[p.id] = p
    setProdutos(mapa)
  }

  function remover(avaliacao: AvaliacaoComProduto) {
    if (!email) return
    removerAvaliacao(avaliacao.produtoId, email)
    setAvaliacoes(prev => prev?.filter(a => a.produtoId !== avaliacao.produtoId) ?? null)
    showToast('Avaliação removida', () => {
      salvarAvaliacao(avaliacao.produtoId, email, avaliacao.nota, avaliacao.comentario, avaliacao.foto)
      carregar(email)
    })
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link href="/conta" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-lm-green mb-4">
          <ArrowLeft size={15} /> Voltar pra Minha Conta
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Minhas avaliações</h1>
        <p className="text-sm text-gray-500 mb-6">Notas e comentários que você deixou em produtos</p>

        {avaliacoes === null && (
          <p className="text-sm text-gray-400 py-8">Carregando...</p>
        )}

        {avaliacoes !== null && avaliacoes.length === 0 && (
          <p className="text-sm text-gray-500 py-8">Você ainda não avaliou nenhum produto.</p>
        )}

        {avaliacoes !== null && avaliacoes.length > 0 && (
          <div className="space-y-3">
            {avaliacoes.map(avaliacao => {
              const produto = produtos[avaliacao.produtoId]
              if (!produto) return null
              return (
                <div key={avaliacao.produtoId} className="flex gap-3 bg-white rounded-card shadow-soft border border-gray-100 p-4">
                  <img
                    src={getImagemCategoria(produto.categoria, produto.id)}
                    alt={produto.categoria}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/produto/${produto.id}`} className="text-sm font-semibold text-gray-900 hover:text-lm-green truncate">
                        {produto.produto}
                      </Link>
                      <button
                        type="button"
                        onClick={() => remover(avaliacao)}
                        aria-label="Remover avaliação"
                        className="p-1 text-gray-300 hover:text-red-500 flex-shrink-0 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1 mb-1.5">
                      <StarRating value={avaliacao.nota} size={13} />
                      <span className="text-xs text-gray-400">
                        {new Date(avaliacao.data).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {avaliacao.comentario && (
                      <p className="text-sm text-gray-600 leading-relaxed">{avaliacao.comentario}</p>
                    )}
                    {avaliacao.foto && (
                      <img
                        src={avaliacao.foto}
                        alt="Foto enviada na avaliação"
                        className="w-16 h-16 rounded-lg object-cover mt-2"
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
