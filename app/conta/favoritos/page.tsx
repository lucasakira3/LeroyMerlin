"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Plus, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ProductListItem from "@/components/ProductListItem";
import { getFavoritosIds, toggleFavorito } from "@/lib/clientFavoritos";
import {
  getGrupos,
  criarGrupo,
  removerGrupo,
  getGrupoDoProduto,
  atribuirGrupo,
  type GrupoFavoritos,
} from "@/lib/clientFavoritosGrupos";
import { getUsuarioLogado } from "@/lib/clientAuth";
import { buscarProdutosPorIds } from "@/lib/produtosCliente";
import { showToast } from "@/lib/toast";
import type { SearchResult } from "@/types/produto";

async function buscarFavoritos(ids: string[]): Promise<SearchResult[]> {
  const produtos = await buscarProdutosPorIds(ids);
  return produtos.map((produto) => ({ produto, score: 1 }));
}

const SEM_GRUPO = "__sem_grupo__";

export default function FavoritosPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<SearchResult[] | null>(null);
  const [grupos, setGrupos] = useState<GrupoFavoritos[]>([]);
  const [atribuicoes, setAtribuicoes] = useState<Record<string, string>>({});
  const [filtro, setFiltro] = useState<string>("todos");
  const [novoGrupoAberto, setNovoGrupoAberto] = useState(false);
  const [novoGrupoNome, setNovoGrupoNome] = useState("");

  const carregarGrupos = useCallback((emailUsuario: string, ids: string[]) => {
    setGrupos(getGrupos(emailUsuario));
    const mapa: Record<string, string> = {};
    for (const id of ids) {
      const g = getGrupoDoProduto(emailUsuario, id);
      if (g) mapa[id] = g;
    }
    setAtribuicoes(mapa);
  }, []);

  useEffect(() => {
    const usuario = getUsuarioLogado();
    if (!usuario) {
      router.push("/funcionario/login");
      return;
    }
    setEmail(usuario.email);

    let cancelado = false;
    const atualizar = async () => {
      const ids = getFavoritosIds();
      const resultado = await buscarFavoritos(ids);
      if (cancelado) return;
      setProdutos(resultado);
      carregarGrupos(usuario.email, ids);
    };

    atualizar();
    window.addEventListener("lm-favoritos-change", atualizar);
    window.addEventListener("storage", atualizar);

    return () => {
      cancelado = true;
      window.removeEventListener("lm-favoritos-change", atualizar);
      window.removeEventListener("storage", atualizar);
    };
  }, [router, carregarGrupos]);

  function removerFavorito(id: string) {
    toggleFavorito(id);
    showToast("Removido dos favoritos", () => toggleFavorito(id));
  }

  function mudarGrupo(produtoId: string, grupoId: string) {
    if (!email) return;
    atribuirGrupo(email, produtoId, grupoId === SEM_GRUPO ? null : grupoId);
    setAtribuicoes((prev) => {
      const novo = { ...prev };
      if (grupoId === SEM_GRUPO) delete novo[produtoId];
      else novo[produtoId] = grupoId;
      return novo;
    });
  }

  function criarNovoGrupo() {
    if (!email || !novoGrupoNome.trim()) return;
    criarGrupo(email, novoGrupoNome.trim());
    setGrupos(getGrupos(email));
    setNovoGrupoNome("");
    setNovoGrupoAberto(false);
  }

  function excluirGrupo(id: string) {
    if (!email) return;
    removerGrupo(email, id);
    setGrupos(getGrupos(email));
    setAtribuicoes((prev) => {
      const novo = { ...prev };
      for (const produtoId of Object.keys(novo)) {
        if (novo[produtoId] === id) delete novo[produtoId];
      }
      return novo;
    });
    if (filtro === id) setFiltro("todos");
  }

  const produtosFiltrados = (produtos ?? []).filter(({ produto }) => {
    if (filtro === "todos") return true;
    if (filtro === SEM_GRUPO) return !atribuicoes[produto.id];
    return atribuicoes[produto.id] === filtro;
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <PageHeader
          title="Todos os favoritos"
          description="Produtos que você guardou para consultar depois. Crie grupos para organizá-los."
        />

        {produtos !== null && produtos.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 mb-2">
            <button
              type="button"
              onClick={() => setFiltro("todos")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                filtro === "todos"
                  ? "bg-lm-dark text-white border-lm-dark"
                  : "bg-white text-gray-600 border-gray-200 hover:border-lm-green/40"
              }`}
            >
              Todos ({produtos.length})
            </button>

            {grupos.map((g) => {
              const count = produtos.filter(
                ({ produto }) => atribuicoes[produto.id] === g.id,
              ).length;
              return (
                <div
                  key={g.id}
                  className={`flex items-center rounded-full border transition-colors ${
                    filtro === g.id
                      ? "bg-lm-green text-white border-lm-green"
                      : "bg-white text-gray-600 border-gray-200 hover:border-lm-green/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setFiltro(g.id)}
                    className="text-xs font-semibold pl-3 pr-1.5 py-1.5"
                  >
                    {g.nome} ({count})
                  </button>
                  <button
                    type="button"
                    onClick={() => excluirGrupo(g.id)}
                    aria-label={`Excluir grupo ${g.nome}`}
                    className={`pr-2 py-1.5 ${
                      filtro === g.id
                        ? "text-white/80 hover:text-white"
                        : "text-gray-300 hover:text-red-500"
                    }`}
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => setFiltro(SEM_GRUPO)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                filtro === SEM_GRUPO
                  ? "bg-lm-dark text-white border-lm-dark"
                  : "bg-white text-gray-600 border-gray-200 hover:border-lm-green/40"
              }`}
            >
              Sem grupo
            </button>

            {novoGrupoAberto ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={novoGrupoNome}
                  onChange={(e) => setNovoGrupoNome(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") criarNovoGrupo();
                    if (e.key === "Escape") {
                      setNovoGrupoAberto(false);
                      setNovoGrupoNome("");
                    }
                  }}
                  placeholder="Nome do grupo"
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-300 focus:border-lm-green outline-none w-32"
                />
                <button
                  type="button"
                  onClick={criarNovoGrupo}
                  className="text-xs font-semibold text-lm-green px-2"
                >
                  Criar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setNovoGrupoAberto(true)}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-lm-green hover:text-lm-green transition-colors"
              >
                <Plus size={12} /> Novo grupo
              </button>
            )}
          </div>
        )}

        {produtos === null && (
          <div className="space-y-2 mt-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}
        {produtos !== null && produtos.length === 0 && (
          <p className="text-sm text-gray-500 py-8">
            Você ainda não favoritou nenhum produto.
          </p>
        )}
        {produtos !== null && produtos.length > 0 && (
          <div className="space-y-2 mt-4">
            {produtosFiltrados.map(({ produto }, i) => (
              <ProductListItem
                key={produto.id}
                produto={produto}
                href={`/produto/${produto.id}`}
                className="animate-fade-in-up"
                style={
                  {
                    "--stagger-delay": `${Math.min(i, 15) * 20}ms`,
                  } as React.CSSProperties
                }
                extra={
                  <div className="flex items-center gap-1.5 pr-1 flex-shrink-0">
                    <select
                      value={atribuicoes[produto.id] ?? SEM_GRUPO}
                      onChange={(e) => mudarGrupo(produto.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 max-w-[110px] focus:border-lm-green outline-none"
                    >
                      <option value={SEM_GRUPO}>Sem grupo</option>
                      {grupos.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.nome}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removerFavorito(produto.id)}
                      aria-label="Remover dos favoritos"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                      <Heart size={15} fill="currentColor" />
                    </button>
                  </div>
                }
              />
            ))}
            {produtosFiltrados.length === 0 && (
              <p className="text-sm text-gray-500 py-6">Nenhum produto neste grupo.</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
