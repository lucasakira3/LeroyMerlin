import { useState } from "react";
import { Text, View } from "react-native";
import { calcularTinta, calcularPiso } from "../../lib/calculadoraMateriais";
import { Button, Card, Heading, Input, Notice, Screen, s } from "../src/ui";

export default function Calculadora() {
  const [tipo, setTipo] = useState<"tinta" | "piso">("tinta");
  const [area, setArea] = useState("");
  const [result, setResult] = useState<ReturnType<typeof calcularTinta> | null>(
    null,
  );
  const numero = Number(area.replace(",", "."));
  const valido = Number.isFinite(numero) && numero > 0 && numero <= 10000;
  return (
    <Screen>
      <Heading
        eyebrow="SEM INTERNET, SEM COMPLICAÇÃO"
        title="Quanto material\nvocê precisa?"
        subtitle="Use a área total da superfície. As fórmulas são as mesmas do site."
      />
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Button
            title="Tinta"
            secondary={tipo !== "tinta"}
            onPress={() => {
              setTipo("tinta");
              setResult(null);
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Piso"
            secondary={tipo !== "piso"}
            onPress={() => {
              setTipo("piso");
              setResult(null);
            }}
          />
        </View>
      </View>
      <Input
        accessibilityLabel="Área em metros quadrados"
        placeholder="Área em m², ex.: 12,5"
        keyboardType="decimal-pad"
        value={area}
        onChangeText={(value) => {
          setArea(value);
          setResult(null);
        }}
      />
      <Notice>
        {tipo === "tinta"
          ? "Estimativa para duas demãos. Informe a área das paredes a pintar, descontando portas e janelas."
          : "Estimativa com 10% de margem de perda para cortes e quebras."}
      </Notice>
      <Button
        title="Calcular materiais"
        disabled={!valido}
        onPress={() =>
          setResult(
            tipo === "tinta"
              ? calcularTinta(numero, 2)
              : calcularPiso(numero, 10),
          )
        }
      />
      {result && (
        <Card>
          <Text style={s.h2}>
            {result.quantidade} {result.unidade}
          </Text>
          {result.linhas.map((line) => (
            <Text key={line.label} style={s.body}>
              {line.label}: {line.valor}
            </Text>
          ))}
        </Card>
      )}
      <Text style={s.small}>
        Confira o rendimento e as instruções do fabricante antes de comprar.
      </Text>
    </Screen>
  );
}
