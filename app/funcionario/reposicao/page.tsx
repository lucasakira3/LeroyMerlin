'use client'

import { useEffect, useMemo, useState } from 'react'
import { PackageCheck, MapPin, Copy, Check, AlertTriangle } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { aplicarAjustes, ajustarEstoque } from '@/lib/ajustesFuncionario'
import { calcularRota } from '@/lib/rotaLoja'
import type { Produto } from '@/types/produto'

interface ItemReposicao {
  id: string
  nome: string
  categoria: string
  estoque: number
  corredor: string
  corredorNormalizado: string
}

interface GrupoCorredor {
  corredor: string
  corredorNormalizado: string
  itens: ItemReposicao[]
}

export default function ReposicaoPage() {
  const [catalogo, setCatalogo] = useState<Produto[] | null>(null)
  const [limiteBaixo, setLimiteBaixo] = useState(10)
  const [reporAte, setReporAte] = useState(30)
  // Quantidade digitada por produto (sobrescreve a sugestão "repor até − atual").
  const [quantidades, setQuantidades] = useState<Record<string, number>>({})
  const [copiado, setCopiado] = useState(false)
  // Muda a cada reposição pra recalcular aplicarAjustes (que lê do localStorage).
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    fetch('/api/funcionario/produtos')
      .then(r => r.json())
      .then((lista: Produto[]) => setCatalogo(lista))
      .catch(() => setCatalogo([]))
  }, [])

  const grupos = useMemo<GrupoCorredor[]>(() => {
    if (!catalogo) return []
    const baixos: ItemReposicao[] = catalogo
      // eslint-disable-next-line react-hooks/exhaustive-deps
      .map(p => ({ p, atual: aplicarAjustes(p) }))
      .filter(({ atual }) => atual.estoque < limiteBaixo)
      .map(({ p, atual }) => ({
        id: p.id,
        nome: p.produto,
        categoria: p.categoria,
        estoque: atual.estoque,
        corredor: p.corredor,
        corredorNormalizado: p.corredor_normalizado,
      }))

    const porCorredor = new Map<string, GrupoCorredor>()
    for (const item of baixos) {
      const grupo = porCorredor.get(item.corredorNormalizado) ?? {
        corredor: item.corredor,
        corredorNormalizado: item.corredorNormalizado,
        itens: [],
      }
      grupo.itens.push(item)
      porCorredor.set(item.corredorNormalizado, grupo)
    }
    // Sem estoque primeiro dentro de cada corredor (mais urgente).
    for (const g of porCorredor.values()) g.itens.sort((a, b) => a.estoque - b.estoque || a.nome.localeCompare(b.nome, 'pt-BR'))

    // Corredores na ordem em que se anda pela loja (serpentina), o resto no fim.
    const ordem = calcularRota(Array.from(porCorredor.keys()))
    const posicao = new Map(ordem.map((r, i) => [r.corredorNormalizado, i]))
    return Array.from(porCorredor.values()).sort(
      (a, b) => (posicao.get(a.corredorNormalizado) ?? 999) - (posicao.get(b.corredorNormalizado) ?? 999)
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogo, limiteBaixo, versao])

  const totalItens = grupos.reduce((s, g) => s + g.itens.length, 0)
  const semEstoque = grupos.reduce((s, g) => s + g.itens.filter(i => i.estoque === 0).length, 0)

  function quantidadePara(item: ItemReposicao): number {
    return quantidades[item.id] ?? Math.max(1, reporAte - item.estoque)
  }

  function repor(item: ItemReposicao) {
    ajustarEstoque(item.id, quantidadePara(item))
    setVersao(v => v + 1)
  }

  function reporCorredor(grupo: GrupoCorredor) {
    for (const item of grupo.itens) ajustarEstoque(item.id, quantidadePara(item))
    setVersao(v => v + 1)
  }

  async function copiarLista() {
    const linhas = grupos.flatMap(g => [
      `${g.corredor}:`,
      ...g.itens.map(i => `  - ${i.nome} (${i.id}) — tem ${i.estoque}, repor ${quantidadePara(i)}`),
    ])
    try {
      await navigator.clipboard.writeText(`Lista de reposição\n\n${linhas.join('\n')}`)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Sem permissão de clipboard: nada a fazer; o botão simplesmente não confirma.
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-4">
      <Card padding="sm" className="flex flex-wrap items-end gap-4">
        <label className="text-xs text-gray-500">
          Considerar baixo abaixo de
          <input
            type="number"
            min={1}
            value={limiteBaixo}
            onChange={e => setLimiteBaixo(Math.max(1, Number(e.target.value) || 1))}
            className="block w-24 h-9 mt-1 px-2 rounded-lg border border-gray-500 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
          />
        </label>
        <label className="text-xs text-gray-500">
          Repor até (unidades)
          <input
            type="number"
            min={1}
            value={reporAte}
            onChange={e => setReporAte(Math.max(1, Number(e.target.value) || 1))}
            className="block w-24 h-9 mt-1 px-2 rounded-lg border border-gray-500 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
          />
        </label>
        <div className="flex-1 min-w-[180px] text-sm text-gray-600">
          <strong className="text-gray-900">{totalItens}</strong> produtos a repor em <strong className="text-gray-900">{grupos.length}</strong> corredores
          {semEstoque > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-red-600">
              <AlertTriangle size={13} /> {semEstoque} sem estoque
            </span>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={copiarLista} disabled={totalItens === 0}>
          {copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? 'Copiado!' : 'Copiar lista'}
        </Button>
      </Card>

      {catalogo === null ? (
        <Card><p className="text-sm text-gray-500">Carregando estoque...</p></Card>
      ) : grupos.length === 0 ? (
        <Card padding="none">
          <EmptyState icon={PackageCheck} tone="green" title="Nada para repor" description="Nenhum produto abaixo do limite escolhido." />
        </Card>
      ) : (
        grupos.map(grupo => (
          <Card key={grupo.corredorNormalizado} padding="none">
            <div className="flex items-center gap-3 p-4 border-b border-gray-500">
              <span className="inline-flex items-center gap-1.5 font-bold text-gray-900">
                <MapPin size={16} className="text-lm-green" /> {grupo.corredor}
              </span>
              <span className="text-xs text-gray-500">{grupo.itens.length} {grupo.itens.length === 1 ? 'produto' : 'produtos'}</span>
              <Button size="sm" variant="secondary" className="ml-auto" onClick={() => reporCorredor(grupo)}>
                Repor corredor
              </Button>
            </div>
            <ul className="divide-y divide-gray-500">
              {grupo.itens.map(item => (
                <li key={item.id} className="flex flex-wrap items-center gap-3 p-3 px-4">
                  <span className="min-w-[200px] flex-1">
                    <span className="block text-sm font-medium text-gray-900">{item.nome}</span>
                    <span className="block text-xs text-gray-500">{item.id} · {item.categoria}</span>
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      item.estoque === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {item.estoque === 0 ? 'Sem estoque' : `${item.estoque} un.`}
                  </span>
                  <label className="text-xs text-gray-500 flex items-center gap-1.5">
                    Repor
                    <input
                      type="number"
                      min={1}
                      value={quantidadePara(item)}
                      onChange={e => setQuantidades(q => ({ ...q, [item.id]: Math.max(1, Number(e.target.value) || 1) }))}
                      aria-label={`Quantidade a repor de ${item.nome}`}
                      className="w-16 h-8 px-2 rounded-lg border border-gray-500 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
                    />
                  </label>
                  <Button size="sm" onClick={() => repor(item)}>Repor</Button>
                </li>
              ))}
            </ul>
          </Card>
        ))
      )}
    </div>
  )
}
