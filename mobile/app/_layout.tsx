import { Tabs, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useEffect } from "react";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { subscribeAutoSync } from "@/lib/sync";
import { colors, fonts, fontLabel } from "@/theme";

function HeaderBackHome() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.replace("/")}
      hitSlop={10}
      style={{ paddingHorizontal: 12, paddingVertical: 6 }}
    >
      <Text style={[{ color: colors.white, fontSize: 16 }, fontLabel]}>
        ‹ Voltar
      </Text>
    </Pressable>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => subscribeAutoSync(), []);

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary } as object,
          headerTintColor: colors.white,
          headerTitleStyle: {
            fontFamily: fonts.semibold,
            fontWeight: "600",
          } as object,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: {
            fontFamily: fonts.medium,
            fontWeight: "500",
            fontSize: 12,
          } as object,
          tabBarStyle: {
            borderTopColor: colors.border,
            backgroundColor: colors.card,
          } as object,
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
            title: "Ciclo 1 (baseline)",
            tabBarLabel: "Ciclo 1",
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
