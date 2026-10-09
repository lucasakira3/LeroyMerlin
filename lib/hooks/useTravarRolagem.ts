import { useEffect } from 'react'

// Enquanto `ativo`, a página de trás não rola. Usado pelas janelas que abrem por cima da tela
// (ficha do produto, components/ui/Modal.tsx): sem isso, girar a rodinha do mouse ou arrastar
// o dedo com a janela aberta rolava a página de trás em vez do conteúdo da janela.
//
// Travar a rolagem faz a barra de rolagem da página sumir, e a tela inteira "pularia" alguns
// pixels pro lado; a folga à direita, do tamanho da barra, segura tudo no lugar.
// Guarda e devolve o que havia antes, então uma janela aberta de dentro de outra não destrava
// a página quando só a de cima fecha.
export function useTravarRolagem(ativo: boolean): void {
  useEffect(() => {
    if (!ativo) return
    const corpo = document.body
    const antes = { overflow: corpo.style.overflow, paddingRight: corpo.style.paddingRight }
    const larguraDaBarra = window.innerWidth - document.documentElement.clientWidth
    corpo.style.overflow = 'hidden'
    if (larguraDaBarra > 0) corpo.style.paddingRight = `${larguraDaBarra}px`
    return () => {
      corpo.style.overflow = antes.overflow
      corpo.style.paddingRight = antes.paddingRight
    }
  }, [ativo])
}
