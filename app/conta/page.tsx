"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Package, RotateCcw, Share2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ProductListItem from "@/components/ProductListItem";
import Pagination from "@/components/ui/Pagination";
import MeusDados from "@/components/MeusDados";
import EnderecosSalvos from "@/components/EnderecosSalvos";
import PedidoTimeline from "@/components/PedidoTimeline";
import StarRating from "@/components/ui/StarRating";
import { getFavoritosIds } from "@/lib/clientFavoritos";
import { getHistoricoIds } from "@/lib/clientHistorico";
import {
  getUsuarioLogado,
  logoutUsuario,
  type UsuarioLogado,
} from "@/lib/clientAuth";
import { getPedidos, type Pedido } from "@/lib/clientPedidos";
import { getStatusPedido } from "@/lib/statusPedido";
import { getAvaliacoesDoUsuario, type AvaliacaoComProduto } from "@/lib/clientAvaliacoes";
import { buscarProdutosPorIds } from "@/lib/produtosCliente";
import { getImagemCategoria } from "@/lib/categoriaImagens";
import { adicionarAoCarrinho } from "@/lib/clientCarrinho";
import { codificarPedido } from "@/lib/pedidoCompartilhado";
import { showToast } from "@/lib/toast";
import type { SearchResult } from "@/types/produto";

const STATUS_COR: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  purple: "bg-purple-100 text-purple-700",
  green: "bg-green-100 text-green-700",
};

const PRODUTOS_POR_PAGINA = 8;
const PEDIDOS_POR_PAGINA = 5;

async function buscarProdutos(ids: string[]): Promise<SearchResult[]> {
  const produtos = await buscarProdutosPorIds(ids);
  return produtos.map((produto) => ({ produto, score: 1 }));
}

