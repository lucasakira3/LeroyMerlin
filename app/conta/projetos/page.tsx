'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Route, Trash2, ChevronRight, Sparkles, Wallet, Package } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { getUsuarioLogado } from '@/lib/clientAuth'
import { getProjetos, removerProjeto, resumoProjeto, type ProjetoSalvo } from '@/lib/clientProjetos'
import { showToast } from '@/lib/toast'

const moeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ProjetosPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [projetos, setProjetos] = useState<ProjetoSalvo[] | null>(null)
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)

  useEffect(() => {
    const usuario = getUsuarioLogado()
    if (!usuario) return
    setEmail(usuario.email)
    const recarregar = () => setProjetos(getProjetos(usuario.email))
    recarregar()
    window.addEventListener('lm-projetos-change', recarregar)
    return () => window.removeEventListener('lm-projetos-change', recarregar)
  }, [])

  function remover(id: string) {
    if (!email) return
    removerProjeto(email, id)
    setConfirmandoId(null)
    showToast('Projeto removido')
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Meus projetos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Projetos guiados que você salvou — continue o road map de onde parou.</p>
        </div>
        <Link href="/projeto">
          <Button variant="primary"><Sparkles size={16} /> Novo projeto</Button>
        </Link>
      </div>

      {projetos === null ? (
        <div className="space-y-3">
          {[0, 1].map(i => <div key={i} className="h-28 bg-gray-100 rounded-card animate-pulse" />)}
        </div>
      ) : projetos.length === 0 ? (
        <div className="text-center rounded-card border-2 border-zinc-700 bg-blueprint py-12 px-4">
          <div className="w-14 h-14 rounded-full bg-lm-green text-white flex items-center justify-center mx-auto mb-4 ring-4 ring-[#161b22]">
            <Route size={26} />
          </div>
          <p className="font-bold text-white mb-1">Nenhum projeto salvo ainda</p>
          <p className="text-sm text-white/60 mb-5">Monte um projeto no assistente e clique em “Salvar projeto” para acompanhar aqui.</p>
          <Link href="/projeto"><Button variant="primary">Começar um projeto</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projetos.map(p => {
            const r = resumoProjeto(p)
            const pct = r.totalEtapas > 0 ? Math.round((r.concluidas / r.totalEtapas) * 100) : 0
            return (
              <Card key={p.id} padding="md" className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/conta/projetos/${p.id}`} className="min-w-0 flex-1 group">
                    <p className="text-base font-bold text-gray-900 group-hover:text-lm-green transition-colors truncate">{p.titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.descricao}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Package size={12} /> {r.materiais} materiais</span>
                      {r.total > 0 && <span className="flex items-center gap-1"><Wallet size={12} /> {moeda(r.total)}</span>}
                      <span>Salvo em {new Date(p.criadoEm).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {confirmandoId === p.id ? (
                      <>
                        <button onClick={() => remover(p.id)} className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-2.5 py-1.5 rounded-lg">Remover</button>
                        <button onClick={() => setConfirmandoId(null)} className="text-xs font-semibold text-gray-600 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg">Cancelar</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmandoId(p.id)} aria-label={`Remover ${p.titulo}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                    <Link href={`/conta/projetos/${p.id}`} aria-label={`Abrir ${p.titulo}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-lm-green hover:bg-gray-100 transition-colors">
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                </div>

                {r.totalEtapas > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-gray-600">Road map</span>
                      <span className="text-gray-500">{r.concluidas} de {r.totalEtapas} etapas concluídas</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-lm-green transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
