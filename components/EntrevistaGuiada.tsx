'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, RotateCcw } from 'lucide-react'
import Card from './ui/Card'
import Button from './ui/Button'
import ProductListItem from './ProductListItem'
import { getPerfil, salvarPerfil } from '@/lib/clientPerfil'
import { adicionarNotificacao } from '@/lib/clientNotificacoes'
import type { Perfil, Moradia, Experiencia, Area, Orcamento, SustentabilidadePreferencia, ServicoSugerido } from '@/types/perfil'
import type { SearchResult } from '@/types/produto'

const MORADIAS: Moradia[] = ['Casa', 'Apartamento', 'Sítio ou chácara', 'Comércio']
const EXPERIENCIAS: Experiencia[] = ['Iniciante', 'Intermediário', 'Avançado', 'Prefiro contratar um profissional']
const AREAS: Area[] = ['Cozinha', 'Banheiro', 'Quarto', 'Sala', 'Jardim ou área externa', 'Elétrica', 'Iluminação', 'Pintura']
const ORCAMENTOS: Orcamento[] = ['Até R$100', 'R$100–300', 'R$300–600', 'Acima de R$600']
const SUSTENTABILIDADES: SustentabilidadePreferencia[] = ['Pouco importante', 'Importante, mas não decisivo', 'Muito importante']

const MAX_AREAS = 3
const MAX_PRODUTOS_EXIBIDOS = 10

interface ChipProps {
  label: string
  selecionado: boolean
  onClick: () => void
  disabled?: boolean
}

