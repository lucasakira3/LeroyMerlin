'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import ListaDeCompras from '@/components/ListaDeCompras'
import { getUsuarioLogado } from '@/lib/clientAuth'
import { getProjeto, type ProjetoSalvo } from '@/lib/clientProjetos'

// Reabre um projeto salvo: mesma tela de resultado do Projeto Guiado (ListaDeCompras), mas
// começando do progresso guardado — produtos escolhidos e etapas do road map concluídas —
// e gravando de volta cada mudança (ver ListaDeCompras, prop `projetoSalvo`).
export default function ProjetoSalvoPage() {
  const { id } = useParams<{ id: string }>()
  const [projeto, setProjeto] = useState<ProjetoSalvo | null | undefined>(undefined)

  useEffect(() => {
    const usuario = getUsuarioLogado()
    if (!usuario) return
    setProjeto(getProjeto(usuario.email, id))
  }, [id])

  return (
    <div>
      <Link href="/conta/projetos" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-lm-green transition-colors mb-4">
        <ArrowLeft size={16} /> Meus projetos
      </Link>

      {projeto === undefined ? (
        <div className="h-64 bg-gray-100 rounded-card animate-pulse" />
      ) : projeto === null ? (
        <p className="text-sm text-gray-500 py-10 text-center">Projeto não encontrado. Ele pode ter sido removido.</p>
      ) : (
        <ListaDeCompras projeto={projeto.projeto} descricaoOriginal={projeto.descricao} projetoSalvo={projeto} />
      )}
    </div>
  )
}
