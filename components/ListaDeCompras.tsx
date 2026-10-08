'use client'

import { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { ShoppingBag, Lightbulb, CalendarCheck, Share2, Wallet, Package, Wrench, Bookmark, BookmarkCheck } from 'lucide-react'
import ProjetoTimeline from './ProjetoTimeline'
import { type Projeto, type ItemProjeto } from './ProjetoMosaico'
import ProjetoChat from './ProjetoChat'
import PlantaCasa from './PlantaCasa'
import ProdutoDrawer from './ProdutoDrawer'
import StoreMap from './StoreMap'
import type { SearchResult } from '@/types/produto'
import Link from 'next/link'
import Card from './ui/Card'
import Button from './ui/Button'
import { codificarLista } from '@/lib/listaCompartilhada'
import { getOrcamento } from '@/lib/clientOrcamento'
import { getUsuarioLogado } from '@/lib/clientAuth'
import { salvarProjeto, atualizarProgresso, getProjeto, type ProjetoSalvo } from '@/lib/clientProjetos'
import type { ProgressoProjeto } from '@/lib/rascunhoProjeto'
import { showToast } from '@/lib/toast'

const LOJAS = [
  'Interlagos — São Paulo/SP', 'Osasco — Osasco/SP', 'Aricanduva — São Paulo/SP',
  'Santo André — Santo André/SP', 'Guarulhos — Guarulhos/SP', 'Campinas — Campinas/SP',
  'Alphaville — Barueri/SP', 'Belo Horizonte Norte — BH/MG',
  'Barra da Tijuca — Rio de Janeiro/RJ', 'Curitiba — Curitiba/PR',
]

// Chave estável de um item entre duas versões da lista (antes/depois de um pedido de
// mudança pelo chat) — usada só pra tentar preservar progresso do cliente, não pra nada
// visível. Não é perfeita (a IA pode reescrever o texto de um item que não devia mudar),
// mas cobre o caso comum de "só um item mudou, o resto ficou igual".
function chaveDoItem(item: ItemProjeto): string {
  return `${item.etapa_ordem ?? 0}::${item.material}`
}

// Depois de um pedido de mudança no chat, os PRODUTOS escolhidos (selecionados, um Set de
// ids) sobrevivem sozinhos pra itens que não mudaram — buscaTextoSimples é determinística
// contra o mesmo texto de material, então resolve pro mesmo produto. Só precisa de ajuda
// pra itens novos (escolhe o preferido, mesma regra da primeira geração).
function preencherSelecaoPadrao(itens: ItemProjeto[], selecionadosAtuais: Set<string>): Set<string> {
  const proximo = new Set(selecionadosAtuais)
  for (const item of itens) {
    const jaTemEscolha = item.resultados.some(r => proximo.has(r.produto.id))
    if (jaTemEscolha) continue
    const preferido = item.resultados.find(r => r.produto.estoque > 0) ?? item.resultados[0]
    if (preferido) proximo.add(preferido.produto.id)
  }
  return proximo
}

// Diz, pra cada item da lista NOVA (posição), qual era ele na lista ANTIGA. Primeiro pela
// chave completa (etapa + material). Se não achar, pelo nome do material sozinho, desde que
// ele seja único nas duas listas: a IA renumera as etapas quando tira uma inteira (visto no
// teste com o Gemini real — "tira a pintura" fez a etapa 6 virar 4), e só com a chave
// completa os itens que nem mudaram perdiam o progresso.
function casarItens(itensAntigos: ItemProjeto[], itensNovos: ItemProjeto[]): Map<number, number> {
  const contar = (itens: ItemProjeto[]) => {
    const vezes = new Map<string, number>()
    itens.forEach(i => vezes.set(i.material, (vezes.get(i.material) ?? 0) + 1))
    return vezes
  }
  const vezesNaAntiga = contar(itensAntigos)
  const vezesNaNova = contar(itensNovos)
  const antigoPorChave = new Map(itensAntigos.map((item, i) => [chaveDoItem(item), i]))
  const antigoPorMaterial = new Map(itensAntigos.map((item, i) => [item.material, i]))
  const casados = new Map<number, number>()
  itensNovos.forEach((item, novoIndice) => {
    let antigo = antigoPorChave.get(chaveDoItem(item))
    if (antigo === undefined && vezesNaAntiga.get(item.material) === 1 && vezesNaNova.get(item.material) === 1) {
      antigo = antigoPorMaterial.get(item.material)
    }
    if (antigo !== undefined) casados.set(novoIndice, antigo)
  })
  return casados
}

// Itens concluídos são guardados por ÍNDICE no array — se a IA reordenar ou adicionar itens
// no meio da lista, os índices antigos apontam pra itens errados. Item que continua sendo o
// mesmo (ver casarItens) mantém o check; o resto perde.
function remapearConcluidos(casados: Map<number, number>, concluidosAntigos: Set<number>): Set<number> {
  const novo = new Set<number>()
  casados.forEach((indiceAntigo, novoIndice) => {
    if (concluidosAntigos.has(indiceAntigo)) novo.add(novoIndice)
  })
  return novo
}

// "O produto do item" em todas as telas (road map, planta, mapa, compartilhar) é a PRIMEIRA
// opção do item que está selecionada. Pôr o produto escolhido na frente das opções é o que
// garante que a escolha vale mesmo quando outro item da lista usa uma das outras opções.
function comEscolhaNaFrente(item: ItemProjeto, produtoId: string): ItemProjeto {
  if (!item.resultados.some(r => r.produto.id === produtoId)) return item
  return {
    ...item,
    resultados: [...item.resultados.filter(r => r.produto.id === produtoId), ...item.resultados.filter(r => r.produto.id !== produtoId)],
  }
}

// Exposto via ref pro ProjetoWizard aplicar uma atualização vinda do SEU PRÓPRIO chat
// (quando `semChatInterno` esconde o ProjetoChat embutido abaixo) sem duplicar a lógica de
// mesclagem de progresso, que já mora aqui.
export interface ListaDeComprasHandle {
  aplicarAtualizacao: (novoProjeto: Projeto) => void
}

interface ListaDeComprasProps {
  projeto: Projeto
  descricaoOriginal: string
  onTotalChange?: (total: number | null) => void
  projetoSalvo?: ProjetoSalvo
  // true quando usado dentro do ProjetoWizard (components/ProjetoWizard.tsx) — lá a conversa
  // vive numa aba própria, separada do resultado, então o chat embutido aqui ficaria
  // duplicado. Em Minha Conta > Projetos (uso standalone) continua false, chat normal.
  semChatInterno?: boolean
  // Rascunho automático (lib/rascunhoProjeto.ts), usado pelo ProjetoWizard: `progressoInicial`
  // é de onde a tela recomeça ao voltar pro Projeto Guiado, e `onProgresso` avisa a cada
  // mudança (produto trocado, item concluído, loja, lista alterada pelo chat, projeto salvo).
  progressoInicial?: ProgressoProjeto
  onProgresso?: (progresso: ProgressoProjeto & { projeto: Projeto }) => void
}

// `projetoSalvo`: quando vem de Minha Conta > Projetos, começa do progresso guardado
// (produtos escolhidos, etapas concluídas, loja) e grava de volta cada mudança.
const ListaDeCompras = forwardRef<ListaDeComprasHandle, ListaDeComprasProps>(function ListaDeCompras(
  { projeto: projetoInicial, descricaoOriginal, onTotalChange, projetoSalvo, semChatInterno, progressoInicial, onProgresso },
  ref
) {
  // Estado, não só prop: o chat do projeto (components/ProjetoChat.tsx) pode substituir a
  // lista inteira depois de um pedido de mudança do cliente.
  const [projeto, setProjeto] = useState<Projeto>(projetoInicial)
  // De onde a tela começa: projeto salvo na conta > rascunho automático > recém-gerado.
  const inicio = projetoSalvo ?? progressoInicial
  const [loja, setLoja] = useState(inicio?.loja ?? LOJAS[0])
  const [selecionados, setSelecionados] = useState<Set<string>>(
    () => inicio ? new Set(inicio.selecionados) : new Set(projeto.itens.flatMap(i => {
      const preferido = i.resultados.find(r => r.produto.estoque > 0) ?? i.resultados[0]
      return preferido ? [preferido.produto.id] : []
    }))
  )
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [aba, setAba] = useState<'visao-geral' | 'lista-completa' | 'mapa'>(projetoSalvo ? 'lista-completa' : 'visao-geral')
  const [itensConcluidos, setItensConcluidos] = useState<Set<number>>(() => new Set(inicio?.itensConcluidos ?? []))
  const [salvoId, setSalvoId] = useState<string | null>(projetoSalvo?.id ?? progressoInicial?.salvoId ?? null)
  const [emailUsuario, setEmailUsuario] = useState<string | null>(null)
  useEffect(() => {
    const email = getUsuarioLogado()?.email ?? null
    setEmailUsuario(email)
    // O rascunho pode lembrar de um projeto salvo que já foi apagado de Minha Conta (ou o
    // cliente saiu da conta): aí volta a oferecer "Salvar projeto" em vez de dizer que está salvo.
    const idDoRascunho = projetoSalvo ? null : progressoInicial?.salvoId
    if (idDoRascunho && !(email && getProjeto(email, idDoRascunho))) setSalvoId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    onProgresso?.({
      selecionados: Array.from(selecionados),
      itensConcluidos: Array.from(itensConcluidos),
      loja,
      salvoId,
      projeto,
    })
  }, [onProgresso, selecionados, itensConcluidos, loja, salvoId, projeto])

  // Com o projeto salvo, todo progresso (troca de produto, etapa concluída, loja, e a lista
  // em si depois de um pedido de mudança pelo chat) é gravado.
  useEffect(() => {
    if (!salvoId || !emailUsuario) return
    atualizarProgresso(emailUsuario, salvoId, {
      selecionados: Array.from(selecionados),
      itensConcluidos: Array.from(itensConcluidos),
      loja,
      projeto,
    })
  }, [salvoId, emailUsuario, selecionados, itensConcluidos, loja, projeto])

  function alternarItem(indice: number) {
    setItensConcluidos(prev => {
      const next = new Set(prev)
      next.has(indice) ? next.delete(indice) : next.add(indice)
      return next
    })
  }

  // "Trocar produto" de um passo do road map: o item passa a usar outra das opções que a
  // busca achou pra ele. A escolha anterior só sai da lista se nenhum outro item estiver
  // usando o mesmo produto; e o escolhido vai pra frente das opções do item, porque é a
  // primeira opção selecionada que vale como "o produto do item" em todas as telas.
  function trocarProduto(indice: number, produtoId: string) {
    const item = projeto.itens[indice]
    if (!item) return
    const escolhaDe = (i: ItemProjeto) => i.resultados.find(r => selecionados.has(r.produto.id))?.produto.id
    const anterior = escolhaDe(item)
    const usadoPorOutro = projeto.itens.some((outro, i) => i !== indice && escolhaDe(outro) === anterior)
    setSelecionados(prev => {
      const next = new Set(prev)
      if (anterior && !usadoPorOutro) next.delete(anterior)
      next.add(produtoId)
      return next
    })
    setProjeto(p => ({ ...p, itens: p.itens.map((it, i) => (i === indice ? comEscolhaNaFrente(it, produtoId) : it)) }))
  }

  // Chamado pelo chat (ProjetoChat) quando a IA devolve a lista já atualizada. Tenta
  // preservar o progresso do cliente pros itens que continuam iguais — ver as duas funções
  // de mesclagem no topo do arquivo.
  function handleProjetoAtualizado(projetoDaIA: Projeto) {
    // A lista volta da IA com as opções de cada item na ordem da busca. Nos itens que
    // continuam iguais, o produto que estava escolhido (inclusive o trocado à mão) volta
    // pra frente — senão um pedido de mudança no chat desfaria as trocas do cliente.
    const casados = casarItens(projeto.itens, projetoDaIA.itens)
    const novoProjeto: Projeto = {
      ...projetoDaIA,
      itens: projetoDaIA.itens.map((item, novoIndice) => {
        const antigo = casados.get(novoIndice)
        const escolha = antigo === undefined
          ? undefined
          : projeto.itens[antigo].resultados.find(r => selecionados.has(r.produto.id))?.produto.id
        return escolha ? comEscolhaNaFrente(item, escolha) : item
      }),
    }
    const novosSelecionados = preencherSelecaoPadrao(novoProjeto.itens, selecionados)
    const novosConcluidos = remapearConcluidos(casados, itensConcluidos)
    setProjeto(novoProjeto)
    setSelecionados(novosSelecionados)
    setItensConcluidos(novosConcluidos)
  }

  useImperativeHandle(ref, () => ({ aplicarAtualizacao: handleProjetoAtualizado }))

  function salvarNaConta() {
    if (!emailUsuario) return
    const salvo = salvarProjeto(emailUsuario, {
      titulo: projeto.titulo,
      descricao: descricaoOriginal,
      loja,
      projeto,
      selecionados: Array.from(selecionados),
      itensConcluidos: Array.from(itensConcluidos),
    })
    if (!salvo) {
      showToast('Não foi possível salvar: o armazenamento do navegador está cheio.')
      return
    }
    setSalvoId(salvo.id)
    showToast('Projeto salvo em Minha Conta › Projetos')
  }
  const [produtoDrawer, setProdutoDrawer] = useState<SearchResult['produto'] | null>(null)
  // Orçamento definido no topo da tela do Projeto Guiado (TermometroOrcamento) — lido no
  // useEffect porque vive em localStorage; e reage ao evento que o termômetro já dispara.
  const [orcamento, setOrcamento] = useState<number | null>(null)
  useEffect(() => {
    const ler = () => setOrcamento(getOrcamento())
    ler()
    window.addEventListener('lm-orcamento-change', ler)
    return () => window.removeEventListener('lm-orcamento-change', ler)
  }, [])

  const mapResultados: SearchResult[] = projeto.itens
    .flatMap(i => i.resultados)
    .filter(r => selecionados.has(r.produto.id))
    .reduce((acc, r) => acc.find(a => a.produto.id === r.produto.id) ? acc : [...acc, r], [] as SearchResult[])

  const totalEstimado = mapResultados.reduce((sum, r) => sum + ((r.produto as any).preco ?? 0), 0)

  // Avisa a página pra barra de orçamento do topo acompanhar este total; ao sair (novo
  // projeto), volta a null e a barra retorna ao modo carrinho.
  useEffect(() => {
    onTotalChange?.(totalEstimado)
    return () => onTotalChange?.(null)
  }, [totalEstimado, onTotalChange])

  function compartilharWhatsApp() {
    const linhas: string[] = []

    linhas.push(`🏗️ *Projeto: ${projeto.titulo}*`)
    linhas.push(`_${projeto.resumo}_`)
    linhas.push('')
    linhas.push(`📋 *Lista de Materiais — ${loja.split(' — ')[0]}*`)
    linhas.push('')

    let num = 1
    for (const item of projeto.itens) {
      const selecionadosDoItem = item.resultados.filter(r => selecionados.has(r.produto.id))
      if (selecionadosDoItem.length === 0) continue
      for (const r of selecionadosDoItem) {
        const preco = (r.produto as any).preco
        const precoStr = preco != null
          ? Number(preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          : ''
        linhas.push(`${String(num).padStart(2, '0')}. ✅ *${r.produto.produto}*`)
        linhas.push(`   📍 ${r.produto.corredor} · ${item.quantidade}${precoStr ? ` · ${precoStr}` : ''}`)
        num++
      }
    }

    linhas.push('')
    if (totalEstimado > 0) {
      linhas.push(`💰 *Total estimado: ${totalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}*`)
    }
    linhas.push(`🔧 Complexidade: ${projeto.complexidade}`)
    linhas.push(`📦 Orçamento previsto: ${projeto.orcamento_estimado}`)

    if (projeto.dica_especialista) {
      linhas.push('')
      linhas.push(`💡 *Dica do especialista:* ${projeto.dica_especialista}`)
    }

    linhas.push('')
    linhas.push('_Lista gerada pelo Assistente Leroy Merlin 🟢_')

    const texto = linhas.join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  async function copiarLink() {
    // Mesmo critério do compartilhar por WhatsApp e do mapa: só os itens com um produto
    // selecionado entram no link — o que o cliente vê é exatamente o que ele escolheu.
    const itensCompartilhados = projeto.itens.flatMap(item => {
      const escolhido = item.resultados.find(r => selecionados.has(r.produto.id))
      if (!escolhido) return []
      return [{
        material: item.material,
        categoria: item.categoria,
        quantidade: item.quantidade,
        prioridade: item.prioridade,
        observacao: item.observacao,
        comodo: item.comodo,
        etapa_ordem: item.etapa_ordem,
        etapa_nome: item.etapa_nome,
        produtoId: escolhido.produto.id,
      }]
    })
    const url = `${window.location.origin}/lista?d=${encodeURIComponent(
      codificarLista({ titulo: projeto.titulo, resumo: projeto.resumo, loja, itens: itensCompartilhados })
    )}`
    await navigator.clipboard.writeText(url)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 1500)
  }

  return (
    <div>
      {/* Cabeçalho do resultado: título + 3 números grandes + barra de orçamento */}
      <div className="bg-lm-green rounded-2xl p-5 text-white mb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <ShoppingBag size={18} className="text-lm-yellow flex-shrink-0" />
            <h2 className="font-bold text-xl">{projeto.titulo}</h2>
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto">
            <p className="text-white/60 text-[10px] mb-1">Loja</p>
            <select value={loja} onChange={e => setLoja(e.target.value)}
              className="w-full sm:w-auto sm:max-w-[200px] text-xs bg-white/15 border border-white/30 text-white rounded-lg px-2 py-1.5 focus:outline-none">
              {LOJAS.map(l => <option key={l} value={l} className="text-gray-800">{l}</option>)}
            </select>
          </div>
        </div>

        {/* No celular o total ocupa a 1ª linha e os outros dois números dividem a 2ª —
            empilhados, os três tomavam uma tela inteira antes de a lista aparecer. */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-4">
          <div className="col-span-2 sm:col-span-1 bg-white/15 border border-white/25 rounded-xl px-3 sm:px-4 py-3">
            <p className="text-white/60 text-[10px] uppercase tracking-wide flex items-center gap-1"><Wallet size={11} /> Total estimado</p>
            <p className="text-2xl font-black">
              {totalEstimado > 0
                ? totalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : projeto.orcamento_estimado}
            </p>
            <p className="text-[11px] text-white/60">dos itens selecionados</p>
          </div>
          <div className="bg-white/15 border border-white/25 rounded-xl px-3 sm:px-4 py-3">
            <p className="text-white/60 text-[10px] uppercase tracking-wide flex items-center gap-1"><Package size={11} /> Materiais</p>
            <p className="text-xl sm:text-2xl font-black">{projeto.itens.length}</p>
            <p className="text-[11px] text-white/60">{mapResultados.length} selecionados na lista</p>
          </div>
          <div className="bg-white/15 border border-white/25 rounded-xl px-3 sm:px-4 py-3 min-w-0">
            <p className="text-white/60 text-[10px] uppercase tracking-wide flex items-center gap-1"><Wrench size={11} /> Complexidade</p>
            <p className="text-lg sm:text-2xl font-black leading-7 sm:leading-8 break-words">{projeto.complexidade}</p>
            <p className="text-[11px] text-white/60">previsto: {projeto.orcamento_estimado}</p>
          </div>
        </div>

        {/* Compara o total da lista com o orçamento que o cliente definiu no topo da tela */}
        {orcamento !== null && totalEstimado > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-white/80">
                {totalEstimado <= orcamento
                  ? `Dentro do seu orçamento — sobram ${(orcamento - totalEstimado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                  : `Passa ${(totalEstimado - orcamento).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} do seu orçamento`}
              </span>
              <span className="text-white/60">
                orçamento {orcamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${totalEstimado > orcamento ? 'bg-red-400' : 'bg-lm-yellow'}`}
                style={{ width: `${Math.min((totalEstimado / orcamento) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={compartilharWhatsApp}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-black text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            {/* WhatsApp icon */}
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Compartilhar no WhatsApp
          </button>
          <button
            onClick={copiarLink}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/15 hover:bg-black/15 border border-white/30 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Share2 size={14} />
            {linkCopiado ? 'Link copiado ✓' : 'Copiar link'}
          </button>
          {salvoId ? (
            <Link
              href="/conta/projetos"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-lm-yellow text-black text-sm font-bold px-4 py-2.5 rounded-xl"
            >
              <BookmarkCheck size={15} /> Projeto salvo · ver meus projetos
            </Link>
          ) : emailUsuario ? (
            <button
              onClick={salvarNaConta}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-lm-yellow hover:brightness-95 text-black text-sm font-bold px-4 py-2.5 rounded-xl transition-all"
            >
              <Bookmark size={15} /> Salvar projeto
            </button>
          ) : (
            <Link
              href="/funcionario/login?next=/projeto"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/15 hover:bg-black/15 border border-white/30 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Bookmark size={15} /> Entre para salvar o projeto
            </Link>
          )}
        </div>
      </div>

      {projeto.dica_especialista && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-lm-yellow/50 bg-yellow-50 p-4">
          <span className="w-9 h-9 rounded-xl bg-lm-yellow text-black flex items-center justify-center flex-shrink-0">
            <Lightbulb size={18} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-yellow-700">Dica do especialista</p>
            <p className="text-sm text-gray-800 leading-relaxed">{projeto.dica_especialista}</p>
          </div>
        </div>
      )}

      {/* Abas */}
      <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
        <button
          type="button"
          onClick={() => setAba('visao-geral')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            aba === 'visao-geral' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-700 hover:text-gray-700'
          }`}
        >
          Visão geral
        </button>
        <button
          type="button"
          onClick={() => setAba('lista-completa')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            aba === 'lista-completa' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-700 hover:text-gray-700'
          }`}
        >
          Lista completa
        </button>
        <button
          type="button"
          onClick={() => setAba('mapa')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            aba === 'mapa' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-700 hover:text-gray-700'
          }`}
        >
          Mapa
        </button>
      </div>

      {aba === 'mapa' && (
        mapResultados.length > 0 ? (
          <StoreMap
            resultados={mapResultados}
            loja={loja}
            totalEstimado={totalEstimado}
            onSelect={setProdutoDrawer}
          />
        ) : (
          <Card className="text-center py-10">
            <p className="text-sm text-gray-700">Selecione produtos na Lista completa pra vê-los no mapa.</p>
          </Card>
        )
      )}

      {aba === 'visao-geral' && (
        <PlantaCasa
          itens={projeto.itens}
          selecionados={selecionados}
          onSelecionarProduto={setProdutoDrawer}
          onVerMais={() => setAba('lista-completa')}
        />
      )}

      {aba === 'lista-completa' && (
        <div className="space-y-5">
          <ProjetoTimeline
            itens={projeto.itens}
            selecionados={selecionados}
            itensConcluidos={itensConcluidos}
            onAlternarItem={alternarItem}
            onSelecionarProduto={setProdutoDrawer}
            onTrocarProduto={trocarProduto}
            etapasInfo={projeto.etapas}
          />

          {/* CTA Agendamento */}
          <Card className="bg-lm-yellow/10 border-lm-yellow/30">
            <p className="text-sm font-bold text-gray-900 mb-1">Quer ajuda especializada?</p>
            <p className="text-sm text-gray-700 mb-4">
              Nossos consultores avaliam seu projeto na loja, sem custo e sem compromisso.
            </p>
            <Link href="/agendamento" className="block">
              <Button variant="primary" className="w-full">
                <CalendarCheck size={16} /> Agendar consulta com especialista
              </Button>
            </Link>
          </Card>
        </div>
      )}

      {/* Continuação da conversa — visível nas duas abas, não só na "Lista completa".
          Omitido dentro do ProjetoWizard (semChatInterno): lá a conversa já tem aba própria. */}
      {!semChatInterno && (
        <div className="mt-5">
          <ProjetoChat projeto={projeto} onProjetoAtualizado={handleProjetoAtualizado} />
        </div>
      )}

      <ProdutoDrawer produto={produtoDrawer} onClose={() => setProdutoDrawer(null)} />
    </div>
  )
})

export default ListaDeCompras
