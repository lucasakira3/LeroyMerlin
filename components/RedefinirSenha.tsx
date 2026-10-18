'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Mail, KeyRound, MailCheck, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { pedirLinkDeRedefinicao, redefinirSenha, type ResultadoPedidoDeLink } from '@/lib/authServidor'
import { SENHA_MINIMA } from '@/lib/authTipos'
import { contaExiste, criarConta, esquecerSenhaLocal, getConta } from '@/lib/clientContas'
import { loginUsuario } from '@/lib/clientAuth'

const CAMPO = 'block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-500 rounded-xl text-sm focus:ring-2 focus:ring-lm-green/30 focus:border-lm-green outline-none transition-all bg-gray-50 focus:bg-white'
const LOGIN = '/funcionario/login'

// Tela de "Esqueci minha senha" (/redefinir-senha), em dois momentos:
//  1. sem `?token=`: a pessoa digita o e-mail e recebe um link (app/api/auth/esqueci);
//  2. com `?token=` (o link do e-mail): escolhe a senha nova (app/api/auth/redefinir) e já sai
//     logada, como num login normal.
export default function RedefinirSenha() {
  const params = useSearchParams()
  const token = params.get('token')
  return (
    <div className="flex-1 flex items-start sm:items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md" padding="none">
        <div className="p-6 sm:p-8">
          {token ? <NovaSenha token={token} /> : <PedirLink emailInicial={params.get('email') ?? ''} />}
        </div>
      </Card>
    </div>
  )
}

function Titulo({ icone: Icone, titulo, texto }: { icone: typeof Mail; titulo: string; texto: string }) {
  return (
    <div className="text-center mb-6">
      <span className="w-12 h-12 rounded-2xl bg-lm-green/10 text-lm-green flex items-center justify-center mx-auto mb-3">
        <Icone size={24} />
      </span>
      <h1 className="text-2xl font-black text-gray-900">{titulo}</h1>
      <p className="text-gray-700 text-base mt-2">{texto}</p>
    </div>
  )
}

function VoltarAoLogin() {
  return (
    <Link href={LOGIN} className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-lm-green hover:underline">
      <ArrowLeft size={15} /> Voltar para o login
    </Link>
  )
}

const MENSAGEM_DO_PEDIDO: Partial<Record<ResultadoPedidoDeLink, string>> = {
  invalido: 'Confira o e-mail digitado.',
  email_indisponivel: 'O envio de e-mail ainda não está ligado neste site. Tente de novo mais tarde.',
  falha: 'Não foi possível enviar o e-mail agora. Tente de novo em alguns minutos.',
}

function PedirLink({ emailInicial }: { emailInicial: string }) {
  const [email, setEmail] = useState(emailInicial)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoPedidoDeLink | null>(null)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setResultado(await pedirLinkDeRedefinicao(email.trim().toLowerCase()))
    setEnviando(false)
  }

  if (resultado === 'enviado') {
    return (
      <>
        <Titulo icone={MailCheck} titulo="Confira seu e-mail" texto="" />
        <p className="text-base text-gray-700 text-center -mt-4">
          Se existir uma conta com <strong className="text-gray-900 break-all">{email.trim().toLowerCase()}</strong>,
          enviamos um link para você criar uma senha nova. Ele vale por 30 minutos.
        </p>
        <p className="text-sm text-gray-600 text-center mt-3">Não chegou? Confira a pasta de spam ou peça de novo.</p>
        <Button type="button" variant="secondary" className="w-full mt-6" onClick={() => setResultado(null)}>
          Enviar de novo
        </Button>
        <VoltarAoLogin />
      </>
    )
  }

  if (resultado === 'sem-banco') {
    return (
      <>
        <Titulo icone={AlertTriangle} titulo="Esqueci minha senha" texto="" />
        <p className="text-base text-gray-700 text-center -mt-4">
          Neste momento o site está funcionando sem o banco de dados, e o login aceita qualquer senha.
          Volte e entre com a senha que quiser.
        </p>
        <VoltarAoLogin />
      </>
    )
  }

  return (
    <>
      <Titulo icone={Mail} titulo="Esqueci minha senha" texto="Digite o e-mail da sua conta. Vamos enviar um link para você criar uma senha nova." />
      <form onSubmit={enviar} className="space-y-5">
        <div>
          <label htmlFor="redefinir-email" className="block text-sm font-bold text-gray-700 mb-1.5">E-mail</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={18} className="text-gray-600" />
            </div>
            <input
              id="redefinir-email"
              type="email"
              required
              autoFocus={!emailInicial}
              value={email}
              onChange={e => { setEmail(e.target.value); setResultado(null) }}
              className={CAMPO}
              placeholder="seuemail@exemplo.com"
            />
          </div>
          {resultado && MENSAGEM_DO_PEDIDO[resultado] && (
            <p role="alert" className="text-sm text-red-600 mt-2">{MENSAGEM_DO_PEDIDO[resultado]}</p>
          )}
        </div>
        <Button type="submit" variant="primary" disabled={enviando} className="w-full">
          {enviando ? 'Enviando...' : 'Enviar link'}
        </Button>
      </form>
      <VoltarAoLogin />
    </>
  )
}

