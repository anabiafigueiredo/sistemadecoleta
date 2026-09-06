import { useCallback, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useNetwork } from "@/hooks/useNetwork";
import { listColetas, listPending } from "@/lib/storage";
import { API_URL } from "@/lib/config";

/**
 * Tela inicial (doc §3.1):
 * Nova entrevista · Entrevistas realizadas · Pendentes de sincronização
 */
export default function HomeScreen() {
  const router = useRouter();
  const { online } = useNetwork();
  const [pendingCount, setPendingCount] = useState(0);
  const [realizadasCount, setRealizadasCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const [pending, all] = await Promise.all([
          listPending(),
          listColetas(),
        ]);
        setPendingCount(pending.length);
        setRealizadasCount(all.filter((c) => c.sincronizado).length);
      })();
    }, []),
  );

  return (
    <View style={styles.container}>
      <View style={[styles.banner, online ? styles.online : styles.offline]}>
        <Text style={styles.bannerText}>
          {online ? "Online" : "Offline"} · {API_URL.replace(/^https?:\/\//, "")}
        </Text>
      </View>

      <Text style={styles.heading}>Coleta de campo</Text>
      <Text style={styles.subheading}>
        Questionário fixo em etapas, com validações e sync offline-first.
      </Text>

      <MenuCard
        title="Nova entrevista"
        description="Iniciar coleta (identificação → familiar → socioeconômico → educacional → revisão)"
        accent="#0F766E"
        onPress={() => router.push("/coleta/nova")}
      />
      <MenuCard
        title="Entrevistas realizadas"
        description={
          realizadasCount === 0
            ? "Entrevistas já sincronizadas neste aparelho"
            : `${realizadasCount} entrevista(s) sincronizada(s)`
        }
        accent="#1D4E89"
        onPress={() => router.push("/entrevistas")}
      />
      <MenuCard
        title="Pendentes de sincronização"
        description={
          pendingCount === 0
            ? "Fila vazia — nada aguardando envio"
            : `${pendingCount} pendente(s) na fila`
        }
        accent="#C2410C"
        badge={pendingCount > 0 ? String(pendingCount) : undefined}
        onPress={() => router.push("/sync")}
      />

      <Text style={styles.footerHint}>
        A aba Ciclo 1 lista os registros importados (baseline) vindos do servidor.
      </Text>
    </View>
  );
}

function MenuCard({
  title,
  description,
  accent,
  badge,
  onPress,
}: {
  title: string;
  description: string;
  accent: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: accent },
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{title}</Text>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: accent }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.cardDesc}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9", padding: 16 },
  banner: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  online: { backgroundColor: "#CCFBF1" },
  offline: { backgroundColor: "#FEF3C7" },
  bannerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#134E4A",
    textAlign: "center",
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 18,
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 5,
  },
  cardPressed: { opacity: 0.88 },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A", flex: 1 },
  cardDesc: { marginTop: 6, fontSize: 13, color: "#64748B", lineHeight: 18 },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  badgeText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
  footerHint: {
    marginTop: 8,
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },
});
