import { Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { calcularRota } from "../../../lib/rotaLoja";
import { getCorredorRowIndex } from "../../../lib/corredores";
import { useApp } from "../../src/storage";
import { StoreMap } from "../../src/StoreMap";
import { Button, Card, Heading, Notice, Screen, s } from "../../src/ui";

export default function Loja() {
  const { lista } = useApp();
  const params = useLocalSearchParams<{ corredor?: string }>();
  const corredores = lista
    .filter((i) => !i.coletado)
    .map((i) => i.produto.corredor_normalizado);
  const route = calcularRota(corredores);
  return (
    <Screen>
      <Heading
        eyebrow="SUA JORNADA NA LOJA"
        title="Menos voltas.\nMais projeto."
        subtitle="Organize a visita pelos corredores dos materiais da sua lista."
      />
      <Card>
        <StoreMap corredores={corredores} atual={params.corredor} />
      </Card>
      <Button
        title="Escanear corredor"
        onPress={() =>
          router.push({ pathname: "/camera", params: { modo: "qr" } })
        }
      />
      <Text style={s.h2}>Ordem sugerida</Text>
      {!route.length ? (
        <Notice>Adicione produtos à sua lista para montar o percurso.</Notice>
      ) : (
        route.map((stop, index) => (
          <Card key={stop.corredorNormalizado}>
            <Text style={s.h3}>
              {index + 1}. Corredor{" "}
              {stop.row === 1 ? stop.idx + 1 : stop.idx + 26}
            </Text>
            {lista
              .filter((i) => {
                const location = getCorredorRowIndex(
                  i.produto.corredor_normalizado,
                );
                return (
                  !i.coletado &&
                  location?.row === stop.row &&
                  location.idx === stop.idx
                );
              })
              .map((i) => (
                <Text key={i.produto.id} style={s.body}>
                  {i.quantidade} × {i.produto.produto}
                </Text>
              ))}
          </Card>
        ))
      )}
      <Button
        title="Acompanhar atendimento"
        secondary
        onPress={() => router.push("/atendimento")}
      />
    </Screen>
  );
}
