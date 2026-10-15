import { Alert, Share, Text, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "../../src/storage";
import { lembrarLista } from "../../src/notifications";
import { mensagemErro } from "../../src/api";
import { Button, Card, Heading, money, Notice, Screen, s } from "../../src/ui";

export default function Lista() {
  const app = useApp();
  const total = app.lista.reduce(
    (sum, i) => sum + i.quantidade * i.produto.preco,
    0,
  );
  async function share() {
    try {
      await Share.share({
        message: `Minha lista Leroy • NEXT\n\n${app.lista.map((i) => `${i.coletado ? "✓" : "○"} ${i.quantidade} × ${i.produto.produto} — ${i.produto.corredor}`).join("\n")}\n\nTotal estimado: ${money(total)}`,
      });
    } catch (error) {
      Alert.alert("Compartilhar", mensagemErro(error));
    }
  }
  return (
    <Screen>
      <Heading
        eyebrow="DISPONÍVEL NO SEU APARELHO"
        title="Sua lista,\nsempre à mão."
        subtitle="Marque os materiais que já encontrou. A lista funciona sem internet."
      />
      {!app.lista.length ? (
        <>
          <Notice>
            Sua lista ainda está vazia. Encontre um produto para começar.
          </Notice>
          <Button
            title="Buscar produtos"
            onPress={() => router.navigate("/(tabs)")}
          />
        </>
      ) : (
        <>
          <Card>
            <Text style={s.small}>
              {app.lista.filter((i) => i.coletado).length} de {app.lista.length}{" "}
              produtos encontrados
            </Text>
            <Text style={s.price}>{money(total)}</Text>
            <Text style={s.small}>
              Total estimado com os preços salvos. Não é uma compra ou reserva
              de estoque.
            </Text>
          </Card>
          {app.lista.map((item) => (
            <Card key={item.produto.id}>
              <Text
                style={[
                  s.h3,
                  item.coletado && {
                    textDecorationLine: "line-through",
                    opacity: 0.6,
                  },
                ]}
              >
                {item.produto.produto}
              </Text>
              <Text style={s.small}>
                {item.produto.corredor} · {money(item.produto.preco)} / unidade
              </Text>
              <View style={s.row}>
                <Button
                  title="−"
                  secondary
                  onPress={() => app.quantidade(item.produto.id, -1)}
                />
                <Text style={s.h3}>{item.quantidade}</Text>
                <Button
                  title="+"
                  secondary
                  onPress={() => app.quantidade(item.produto.id, 1)}
                />
                <View style={{ flex: 1 }}>
                  <Button
                    title={item.coletado ? "Desmarcar" : "Encontrei"}
                    secondary={item.coletado}
                    onPress={() => app.coletar(item.produto.id)}
                  />
                </View>
              </View>
            </Card>
          ))}
          <Button title="Compartilhar lista" onPress={() => void share()} />
          <Button
            title="Lembrar em 1 minuto"
            secondary
            onPress={() => {
              void lembrarLista()
                .then(() =>
                  Alert.alert(
                    "Lembrete ativado",
                    "Você receberá uma notificação em um minuto.",
                  ),
                )
                .catch((error) => Alert.alert("Lembrete", mensagemErro(error)));
            }}
          />
        </>
      )}
    </Screen>
  );
}
