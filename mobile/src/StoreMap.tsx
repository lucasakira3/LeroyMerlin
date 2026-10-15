import { ScrollView, Text, View } from "react-native";
import Svg, { Rect, Text as SvgText, Path, Circle } from "react-native-svg";
import { getCorredorRowIndex } from "../../lib/corredores";
import { calcularRota } from "../../lib/rotaLoja";
import { colors, s } from "./ui";

export function StoreMap({
  corredores,
  atual,
}: {
  corredores: string[];
  atual?: string;
}) {
  const route = calcularRota(corredores);
  const current = atual ? getCorredorRowIndex(atual) : null;
  const point = (row: number, idx: number) => ({
    x: 48 + idx * 36,
    y: row === 1 ? 75 : 220,
  });
  const path = route
    .map((stop, index) => {
      const p = point(stop.row, stop.idx);
      return `${index ? "L" : "M"} ${p.x} ${p.y}`;
    })
    .join(" ");
  return (
    <View style={{ gap: 12 }}>
      <Text style={s.small}>
        Deslize o mapa para ver os 50 corredores. Planta ilustrativa da
        demonstração.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <Svg width={970} height={305} viewBox="0 0 970 305">
          <Rect x="0" y="0" width="970" height="305" rx="18" fill={colors.bg} />
          {Array.from({ length: 50 }, (_, i) => {
            const row = i < 25 ? 1 : 2;
            const idx = i % 25;
            const p = point(row, idx);
            const selected = route.some((r) => r.row === row && r.idx === idx);
            return (
              <ViewlessShelf
                key={i}
                x={p.x}
                y={p.y}
                n={i + 1}
                selected={selected}
              />
            );
          })}
          {path ? (
            <Path
              d={path}
              stroke={colors.green}
              strokeWidth="3"
              fill="none"
              strokeDasharray="6 5"
            />
          ) : null}
          {current ? (
            <Circle
              cx={point(current.row, current.idx).x}
              cy={point(current.row, current.idx).y}
              r="8"
              fill="#E29535"
              stroke="white"
              strokeWidth="3"
            />
          ) : null}
          <SvgText
            x="20"
            y="160"
            fill={colors.dark}
            fontSize="13"
            fontWeight="bold"
          >
            ENTRADA →
          </SvgText>
          <SvgText x="850" y="160" fill={colors.dark} fontSize="13">
            CAIXAS
          </SvgText>
        </Svg>
      </ScrollView>
      {current && (
        <Text style={s.small}>
          Ponto laranja: corredor lido pela etiqueta. Não há rastreamento
          automático de posição.
        </Text>
      )}
    </View>
  );
}
function ViewlessShelf({
  x,
  y,
  n,
  selected,
}: {
  x: number;
  y: number;
  n: number;
  selected: boolean;
}) {
  return (
    <>
      <Rect
        x={x - 12}
        y={y - 38}
        width="24"
        height="76"
        rx="5"
        fill={selected ? "#BADD88" : "#DAE2D4"}
      />
      <SvgText
        x={x}
        y={y + 57}
        textAnchor="middle"
        fontSize="11"
        fill={colors.dark}
      >
        {String(n).padStart(2, "0")}
      </SvgText>
    </>
  );
}
