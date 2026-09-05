'use client'

import { useCallback, useRef, useState } from 'react'
import { Camera, X, Check, Plus } from 'lucide-react'
import { toggleComparador, estaNoComparador } from '@/lib/clientComparador'
import type { SearchResult } from '@/types/produto'

const MAX_IMAGE_SIZE = 4 * 1024 * 1024

// Reaproveita a mesma rota de identificação por foto já usada na busca da home
// (app/api/vision/route.ts) — aqui o resultado não abre uma tela de busca, alimenta
// direto o comparador, já que a intenção de quem aponta a câmera pro produto físico
// na loja é "isso aqui é comparável com o que eu já escolhi", não uma busca nova.
export default function ComparadorPorFoto() {
  const [aberto, setAberto] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultados, setResultados] = useState<SearchResult[]>([])
  const [adicionadoId, setAdicionadoId] = useState<string | null>(null)
  const [cheio, setCheio] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processarArquivo = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > MAX_IMAGE_SIZE) {
      setErro('Imagem muito grande. Máximo: 4MB.')
      return
    }

    setErro(null)
    setResultados([])
    setPreview(URL.createObjectURL(file))

    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      const [prefixo, base64] = dataUrl.split(',')
      const mimeType = prefixo.match(/data:(.*);base64/)?.[1] ?? 'image/jpeg'

      setLoading(true)
      try {
        const res = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, mimeType }),
        })
        if (!res.ok) throw new Error('Erro na análise da imagem')
        const data = await res.json()

        if (data.descricao_identificada === 'Produto não identificado' || !data.resultados?.length) {
          setErro('Não conseguimos identificar este produto. Tente uma foto mais próxima.')
        } else {
          setResultados(data.resultados.slice(0, 3))
        }
      } catch {
        setErro('Serviço temporariamente indisponível. Tente novamente em instantes.')
      } finally {
        setLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }, [])

  function handleAdicionar(produtoId: string) {
    const resultado = toggleComparador(produtoId)
    if (resultado === 'full') {
      setCheio(true)
      setTimeout(() => setCheio(false), 2000)
      return
    }
    setAdicionadoId(produtoId)
  }

  function limparFoto() {
    setPreview(null)
    setResultados([])
    setErro(null)
    setAdicionadoId(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function fechar() {
    setAberto(false)
    limparFoto()
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 px-3 py-1.5 rounded-full hover:border-lm-green/40 hover:text-lm-green transition-colors flex-shrink-0"
      >
        <Camera size={13} /> Comparar por foto
      </button>
    )
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl p-3 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-600 dark:text-zinc-300">Aponte a câmera pro produto</p>
        <button onClick={fechar} aria-label="Fechar" className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200">
          <X size={16} />
        </button>
      </div>

      {!preview ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-lm-green hover:bg-green-50/50 dark:hover:bg-zinc-800/50 transition-colors"
        >
          <Camera size={22} className="text-gray-400" />
          <p className="text-xs text-gray-500 dark:text-zinc-400 text-center">Tirar foto ou escolher imagem</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) processarArquivo(f) }}
            className="hidden"
            aria-label="Selecionar foto do produto pra comparar"
          />
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 mb-2">
          <img src={preview} alt="Prévia da foto" className="w-full max-h-40 object-contain bg-gray-50 dark:bg-zinc-800" />
          {loading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && (
            <button
              type="button"
              onClick={limparFoto}
              aria-label="Tirar outra foto"
              className="absolute top-1.5 right-1.5 p-1 bg-white/90 rounded-full shadow hover:bg-white"
            >
              <X size={13} className="text-gray-600" />
            </button>
          )}
        </div>
      )}

      {erro && <p className="text-xs text-red-500 text-center mt-2">{erro}</p>}
      {cheio && <p className="text-xs text-amber-600 text-center mt-2">Comparador cheio (máx. 3) — remova um item antes de adicionar outro.</p>}

      {resultados.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {resultados.map((r) => {
            const noComparador = adicionadoId === r.produto.id || estaNoComparador(r.produto.id)
            return (
              <div key={r.produto.id} className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 rounded-lg px-2.5 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-900 dark:text-zinc-50 truncate">{r.produto.produto}</p>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                    {r.produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdicionar(r.produto.id)}
                  disabled={noComparador}
                  className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-colors ${
                    noComparador
                      ? 'bg-lm-green/10 text-lm-green cursor-default'
                      : 'bg-lm-green text-white hover:bg-green-700'
                  }`}
                >
                  {noComparador ? <Check size={12} /> : <Plus size={12} />}
                  {noComparador ? 'No comparador' : 'Adicionar'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
