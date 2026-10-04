// Sem backend: a lista inteira vira uma URL (base64 na própria query string), lida direto
// pela página /lista. Só funciona pra listas pequenas (poucos itens), não escala pra
// payloads grandes — mas dispensa qualquer banco/storage do lado do servidor.
export interface ItemCompartilhado {
  material: string
  categoria: string
  quantidade: string
  prioridade: string
  observacao: string
  comodo: string
  etapa_ordem?: number
  etapa_nome?: string
  produtoId: string
}

export interface ListaCompartilhadaDados {
  titulo: string
  resumo: string
  loja: string
  itens: ItemCompartilhado[]
  // true quando o link é do formato antigo (só os códigos dos produtos, sem cômodo nem
  // etapa): não há dado pra montar a planta nem o passo a passo, só o mapa da loja.
  soMapa?: boolean
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
    // Formato antigo (links gerados antes de o compartilhamento levar as 3 seções):
    // { titulo, loja, produtoIds }. Continua abrindo, só com o mapa — como era na época.
    if (
      dados &&
      typeof dados.titulo === 'string' &&
      typeof dados.loja === 'string' &&
      !Array.isArray(dados.itens) &&
      Array.isArray(dados.produtoIds) &&
      dados.produtoIds.every((id: unknown) => typeof id === 'string')
    ) {
      return {
        titulo: dados.titulo,
        resumo: '',
        loja: dados.loja,
        soMapa: true,
        itens: dados.produtoIds.map((produtoId: string) => ({
          material: '', categoria: '', quantidade: '', prioridade: '', observacao: '', comodo: '', produtoId,
        })),
      }
    }
    if (
      !dados ||
      typeof dados.titulo !== 'string' ||
      typeof dados.loja !== 'string' ||
      !Array.isArray(dados.itens) ||
      !dados.itens.every((i: unknown) =>
        !!i && typeof i === 'object' &&
        typeof (i as any).material === 'string' &&
        typeof (i as any).produtoId === 'string'
      )
    ) {
      return null
    }
    return { resumo: '', ...dados }
  } catch {
    return null
  }
}
