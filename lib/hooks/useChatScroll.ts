'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Até essa distância (px) do fim a pessoa ainda conta como "acompanhando a conversa".
const MARGEM_DO_FIM = 80
// Folga acima da mensagem quando ela é alinhada no topo da área visível.
const RESPIRO = 12

// Topo da mensagem `indice` medido dentro do conteúdo rolável (não da tela).
function topoDaMensagem(el: HTMLElement, indice: number): number | null {
  const alvo = el.querySelectorAll<HTMLElement>('[data-mensagem]')[indice]
  if (!alvo) return null
  return alvo.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop
}

/**
 * Rolagem automática de chat que não tira do lugar quem está lendo mensagens antigas.
 *
 * Uso: `ref={containerRef}` e `onScroll={onScroll}` na área rolável das mensagens, e
 * `data-mensagem` no elemento de cada mensagem (na ordem da conversa).
 *
 * Regras (valem igual pra mensagem enviada e recebida):
 * - Rola SÓ a área do chat (`scrollTo` nela). O `scrollIntoView` usado antes rolava também
 *   a página inteira: a tela descia até o rodapé a cada mensagem, e até ao abrir o chat.
 * - Quem está acompanhando o fim da conversa vê a mensagem nova a partir do COMEÇO dela —
 *   uma resposta longa não joga a pessoa pro fim do texto.
 * - Quem rolou pra cima pra ler não é movido: a mensagem conta como não lida (`naoLidas`)
 *   e a tela oferece um botão pra ir até ela (`irParaNaoLidas`).
 */
export function useChatScroll(totalMensagens: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const acompanhandoRef = useRef(true)
  const ultimoTopRef = useRef(0)
  const totalAnteriorRef = useRef(totalMensagens)
  const [naoLidas, setNaoLidas] = useState(0)

  // `indice` null = fim da conversa. Com índice, para no topo daquela mensagem — a não ser
  // que ela caiba inteira, aí vai até o fim mesmo.
  const rolarPara = useCallback((indice: number | null, suave: boolean) => {
    const el = containerRef.current
    if (!el) return
    const fim = el.scrollHeight - el.clientHeight
    const topo = indice === null ? null : topoDaMensagem(el, indice)
    const destino = topo === null ? fim : Math.min(fim, Math.max(0, topo - RESPIRO))
    const semAnimacao = !suave || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ top: destino, behavior: semAnimacao ? 'auto' : 'smooth' })
  }, [])

  const onScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const distanciaDoFim = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanciaDoFim <= MARGEM_DO_FIM) {
      acompanhandoRef.current = true
      setNaoLidas(0)
    } else if (el.scrollTop < ultimoTopRef.current) {
      // Só rolagem PRA CIMA desliga o acompanhamento: a animação da rolagem automática
      // (sempre pra baixo) também passa por aqui e não pode ser confundida com a pessoa
      // saindo do fim da conversa.
      acompanhandoRef.current = false
    }
    ultimoTopRef.current = el.scrollTop
  }, [])

  useEffect(() => {
    const anterior = totalAnteriorRef.current
    totalAnteriorRef.current = totalMensagens
    if (totalMensagens === anterior) return
    if (totalMensagens < anterior) {
      // Conversa reiniciada (ex.: trocou de produto no popup).
      acompanhandoRef.current = true
      setNaoLidas(0)
      return
    }
    if (!acompanhandoRef.current) {
      setNaoLidas(n => n + (totalMensagens - anterior))
      return
    }
    // 0 → N é a primeira carga (histórico salvo ou primeira pergunta): direto pro fim.
    if (anterior === 0) rolarPara(null, false)
    else rolarPara(anterior, true)
  }, [totalMensagens, rolarPara])

  const irParaNaoLidas = useCallback(() => {
    acompanhandoRef.current = true
    rolarPara(totalAnteriorRef.current - naoLidas, true)
    setNaoLidas(0)
  }, [naoLidas, rolarPara])

  return { containerRef, onScroll, naoLidas, irParaNaoLidas }
}
