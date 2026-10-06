'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getUsuarioLogado } from '@/lib/clientAuth'
import { getFuncionarioLogado } from '@/lib/funcionarioAuth'
import { consumirPedidoPendente, estaAplicandoRemoto, sincronizar, type Escopo } from '@/lib/sync/motor'

// De quanto em quanto tempo cada um pergunta ao banco "mudou alguma coisa?". O painel do
// funcionário é o que mais precisa parecer ao vivo (pedido novo, pedido de ajuda).
const INTERVALO_MS = { funcionario: 4000, cliente: 6000 }
// Aba aberta e esquecida não fica chamando o servidor pra sempre: depois deste tempo sem
// ninguém mexer, para de perguntar até a pessoa voltar.
const PARADO_DEPOIS_DE_MS = 10 * 60 * 1000

// Eventos que as telas já disparavam ao gravar algo — aproveitados pra mandar a mudança pro
// banco na hora, sem esperar o próximo ciclo do relógio.
const EVENTOS_DE_MUDANCA_LOCAL = [
  'lm-sync-pedir',
  'lm-status-pedido-change',
  'lm-ajuda-corredor-change',
  'lm-conversa-especialista-change',
]

function escopoAtual(pathname: string): Escopo {
  const noPainel = pathname.startsWith('/funcionario') && pathname !== '/funcionario/login'
  if (noPainel && getFuncionarioLogado()) return { papel: 'funcionario' }
  const usuario = getUsuarioLogado()
  return usuario ? { papel: 'cliente', email: usuario.email } : { papel: 'visitante' }
}

// Liga o motor de sincronização (lib/sync/motor.ts) ao ciclo de vida da página. Montado uma
// vez no layout raiz; não desenha nada.
export default function Sincronizador() {
  const pathname = usePathname()

  useEffect(() => {
    let desmontado = false
    let relogio: number | undefined
    let espera: number | undefined
    let ultimaAtividade = Date.now()

    async function rodar() {
      if (desmontado) return
      await sincronizar(escopoAtual(pathname))
      // Algo mudou aqui enquanto o ciclo estava no ar: roda mais um pra não esperar o relógio.
      if (!desmontado && consumirPedidoPendente()) agendarJa()
    }

    function agendarJa() {
      window.clearTimeout(espera)
      espera = window.setTimeout(rodar, 150)
    }

    function proximoCiclo() {
      const escopo = escopoAtual(pathname)
      // Visitante só envia (pedido de ajuda, agendamento) — e isso já chega pelos eventos.
      const intervalo = escopo.papel === 'visitante' ? INTERVALO_MS.cliente * 5 : INTERVALO_MS[escopo.papel]
      relogio = window.setTimeout(async () => {
        const visivel = document.visibilityState === 'visible'
        const emUso = Date.now() - ultimaAtividade < PARADO_DEPOIS_DE_MS
        if (visivel && emUso) await rodar()
        if (!desmontado) proximoCiclo()
      }, intervalo)
    }

    function aoMudarAqui() {
      // O próprio motor dispara esses eventos quando traz algo do banco; isso não é mudança
      // feita neste aparelho.
      if (!estaAplicandoRemoto()) agendarJa()
    }

    function aoVoltar() {
      ultimaAtividade = Date.now()
      if (document.visibilityState === 'visible') agendarJa()
    }

    function aoMexer() {
      const estavaParado = Date.now() - ultimaAtividade >= PARADO_DEPOIS_DE_MS
      ultimaAtividade = Date.now()
      if (estavaParado) agendarJa()
    }

    for (const evento of EVENTOS_DE_MUDANCA_LOCAL) window.addEventListener(evento, aoMudarAqui)
    document.addEventListener('visibilitychange', aoVoltar)
    window.addEventListener('focus', aoVoltar)
    window.addEventListener('online', aoVoltar)
    window.addEventListener('pointerdown', aoMexer, { passive: true })
    window.addEventListener('keydown', aoMexer)

    agendarJa()
    proximoCiclo()

    return () => {
      desmontado = true
      window.clearTimeout(relogio)
      window.clearTimeout(espera)
      for (const evento of EVENTOS_DE_MUDANCA_LOCAL) window.removeEventListener(evento, aoMudarAqui)
      document.removeEventListener('visibilitychange', aoVoltar)
      window.removeEventListener('focus', aoVoltar)
      window.removeEventListener('online', aoVoltar)
      window.removeEventListener('pointerdown', aoMexer)
      window.removeEventListener('keydown', aoMexer)
    }
  }, [pathname])

  return null
}
