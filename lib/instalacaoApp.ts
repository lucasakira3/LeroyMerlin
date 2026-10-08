// Instalar o site como aplicativo (ícone na tela inicial do celular).
//
// O navegador avisa UMA vez, logo que a página abre, que o site pode ser instalado (evento
// `beforeinstallprompt`, do Chrome/Edge no Android e no computador). O botão "Instalar
// aplicativo" fica dentro do menu do celular, que só existe na tela depois de aberto — então
// quem escuta o aviso é este módulo, ligado no layout raiz (components/InstalarApp.tsx), e o
// botão só pergunta aqui se dá pra instalar.
//
// No iPhone o Safari não tem esse aviso nem janela de instalação: o caminho é pelo botão
// Compartilhar. Lá o botão do menu mostra a instrução em vez de abrir uma janela.

// O evento ainda não está nos tipos do TypeScript.
interface EventoDeInstalacao extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type JeitoDeInstalar = 'janela' | 'iphone' | null

const EVENTO_MUDOU = 'lm-instalacao-change'
let eventoGuardado: EventoDeInstalacao | null = null

function jaInstalado(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function ehIphone(): boolean {
  const ua = navigator.userAgent
  // iPad recente se apresenta como Mac; o que o entrega é ter tela de toque.
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
}

export function jeitoDeInstalar(): JeitoDeInstalar {
  if (typeof window === 'undefined' || jaInstalado()) return null
  if (eventoGuardado) return 'janela'
  return ehIphone() ? 'iphone' : null
}

// Abre a janela de instalação do navegador. Devolve se a pessoa aceitou.
export async function abrirJanelaDeInstalacao(): Promise<boolean> {
  const evento = eventoGuardado
  if (!evento) return false
  await evento.prompt()
  const { outcome } = await evento.userChoice
  // O navegador só deixa usar o evento uma vez.
  eventoGuardado = null
  window.dispatchEvent(new Event(EVENTO_MUDOU))
  return outcome === 'accepted'
}

export function aoMudarInstalacao(callback: () => void): () => void {
  window.addEventListener(EVENTO_MUDOU, callback)
  return () => window.removeEventListener(EVENTO_MUDOU, callback)
}

// Chamado uma vez pelo layout raiz. Devolve a função que desliga tudo.
export function iniciarInstalacao(): () => void {
  // Só no site publicado: em desenvolvimento um service worker atrapalha o recarregamento
  // automático das telas.
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }

  const aoPoderInstalar = (e: Event) => {
    // Sem isto o Chrome mostra a própria faixa de instalação por cima da tela.
    e.preventDefault()
    eventoGuardado = e as EventoDeInstalacao
    window.dispatchEvent(new Event(EVENTO_MUDOU))
  }
  const aoInstalar = () => {
    eventoGuardado = null
    window.dispatchEvent(new Event(EVENTO_MUDOU))
  }
  window.addEventListener('beforeinstallprompt', aoPoderInstalar)
  window.addEventListener('appinstalled', aoInstalar)
  return () => {
    window.removeEventListener('beforeinstallprompt', aoPoderInstalar)
    window.removeEventListener('appinstalled', aoInstalar)
  }
}
