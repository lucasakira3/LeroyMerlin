'use client'

import { useState } from 'react'
import { Sparkles, RotateCcw, ClipboardCheck } from 'lucide-react'
import Card from './ui/Card'
import Button from './ui/Button'
import { getPerfil, salvarPerfil } from '@/lib/clientPerfil'
import type { Perfil, Moradia, Experiencia, Area, Orcamento, SustentabilidadePreferencia } from '@/types/perfil'

const MORADIAS: Moradia[] = ['Casa', 'Apartamento', 'Sítio ou chácara', 'Comércio']
const EXPERIENCIAS: Experiencia[] = ['Iniciante', 'Intermediário', 'Avançado', 'Prefiro contratar um profissional']
const AREAS: Area[] = ['Cozinha', 'Banheiro', 'Quarto', 'Sala', 'Jardim ou área externa', 'Elétrica', 'Iluminação', 'Pintura']
const ORCAMENTOS: Orcamento[] = ['Até R$100', 'R$100–300', 'R$300–600', 'Acima de R$600']
const SUSTENTABILIDADES: SustentabilidadePreferencia[] = ['Pouco importante', 'Importante, mas não decisivo', 'Muito importante']

const MAX_AREAS = 3

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
            ? 'bg-white text-gray-300 border-gray-200 dark:border-gray-500 cursor-not-allowed'
            : 'bg-white text-gray-700 border-gray-200 dark:border-gray-500 hover-verde'
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

// Entrevista de perfil da tela Minha conta › Visão geral (app/conta/page.tsx). É o passo 1
// do "complete seu perfil", e a faixa de orçamento respondida vira o orçamento padrão do
// termômetro do carrinho (components/TermometroOrcamento.tsx).
// Até 18/10/2026 ela terminava numa lista "Sugestões pra você" (produtos e serviços via
// /api/perfil/sugestoes); o usuário pediu pra tirar. Respondida, agora vira uma linha só, com
// "Refazer".
export default function EntrevistaGuiada({ email }: { email: string }) {
  const [modo, setModo] = useState<'convite' | 'formulario' | 'respondida'>(
    () => (getPerfil(email) ? 'respondida' : 'convite')
  )
  const [resposta, setResposta] = useState<Resposta>(RESPOSTA_VAZIA)

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
    setModo('respondida')
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
        <p className="text-sm text-gray-700 mb-3">
          Responda 5 perguntas rápidas sobre sua casa e seus projetos.
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
          Salvar respostas
        </Button>
      </Card>
    )
  }

  // Respondida: uma linha só, com a data e o botão de refazer.
  const respondidoEm = getPerfil(email)?.respondidoEm
  return (
    <Card padding="sm" className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <p className="flex items-center gap-2 text-sm text-gray-700">
        <ClipboardCheck size={16} className="text-lm-green flex-shrink-0" />
        Entrevista de perfil respondida{respondidoEm ? ` em ${new Date(respondidoEm).toLocaleDateString('pt-BR')}` : ''}.
      </p>
      <Button variant="ghost" size="sm" onClick={refazer}>
        <RotateCcw size={14} /> Refazer
      </Button>
    </Card>
  )
}
