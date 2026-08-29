// Pub-sub simples pra um único toast global (montado uma vez em app/layout.tsx, ver
// components/UndoToast.tsx) — qualquer componente pode chamar showToast sem precisar de
// contexto React ou prop drilling, mesmo padrão de espírito dos eventos 'lm-*-change'
// já usados em lib/clientCarrinho.ts/clientFavoritos.ts, só que carregando uma função de
// callback (o "desfazer"), não só um sinal de mudança.
type Listener = (toast: ToastState | null) => void

export interface ToastState {
  message: string
  onUndo?: () => void
}

let listener: Listener | null = null

export function showToast(message: string, onUndo?: () => void): void {
  listener?.({ message, onUndo })
}

export function subscribeToast(fn: Listener): () => void {
  listener = fn
  return () => {
    if (listener === fn) listener = null
  }
}
