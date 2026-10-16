import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { request } from "./api";

export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
// A primeira versão funciona sem Firebase. Push remoto é uma opção futura.
export const pushEnabled = process.env.EXPO_PUBLIC_PUSH_ENABLED === "true";
export async function notifications() {
  // Android Expo Go não carrega o módulo de push remoto.
  if (isExpoGo || Platform.OS === "web")
    throw new Error(
      "Notificações precisam da build própria do aplicativo. Nesta prévia, acompanhe o atendimento pela tela.",
    );
  return import("expo-notifications");
}
async function permissions() {
  const module = await notifications();
  if (Platform.OS === "android")
    await module.setNotificationChannelAsync("atendimento", {
      name: "Atendimento na loja",
      importance: module.AndroidImportance.HIGH,
    });
  const current = await module.getPermissionsAsync();
  if (
    current.status !== "granted" &&
    (await module.requestPermissionsAsync()).status !== "granted"
  )
    throw new Error(
      "Notificações não autorizadas. Você pode ativá-las nas configurações do aparelho.",
    );
  return module;
}
export async function registrarPush(token: string): Promise<void> {
  if (!pushEnabled)
    throw new Error("Acompanhe as atualizações pela tela de atendimento.");
  if (!Device.isDevice) throw new Error("Ative o push em um celular físico.");
  const projectId =
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId)
    throw new Error("Vincule o projeto à conta Expo antes de ativar o push.");
  const module = await permissions();
  const push = await module.getExpoPushTokenAsync({ projectId });
  await request("/api/mobile/dispositivo", {
    method: "POST",
    token,
    body: { token: push.data },
  });
}
export async function lembrarLista(): Promise<void> {
  const module = await permissions();
  await module.scheduleNotificationAsync({
    identifier: "lembrete-lista",
    content: {
      title: "Sua lista está pronta",
      body: "Confira os materiais antes de sair da loja.",
      data: { url: "/(tabs)/lista" },
      sound: "default",
    },
    trigger: {
      type: module.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60,
      channelId: "atendimento",
    },
  });
}