function SecaoProdutos({
  titulo,
  ids,
  mensagemVazia,
  limite,
  verTodosHref,
  verTodosLabel,
}: {
  titulo: string;
  ids: string[];
  mensagemVazia: string;
  limite?: number;
  verTodosHref?: string;
  verTodosLabel?: string;
}) {
  const [produtos, setProdutos] = useState<SearchResult[] | null>(null);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    let cancelado = false;
    if (ids.length === 0) {
      setProdutos([]);
      return;
    }
    buscarProdutos(ids).then((resultado) => {
      if (!cancelado) setProdutos(resultado);
    });
    return () => {
      cancelado = true;
    };
  }, [ids]);

  useEffect(() => {
    setPagina(1);
  }, [ids]);

  const totalPaginas = produtos
    ? Math.max(1, Math.ceil(produtos.length / PRODUTOS_POR_PAGINA))
    : 1;
  const produtosPaginados = produtos
    ? limite
      ? produtos.slice(0, limite)
      : produtos.slice(
          (pagina - 1) * PRODUTOS_POR_PAGINA,
          pagina * PRODUTOS_POR_PAGINA,
        )
    : [];

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{titulo}</h2>
      {produtos === null && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}
      {produtos !== null && produtos.length === 0 && (
        <p className="text-sm text-gray-500 py-6">{mensagemVazia}</p>
      )}
      {produtos !== null && produtos.length > 0 && (
        <>
          <div className="space-y-2">
            {produtosPaginados.map(({ produto }, i) => (
              <ProductListItem
                key={produto.id}
                produto={produto}
                href={`/produto/${produto.id}`}
                className="animate-fade-in-up"
                style={
                  {
                    "--stagger-delay": `${Math.min(i, 15) * 30}ms`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
          {limite && produtos.length > limite && verTodosHref ? (
            <Link
              href={verTodosHref}
              className="inline-flex mt-4 text-sm font-semibold text-lm-green hover:underline"
            >
              {verTodosLabel}
            </Link>
          ) : !limite ? (
            <Pagination
              page={pagina}
              totalPages={totalPaginas}
              onChange={setPagina}
              className="mt-4"
            />
          ) : null}
        </>
      )}
    </section>
  );
}

function SecaoPedidos({ pedidos }: { pedidos: Pedido[] }) {
  const router = useRouter();
  const [pagina, setPagina] = useState(1);
  const [linkCopiadoId, setLinkCopiadoId] = useState<string | null>(null);
  const totalPaginas = Math.max(
    1,
    Math.ceil(pedidos.length / PEDIDOS_POR_PAGINA),
  );
  const pedidosPaginados = pedidos.slice(
    (pagina - 1) * PEDIDOS_POR_PAGINA,
    pagina * PEDIDOS_POR_PAGINA,
  );

  function comprarDeNovo(pedido: Pedido) {
    for (const item of pedido.itens) {
      adicionarAoCarrinho(item.produtoId, item.quantidade);
    }
    showToast(
      `${pedido.itens.length} ${pedido.itens.length === 1 ? "item adicionado" : "itens adicionados"} ao carrinho`,
    );
    router.push("/carrinho");
  }

  async function compartilharPedido(pedido: Pedido) {
    const url = `${window.location.origin}/pedido?d=${encodeURIComponent(codificarPedido(pedido))}`;
    await navigator.clipboard.writeText(url);
    setLinkCopiadoId(pedido.numero);
    setTimeout(() => setLinkCopiadoId(null), 1500);
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Meus pedidos</h2>
      {pedidos.length === 0 && (
        <p className="text-sm text-gray-500 py-6">
          Você ainda não fez nenhum pedido.
        </p>
      )}
      {pedidos.length > 0 && (
        <div className="space-y-3">
          {pedidosPaginados.map((pedido) => {
            const status = getStatusPedido(pedido);
            return (
            <div
              key={pedido.numero}
              className="bg-white rounded-card shadow-soft border border-gray-100 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package size={15} className="text-lm-green" />
                  <span className="font-mono text-sm font-semibold text-gray-900">
                    {pedido.numero}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COR[status.cor]}`}
                  >
                    {status.label}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(pedido.data).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="space-y-1 mb-3">
                {pedido.itens.map((item) => (
                  <p key={item.produtoId} className="text-sm text-gray-600">
                    {item.quantidade}× {item.nome}
                  </p>
                ))}
              </div>
              <div className="mb-3 px-1">
                <PedidoTimeline etapas={status.etapas} etapaAtual={status.etapa} />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {pedido.metodo === "retirada"
                    ? `Retirada: ${pedido.loja}`
                    : `Entrega: ${pedido.endereco}`}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {pedido.total.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
              {pedido.pagamento && (
                <p className="text-xs text-gray-500 pt-1.5">
                  {pedido.pagamento.metodo === "cartao"
                    ? `${pedido.pagamento.bandeira} final ${pedido.pagamento.ultimosDigitos}${pedido.pagamento.parcelas && pedido.pagamento.parcelas > 1 ? ` · ${pedido.pagamento.parcelas}x` : ""}`
                    : pedido.pagamento.metodo === "pix" ? "Pix" : "Boleto bancário"}
                </p>
              )}
              <div className="flex items-center gap-3 pt-2 mt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => comprarDeNovo(pedido)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-lm-green hover:underline"
                >
                  <RotateCcw size={13} /> Comprar de novo
                </button>
                <button
                  type="button"
                  onClick={() => compartilharPedido(pedido)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-lm-green transition-colors"
                >
                  <Share2 size={13} />
                  {linkCopiadoId === pedido.numero ? "Link copiado ✓" : "Compartilhar"}
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}
      <Pagination
        page={pagina}
        totalPages={totalPaginas}
        onChange={setPagina}
        className="mt-4"
      />
    </section>
  );
}

const AVALIACOES_PREVIEW = 3;

function SecaoAvaliacoes({ avaliacoes }: { avaliacoes: AvaliacaoComProduto[] }) {
  const [produtos, setProdutos] = useState<Record<
    string,
    { produto: string; categoria: string; id: string }
  > | null>(null);
  const preview = avaliacoes.slice(0, AVALIACOES_PREVIEW);

  useEffect(() => {
    if (preview.length === 0) {
      setProdutos({});
      return;
    }
    buscarProdutosPorIds(preview.map((a) => a.produtoId)).then((resolvidos) => {
      const mapa: Record<string, { produto: string; categoria: string; id: string }> = {};
      for (const p of resolvidos) mapa[p.id] = p;
      setProdutos(mapa);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avaliacoes]);

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Minhas avaliações</h2>
      {avaliacoes.length === 0 && (
        <p className="text-sm text-gray-500 py-6">
          Você ainda não avaliou nenhum produto.
        </p>
      )}
      {avaliacoes.length > 0 && produtos && (
        <div className="space-y-2">
          {preview.map((avaliacao) => {
            const produto = produtos[avaliacao.produtoId];
            if (!produto) return null;
            return (
              <div
                key={avaliacao.produtoId}
                className="flex items-center gap-3 bg-white rounded-card shadow-soft border border-gray-100 p-3"
              >
                <img
                  src={getImagemCategoria(produto.categoria, produto.id)}
                  alt={produto.categoria}
                  className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {produto.produto}
                  </p>
                  <StarRating value={avaliacao.nota} size={12} />
                </div>
              </div>
            );
          })}
          <Link
            href="/conta/avaliacoes"
            className="inline-flex mt-2 text-sm font-semibold text-lm-green hover:underline"
          >
            Ver todas as avaliações
          </Link>
        </div>
      )}
    </section>
  );
}

export default function ContaPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [favoritosIds, setFavoritosIds] = useState<string[]>([]);
  const [historicoIds, setHistoricoIds] = useState<string[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoComProduto[]>([]);

  useEffect(() => {
    const atualizarFavoritos = () => setFavoritosIds(getFavoritosIds());
    const usuarioLogado = getUsuarioLogado();
    if (!usuarioLogado) {
      router.push("/funcionario/login");
      return;
    }
    setUsuario(usuarioLogado);
    atualizarFavoritos();
    setHistoricoIds(getHistoricoIds());
    setPedidos(getPedidos(usuarioLogado.email));
    setAvaliacoes(getAvaliacoesDoUsuario(usuarioLogado.email));
    window.addEventListener("lm-favoritos-change", atualizarFavoritos);
    window.addEventListener("storage", atualizarFavoritos);
    return () => {
      window.removeEventListener(
        "lm-favoritos-change",
        atualizarFavoritos,
      );
      window.removeEventListener("storage", atualizarFavoritos);
    };
  }, [router]);

  const handleSair = () => {
    logoutUsuario();
    window.location.href = "/";
  };

  if (!usuario) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        <PageHeader
          title="Minha Conta"
          description={`Olá, ${usuario.nome ?? usuario.email}`}
          action={
            <Button variant="ghost" size="sm" onClick={handleSair}>
              <LogOut size={16} />
              Sair
            </Button>
          }
        />
        <MeusDados
          email={usuario.email}
          nomeAtual={usuario.nome ?? usuario.email}
          onNomeAtualizado={(novoNome) => setUsuario({ ...usuario, nome: novoNome })}
        />
        <SecaoPedidos pedidos={pedidos} />
        <SecaoAvaliacoes avaliacoes={avaliacoes} />
        <EnderecosSalvos email={usuario.email} />
        <SecaoProdutos
          titulo="Favoritos"
          ids={favoritosIds}
          mensagemVazia="Você ainda não favoritou nenhum produto."
          limite={4}
          verTodosHref="/conta/favoritos"
          verTodosLabel="Ver todos os favoritos"
        />
        <SecaoProdutos
          titulo="Vistos recentemente"
          ids={historicoIds}
          mensagemVazia="Nenhum produto visitado ainda — suas buscas vão aparecer aqui."
          limite={5}
        />
      </div>
    </main>
  );
}
