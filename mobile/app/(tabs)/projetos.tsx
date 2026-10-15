import { useState } from "react";
import { Alert, Text } from "react-native";
import { router } from "expo-router";
import type { ProjetoMobile } from "../../../types/mobile";
import { api, mensagemErro } from "../../src/api";
import { useApp } from "../../src/storage";
import { Button, Card, Heading, Input, Notice, Screen, s } from "../../src/ui";

export default function Projetos() {
  const app = useApp();
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [projeto, setProjeto] = useState<ProjetoMobile | null>(null);
  async function generate() {
    if (!descricao.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const value = await api.projeto(descricao.trim());
      setProjeto(value);
      app.salvarProjeto(value);
    } catch (err) {
      setError(mensagemErro(err));
    } finally {
      setLoading(false);
    }
  }
  function addAll() {
    if (!projeto) return;
    const products = new Map(
      projeto.itens.flatMap((item) =>
        item.resultados[0]
          ? [
              [
                item.resultados[0].produto.id,
                item.resultados[0].produto,
              ] as const,
            ]
          : [],
      ),
    );
    products.forEach((product) => app.adicionar(product));
    Alert.alert(
      "Lista atualizada",
      `${products.size} produtos adicionados com uma unidade cada. Confira as quantidades recomendadas no projeto e ajuste a lista.`,
    );
  }
  return (
    <Screen>
      <Heading
        eyebrow="DO PLANO À PRÁTICA"
        title="Conte a ideia.\nPlaneje a reforma."
        subtitle="A IA organiza os materiais e as etapas usando o catálogo da loja."
      />
      <Input
        accessibilityLabel="Descreva seu projeto"
        placeholder="Quero pintar meu quarto de 12 m²…"
        multiline
        maxLength={3000}
        value={descricao}
        onChangeText={setDescricao}
      />
      <Button
        title="Montar meu projeto"
        loading={loading}
        disabled={!descricao.trim()}
        onPress={() => void generate()}
      />
      {loading && (
        <Notice>
          Organizando as etapas e procurando materiais. Isso pode levar até um
          minuto.
        </Notice>
      )}
      {error ? <Notice error>{error}</Notice> : null}
      <Button
        title="Calcular tinta ou piso"
        secondary
        onPress={() => router.push("/calculadora")}
      />
      {projeto ? (
        <>
          <Card>
            <Text style={s.h2}>{projeto.titulo}</Text>
            <Text style={s.body}>{projeto.resumo}</Text>
            <Text style={s.h3}>{projeto.orcamento_estimado}</Text>
            <Text style={s.small}>{projeto.dica_especialista}</Text>
          </Card>
          {projeto.etapas
            ?.slice()
            .sort((a, b) => a.ordem - b.ordem)
            .map((etapa) => (
              <Card key={etapa.ordem}>
                <Text style={s.h3}>
                  {etapa.ordem}. {etapa.nome}
                </Text>
                <Text style={s.body}>{etapa.instrucoes}</Text>
              </Card>
            ))}
          <Text style={s.h2}>Materiais recomendados</Text>
          {projeto.itens.map((item, i) => (
            <Card key={`${item.material}-${i}`}>
              <Text style={s.small}>{item.etapa_nome}</Text>
              <Text style={s.h3}>{item.material}</Text>
              <Text style={s.body}>{item.quantidade}</Text>
              <Text style={s.small}>{item.observacao}</Text>
              {item.resultados[0] ? (
                <Button
                  title="Ver produto na loja"
                  secondary
                  onPress={() => {
                    app.lembrarProduto(item.resultados[0].produto);
                    router.push({
                      pathname: "/produto/[id]",
                      params: { id: item.resultados[0].produto.id },
                    });
                  }}
                />
              ) : (
                <Text style={s.small}>
                  Consulte um especialista para encontrar este material.
                </Text>
              )}
            </Card>
          ))}
          <Button
            title="Adicionar produtos à lista"
            disabled={!projeto.itens.some((i) => i.resultados.length > 0)}
            onPress={addAll}
          />
        </>
      ) : null}
      {app.projetos.length > 0 && (
        <>
          <Text style={s.h2}>Salvos no aparelho</Text>
          {app.projetos.map((p, index) => (
            <Card key={`${p.titulo}-${index}`}>
              <Text style={s.h3}>{p.titulo}</Text>
              <Text style={s.small}>
                {p.itens.length} materiais · disponível offline
              </Text>
              <Button
                title="Abrir projeto"
                secondary
                onPress={() => setProjeto(p)}
              />
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}
