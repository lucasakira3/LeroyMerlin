// RAG — "geração com consulta": antes de a IA responder, o servidor busca no catálogo real os
// produtos que têm a ver com o pedido e manda junto. Assim a IA recomenda o que existe na
// loja, com corredor, preço e estoque de verdade, em vez de inventar.
//
// Usado por:
//   - o Robô do Tire Dúvidas e o "Pergunte sobre este produto" (app/api/duvidas): a pergunta
//     vira uma busca por significado (lib/search.ts) e os produtos achados entram no prompt;
//   - o Projeto Guiado (app/api/projeto e app/api/projeto/conversar): cada material da lista
//     que a IA montou é casado com o produto do catálogo por significado (vetores) somado a
//     palavras e categoria — antes era só por palavras, e "Extensão para Cabo de Rolo" (de
//     pintura) caía num cabo elétrico.
//
// Cota: cada texto transformado em vetor conta 1 na cota diária do Gemini (separada da cota
// de geração de texto). O Projeto Guiado manda todos os materiais numa chamada só.
import { cosineSimilarity } from './embeddings'
import { carregarProdutos, carregarProdutosComEmbeddings } from './produtos'
import { buscarProdutos } from './search'
import { buscaTextoSimples } from './projetoGuiado'
import type { Produto, SearchResult } from '@/types/produto'

type ProdutoPublico = SearchResult['produto']

// ── Texto do catálogo pro prompt ─────────────────────────────────────────────────

function preco(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function linhaDoProduto(p: ProdutoPublico): string {
  const estoque = p.estoque > 0 ? `${p.estoque} em estoque` : 'sem estoque'
  return `${p.produto} (código ${p.id}) — ${p.categoria} — ${p.corredor} — ${preco(p.preco)} — ${estoque}`
}

// Os produtos da loja mais parecidos com a consulta, já como texto pra ir no prompt.
// Nunca falha: sem a busca por significado (cota, rede), lib/search.ts cai na busca por
// palavras; sem nada, volta lista vazia e a IA é instruída a dizer que não achou.
export async function produtosDaLojaPara(consulta: string, quantos = 6): Promise<{ texto: string; produtos: ProdutoPublico[] }> {
  try {
    const achados = (await buscarProdutos(consulta, quantos)).map(r => r.produto)
    if (achados.length === 0) return { texto: '(nenhum produto do catálogo encontrado para esta pergunta)', produtos: [] }
    return { texto: achados.map((p, i) => `${i + 1}. ${linhaDoProduto(p)}`).join('\n'), produtos: achados }
  } catch {
    return { texto: '(catálogo indisponível no momento)', produtos: [] }
  }
}

// ── Vetores em lote ──────────────────────────────────────────────────────────────

// Vários textos numa chamada só (até 100 por chamada na API do Gemini). Mesmo modelo e
// formato dos vetores dos produtos (scripts/gerar-embeddings.ts), pra poderem ser comparados.
export async function gerarEmbeddingsEmLote(textos: string[]): Promise<number[][]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada')
  const vetores: number[][] = []
  for (let i = 0; i < textos.length; i += 100) {
    const lote = textos.slice(i, i + 100)
    const resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: lote.map(texto => ({ model: 'models/gemini-embedding-2', content: { parts: [{ text: texto }] } })),
        }),
      }
    )
    if (!resposta.ok) {
      const erro = await resposta.json().catch(() => ({}))
      throw new Error(erro.error?.message || `HTTP ${resposta.status}`)
    }
    const dados = await resposta.json()
    for (const e of dados.embeddings ?? []) vetores.push(e.values as number[])
  }
  if (vetores.length !== textos.length) throw new Error('resposta incompleta da API de vetores')
  return vetores
}

// ── Casamento material → produto (Projeto Guiado) ────────────────────────────────

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Notas de corte (calibradas com 22 materiais reais do Projeto Guiado em 24/10/2026):
//   - semelhança mínima de significado pra ser candidato;
//   - nota final mínima (significado + palavras + categoria) pra ser sugerido. Abaixo dela o
//     "mais parecido" é só o menos pior — melhor não sugerir nada do que algo sem relação
//     (ex.: "Balde Plástico 12L", que a loja não tem, chegava num regador).
export const SEMELHANCA_MINIMA = 0.6
export const NOTA_MINIMA = 0.68
const PESO_PALAVRAS = 0.08
// Categoria: soma se bate, não conta se é vizinha, desconta se é distante. É o que tira
// "Extensão para Cabo de Rolo" (Pintura) do cabo elétrico. Vizinhas não descontam porque a
// IA às vezes dá a vizinha pro mesmo item (chama bucha de "Ferramentas"; a loja guarda em
// "Construção").
const PESO_CATEGORIA_IGUAL = 0.025
const PESO_CATEGORIA_DISTANTE = -0.05
const VIZINHAS: [string, string][] = [
  ['construcao', 'ferramentas'], ['construcao', 'pisos e ceramica'], ['construcao', 'pintura'], ['construcao', 'hidraulica'],
  ['banheiro', 'hidraulica'], ['banheiro', 'pisos e ceramica'], ['eletrica', 'iluminacao'], ['decoracao', 'iluminacao'],
  ['decoracao', 'pintura'], ['jardim', 'ferramentas'],
]

