import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppStore } from "../src/storage";
import { colors } from "../src/ui";
import { isExpoGo, notifications } from "../src/notifications";

function NotificationNavigation() {
  useEffect(() => {
    if (isExpoGo) return;
    let active = true;
    let cleanup: (() => void) | undefined;
    void notifications()
      .then(async (module) => {
        if (!active) return;
        module.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
        const open = (url: unknown) => {
          if (url === "/atendimento") router.push("/atendimento");
          if (url === "/(tabs)/lista") router.push("/(tabs)/lista");
        };
        const listener = module.addNotificationResponseReceivedListener(
          (response) => open(response.notification.request.content.data?.url),
        );
        cleanup = () => listener.remove();
        const last = await module.getLastNotificationResponseAsync();
        if (active && last) {
          open(last.notification.request.content.data?.url);
          await module.clearLastNotificationResponseAsync();
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
      cleanup?.();
    };
  }, []);
  return null;
}
export default function RootLayout() {
  return (
    <AppStore>
      <StatusBar style="dark" />
      <NotificationNavigation />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.dark,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="camera"
          options={{ title: "Câmera", presentation: "fullScreenModal" }}
        />
        <Stack.Screen
          name="produto/[id]"
          options={{ title: "Produto", presentation: "modal" }}
        />
        <Stack.Screen name="atendimento" options={{ title: "Atendimento" }} />
        <Stack.Screen
          name="calculadora"
          options={{ title: "Calculadora de materiais" }}
        />
      </Stack>
    </AppStore>
  );
}
