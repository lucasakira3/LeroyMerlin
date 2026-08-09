export interface ListaCompartilhadaDados {
  titulo: string
  loja: string
  produtoIds: string[]
}

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
