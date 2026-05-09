'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, X } from 'lucide-react'
import type { SearchResult } from '@/types/produto'

interface ImageUploadProps {
  onResults: (results: SearchResult[]) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

export default function ImageUpload({ onResults, loading, setLoading }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return
      if (file.size > 4 * 1024 * 1024) {
        setErrorMsg('Imagem muito grande. Máximo: 4MB.')
        return
      }

      setErrorMsg(null)
      setPreview(URL.createObjectURL(file))

      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        const [prefix, base64] = dataUrl.split(',')
        const mimeType = prefix.match(/data:(.*);base64/)?.[1] ?? 'image/jpeg'

        setLoading(true)
        try {
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
            onResults(data.resultados)
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
    [onResults, setLoading]
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
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="w-full">
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
            Arraste uma foto do produto ou clique para selecionar
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Selecionar imagem do produto"
          />
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <img src={preview} alt="Prévia da imagem do produto" className="w-full max-h-64 object-contain bg-gray-50" />
          {loading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-white">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium">Analisando imagem...</p>
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
    </div>
  )
}
