'use client'

import { useState } from 'react'
import { Ruler, Scale, Calculator } from 'lucide-react'
import ProjetoWizard from '@/components/ProjetoWizard'
import TermometroOrcamento from '@/components/TermometroOrcamento'
import ReguaVirtual from '@/components/ReguaVirtual'
import ComparadorFerramenta from '@/components/ComparadorFerramenta'
import CalculadoraMateriais from '@/components/CalculadoraMateriais'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'

const FERRAMENTAS = [
  { id: 'regua', icone: Ruler, label: 'Régua virtual', texto: 'Estime medidas por foto', bg: 'bg-lm-green/10', cor: 'text-lm-green' },
  { id: 'comparador', icone: Scale, label: 'Comparador de produtos', texto: 'Compare até 3 produtos lado a lado', bg: 'bg-lm-yellow/20', cor: 'text-yellow-700' },
  { id: 'calculadora', icone: Calculator, label: 'Calculadora de materiais', texto: 'Tinta, piso, cimento e papel de parede', bg: 'bg-blue-500/10', cor: 'text-blue-600' },
] as const

// A pedido do usuário: as ferramentas abrem num popup por cima do Projeto Guiado (o
// cliente usa a régua/o comparador e já vê o resultado ali mesmo), em vez de navegar pra
// /medir ou /comparar — tudo centralizado nesta tela. O comparador ganhou um seletor de
// produtos dentro do próprio popup (busca na loja inteira, carrinho ou favoritos), ver
// components/ComparadorFerramenta.tsx — sem isso o popup abriria vazio, já que antes só
// dava pra montar o comparador escolhendo produtos em telas fora do Projeto Guiado.
export default function ProjetoPage() {
  const [ferramentaAberta, setFerramentaAberta] = useState<'regua' | 'comparador' | 'calculadora' | null>(null)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mb-6">
        <TermometroOrcamento />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-8 lg:items-start">
        {/* Chat — a bancada, expandida */}
        <Card padding="none" className="flex flex-col overflow-hidden lg:min-h-[640px]">
          <div className="border-b border-gray-100 px-4 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-lm-green animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-lm-dark">Assistente de Projetos</p>
              <p className="text-xs text-gray-500">Powered by Gemini · monta sua lista de materiais</p>
            </div>
          </div>

          <ProjetoWizard />
        </Card>

        {/* Ferramentas — soltas, ao lado da bancada */}
        <div className="flex flex-col items-center gap-10 pt-4 lg:sticky lg:top-6 lg:self-start">
          {FERRAMENTAS.map(ferramenta => (
            <button
              key={ferramenta.id}
              type="button"
              onClick={() => setFerramentaAberta(ferramenta.id)}
              className="group flex flex-col items-center text-center gap-3 w-full"
            >
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 group-hover:-rotate-3 ${ferramenta.bg}`}>
                <ferramenta.icone size={36} className={ferramenta.cor} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-bold text-lm-dark">{ferramenta.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 max-w-[160px]">{ferramenta.texto}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Modal
        open={ferramentaAberta === 'regua'}
        onClose={() => setFerramentaAberta(null)}
        title="Régua virtual"
        maxWidthClass="md:max-w-2xl"
      >
        <div className="p-6">
          <ReguaVirtual />
        </div>
      </Modal>

      <Modal
        open={ferramentaAberta === 'comparador'}
        onClose={() => setFerramentaAberta(null)}
        title="Comparador de produtos"
        maxWidthClass="md:max-w-6xl"
        minHeightClass="md:min-h-[680px]"
      >
        <ComparadorFerramenta />
      </Modal>

      <Modal
        open={ferramentaAberta === 'calculadora'}
        onClose={() => setFerramentaAberta(null)}
        title="Calculadora de materiais"
        maxWidthClass="md:max-w-4xl"
        minHeightClass="md:min-h-[560px]"
      >
        <CalculadoraMateriais />
      </Modal>
    </div>
  )
}
