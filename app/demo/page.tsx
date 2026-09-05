'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, PlayCircle, Trash2, ArrowRight, Copy, Check } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ativarModoDemo, desativarModoDemo, DEMO_EMAIL, DEMO_SENHA } from '@/lib/demoSeed'

const ROTEIRO = [
  { tela: 'Home', mostrar: 'Busca inteligente, categorias, vitrine de ofertas' },
  { tela: '/conta', mostrar: 'Conta já logada, favoritos, pedido anterior, avaliação com foto, endereço salvo' },
  { tela: '/carrinho', mostrar: 'Termômetro de orçamento sugerindo troca de item + "Ver rota no mapa" (3 corredores)' },
  { tela: 'Popup de um produto', mostrar: 'Chat com IA, verificar compatibilidade por foto, comparar' },
  { tela: '/projeto', mostrar: 'Projeto guiado (IA monta lista de materiais) + régua virtual' },
  { tela: '/funcionario/login', mostrar: 'Painel do funcionário — dashboard, estoque com filtros, chamados' },
]

export default function DemoPage() {
  const [ativo, setAtivo] = useState(false)
  const [copiado, setCopiado] = useState(false)

  function ativar() {
    ativarModoDemo()
    setAtivo(true)
  }

  function desativar() {
    desativarModoDemo()
    setAtivo(false)
  }

  function copiarCredenciais() {
    navigator.clipboard?.writeText(`${DEMO_EMAIL} / ${DEMO_SENHA}`).catch(() => {})
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-2xl mx-auto">
      <PageHeader
        title="Modo Demo"
        description="Popula o app com dados prontos pra gravar o pitch sem digitar nada ao vivo."
      />

      <Card className="mb-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-lm-green/10 flex items-center justify-center text-lm-green flex-shrink-0">
            <Sparkles size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              Cria uma conta de demonstração já logada, com carrinho, favoritos, pedido anterior, avaliação,
              endereço e perfil respondido — tudo coerente entre si (o carrinho e o orçamento estão calibrados
              pra mostrar o Termômetro de Orçamento sugerindo uma troca de verdade).
            </p>
            <p className="text-xs text-amber-600 mt-2">
              Isso substitui os dados atuais deste navegador (carrinho, favoritos etc.) — não use numa sessão que
              você queira manter.
            </p>
          </div>
        </div>
      </Card>

      {!ativo ? (
        <Button onClick={ativar}>
          <PlayCircle size={16} />
          Ativar modo demo
        </Button>
      ) : (
        <div className="space-y-4">
          <Card className="bg-lm-green/5 border-lm-green/20">
            <p className="text-sm font-bold text-lm-green mb-2">Modo demo ativado</p>
            <p className="text-xs text-gray-600 mb-2">
              Login: <strong>{DEMO_EMAIL}</strong> / <strong>{DEMO_SENHA}</strong>
              {' '}(guarde caso precise logar de novo durante a gravação)
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={copiarCredenciais}>
                {copiado ? <Check size={13} /> : <Copy size={13} />}
                {copiado ? 'Copiado' : 'Copiar login'}
              </Button>
              <Link href="/">
                <Button size="sm">
                  Ir pra home <ArrowRight size={13} />
                </Button>
              </Link>
            </div>
          </Card>

          <Card>
            <p className="text-sm font-bold text-gray-900 mb-3">Roteiro sugerido</p>
            <ol className="space-y-2.5">
              {ROTEIRO.map((passo, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span className="font-bold text-lm-green flex-shrink-0">{i + 1}.</span>
                  <span>
                    <span className="font-semibold text-gray-900">{passo.tela}</span>
                    <span className="text-gray-500"> — {passo.mostrar}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>

          <button
            type="button"
            onClick={desativar}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500"
          >
            <Trash2 size={13} />
            Desativar modo demo (limpa tudo de novo)
          </button>
        </div>
      )}
    </div>
  )
}
