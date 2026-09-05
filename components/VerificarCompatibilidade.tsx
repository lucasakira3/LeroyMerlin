'use client'

import { useCallback, useRef, useState } from 'react'
import { Camera, X, CheckCircle2, XCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import type { CompatibilidadeResponse } from '@/types/produto'

const MAX_IMAGE_SIZE = 4 * 1024 * 1024

const VEREDITO_INFO = {
  sim: { icon: CheckCircle2, cor: 'text-lm-green', bg: 'bg-lm-green/10 border-lm-green/20', label: 'Compatível' },
  nao: { icon: XCircle, cor: 'text-red-600', bg: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900', label: 'Não compatível' },
  talvez: { icon: HelpCircle, cor: 'text-amber-600', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900', label: 'Talvez — confira a medida' },
} as const

// Responde "esse produto serve no que eu já tenho em casa?" — diferente do chat de texto
// logo acima (que responde dúvidas gerais), aqui o cliente manda uma foto do que já existe
// (a pia, a tomada, o vaso) e a IA compara com ESSE produto específico (não a categoria
// inteira), via app/api/produto/[id]/compatibilidade/route.ts.
export default function VerificarCompatibilidade({ produtoId }: { produtoId: string }) {
  const [aberto, setAberto] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<CompatibilidadeResponse | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processarArquivo = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > MAX_IMAGE_SIZE) {
      setErro('Imagem muito grande. Máximo: 4MB.')
      return
    }

    setErro(null)
    setResultado(null)
    setPreview(URL.createObjectURL(file))

    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      const [prefixo, base64] = dataUrl.split(',')
      const mimeType = prefixo.match(/data:(.*);base64/)?.[1] ?? 'image/jpeg'

      setLoading(true)
      try {
        const res = await fetch(`/api/produto/${produtoId}/compatibilidade`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, mimeType }),
        })
        if (!res.ok) throw new Error('Erro na análise')
        const data: CompatibilidadeResponse = await res.json()
        setResultado(data)
        if (!data.imagem_reconhecida) setErro(data.explicacao)
      } catch {
        setErro('Serviço temporariamente indisponível. Tente novamente em instantes.')
      } finally {
        setLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }, [produtoId])

  function limpar() {
    setPreview(null)
    setResultado(null)
    setErro(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const info = resultado?.veredito ? VEREDITO_INFO[resultado.veredito] : null

  return (
    <div className="mt-2 border-t border-gray-100 pt-3">
      <button
        type="button"
        onClick={() => setAberto(v => !v)}
        className="w-full flex items-center justify-between gap-2 text-xs font-semibold text-lm-green"
        aria-expanded={aberto}
      >
        <span className="flex items-center gap-1.5">
          <Camera size={13} /> Verificar compatibilidade com uma foto
        </span>
        {aberto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {aberto && (
        <div className="mt-2.5">
          <p className="text-[11px] text-gray-400 mb-2">
            Mande uma foto do que você já tem em casa (a pia, o vaso, a tomada) pra IA avaliar se este produto serve.
          </p>

          {!preview ? (
            <div
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-lm-green hover:bg-green-50/50 transition-colors"
            >
              <Camera size={20} className="text-gray-400" />
              <p className="text-xs text-gray-500 text-center">Tirar foto ou escolher imagem</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) processarArquivo(f) }}
                className="hidden"
                aria-label="Selecionar foto pra verificar compatibilidade"
              />
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-gray-200 mb-2">
              <img src={preview} alt="Prévia da foto" className="w-full max-h-40 object-contain bg-gray-50" />
              {loading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!loading && (
                <button
                  type="button"
                  onClick={limpar}
                  aria-label="Remover imagem"
                  className="absolute top-1.5 right-1.5 p-1 bg-white/90 rounded-full shadow hover:bg-white"
                >
                  <X size={13} className="text-gray-600" />
                </button>
              )}
            </div>
          )}

          {erro && <p className="text-xs text-red-500 mt-2">{erro}</p>}

          {resultado?.imagem_reconhecida && info && (
            <div className={`mt-2 flex items-start gap-2 border rounded-xl p-2.5 ${info.bg}`}>
              <info.icon size={16} className={`flex-shrink-0 mt-0.5 ${info.cor}`} />
              <div>
                <p className={`text-xs font-bold ${info.cor}`}>{info.label}</p>
                <p className="text-xs text-gray-600 mt-0.5">{resultado.explicacao}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
