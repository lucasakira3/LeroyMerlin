import type { ExpoConfig } from "expo/config";

const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
if (["preview", "production"].includes(process.env.EAS_BUILD_PROFILE ?? "")) {
  if (!process.env.EXPO_PUBLIC_API_URL?.startsWith("https://")) {
    throw new Error(
      "Para distribuir, defina EXPO_PUBLIC_API_URL com o endereço HTTPS do backend no ambiente EAS.",
    );
  }
  if (!projectId)
    throw new Error(
      "Defina EXPO_PUBLIC_EAS_PROJECT_ID com o ID real do projeto Expo antes da build de distribuição.",
    );
}
const config: ExpoConfig = {
  name: "Leroy • NEXT",
  slug: "leroy-next-mobile",
  version: "1.0.0",
  icon: "./assets/icon.png",
  scheme: "leroynext",
  orientation: "portrait",
  userInterfaceStyle: "light",
  platforms: ["android", "web"],
  android: {
    package: "br.com.fiap.leroynext",
    ...(process.env.GOOGLE_SERVICES_JSON
      ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON }
      : {}),
    blockedPermissions: ["android.permission.RECORD_AUDIO"],
  },
  plugins: [
    "expo-router",
    "expo-status-bar",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#F3F5EF",
        image: "./assets/icon.png",
        imageWidth: 140,
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission:
          "Permita usar a câmera para encontrar produtos e ler etiquetas.",
        recordAudioAndroid: false,
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Escolha uma foto para encontrar produtos.",
        cameraPermission: "Fotografe um produto.",
        microphonePermission: false,
      },
    ],
    "expo-secure-store",
    ["expo-notifications", { color: "#237A39", defaultChannel: "atendimento" }],
  ],
  extra: { ...(projectId ? { eas: { projectId } } : {}) },
};
export default config;