function NovaSenha({ token }: { token: string }) {
  const [situacao, setSituacao] = useState<'conferindo' | 'pronto' | 'link_invalido' | 'sem-banco' | 'salva'>('conferindo')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [repetida, setRepetida] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  // Confere o link assim que a tela abre: se ele já venceu, avisa antes de a pessoa digitar.
  useEffect(() => {
    redefinirSenha(token).then(r => {
      if (r.tipo === 'ok') { setEmail(r.email); setSituacao('pronto') }
      else if (r.tipo === 'sem-banco') setSituacao('sem-banco')
      else setSituacao('link_invalido')
    })
  }, [token])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    if (senha.length < SENHA_MINIMA) { setErro(`A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`); return }
    if (senha !== repetida) { setErro('As duas senhas não são iguais.'); return }
    setSalvando(true)
    const r = await redefinirSenha(token, senha)
    setSalvando(false)
    if (r.tipo === 'link_invalido') { setSituacao('link_invalido'); return }
    if (r.tipo !== 'ok') {
      setErro(r.tipo === 'senha_invalida' ? `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.` : 'Não foi possível salvar agora. Tente de novo.')
      return
    }
    // O servidor já entregou o cookie de sessão; aqui entra no aparelho, como faz o login
    // (components/ClienteAuthForm.tsx).
    if (!contaExiste(r.email)) criarConta(r.email.split('@')[0], r.email, '')
    else esquecerSenhaLocal(r.email)
    loginUsuario(r.email, getConta(r.email)?.nome)
    setSituacao('salva')
    window.setTimeout(() => { window.location.href = '/conta' }, 1800)
  }

  if (situacao === 'conferindo') {
    return <p className="text-center text-base text-gray-700 py-6">Conferindo o link...</p>
  }

  if (situacao === 'link_invalido' || situacao === 'sem-banco') {
    return (
      <>
        <Titulo icone={AlertTriangle} titulo="Link vencido" texto="Este link já foi usado ou passou dos 30 minutos. Peça um novo — leva só um instante." />
        <Link href="/redefinir-senha" className="block">
          <Button type="button" variant="primary" className="w-full">Pedir um link novo</Button>
        </Link>
        <VoltarAoLogin />
      </>
    )
  }

  if (situacao === 'salva') {
    return (
      <>
        <Titulo icone={CheckCircle2} titulo="Senha nova salva" texto="Pronto! Você já entrou na sua conta. Levando você para lá..." />
        <Link href="/conta" className="block">
          <Button type="button" variant="primary" className="w-full">Ir para minha conta</Button>
        </Link>
      </>
    )
  }

  return (
    <>
      <Titulo icone={KeyRound} titulo="Crie uma senha nova" texto="" />
      <p className="text-base text-gray-700 text-center -mt-4 mb-6">
        Para a conta <strong className="text-gray-900 break-all">{email}</strong>.
      </p>
      <form onSubmit={salvar} className="space-y-5">
        <div>
          <label htmlFor="redefinir-senha" className="block text-sm font-bold text-gray-700 mb-1.5">Senha nova</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound size={18} className="text-gray-600" />
            </div>
            <input id="redefinir-senha" type="password" required autoFocus autoComplete="new-password" value={senha}
              onChange={e => { setSenha(e.target.value); setErro(null) }} className={CAMPO} placeholder="••••••••" />
          </div>
        </div>
        <div>
          <label htmlFor="redefinir-senha-2" className="block text-sm font-bold text-gray-700 mb-1.5">Repita a senha nova</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound size={18} className="text-gray-600" />
            </div>
            <input id="redefinir-senha-2" type="password" required autoComplete="new-password" value={repetida}
              onChange={e => { setRepetida(e.target.value); setErro(null) }} className={CAMPO} placeholder="••••••••" />
          </div>
          {erro && <p role="alert" className="text-sm text-red-600 mt-2">{erro}</p>}
        </div>
        <Button type="submit" variant="primary" disabled={salvando} className="w-full">
          {salvando ? 'Salvando...' : 'Salvar senha nova'}
        </Button>
      </form>
    </>
  )
}
