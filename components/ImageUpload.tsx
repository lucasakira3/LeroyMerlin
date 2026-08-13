'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, X, Wrench, PackageSearch, MapPin } from 'lucide-react'
import Card from './ui/Card'
import type { SearchResult, DiagnosticoVisualResponse } from '@/types/produto'

type Modo = 'produto' | 'problema'

interface ImageUploadProps {
  onResults: (results: SearchResult[], label?: string) => void
  loading: boolean
  setLoading: (loading: boolean) => void
  onSelectProduto?: (produto: SearchResult['produto']) => void
}

export default function ImageUpload({ onResults, loading, setLoading, onSelectProduto }: ImageUploadProps) {
  const [modo, setModo] = useState<Modo>('produto')
  const [preview, setPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [diagnostico, setDiagnostico] = useState<DiagnosticoVisualResponse | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return
      if (file.size > 4 * 1024 * 1024) {
        setErrorMsg('Imagem muito grande. Máximo: 4MB.')
        return
      }

      setErrorMsg(null)
      setDiagnostico(null)
      setPreview(URL.createObjectURL(file))

      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        const [prefix, base64] = dataUrl.split(',')
        const mimeType = prefix.match(/data:(.*);base64/)?.[1] ?? 'image/jpeg'

        setLoading(true)
        try {
          if (modo === 'produto') {
            const res = await fetch('/api/vision', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64, mimeType }),
            })

            if (!res.ok) throw new Error('Erro na análise da imagem')

            const data = await res.json()

            if (data.descricao_identificada === 'Produto não identificado') {
              setErrorMsg('Não conseguimos identificar este produto. Tente uma foto mais próxima ou use a busca por texto.')
              onResults([])
            } else {
              onResults(data.resultados, 'busca por imagem')
            }
          } else {
            const res = await fetch('/api/diagnostico-visual', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64, mimeType }),
            })

            if (!res.ok) throw new Error('Erro no diagnóstico da imagem')

            const data: DiagnosticoVisualResponse = await res.json()

            if (!data.problema_identificado) {
              setErrorMsg(data.diagnostico || 'Não conseguimos identificar bem o problema nesta foto. Pode descrever com suas palavras?')
              onResults([])
            } else {
              setDiagnostico(data)
              onResults(data.resultados, 'diagnóstico visual do problema')
            }
          }
        } catch (err) {
          console.error('Erro ao analisar imagem:', err)
          setErrorMsg('API temporariamente indisponível. Aguarde alguns segundos e tente novamente.')
          onResults([])
        } finally {
          setLoading(false)
        }
      }
      reader.readAsDataURL(file)
    },
    [onResults, setLoading, modo]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const clearImage = () => {
    setPreview(null)
    setErrorMsg(null)
    setDiagnostico(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const trocarModo = (novo: Modo) => {
    if (novo === modo) return
    setModo(novo)
    clearImage()
  }

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => trocarModo('produto')}
          aria-pressed={modo === 'produto'}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg border transition-colors ${
            modo === 'produto'
              ? 'bg-lm-green text-white border-lm-green'
              : 'bg-white text-gray-500 border-gray-200 hover:border-lm-green/40'
          }`}
        >
          <PackageSearch size={14} /> Já sei o produto
        </button>
        <button
          type="button"
          onClick={() => trocarModo('problema')}
          aria-pressed={modo === 'problema'}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg border transition-colors ${
            modo === 'problema'
              ? 'bg-lm-green text-white border-lm-green'
              : 'bg-white text-gray-500 border-gray-200 hover:border-lm-green/40'
          }`}
        >
          <Wrench size={14} /> Solucionar problema
        </button>
      </div>

      {!preview ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          className={`relative flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            dragOver
              ? 'border-lm-green bg-green-50'
              : 'border-gray-300 bg-white hover:border-lm-green hover:bg-green-50/50'
          }`}
        >
          <Camera size={28} className="text-gray-400" />
          <p className="text-sm text-gray-500 text-center">
            {modo === 'produto'
              ? 'Arraste uma foto do produto ou clique para selecionar'
              : 'Mostre o problema — cano vazando, parede rachada, tomada solta — e a IA identifica o que fazer'}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-label={modo === 'produto' ? 'Selecionar imagem do produto' : 'Selecionar imagem do problema'}
          />
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <img
            src={preview}
            alt={modo === 'produto' ? 'Prévia da imagem do produto' : 'Prévia da imagem do problema'}
            className="w-full max-h-64 object-contain bg-gray-50"
          />
          {loading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-white">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium">
                  {modo === 'produto' ? 'Analisando imagem...' : 'Diagnosticando problema...'}
                </p>
              </div>
            </div>
          )}
          {!loading && (
            <button
              type="button"
              onClick={clearImage}
              aria-label="Remover imagem"
              className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow hover:bg-white transition-colors"
            >
              <X size={16} className="text-gray-600" />
            </button>
          )}
        </div>
      )}

      {errorMsg && <p className="mt-2 text-sm text-red-500 text-center">{errorMsg}</p>}

      {diagnostico && diagnostico.problema_identificado && (
        <Card className="mt-3 border-lm-green/20 bg-lm-green/5" padding="sm">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-lm-green/15 flex items-center justify-center flex-shrink-0">
              <Wrench size={14} className="text-lm-green" />
            </div>
            <p className="text-sm text-gray-800 flex-1">{diagnostico.diagnostico}</p>
          </div>

          {diagnostico.itens_sugeridos.length > 0 && (
            <div className="mt-3 pt-3 border-t border-lm-green/10 space-y-2.5">
              <p className="text-xs font-semibold text-gray-500">
                Produtos que você provavelmente precisa:
              </p>
              {diagnostico.itens_sugeridos.map((item, i) => {
                const top = item.resultados[0]
                return (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {top ? top.produto.produto : item.nome_busca}
                      </p>
                      {item.motivo && (
                        <p className="text-xs text-gray-500 truncate">{item.motivo}</p>
                      )}
                    </div>
                    {top ? (
                      <button
                        type="button"
                        onClick={() => onSelectProduto?.(top.produto)}
                        className="flex items-center gap-1 text-xs font-semibold text-lm-green flex-shrink-0 hover:underline"
                      >
                        <MapPin size={11} /> {top.produto.corredor}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 flex-shrink-0">peça ao vendedor</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
