// Grupos de favoritos, por e-mail. Favoritar continua sem fricção via
// clientFavoritos.ts (lista global, sem grupo); esta camada é só a
// organização posterior — quais grupos existem e em qual grupo cada produto
// favoritado está.
export interface GrupoFavoritos {
  id: string
  nome: string
}

interface DadosGrupos {
  grupos: GrupoFavoritos[]
  atribuicoes: Record<string, string> // produtoId -> grupoId
}

const VAZIO: DadosGrupos = { grupos: [], atribuicoes: {} }

function chave(email: string): string {
  return `lm_favoritos_grupos_${email}`
}

function ler(email: string): DadosGrupos {
  if (typeof window === 'undefined') return VAZIO
  try {
    const bruto = window.localStorage.getItem(chave(email))
    if (!bruto) return { grupos: [], atribuicoes: {} }
    const dados = JSON.parse(bruto)
    if (!dados || !Array.isArray(dados.grupos) || typeof dados.atribuicoes !== 'object') {
      return { grupos: [], atribuicoes: {} }
    }
    return dados
  } catch {
    return { grupos: [], atribuicoes: {} }
  }
}

function salvar(email: string, dados: DadosGrupos): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(chave(email), JSON.stringify(dados))
  window.dispatchEvent(new Event('lm-favoritos-change'))
}

export function getGrupos(email: string): GrupoFavoritos[] {
  return ler(email).grupos
}

export function criarGrupo(email: string, nome: string): GrupoFavoritos {
  const dados = ler(email)
  const grupo: GrupoFavoritos = {
    id: `grp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    nome,
  }
  dados.grupos.push(grupo)
  salvar(email, dados)
  return grupo
}

export function removerGrupo(email: string, id: string): void {
  const dados = ler(email)
  dados.grupos = dados.grupos.filter((g) => g.id !== id)
  for (const produtoId of Object.keys(dados.atribuicoes)) {
    if (dados.atribuicoes[produtoId] === id) delete dados.atribuicoes[produtoId]
  }
  salvar(email, dados)
}

export function getGrupoDoProduto(email: string, produtoId: string): string | null {
  return ler(email).atribuicoes[produtoId] ?? null
}

export function atribuirGrupo(email: string, produtoId: string, grupoId: string | null): void {
  const dados = ler(email)
  if (grupoId === null) {
    delete dados.atribuicoes[produtoId]
  } else {
    dados.atribuicoes[produtoId] = grupoId
  }
  salvar(email, dados)
}
