// LGPD self-service: exportar e apagar os dados que o app guarda sobre o cliente. Como não
// existe backend (tudo é localStorage, ver project-overview), "meus dados" aqui significa
// literalmente tudo que está gravado neste navegador — inclusive o que não é tecnicamente
// indexado por e-mail (carrinho, favoritos, comparador, histórico funcionam sem login,
// então não têm como ser isolados por conta). Opera direto nas chaves de localStorage em
// vez de importar cada lib/client*.ts, pra não precisar adicionar uma função de "apagar"
// em 7 arquivos diferentes só pra isso — só lê/escreve o mesmo formato JSON que cada uma
// já usa. Os e-mails usados como chave NÃO são renormalizados aqui — usa o valor cru de
// getUsuarioLogado(), igual todo outro call site desses módulos já faz (ver comentário em
// lib/clientPedidos.ts sobre normalização inconsistente entre os módulos).

const CHAVES_MAPA_POR_EMAIL = [
  'lm_contas_cliente',
  'lm_enderecos_cliente',
  'lm_pedidos_cliente',
  'lm_perfil_cliente',
  'lm_notificacoes',
] as const

// Dado que não é por conta — funciona sem login, então uma "conta" não tem um dono
// exclusivo dele. Apagar a conta neste navegador limpa também isso (avisado na UI).
const CHAVES_GLOBAIS_NAVEGADOR = [
  'lm_favoritos_produtos',
  'lm_carrinho',
  'lm_comparador',
  'lm_historico_produtos',
  'lm_buscas_recentes',
  'lm_orcamento_valor',
] as const

const EVENTOS_PARA_DISPARAR = [
  'lm-favoritos-change',
  'lm-carrinho-change',
  'lm-comparador-change',
  'lm-notificacoes-change',
  'lm-orcamento-change',
]

function lerJSON<T>(chave: string, valorPadrao: T): T {
  if (typeof window === 'undefined') return valorPadrao
  try {
    const bruto = window.localStorage.getItem(chave)
    return bruto ? JSON.parse(bruto) : valorPadrao
  } catch {
    return valorPadrao
  }
}

export interface DadosClienteExportados {
  geradoEm: string
  email: string
  conta: { nome: string; criadoEm: string } | null
  perfil: unknown
  enderecos: unknown
  pedidos: unknown
  notificacoes: unknown
  avaliacoes: Array<{ produtoId: string } & Record<string, unknown>>
  gruposFavoritos: unknown
  favoritos: unknown
  carrinho: unknown
  comparador: unknown
  historicoVisualizacoes: unknown
  buscasRecentes: unknown
  orcamento: number | null
}

export function exportarDadosCliente(email: string): DadosClienteExportados {
  const contas = lerJSON<Record<string, { nome: string; senha: string; criadoEm: string }>>('lm_contas_cliente', {})
  const conta = contas[email]

  const avaliacoesPorProduto = lerJSON<Record<string, Array<{ email: string } & Record<string, unknown>>>>(
    'lm_avaliacoes_produtos',
    {}
  )
  const minhasAvaliacoes = Object.entries(avaliacoesPorProduto).flatMap(([produtoId, lista]) =>
    lista.filter((a) => a.email === email).map((a) => ({ produtoId, ...a }))
  )

  const orcamentoBruto = typeof window === 'undefined' ? null : window.localStorage.getItem('lm_orcamento_valor')

  return {
    geradoEm: new Date().toISOString(),
    email,
    // senha NUNCA entra no export, mesmo sendo texto puro só por ser mock (ver clientContas.ts) —
    // não é hábito que vale a pena praticar nem num MVP.
    conta: conta ? { nome: conta.nome, criadoEm: conta.criadoEm } : null,
    perfil: lerJSON<Record<string, unknown>>('lm_perfil_cliente', {})[email] ?? null,
    enderecos: lerJSON<Record<string, unknown>>('lm_enderecos_cliente', {})[email] ?? [],
    pedidos: lerJSON<Record<string, unknown>>('lm_pedidos_cliente', {})[email] ?? [],
    notificacoes: lerJSON<Record<string, unknown>>('lm_notificacoes', {})[email] ?? [],
    avaliacoes: minhasAvaliacoes,
    gruposFavoritos: lerJSON(`lm_favoritos_grupos_${email}`, null),
    favoritos: lerJSON('lm_favoritos_produtos', []),
    carrinho: lerJSON('lm_carrinho', []),
    comparador: lerJSON('lm_comparador', []),
    historicoVisualizacoes: lerJSON('lm_historico_produtos', []),
    buscasRecentes: lerJSON('lm_buscas_recentes', []),
    orcamento: orcamentoBruto ? Number(orcamentoBruto) : null,
  }
}

export function apagarDadosCliente(email: string): void {
  if (typeof window === 'undefined') return

  for (const chave of CHAVES_MAPA_POR_EMAIL) {
    const mapa = lerJSON<Record<string, unknown>>(chave, {})
    if (email in mapa) {
      delete mapa[email]
      window.localStorage.setItem(chave, JSON.stringify(mapa))
    }
  }

  // Avaliações não são um mapa por e-mail — é por produtoId, com o e-mail dentro de cada
  // item — então precisa varrer e filtrar em vez de só deletar uma chave, sem tocar nas
  // avaliações de outros clientes no mesmo produto.
  const avaliacoes = lerJSON<Record<string, Array<{ email: string }>>>('lm_avaliacoes_produtos', {})
  let avaliacoesMudaram = false
  for (const produtoId of Object.keys(avaliacoes)) {
    const restantes = avaliacoes[produtoId].filter((a) => a.email !== email)
    if (restantes.length !== avaliacoes[produtoId].length) {
      avaliacoesMudaram = true
      if (restantes.length > 0) avaliacoes[produtoId] = restantes
      else delete avaliacoes[produtoId]
    }
  }
  if (avaliacoesMudaram) window.localStorage.setItem('lm_avaliacoes_produtos', JSON.stringify(avaliacoes))

  window.localStorage.removeItem(`lm_favoritos_grupos_${email}`)

  for (const chave of CHAVES_GLOBAIS_NAVEGADOR) window.localStorage.removeItem(chave)

  window.localStorage.removeItem('lm_usuario_logado')

  for (const evento of EVENTOS_PARA_DISPARAR) window.dispatchEvent(new Event(evento))
}
