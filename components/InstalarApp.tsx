'use client'

import { useEffect, useState } from 'react'
import { Download, Share } from 'lucide-react'
import {
  abrirJanelaDeInstalacao, aoMudarInstalacao, iniciarInstalacao, jeitoDeInstalar, type JeitoDeInstalar,
} from '@/lib/instalacaoApp'
import { showToast } from '@/lib/toast'

// Montado uma vez no layout raiz; não desenha nada. Liga o que permite instalar o site como
// aplicativo (ver lib/instalacaoApp.ts).
export default function InstalarApp() {
  useEffect(() => iniciarInstalacao(), [])
  return null
}

// Item "Instalar aplicativo" do menu do celular (components/NavBar.tsx). Só aparece quando dá
// pra instalar: some se o site já está instalado ou se o navegador não instala.
export function BotaoInstalarApp() {
  const [jeito, setJeito] = useState<JeitoDeInstalar>(null)
  const [dicaAberta, setDicaAberta] = useState(false)

  useEffect(() => {
    const atualizar = () => setJeito(jeitoDeInstalar())
    atualizar()
    return aoMudarInstalacao(atualizar)
  }, [])

  if (!jeito) return null

  async function instalar() {
    if (jeito === 'iphone') {
      setDicaAberta(v => !v)
      return
    }
    if (await abrirJanelaDeInstalacao()) showToast('Aplicativo instalado. Procure o ícone na tela inicial.')
  }

  return (
    <div>
      <button
        type="button"
        onClick={instalar}
        aria-expanded={jeito === 'iphone' ? dicaAberta : undefined}
        className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 transition-colors"
      >
        <Download size={16} />
        Instalar aplicativo
      </button>
      {dicaAberta && (
        <p className="mx-3 mb-1 px-3 py-2.5 rounded-xl bg-white/10 text-sm text-white leading-relaxed">
          No iPhone: toque em <Share size={14} className="inline -mt-1" aria-label="Compartilhar" />{' '}
          <strong>Compartilhar</strong>, na barra do navegador, e depois em{' '}
          <strong>Adicionar à Tela de Início</strong>.
        </p>
      )}
    </div>
  )
}
