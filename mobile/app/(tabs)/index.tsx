import { useState } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import type { ProdutoMobile } from "../../../types/mobile";
import {
  api,
  API_URL,
  buscaOffline,
  catalogoDemo,
  mensagemErro,
} from "../../src/api";
import {
  Button,
  Card,
  Heading,
  Input,
  Notice,
  ProductCard,
  Screen,
  s,
} from "../../src/ui";

export default function Buscar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProdutoMobile[]>(
    catalogoDemo.slice(0, 6),
  );
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(
    API_URL
      ? "Seleção do catálogo para explorar. Faça uma busca para consultar a loja."
      : "Catálogo offline de demonstração. Busca com IA precisa de conexão ao servidor.",
  );
  async function search() {
    if (!query.trim() || loading) return;
    setLoading(true);
    setNotice("");
    try {
      const data = await api.buscar(query.trim());
      setResults(data.resultados.map((r) => r.produto));
      if (!data.total)
        setNotice("Nenhum produto encontrado. Tente um termo mais simples.");
    } catch (error) {
      setResults(buscaOffline(query));
      setNotice(
        `${mensagemErro(error)} Exibindo apenas a busca por texto no catálogo offline.`,
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <Screen>
      <Heading
        eyebrow="LEROY MERLIN · NEXT"
        title={"Seu projeto\ncomeça aqui."}
        subtitle="Encontre o material certo, descubra o corredor e conte com ajuda na loja."
      />
      <Input
        accessibilityLabel="O que você procura?"
        placeholder="Ex.: furadeira para parede"
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        onSubmitEditing={() => void search()}
      />
      <Button
        title="Buscar produtos"
        onPress={() => void search()}
        loading={loading}
      />
      <Card>
        <Text style={s.h2}>Mostre o que você precisa</Text>
        <Text style={s.body}>
          Uma peça, um problema ou uma etiqueta. Use a câmera para começar.
        </Text>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Button title="Fotografar" onPress={() => router.push("/camera")} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Ler QR"
              secondary
              onPress={() =>
                router.push({ pathname: "/camera", params: { modo: "qr" } })
              }
            />
          </View>
        </View>
      </Card>
      {notice ? <Notice>{notice}</Notice> : null}
      <Text style={s.h2}>Produtos para você</Text>
      {results.map((produto) => (
        <ProductCard key={produto.id} produto={produto} />
      ))}
    </Screen>
  );
}
