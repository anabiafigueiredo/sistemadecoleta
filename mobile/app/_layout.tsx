import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import { useEffect } from "react";
import { subscribeAutoSync } from "@/lib/sync";

export default function RootLayout() {
  useEffect(() => subscribeAutoSync(), []);

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: "#0F766E" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "700" },
          tabBarActiveTintColor: "#0F766E",
          tabBarInactiveTintColor: "#64748B",
          tabBarStyle: { borderTopColor: "#E2E8F0" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Registros",
            tabBarLabel: "Lista",
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 18 }}>📋</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="coleta/nova"
          options={{
            title: "Nova coleta",
            tabBarLabel: "Coletar",
            href: "/coleta/nova",
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 18 }}>＋</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="sync"
          options={{
            title: "Sincronização",
            tabBarLabel: "Sync",
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 18 }}>↻</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="coleta/[id]"
          options={{
            href: null,
            title: "Detalhe",
          }}
        />
      </Tabs>
    </>
  );
}
