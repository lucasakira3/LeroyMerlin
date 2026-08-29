// Sem backend: a lista inteira vira uma URL (base64 na própria query string), lida direto
// pela página /lista. Só funciona pra listas pequenas (poucos ids de produto), não escala
// pra payloads grandes — mas dispensa qualquer banco/storage do lado do servidor.
export interface ListaCompartilhadaDados {
  titulo: string
  loja: string
  produtoIds: string[]
}

// btoa/atob só lidam com Latin1 — encodeURIComponent+unescape (e o par decodeURIComponent+
// escape na volta) é o jeito padrão de fazer base64 aguentar UTF-8 (acentos no título/loja)
// sem quebrar. `escape`/`unescape` são deprecated pro uso normal, mas esse é o uso correto
// deles (conversão de byte, não de URL).
export function codificarLista(dados: ListaCompartilhadaDados): string {
  const json = JSON.stringify(dados)
  return btoa(unescape(encodeURIComponent(json)))
}

export function decodificarLista(codificado: string): ListaCompartilhadaDados | null {
  try {
    const json = decodeURIComponent(escape(atob(codificado)))
    const dados = JSON.parse(json)
    if (
      !dados ||
      typeof dados.titulo !== 'string' ||
      typeof dados.loja !== 'string' ||
      !Array.isArray(dados.produtoIds) ||
      !dados.produtoIds.every((id: unknown) => typeof id === 'string')
    ) {
      return null
    }
    return dados
  } catch {
    return null
  }
}
