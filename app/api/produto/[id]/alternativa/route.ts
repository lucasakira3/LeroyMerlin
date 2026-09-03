import { NextRequest, NextResponse } from "next/server";
import { carregarProdutos } from "@/lib/produtos";
import { getInfoOferta } from "@/lib/ofertas";
import { cosineSimilarity } from "@/lib/embeddings";
import type { Produto } from "@/types/produto";

const ID_REGEX = /^LM-\d{4}$/;

// Abaixo desse limiar de similaridade semântica, dois produtos da mesma `categoria`
// (campo largo demais — ex.: "Ferramentas" mistura parafusadeira com máscara PFF2) não são
// genuinamente comparáveis. Calibrado testando o caso real que motivou essa mudança:
// Parafusadeira a Bateria 20V Makita x outra parafusadeira/furadeira fica em ~0.75-0.84;
// x Máscara Respiratória PFF2 (mesma categoria, produto totalmente diferente) fica bem abaixo.
const LIMIAR_SIMILARIDADE = 0.78;

// Similaridade sozinha não basta: Tinta Látex Acrílica Fosca 18L Coral x Massa Corrida
// PVA 18L Coral fica em ~0.81 (acima do limiar) por serem ambos "produtos de pintura pra
// parede vendidos em lata de 18L", mas são funcionalmente complementares (uma cobre a
// parede, a outra nivela antes de pintar), não concorrentes substituíveis. Auditando
// data/produtos.json, `tags[0]` é consistentemente o substantivo que nomeia o TIPO do
// produto (ex.: "parafusadeira", "tinta", "massa corrida" — ver primeira tag de cada
// item), então exigir que bata é um proxy barato e confiável de "é o mesmo tipo de coisa".
function mesmoTipoDeProduto(a: Produto, b: Produto): boolean {
  const tipoA = a.tags[0]?.toLowerCase().trim();
  const tipoB = b.tags[0]?.toLowerCase().trim();
  return Boolean(tipoA) && tipoA === tipoB;
}

// Cor/acabamento também precisam bater quando o produto tem essa característica —
// mesmo tipo não basta: uma "Tinta Fosca" e uma "Tinta Rosa Quartzo" são ambas tinta
// látex de parede (passam em mesmoTipoDeProduto + similaridade), mas não são a mesma
// coisa colorida diferente, então virar sugestão de "troca" é enganoso pro cliente.
// Levantado auditando as tags reais de `categoria === 'Pintura'` em data/produtos.json.
const ATRIBUTOS_VISUAIS = new Set([
  'branca', 'branco', 'branco-neve', 'amarelo-canário', 'areia', 'azul', 'azul-sereno',
  'bicolor', 'cinza', 'cinza-urbano', 'marrom', 'preto', 'rosa-quartzo', 'verde',
  'verde-sálvia', 'vermelho', 'acetinado', 'brilhante', 'fosca', 'fosco', 'semibrilho',
  'lisa', 'liso',
]);

function atributosVisuais(p: Produto): Set<string> {
  return new Set(
    p.tags
      .map((t) => t.toLowerCase().trim())
      .filter((t) => ATRIBUTOS_VISUAIS.has(t)),
  );
}

// Quando o produto original tem cor/acabamento identificável, exige que o candidato
// compartilhe pelo menos um desses atributos. Se o original não tiver nenhum (produto
// sem essa característica, ex. parafusadeira), não aplica restrição nenhuma.
function corCompativel(original: Produto, candidato: Produto): boolean {
  const visuaisOriginal = atributosVisuais(original);
  if (visuaisOriginal.size === 0) return true;
  const visuaisCandidato = atributosVisuais(candidato);
  for (const atributo of visuaisOriginal) {
    if (visuaisCandidato.has(atributo)) return true;
  }
  return false;
}

function extrairMarca(p: Produto): string {
  const palavras = p.produto.trim().split(/\s+/);
  return (palavras[palavras.length - 1] ?? '').toLowerCase();
}

type ProdutoPublico = Omit<Produto, "embedding" | "embedding_text">;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Dado um produto do carrinho, busca a alternativa mais barata GENUINAMENTE comparável:
// mesma categoria exata (pré-filtro, não o bucket amplo de CATEGORIA_TERMOS) E similaridade
// semântica alta o bastante (embedding já pré-computado em data/produtos.json, comparação
// local sem chamar API) — a categoria sozinha não basta, ela mistura produtos muito
// diferentes (ex.: "Ferramentas" tem parafusadeira e máscara PFF2 juntas). Entre os
// comparáveis, ordena por preço crescente e devolve o mais barato (ver
// docs/backlog-fluxo-loja-fisica.md, seção "Termômetro de Orçamento Vivo").
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id } = await params;

    if (!ID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "ID inválido. O formato esperado é LM-XXXX (ex: LM-0042)." },
        { status: 400 },
      );
    }

    const produtos = await carregarProdutos();
    const original = produtos.find((p) => p.id === id);

    if (!original) {
      return NextResponse.json(
        { error: `Produto '${id}' não encontrado.` },
        { status: 404 },
      );
    }

    const precoOriginal = getInfoOferta(original.id, original.preco).precoComDesconto;

    const marcaOriginal = extrairMarca(original);

    const candidatos = produtos
      .filter((p) => p.id !== original.id)
      .filter((p) => p.categoria === original.categoria)
      .filter((p) => p.estoque > 0)
      .filter((p) => mesmoTipoDeProduto(original, p))
      .filter((p) => corCompativel(original, p))
      .filter((p) => cosineSimilarity(original.embedding, p.embedding) >= LIMIAR_SIMILARIDADE)
      .map((p) => ({ produto: p, preco: getInfoOferta(p.id, p.preco).precoComDesconto }))
      .filter(({ preco }) => preco < precoOriginal)
      // Prioriza marca diferente (troca de verdade) antes de preço — só cai pra mesma
      // marca se não houver nenhuma alternativa de marca diferente disponível.
      .sort((a, b) => {
        const marcaDiferenteA = extrairMarca(a.produto) !== marcaOriginal;
        const marcaDiferenteB = extrairMarca(b.produto) !== marcaOriginal;
        if (marcaDiferenteA !== marcaDiferenteB) return marcaDiferenteA ? -1 : 1;
        return a.preco - b.preco;
      });

    if (candidatos.length === 0) {
      return NextResponse.json({ alternativa: null }, { status: 200 });
    }

    const {
      embedding: _embedding,
      embedding_text: _embeddingText,
      ...produtoPublico
    }: Produto = candidatos[0].produto;

    const alternativa: ProdutoPublico = { ...produtoPublico, preco: candidatos[0].preco };

    return NextResponse.json({ alternativa }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/produto/[id]/alternativa] Erro:", error);
    return NextResponse.json(
      { error: "Falha ao buscar alternativa. Tente novamente." },
      { status: 500 },
    );
  }
}
