"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { getFavoritosIds } from "@/lib/clientFavoritos";
import { getUsuarioLogado } from "@/lib/clientAuth";
import { buscarProdutosPorIds } from "@/lib/produtosCliente";
import type { SearchResult } from "@/types/produto";

async function buscarFavoritos(ids: string[]): Promise<SearchResult[]> {
  const produtos = await buscarProdutosPorIds(ids);
  return produtos.map((produto) => ({ produto, score: 1 }));
}

export default function FavoritosPage() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<SearchResult[] | null>(null);

  useEffect(() => {
    if (!getUsuarioLogado()) {
      router.push("/funcionario/login");
      return;
    }

    let cancelado = false;
    const atualizar = async () => {
      const resultado = await buscarFavoritos(getFavoritosIds());
      if (!cancelado) setProdutos(resultado);
    };

    atualizar();
    const atualizarFavoritos = () => atualizar();
    window.addEventListener("lm:favoritos-atualizados", atualizarFavoritos);
    window.addEventListener("storage", atualizarFavoritos);

    return () => {
      cancelado = true;
      window.removeEventListener(
        "lm:favoritos-atualizados",
        atualizarFavoritos,
      );
      window.removeEventListener("storage", atualizarFavoritos);
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PageHeader
          title="Todos os favoritos"
          description="Produtos que você guardou para consultar depois"
        />
        {produtos === null && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-6">
            {[0, 1, 2, 3].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}
        {produtos !== null && produtos.length === 0 && (
          <p className="text-sm text-gray-500 py-8">
            Você ainda não favoritou nenhum produto.
          </p>
        )}
        {produtos !== null && produtos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-6">
            {produtos.map(({ produto }, i) => (
              <ProductCard
                key={produto.id}
                produto={produto}
                href={`/produto/${produto.id}`}
                className="animate-fade-in-up"
                style={
                  {
                    "--stagger-delay": `${Math.min(i, 15) * 20}ms`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
