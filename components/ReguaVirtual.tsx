'use client'

import { useCallback, useRef, useState } from 'react'
import { Camera, RotateCcw, Ruler, AlertTriangle } from 'lucide-react'
import Card from './ui/Card'
import { OBJETOS_REFERENCIA, type MedicaoResponse } from '@/lib/medir'

const MAX_IMAGE_SIZE = 4 * 1024 * 1024

export default function ReguaVirtual() {
  const [referenciaId, setReferenciaId] = useState(OBJETOS_REFERENCIA[0].id)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<MedicaoResponse | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const referencia = OBJETOS_REFERENCIA.find(o => o.id === referenciaId)!

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
        const res = await fetch('/api/medir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, mimeType, referenciaId }),
        })
        if (!res.ok) throw new Error('Erro na análise')
        const data: MedicaoResponse = await res.json()
        setResultado(data)
        if (!data.identificado) setErro(data.explicacao)
      } catch {
        setErro('Serviço temporariamente indisponível. Tente novamente em instantes.')
      } finally {
        setLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }, [referenciaId])

  function recomecar() {
    setPreview(null)
    setResultado(null)
    setErro(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <h3 className="text-sm font-bold text-lm-dark mb-1">1. Escolha o objeto de referência</h3>
        <p className="text-xs text-gray-500 mb-3">
          Sem sensor de profundidade, a única forma de estimar tamanho por foto é comparando com algo de tamanho conhecido.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {OBJETOS_REFERENCIA.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => { setReferenciaId(o.id); recomecar() }}
              aria-pressed={referenciaId === o.id}
              className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${
                referenciaId === o.id
                  ? 'bg-lm-green text-white border-lm-green'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-lm-green/40'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <h3 className="text-sm font-bold text-lm-dark mb-1">2. Tire a foto</h3>
        <p className="text-xs text-gray-500 mb-3">
          Coloque a {referencia.label.toLowerCase()} bem visível, encostada no que você quer medir (parede, piso, vão), e fotografe os dois juntos.
        </p>

        {!preview ? (
          <div
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-lm-green hover:bg-green-50/50 transition-colors"
          >
            <Camera size={28} className="text-gray-400" />
            <p className="text-sm text-gray-500 text-center">Tirar foto ou escolher imagem</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) processarArquivo(f) }}
              className="hidden"
              aria-label="Selecionar foto pra medir"
            />
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-gray-200">
            <img src={preview} alt="Prévia da foto" className="w-full max-h-72 object-contain bg-gray-50" />
            {loading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-white">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-medium">Estimando medidas...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {erro && (
          <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <p>{erro}</p>
          </div>
        )}

        {resultado?.identificado && (
          <div className="mt-3 bg-lm-green/5 border border-lm-green/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Ruler size={16} className="text-lm-green" />
              <p className="text-sm font-bold text-gray-900">
                {resultado.largura_cm} × {resultado.altura_cm} cm
                {resultado.area_m2 != null && (
                  <span className="text-gray-500 font-medium"> · {resultado.area_m2} m²</span>
                )}
              </p>
            </div>
            <p className="text-xs text-gray-600">{resultado.explicacao}</p>
            <p className="text-[11px] text-gray-400 mt-2">
              Estimativa aproximada por foto — para uma compra que exige precisão, confirme com fita métrica antes de fechar o pedido.
            </p>
          </div>
        )}

        {preview && !loading && (
          <button
            type="button"
            onClick={recomecar}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-lm-green"
          >
            <RotateCcw size={13} /> Tirar outra foto
          </button>
        )}
      </Card>
    </div>
  )
}