function pesoDaCategoria(doProduto: string, pedida: string): number {
  const a = normalizar(doProduto), b = normalizar(pedida)
  if (!b) return 0
  if (a === b) return PESO_CATEGORIA_IGUAL
  return VIZINHAS.some(([x, y]) => (x === a && y === b) || (x === b && y === a)) ? 0 : PESO_CATEGORIA_DISTANTE
}

// Nota de um produto pra um material: semelhança de significado + um empurrão pra quem tem
// as mesmas palavras no nome (tamanhos e medidas, "1kg", "18L", pesam aqui) + categoria.
export function notaDoCandidato(
  material: string,
  categoria: string,
  produto: Pick<Produto, 'produto' | 'categoria' | 'tags'>,
  semelhanca: number
): number {
  const termos = normalizar(material).split(/[^a-z0-9,]+/).filter(t => t.length > 2 || /\d/.test(t))
  const texto = normalizar(`${produto.produto} ${produto.tags.join(' ')}`)
  const palavras = termos.length ? termos.filter(t => texto.includes(t)).length / termos.length : 0
  return semelhanca + PESO_PALAVRAS * palavras + pesoDaCategoria(produto.categoria, categoria)
}

export interface MaterialParaCasar { material: string; categoria: string }

// Vetores de materiais já vistos, enquanto o servidor está de pé. Na conversa de edição do
// Projeto Guiado a lista inteira volta a cada mensagem com quase tudo igual — sem o cache,
// cada "troca a tinta por branca" gastaria de novo a cota com os outros 20 materiais.
const vetoresDosMateriais = new Map<string, number[]>()

async function vetoresPara(materiais: string[]): Promise<number[][]> {
  const faltando = [...new Set(materiais.filter(m => !vetoresDosMateriais.has(m)))]
  if (faltando.length > 0) {
    if (vetoresDosMateriais.size > 2000) vetoresDosMateriais.clear() // não crescer sem limite
    const novos = await gerarEmbeddingsEmLote(faltando)
    faltando.forEach((m, i) => vetoresDosMateriais.set(m, novos[i]))
  }
  return materiais.map(m => vetoresDosMateriais.get(m)!)
}

// Até `quantos` produtos do catálogo pra cada material, do melhor pro pior. Se a busca por
// significado não estiver disponível, usa a busca por palavras de antes (buscaTextoSimples).
export async function casarMateriaisComCatalogo(itens: MaterialParaCasar[], quantos = 3): Promise<SearchResult[][]> {
  if (itens.length === 0) return []
  try {
    const [produtos, vetores] = await Promise.all([
      carregarProdutosComEmbeddings(),
      vetoresPara(itens.map(i => i.material)),
    ])
    const comVetor = produtos.filter(p => p.embedding.length > 0)
    return itens.map((item, i) => {
      const candidatos = comVetor
        .map(p => ({ p, semelhanca: cosineSimilarity(vetores[i], p.embedding) }))
        .filter(c => c.semelhanca >= SEMELHANCA_MINIMA)
        .map(c => ({ ...c, nota: notaDoCandidato(item.material, item.categoria, c.p, c.semelhanca) }))
        .filter(c => c.nota >= NOTA_MINIMA)
        .sort((a, b) => b.nota - a.nota || (b.p.estoque > 0 ? 1 : 0) - (a.p.estoque > 0 ? 1 : 0))
        .slice(0, quantos)
      return candidatos.map(({ p: { embedding: _e, embedding_text: _et, ...publico }, nota }) => ({ produto: publico, score: nota }))
    })
  } catch (erro) {
    console.error('[rag] casamento por significado indisponível, usando palavras:', erro instanceof Error ? erro.message : erro)
    const produtos = await carregarProdutos()
    return itens.map(item => buscaTextoSimples(produtos, item.material, quantos))
  }
}
