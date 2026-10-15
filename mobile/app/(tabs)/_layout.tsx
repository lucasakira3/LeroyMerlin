import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "../../src/ui";
import { useApp } from "../../src/storage";
export default function TabLayout() {
  const { lista } = useApp();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: "white", borderTopColor: colors.line },
        tabBarLabelStyle: { fontWeight: "700", fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Buscar",
          tabBarIcon: ({ color }) => (
            <Ionicons name="search-outline" size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="loja"
        options={{
          title: "Na loja",
          tabBarIcon: ({ color }) => (
            <Ionicons name="map-outline" size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="projetos"
        options={{
          title: "Projetos",
          tabBarIcon: ({ color }) => (
            <Ionicons name="construct-outline" size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lista"
        options={{
          title: "Minha lista",
          tabBarBadge: lista.length || undefined,
          tabBarIcon: ({ color }) => (
            <Ionicons name="list-outline" size={23} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
