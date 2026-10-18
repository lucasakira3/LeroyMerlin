// Formato das respostas das rotas de login (app/api/auth/*), usado pelas rotas e pelas telas.
// `ativo: false` = banco não configurado ou tabelas da etapa 2 ainda não criadas: a tela cai
// no login antigo, só deste aparelho (plano B — ver lib/authServidor.ts).
export interface RespostaAuth {
  ativo: boolean
  motivo?: 'sem-configuracao' | 'tabelas-ausentes'
  // email_indisponivel: o site ainda não tem como enviar e-mail (ver lib/servidor/email.ts).
  // link_invalido: link de "Esqueci minha senha" vencido, já usado ou adulterado.
  erro?: 'email_invalido' | 'senha_invalida' | 'senha_incorreta' | 'sem_sessao' | 'falha' | 'email_indisponivel' | 'link_invalido'
  email?: string
  // true quando a conta (ou a senha do painel) acabou de ser criada neste login.
  criado?: boolean
}

// Mesmo limite de lib/servidor/senha.ts, repetido aqui pra tela avisar antes de chamar o servidor.
export const SENHA_MINIMA = 4
