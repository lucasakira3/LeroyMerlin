// Tabelas do Supabase que o site espelha (supabase/schema.sql). Usado dos dois lados: o
// servidor (app/api/sync/route.ts) só aceita gravar nestas tabelas e nestas colunas, e o
// navegador (lib/sync/motor.ts) sabe o que pedir.
//
//   escopoCliente — coluna que diz de qual cliente é a linha. Um cliente logado só recebe
//                   as linhas dele; `null` = a tabela é só do painel do funcionário.
//   imutavel      — linha gravada uma vez não muda mais (pedido, mensagem): o servidor
//                   ignora o reenvio em vez de regravar.
export const TABELAS = {
  clientes: { colunas: ['id', 'nome', 'criado_em'], escopoCliente: null, imutavel: false },
  pedidos: { colunas: ['id', 'cliente_email', 'metodo', 'total', 'feito_em', 'dados'], escopoCliente: 'cliente_email', imutavel: true },
  pedidos_status: { colunas: ['id', 'cliente_email', 'etapa', 'definida_em'], escopoCliente: 'cliente_email', imutavel: false },
  ajuda_corredor: { colunas: ['id', 'produto_id', 'produto_nome', 'corredor', 'cliente_nome', 'pedido_em', 'atendido'], escopoCliente: null, imutavel: false },
  agendamentos: { colunas: ['id', 'cliente_email', 'cliente_nome', 'servico', 'loja', 'data', 'horario', 'status', 'dados'], escopoCliente: 'cliente_email', imutavel: false },
  chamados: { colunas: ['id', 'atendido', 'notas'], escopoCliente: null, imutavel: false },
  conversas: { colunas: ['id', 'cliente_nome', 'atendida_em'], escopoCliente: 'id', imutavel: false },
  mensagens: { colunas: ['id', 'cliente_email', 'autor', 'texto', 'enviada_em'], escopoCliente: 'cliente_email', imutavel: true },
} as const

export type Tabela = keyof typeof TABELAS

export const NOMES_DAS_TABELAS = Object.keys(TABELAS) as Tabela[]

export function ehTabela(nome: string): nome is Tabela {
  return Object.prototype.hasOwnProperty.call(TABELAS, nome)
}

export type Linha = { id: string } & Record<string, unknown>
export type Lote = Partial<Record<Tabela, Linha[]>>

export interface Remocao {
  tabela: string
  id: string
  removido_em?: string
}

// Quem está pedindo: o painel do funcionário enxerga tudo; o cliente logado, só o que é
// dele; o visitante (sem login) só envia — pedido de ajuda e agendamento funcionam sem conta.
export type Papel = 'funcionario' | 'cliente' | 'visitante'

// Quem pode gravar cada linha. A MESMA função roda dos dois lados:
//   • no servidor (app/api/sync/route.ts) é a trava de verdade — o papel e o e-mail vêm do
//     cookie de sessão, não do que o aparelho diz;
//   • no aparelho (lib/sync/motor.ts) serve pra cada papel mandar só o que é dele. O mesmo
//     navegador pode estar logado como cliente e como funcionário; sem isto o ciclo do
//     cliente tentaria mandar a etapa que o funcionário acabou de mudar, o servidor
//     recusaria, e a mudança se perderia.
// `email` = e-mail em minúsculas de quem está logado como cliente ('' pros outros papéis).
export function podeGravar(papel: Papel, email: string, tabela: Tabela, linha: Linha): boolean {
  const meu = (valor: unknown) => email !== '' && typeof valor === 'string' && valor.trim().toLowerCase() === email
  switch (tabela) {
    case 'clientes':
      return papel === 'cliente' && meu(linha.id)
    case 'pedidos':
      return papel === 'cliente' && meu(linha.cliente_email)
    case 'pedidos_status':
    case 'chamados':
      return papel === 'funcionario'
    case 'ajuda_corredor':
      // Pedir ajuda funciona sem login; marcar como atendido é só do funcionário.
      return papel === 'funcionario' || linha.atendido !== true
    case 'agendamentos':
      // Agendar também funciona sem login (o e-mail é o digitado no formulário). O painel
      // nunca altera o agendamento em si: o que ele anota fica em `chamados`.
      return papel !== 'funcionario'
    case 'conversas':
      return papel === 'funcionario' || (papel === 'cliente' && meu(linha.id))
    case 'mensagens':
      // Cada lado só envia as próprias mensagens.
      return papel === 'funcionario'
        ? linha.autor === 'funcionario'
        : papel === 'cliente' && linha.autor === 'cliente' && meu(linha.cliente_email)
  }
}

// Um ciclo de sincronização é UMA chamada: manda o que mudou neste aparelho e recebe o que
// mudou nos outros desde a última vez (`desde`, um relógio por tabela).
export interface PedidoDeSync {
  papel: Papel
  email?: string
  // Que horas são no aparelho, no instante do envio. O servidor compara com a hora certa e
  // corrige as horas que o aparelho carimbou (ver `acertarHoras` em app/api/sync/route.ts).
  agora?: string
  desde?: Record<string, string>
  gravar?: Lote
  remover?: Partial<Record<Tabela, string[]>>
  apagarClientes?: string[]
}

export interface RespostaDeSync {
  // false = banco não configurado ou tabelas ainda não criadas: o site segue só com os
  // dados deste aparelho, como era antes do Supabase.
  ativo: boolean
  motivo?: 'sem-configuracao' | 'tabelas-ausentes'
  tabelas?: Partial<Record<Tabela, (Linha & { atualizado_em: string })[]>>
  remocoes?: Remocao[]
  // Até que hora o aparelho pode dar o assunto por encerrado. Fica alguns segundos atrás do
  // relógio do servidor: uma gravação que ainda estava sendo concluída no instante da
  // consulta pode aparecer com hora um pouco anterior, e o aparelho que já tivesse avançado
  // até "agora" nunca a receberia. O que é mais novo que isto volta de novo na próxima
  // consulta (sem efeito, ver lib/sync/espelho.ts) até ficar mais velho que a folga.
  seguroAte?: string
  // 'sem-sessao' (com status 401) = o servidor não reconhece o login deste aparelho: o
  // cookie venceu, ou o aparelho estava logado desde antes de o login ser de verdade.
  erro?: string
}
