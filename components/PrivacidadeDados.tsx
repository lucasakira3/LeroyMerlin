'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Trash2, ShieldAlert, X } from 'lucide-react'
import Card from './ui/Card'
import Button from './ui/Button'
import { exportarDadosCliente, apagarDadosCliente } from '@/lib/privacidadeDados'
import { validarLogin } from '@/lib/clientContas'
import { logoutUsuario } from '@/lib/clientAuth'
import { showToast } from '@/lib/toast'

export default function PrivacidadeDados({ email }: { email: string }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  function exportar() {
    const dados = exportarDadosCliente(email)
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `meus-dados-leroymerlin-${email}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast('Download iniciado')
  }

  function confirmarExclusao(e: React.FormEvent) {
    e.preventDefault()
    if (validarLogin(email, senha) !== 'ok') {
      setErro('Senha incorreta.')
      return
    }
    apagarDadosCliente(email)
    logoutUsuario()
    router.push('/')
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        <ShieldAlert size={16} className="text-gray-400" />
        <h2 className="text-sm font-bold text-gray-900">Privacidade e dados</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Você pode baixar uma cópia de tudo que guardamos sobre você, ou apagar sua conta por completo.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" size="sm" onClick={exportar}>
          <Download size={14} />
          Exportar meus dados
        </Button>
        {!confirmando && (
          <Button variant="danger" size="sm" onClick={() => setConfirmando(true)}>
            <Trash2 size={14} />
            Apagar minha conta
          </Button>
        )}
      </div>

      {confirmando && (
        <form onSubmit={confirmarExclusao} className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
          <p className="text-sm text-red-700">
            <strong>Isso é permanente.</strong> Vai apagar sua conta, pedidos, avaliações, endereços e perfil.
            Como o carrinho, favoritos e comparador não exigem login, apagar a conta também limpa isso
            <strong> neste navegador</strong>. Não tem como desfazer.
          </p>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Digite sua senha pra confirmar
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => { setSenha(e.target.value); setErro(null) }}
              autoFocus
              className="w-full h-10 px-3 rounded-xl border border-red-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <div className="flex gap-2">
            <Button type="submit" variant="danger" size="sm">
              <Trash2 size={14} />
              Apagar tudo
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setConfirmando(false); setSenha(''); setErro(null) }}
            >
              <X size={14} />
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}
