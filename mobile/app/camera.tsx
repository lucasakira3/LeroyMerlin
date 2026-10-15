import { useRef, useState } from "react";
import { Image, Linking, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import type { ProdutoMobile } from "../../types/mobile";
import { api, mensagemErro } from "../src/api";
import { feedback } from "../src/storage";
import { lerEtiqueta } from "../src/qr";
import { Button, Heading, Notice, ProductCard, Screen, s } from "../src/ui";

export default function Camera() {
  const params = useLocalSearchParams<{ modo?: string }>();
  const [modo, setModo] = useState<"produto" | "problema" | "qr">(
    params.modo === "qr" ? "qr" : "produto",
  );
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const locked = useRef(false);
  const [ready, setReady] = useState(false);
  const [focused, setFocused] = useState(false);
  const [photo, setPhoto] = useState<{ uri: string; base64: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [description, setDescription] = useState("");
  const [results, setResults] = useState<ProdutoMobile[]>([]);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
        setReady(false);
      };
    }, []),
  );
  async function prepare(uri: string) {
    const context = ImageManipulator.manipulate(uri);
    context.resize({ width: 1200 });
    const rendered = await context.renderAsync();
    const image = await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.65,
      base64: true,
    });
    if (!image.base64 || image.base64.length * 0.75 > 4 * 1024 * 1024)
      throw new Error("Foto muito grande. Tente uma imagem menor.");
    setPhoto({ uri: image.uri, base64: image.base64 });
    setResults([]);
    setDescription("");
  }
  async function capture() {
    if (!ready || loading) return;
    setLoading(true);
    setError("");
    try {
      const image = await camera.current?.takePictureAsync({ quality: 0.7 });
      if (image) await prepare(image.uri);
    } catch (err) {
      setError(mensagemErro(err));
    } finally {
      setLoading(false);
    }
  }
  async function pick() {
    setError("");
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted)
        throw new Error(
          "Autorize o acesso às fotos nas configurações do aparelho.",
        );
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
      });
      if (!result.canceled) {
        setLoading(true);
        await prepare(result.assets[0].uri);
      }
    } catch (err) {
      setError(mensagemErro(err));
    } finally {
      setLoading(false);
    }
  }
  async function analyze() {
    if (!photo || loading) return;
    setLoading(true);
    setError("");
    try {
      const result = await api.foto(photo.base64, modo === "problema");
      setDescription(
        "diagnostico" in result
          ? result.diagnostico
          : result.descricao_identificada,
      );
      setResults(result.resultados.map((r) => r.produto));
      feedback();
    } catch (err) {
      setError(mensagemErro(err));
    } finally {
      setLoading(false);
    }
  }
  function scan(raw: string) {
    if (locked.current) return;
    locked.current = true;
    const result = lerEtiqueta(raw);
    if (!result) {
      setError(
        "Esta etiqueta não é de um produto ou corredor da demonstração.",
      );
      return;
    }
    feedback();
    if (result.tipo === "produto")
      router.replace({ pathname: "/produto/[id]", params: { id: result.id } });
    else
      router.replace({
        pathname: "/(tabs)/loja",
        params: { corredor: result.slug },
      });
  }
  return (
    <Screen>
      <Heading
        eyebrow="ENCONTRE COM A CÂMERA"
        title={modo === "qr" ? "Leia uma etiqueta" : "Mostre, descubra."}
        subtitle={
          modo === "qr"
            ? "Aponte para um QR de produto ou corredor do estande."
            : "Fotografe uma peça ou um problema para encontrar materiais."
        }
      />
      <View style={s.row}>
        {(["produto", "problema", "qr"] as const).map((mode) => (
          <View key={mode} style={{ flex: 1 }}>
            <Button
              title={
                { produto: "Produto", problema: "Problema", qr: "QR" }[mode]
              }
              secondary={modo !== mode}
              disabled={loading}
              onPress={() => {
                setModo(mode);
                setPhoto(null);
                setResults([]);
                setDescription("");
                setError("");
                locked.current = false;
                setReady(false);
              }}
            />
          </View>
        ))}
      </View>
      {error ? <Notice error>{error}</Notice> : null}
      {photo ? (
        <Image
          source={{ uri: photo.uri }}
          style={{ width: "100%", height: 290, borderRadius: 22 }}
        />
      ) : permission?.granted && focused ? (
        <View style={{ height: 330, borderRadius: 22, overflow: "hidden" }}>
          <CameraView
            key={modo}
            ref={camera}
            style={{ flex: 1 }}
            facing="back"
            onCameraReady={() => setReady(true)}
            onMountError={() =>
              setError(
                "Não foi possível abrir a câmera. Tente escolher uma foto.",
              )
            }
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={
              modo === "qr" ? (result) => scan(result.data) : undefined
            }
          />
        </View>
      ) : (
        <Notice>Autorize a câmera para fotografar e ler etiquetas.</Notice>
      )}
      {!photo && !permission?.granted && (
        <Button
          title={
            permission?.canAskAgain === false
              ? "Abrir configurações"
              : "Permitir câmera"
          }
          onPress={() =>
            void (permission?.canAskAgain === false
              ? Linking.openSettings()
              : requestPermission())
          }
        />
      )}
      {modo !== "qr" ? (
        <>
          {photo ? (
            <>
              <Button
                title="Analisar foto"
                loading={loading}
                onPress={() => void analyze()}
              />
              <Button
                title="Tirar outra foto"
                secondary
                disabled={loading}
                onPress={() => {
                  setPhoto(null);
                  setResults([]);
                  setDescription("");
                  setReady(false);
                }}
              />
            </>
          ) : (
            <>
              <Button
                title="Fotografar"
                disabled={!ready}
                loading={loading}
                onPress={() => void capture()}
              />
              <Button
                title="Escolher da galeria"
                secondary
                disabled={loading}
                onPress={() => void pick()}
              />
            </>
          )}
        </>
      ) : (
        <Button
          title="Ler outra etiqueta"
          secondary
          onPress={() => {
            locked.current = false;
            setError("");
          }}
        />
      )}
      {description ? <Notice>{description}</Notice> : null}
      {results.map((p) => (
        <ProductCard key={p.id} produto={p} />
      ))}
      <Text style={s.small}>
        As fotos são enviadas ao servidor e ao serviço de IA somente quando você
        toca em Analisar foto.
      </Text>
    </Screen>
  );
}
