import { useEffect, useState } from "react";
import { Alert, Image, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { ProdutoMobile } from "../../../types/mobile";
import { api, catalogoDemo, mensagemErro } from "../../src/api";
import { useApp } from "../../src/storage";
import { Button, Card, Heading, money, Notice, Screen, s } from "../../src/ui";
import { StoreMap } from "../../src/StoreMap";

export default function Produto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const app = useApp();
  const cached =
    app.produtos.find((p) => p.id === id) ??
    app.lista.find((i) => i.produto.id === id)?.produto ??
    catalogoDemo.find((p) => p.id === id);
  const [produto, setProduto] = useState<ProdutoMobile | undefined>(cached);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!app.pronto) return;
    let active = true;
    setProduto(cached);
    setNotice("");
    void api
      .produto(id)
      .then((p) => {
        if (active) {
          setProduto(p);
          app.lembrarProduto(p);
        }
      })
      .catch((error) => {
        if (active)
          setNotice(
            cached
              ? "Sem conexão. Exibindo os dados salvos; preço e estoque podem ter mudado."
              : mensagemErro(error),
          );
      });
    return () => {
      active = false;
    };
    // O cache não reinicia a consulta que acabou de preenchê-lo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, app.pronto]);
  async function help() {
    if (!produto || loading) return;
    if (!app.sessao || app.sessao.expiraEm < Date.now()) {
      router.push({
        pathname: "/atendimento",
        params: { produtoId: produto.id },
      });
      return;
    }
    setLoading(true);
    try {
      await api.ajuda(produto.id, app.sessao.token);
      router.push("/atendimento");
    } catch (error) {
      Alert.alert("Pedido de ajuda", mensagemErro(error));
    } finally {
      setLoading(false);
    }
  }
  return (
    <Screen>
      {notice ? <Notice>{notice}</Notice> : null}
      {produto ? (
        <>
          <Heading
            eyebrow={produto.categoria.toUpperCase()}
            title={produto.produto}
          />
          {produto.imagem ? (
            <Image
              source={{ uri: produto.imagem }}
              resizeMode="contain"
              style={{
                width: "100%",
                height: 230,
                backgroundColor: "white",
                borderRadius: 22,
              }}
            />
          ) : null}
          <Card>
            <Text style={s.price}>{money(produto.preco)}</Text>
            <Text style={s.h3}>{produto.corredor}</Text>
            <Text style={s.body}>
              {produto.estoque > 0
                ? `${produto.estoque} unidades no catálogo`
                : "Sem estoque no catálogo"}
            </Text>
            <Text style={s.small}>{produto.especificacoes}</Text>
          </Card>
          <Button
            title="Adicionar à minha lista"
            onPress={() => {
              app.adicionar(produto);
              Alert.alert("Adicionado", "O produto está na sua lista.");
            }}
          />
          <Button
            title="Pedir ajuda neste corredor"
            secondary
            loading={loading}
            onPress={() => void help()}
          />
          <Card>
            <StoreMap corredores={[produto.corredor_normalizado]} />
          </Card>
          <Text style={s.h2}>Sobre este material</Text>
          <Text style={s.body}>{produto.resposta_ia}</Text>
        </>
      ) : (
        <Notice>{notice || "Carregando produto…"}</Notice>
      )}
    </Screen>
  );
}
