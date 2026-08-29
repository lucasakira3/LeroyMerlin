import type { Pedido } from './clientPedidos'

// Um Pedido já é um instantâneo autocontido (nome/preço travados no momento da compra,
// ver clientPedidos.ts) — diferente de listaCompartilhada.ts, não precisa resolver ids
// contra o catálogo atual, então o link funciona mesmo se o produto sair do catálogo
// depois. Mesma técnica de codificação (base64 com escape/unescape pra aguentar UTF-8).
export function codificarPedido(pedido: Pedido): string {
  const json = JSON.stringify(pedido)
  return btoa(unescape(encodeURIComponent(json)))
}

export function decodificarPedido(codificado: string): Pedido | null {
  try {
    const json = decodeURIComponent(escape(atob(codificado)))
    const dados = JSON.parse(json)
    if (
      !dados ||
      typeof dados.numero !== 'string' ||
      typeof dados.data !== 'string' ||
      !Array.isArray(dados.itens) ||
      typeof dados.total !== 'number'
    ) {
      return null
    }
    return dados as Pedido
  } catch {
    return null
  }
}
