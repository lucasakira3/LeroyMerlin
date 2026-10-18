// Envio de e-mail pelo servidor do site (hoje só o link de "Esqueci minha senha").
//
// Usa SMTP comum, então serve qualquer serviço que fale SMTP. As variáveis ficam no
// .env.local e na Vercel (nomes em .env.example):
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS  — servidor e login do envio
//   EMAIL_REMETENTE (opcional)                   — quem aparece como remetente
// Exemplo com Gmail: SMTP_HOST=smtp.gmail.com, SMTP_PORT=465, SMTP_USER=o endereço do Gmail e
// SMTP_PASS=uma "senha de app" do Google (não a senha normal da conta).
//
// Sem essas variáveis o site continua funcionando; só a recuperação de senha avisa que o
// envio de e-mail ainda não está ligado.
import nodemailer from 'nodemailer'

function configuracao() {
  const host = process.env.SMTP_HOST?.trim()
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS?.trim()
  if (!host || !user || !pass) return null
  const port = Number(process.env.SMTP_PORT?.trim() || 465)
  return {
    host,
    port,
    // 465 = conexão já criptografada desde o início; 587 = começa aberta e criptografa depois.
    secure: port === 465,
    auth: { user, pass },
    remetente: process.env.EMAIL_REMETENTE?.trim() || `"Leroy Merlin (projeto FIAP)" <${user}>`,
  }
}

export function emailConfigurado(): boolean {
  return configuracao() !== null
}

export async function enviarEmail(mensagem: { para: string; assunto: string; texto: string; html: string }): Promise<void> {
  const config = configuracao()
  if (!config) throw new Error('envio de e-mail não configurado')
  const { remetente, ...conexao } = config
  const transporte = nodemailer.createTransport(conexao)
  const enviado = await transporte.sendMail({
    from: remetente,
    to: mensagem.para,
    subject: mensagem.assunto,
    text: mensagem.texto,
    html: mensagem.html,
  })
  // Só existe quando o servidor é o Ethereal (caixa de e-mail falsa usada nos testes): o
  // endereço pra ver o e-mail enviado. Nos serviços de verdade vem vazio e nada é escrito.
  const previa = nodemailer.getTestMessageUrl(enviado)
  if (previa) console.log('[email] prévia do e-mail de teste:', previa)
}
