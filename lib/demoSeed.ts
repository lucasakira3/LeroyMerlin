// Modo demo pra gravar o vídeo do pitch sem digitar nada ao vivo (evita imprevisto com a
// API do Gemini instável durante a gravação, ver [[project-dev-workflow]]) e sem esperar
// carregamento de IA na hora de apresentar. Popula localStorage direto com uma conta e um
// conjunto de dados coerentes entre si — o carrinho usa os mesmos 3 produtos (corredores
// 03/19/44) e o mesmo teto de orçamento (R$400) já confirmados manualmente nesta sessão
// como a combinação que deixa o Termômetro de Orçamento sugerindo uma troca de verdade e a
// rota no mapa cruzando três corredores diferentes — não são valores arbitrários.
export const DEMO_EMAIL = 'demo@leroymerlin.com.br'
export const DEMO_SENHA = 'demo123'
export const DEMO_NOME = 'Cliente Demo'

const ISO_DIAS_ATRAS = (dias: number) => {
  const d = new Date()
  d.setDate(d.getDate() - dias)
  return d.toISOString()
}

export function ativarModoDemo(): void {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(
    'lm_contas_cliente',
    JSON.stringify({
      [DEMO_EMAIL]: { nome: DEMO_NOME, senha: DEMO_SENHA, criadoEm: ISO_DIAS_ATRAS(30) },
    })
  )
  window.localStorage.setItem('lm_usuario_logado', JSON.stringify({ email: DEMO_EMAIL, nome: DEMO_NOME }))

  window.localStorage.setItem('lm_favoritos_produtos', JSON.stringify(['LM-0001', 'LM-0003', 'LM-0463']))

  window.localStorage.setItem(
    'lm_historico_produtos',
    JSON.stringify(
      ['LM-0738', 'LM-0463', 'LM-0003', 'LM-0001'].map((id, i) => ({
        id,
        visitadoEm: Date.now() - i * 60_000,
      }))
    )
  )

  // Mesma combinação de itens/orçamento já testada ao vivo nesta sessão: dispara a
  // sugestão de troca do Termômetro e cruza 3 corredores diferentes no mapa da rota.
  window.localStorage.setItem(
    'lm_carrinho',
    JSON.stringify([
      { produtoId: 'LM-0001', quantidade: 1 },
      { produtoId: 'LM-0463', quantidade: 2 },
      { produtoId: 'LM-0738', quantidade: 1 },
    ])
  )
  window.localStorage.setItem('lm_orcamento_valor', '400')

  window.localStorage.setItem(
    'lm_pedidos_cliente',
    JSON.stringify({
      [DEMO_EMAIL]: [
        {
          numero: 'LMDEMO01',
          data: ISO_DIAS_ATRAS(7),
          itens: [
            { produtoId: 'LM-0002', nome: 'Furadeira de Impacto 700W Stanley', preco: 279.9, quantidade: 1 },
            { produtoId: 'LM-0004', nome: 'Parafusadeira a Bateria 20V Makita', preco: 589.9, quantidade: 1 },
          ],
          metodo: 'entrega',
          endereco: 'Rua das Palmeiras, 120 - Vila Nova, São Paulo/SP',
          pagamento: { metodo: 'cartao', parcelas: 3, ultimosDigitos: '4242', bandeira: 'Visa' },
          total: 869.8,
        },
      ],
    })
  )

  window.localStorage.setItem(
    'lm_avaliacoes_produtos',
    JSON.stringify({
      'LM-0001': [
        {
          email: DEMO_EMAIL,
          nota: 5,
          comentario: 'Furadeira ótima, bateria dura bastante e o torque dá conta de tudo em casa.',
          data: ISO_DIAS_ATRAS(3),
        },
      ],
    })
  )

  window.localStorage.setItem(
    'lm_enderecos_cliente',
    JSON.stringify({
      [DEMO_EMAIL]: [
        {
          id: 'demo-end-1',
          rotulo: 'Casa',
          cep: '01310-100',
          rua: 'Av. Paulista',
          numero: '1000',
          complemento: 'Apto 52',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          uf: 'SP',
          padrao: true,
        },
      ],
    })
  )

  window.localStorage.setItem(
    'lm_perfil_cliente',
    JSON.stringify({
      [DEMO_EMAIL]: {
        moradia: 'Casa',
        experiencia: 'Intermediário',
        areas: ['Cozinha', 'Banheiro'],
        orcamento: 'R$300–600',
        sustentabilidade: 'Importante, mas não decisivo',
        respondidoEm: ISO_DIAS_ATRAS(10),
      },
    })
  )

  window.localStorage.setItem(
    'lm_notificacoes',
    JSON.stringify({
      [DEMO_EMAIL]: [
        {
          id: 'demo-notif-1',
          tipo: 'pedido',
          titulo: 'Pedido confirmado',
          mensagem: 'Seu pedido LMDEMO01 foi confirmado.',
          href: '/conta',
          criadaEm: ISO_DIAS_ATRAS(7),
          lida: false,
        },
      ],
    })
  )

  // Nenhum objeto de comparador/ajuda-corredor/orçamento pendente sobrando de sessões
  // anteriores — modo demo começa de um estado limpo, previsível pra gravar.
  window.localStorage.removeItem('lm_comparador')
  window.localStorage.removeItem('lm_pedidos_ajuda')
  window.localStorage.removeItem('lm_buscas_recentes')

  for (const evento of [
    'lm-favoritos-change',
    'lm-carrinho-change',
    'lm-comparador-change',
    'lm-notificacoes-change',
    'lm-orcamento-change',
  ]) {
    window.dispatchEvent(new Event(evento))
  }
}

export function desativarModoDemo(): void {
  if (typeof window === 'undefined') return
  const chaves = [
    'lm_contas_cliente',
    'lm_usuario_logado',
    'lm_favoritos_produtos',
    'lm_historico_produtos',
    'lm_carrinho',
    'lm_orcamento_valor',
    'lm_pedidos_cliente',
    'lm_avaliacoes_produtos',
    'lm_enderecos_cliente',
    'lm_perfil_cliente',
    'lm_notificacoes',
    'lm_comparador',
  ]
  for (const chave of chaves) window.localStorage.removeItem(chave)
  for (const evento of ['lm-favoritos-change', 'lm-carrinho-change', 'lm-comparador-change', 'lm-notificacoes-change', 'lm-orcamento-change']) {
    window.dispatchEvent(new Event(evento))
  }
}
