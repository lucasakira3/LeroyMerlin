import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import type { ReactNode } from "react";
import type { ProdutoMobile } from "../../types/mobile";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useApp } from "./storage";

export const colors = {
  green: "#237A39",
  dark: "#163C26",
  muted: "#64756B",
  bg: "#F3F5EF",
  paper: "#FFFFFF",
  line: "#DCE5D9",
  lime: "#E8F3C8",
  orange: "#BA6322",
  red: "#B53232",
};
export const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export function Screen({
  children,
  scroll = true,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  const app = useApp();
  return (
    <SafeAreaView edges={["top"]} style={s.screen}>
      {!app.pronto ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.green} />
      ) : scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.content}
        >
          {app.erroStorage && <Notice>{app.erroStorage}</Notice>}
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
    </SafeAreaView>
  );
}
export function Heading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ gap: 8, marginBottom: 6 }}>
      {eyebrow && <Text style={s.eyebrow}>{eyebrow}</Text>}
      <Text accessibilityRole="header" style={s.title}>
        {title}
      </Text>
      {subtitle && <Text style={s.body}>{subtitle}</Text>}
    </View>
  );
}
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  loading = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.75 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.green : "white"} />
      ) : (
        <Text style={[s.buttonText, secondary && { color: colors.green }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      {...props}
      style={[
        s.input,
        props.multiline && { minHeight: 110, textAlignVertical: "top" },
        props.style,
      ]}
    />
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[s.notice, error && { backgroundColor: "#FCECEC" }]}
    >
      <Text style={{ color: error ? colors.red : colors.dark, lineHeight: 21 }}>
        {children}
      </Text>
    </View>
  );
}
export function ProductCard({ produto }: { produto: ProdutoMobile }) {
  const app = useApp();
  function open() {
    app.lembrarProduto(produto);
    router.push({ pathname: "/produto/[id]", params: { id: produto.id } });
  }
  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver ${produto.produto}`}
        onPress={open}
        style={s.row}
      >
        {produto.imagem ? (
          <Image
            source={{ uri: produto.imagem }}
            style={{ width: 64, height: 64, borderRadius: 12 }}
          />
        ) : (
          <View style={s.productIcon}>
            <Ionicons name="cube-outline" size={29} color={colors.green} />
          </View>
        )}
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={s.small}>
            {produto.categoria} · {produto.corredor}
          </Text>
          <Text style={s.h3}>{produto.produto}</Text>
          <Text style={s.price}>{money(produto.preco)}</Text>
        </View>
      </Pressable>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.small}>
            {produto.estoque > 0
              ? `${produto.estoque} em estoque`
              : "Sem estoque"}
          </Text>
        </View>
        <Button
          title="+ Lista"
          secondary
          onPress={() => app.adicionar(produto)}
        />
      </View>
    </Card>
  );
}
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, gap: 18, paddingBottom: 38 },
  eyebrow: {
    color: colors.green,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.dark,
    letterSpacing: -1,
    lineHeight: 38,
  },
  h2: { fontSize: 21, fontWeight: "700", color: colors.dark },
  h3: { fontSize: 16, fontWeight: "700", color: colors.dark, lineHeight: 23 },
  body: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  small: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  price: { fontSize: 20, color: colors.green, fontWeight: "800" },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 14,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  button: {
    backgroundColor: colors.green,
    minHeight: 48,
    paddingHorizontal: 19,
    paddingVertical: 13,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { fontSize: 14, fontWeight: "700", color: "white" },
  secondary: { backgroundColor: colors.lime },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 15,
    padding: 16,
    minHeight: 52,
    fontSize: 16,
    color: colors.dark,
  },
  notice: { backgroundColor: colors.lime, borderRadius: 15, padding: 14 },
  productIcon: {
    width: 64,
    height: 64,
    backgroundColor: colors.bg,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
