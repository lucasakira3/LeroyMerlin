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
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Orçamento faz parte do fluxo: fica na mesma largura do assistente, logo acima */}
      <TermometroOrcamento />

      <Card padding="none" className="flex flex-col overflow-hidden lg:min-h-[640px]">
        <div className="border-b border-gray-500 px-4 py-3 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-lm-green animate-pulse" />
          <div>
            <p className="text-sm font-semibold text-lm-dark">Assistente de Projetos</p>
            <p className="text-xs text-gray-500">Powered by Gemini · monta sua lista de materiais</p>
          </div>
        </div>

        <ProjetoWizard />
      </Card>

      {/* Ferramentas de apoio — linha de atalhos abaixo do assistente (antes eram uma coluna
          solta e pequena ao lado, que sobrava vazia e apertava o resultado) */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Ferramentas para o seu projeto
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FERRAMENTAS.map(ferramenta => (
            <button
              key={ferramenta.id}
              type="button"
              onClick={() => setFerramentaAberta(ferramenta.id)}
              className="group flex items-center gap-4 text-left rounded-card border border-gray-500 bg-white p-4 hover:border-lm-green/50 hover:shadow-soft transition-all"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 group-hover:-rotate-3 ${ferramenta.bg}`}>
                <ferramenta.icone size={28} className={ferramenta.cor} strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-lm-dark">{ferramenta.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{ferramenta.texto}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

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