function Chip({ label, selecionado, onClick, disabled }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selecionado}
      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
        selecionado
          ? 'bg-lm-green text-white border-lm-green'
          : disabled
            ? 'bg-white text-gray-300 border-gray-100 cursor-not-allowed'
            : 'bg-white text-gray-500 border-gray-200 hover:border-lm-green/40'
      }`}
    >
      {label}
    </button>
  )
}

interface Resposta {
  moradia: Moradia | null
  experiencia: Experiencia | null
  areas: Area[]
  orcamento: Orcamento | null
  sustentabilidade: SustentabilidadePreferencia | null
}

const RESPOSTA_VAZIA: Resposta = {
  moradia: null,
  experiencia: null,
  areas: [],
  orcamento: null,
  sustentabilidade: null,
}

function respostaCompleta(r: Resposta): boolean {
  return !!(r.moradia && r.experiencia && r.areas.length > 0 && r.orcamento && r.sustentabilidade)
}

export default function EntrevistaGuiada({ email }: { email: string }) {
  const [modo, setModo] = useState<'convite' | 'formulario' | 'carregando' | 'resultado'>(
    () => (getPerfil(email) ? 'carregando' : 'convite')
  )
  const [resposta, setResposta] = useState<Resposta>(RESPOSTA_VAZIA)
  const [produtos, setProdutos] = useState<SearchResult[]>([])
  const [servicos, setServicos] = useState<ServicoSugerido[]>([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    const perfil = getPerfil(email)
    if (perfil) {
      buscarSugestoes(perfil)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  async function buscarSugestoes(perfil: Perfil) {
    setModo('carregando')
    setErro('')
    try {
      const res = await fetch('/api/perfil/sugestoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfil }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (data.error) throw new Error()
      setProdutos(data.produtos)
      setServicos(data.servicos)
      setModo('resultado')
    } catch {
      setErro('Não foi possível gerar sugestões. Tente novamente.')
      setModo('resultado')
    }
  }

  function toggleArea(area: Area) {
    setResposta(prev => {
      const jaSelecionada = prev.areas.includes(area)
      if (jaSelecionada) return { ...prev, areas: prev.areas.filter(a => a !== area) }
      if (prev.areas.length >= MAX_AREAS) return prev
      return { ...prev, areas: [...prev.areas, area] }
    })
  }

  function enviar() {
    if (!respostaCompleta(resposta)) return
    const perfil: Perfil = {
      moradia: resposta.moradia!,
      experiencia: resposta.experiencia!,
      areas: resposta.areas,
      orcamento: resposta.orcamento!,
      sustentabilidade: resposta.sustentabilidade!,
      respondidoEm: new Date().toISOString(),
    }
    salvarPerfil(email, perfil)
    try {
      adicionarNotificacao(email, {
        tipo: 'entrevista',
        titulo: 'Perfil traçado',
        mensagem: 'Suas sugestões personalizadas já estão disponíveis.',
        href: '/conta',
      })
    } catch {}
    buscarSugestoes(perfil)
  }

  function refazer() {
    setResposta(RESPOSTA_VAZIA)
    setModo('formulario')
  }

  if (modo === 'convite') {
    return (
      <Card className="bg-lm-green/5 border-lm-green/20">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-lm-green" />
          <h2 className="text-sm font-bold text-gray-900">Entrevista guiada</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Responda 5 perguntas rápidas e receba sugestões de produtos e serviços pensadas pra você.
        </p>
        <Button variant="primary" size="sm" onClick={() => setModo('formulario')}>
          Começar entrevista
        </Button>
      </Card>
    )
  }

  if (modo === 'formulario') {
    return (
      <Card>
        <h2 className="text-sm font-bold text-gray-900 mb-4">Entrevista guiada</h2>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Qual é o seu tipo de moradia?</p>
            <div className="flex flex-wrap gap-2">
              {MORADIAS.map(m => (
                <Chip key={m} label={m} selecionado={resposta.moradia === m} onClick={() => setResposta(prev => ({ ...prev, moradia: m }))} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Qual seu nível de experiência com reforma/manutenção?</p>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCIAS.map(e => (
                <Chip key={e} label={e} selecionado={resposta.experiencia === e} onClick={() => setResposta(prev => ({ ...prev, experiencia: e }))} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Quais áreas você mais quer melhorar agora? (até 3)</p>
            <div className="flex flex-wrap gap-2">
              {AREAS.map(a => (
                <Chip
                  key={a}
                  label={a}
                  selecionado={resposta.areas.includes(a)}
                  onClick={() => toggleArea(a)}
                  disabled={!resposta.areas.includes(a) && resposta.areas.length >= MAX_AREAS}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Quanto você costuma investir por produto?</p>
            <div className="flex flex-wrap gap-2">
              {ORCAMENTOS.map(o => (
                <Chip key={o} label={o} selecionado={resposta.orcamento === o} onClick={() => setResposta(prev => ({ ...prev, orcamento: o }))} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">O quanto sustentabilidade pesa nas suas escolhas?</p>
            <div className="flex flex-wrap gap-2">
              {SUSTENTABILIDADES.map(s => (
                <Chip key={s} label={s} selecionado={resposta.sustentabilidade === s} onClick={() => setResposta(prev => ({ ...prev, sustentabilidade: s }))} />
              ))}
            </div>
          </div>
        </div>

        <Button variant="primary" className="mt-5 w-full" onClick={enviar} disabled={!respostaCompleta(resposta)}>
          Ver sugestões
        </Button>
      </Card>
    )
  }

  if (modo === 'carregando') {
    return (
      <Card className="text-center">
        <div className="flex justify-center mb-3">
          <div className="w-10 h-10 border-4 border-lm-green/20 border-t-lm-green rounded-full animate-spin" />
        </div>
        <p className="text-sm font-semibold text-gray-900">Montando suas sugestões...</p>
      </Card>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Sugestões pra você</h2>
        <Button variant="ghost" size="sm" onClick={refazer}>
          <RotateCcw size={14} /> Refazer entrevista
        </Button>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 mb-4">{erro}</div>
      )}

      {!erro && servicos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {servicos.map(s => (
            <Link
              key={s.href}
              href={s.href}
              className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-lm-green/40 transition-colors"
            >
              <p className="text-sm font-semibold text-gray-900">{s.titulo}</p>
              <p className="text-xs text-gray-500 mt-1">{s.descricao}</p>
            </Link>
          ))}
        </div>
      )}

      {!erro && produtos.length === 0 && (
        <p className="text-sm text-gray-500 py-6">
          Nenhum produto encontrado pro seu perfil ainda — tente outras áreas na próxima entrevista.
        </p>
      )}

      {!erro && produtos.length > 0 && (
        <div className="space-y-2">
          {produtos.slice(0, MAX_PRODUTOS_EXIBIDOS).map(({ produto }, i) => (
            <ProductListItem
              key={produto.id}
              produto={produto}
              href={`/produto/${produto.id}`}
              className="animate-fade-in-up"
              style={{ '--stagger-delay': `${Math.min(i, 15) * 30}ms` } as React.CSSProperties}
            />
          ))}
        </div>
      )}
    </section>
  )
}
