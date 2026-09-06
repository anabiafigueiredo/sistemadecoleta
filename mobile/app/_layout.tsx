import { Tabs, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, Text } from "react-native";
import { useEffect } from "react";
import { subscribeAutoSync } from "@/lib/sync";

function HeaderBackHome() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.replace("/")}
      hitSlop={10}
      style={{ paddingHorizontal: 12, paddingVertical: 6 }}
    >
      <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
        ‹ Voltar
      </Text>
    </Pressable>
  );
}

export default function RootLayout() {
  useEffect(() => subscribeAutoSync(), []);

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: "#0F766E" } as object,
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "700" } as object,
          tabBarActiveTintColor: "#0F766E",
          tabBarInactiveTintColor: "#64748B",
          tabBarStyle: { borderTopColor: "#E2E8F0" } as object,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Início",
            tabBarLabel: "Início",
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 18 }}>⌂</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="planilha"
          options={{
            title: "Planilha (T1)",
            tabBarLabel: "Planilha",
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 18 }}>▤</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="entrevistas"
          options={{
            title: "Entrevistas realizadas",
            tabBarLabel: "Realizadas",
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 18 }}>✓</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="sync"
          options={{
            title: "Pendentes de sincronização",
            tabBarLabel: "Pendentes",
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 18 }}>↻</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="coleta/nova"
          options={{
            href: null,
            title: "Nova entrevista",
            headerLeft: () => <HeaderBackHome />,
          }}
        />
        <Tabs.Screen
          name="coleta/[id]"
          options={{
            href: null,
            title: "Detalhe",
            headerLeft: () => <HeaderBackHome />,
          }}
        />
      </Tabs>
    </>
  );
}
