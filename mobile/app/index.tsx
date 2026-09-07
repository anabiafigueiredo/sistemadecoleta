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
import { colors, fontBody, fontEmphasis, fontLabel, fontTitle } from "@/theme";

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
        accent={colors.primary}
        onPress={() => router.push("/coleta/nova")}
      />
      <MenuCard
        title="Entrevistas realizadas"
        description={
          realizadasCount === 0
            ? "Entrevistas já sincronizadas neste aparelho"
            : `${realizadasCount} entrevista(s) sincronizada(s)`
        }
        accent={colors.accent}
        onPress={() => router.push("/entrevistas")}
      />
      <MenuCard
        title="Pendentes de sincronização"
        description={
          pendingCount === 0
            ? "Fila vazia — nada aguardando envio"
            : `${pendingCount} pendente(s) na fila`
        }
        accent={colors.error}
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
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  banner: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  online: { backgroundColor: colors.primarySoft },
  offline: { backgroundColor: colors.warningBg },
  bannerText: {
    fontSize: 12,
    ...fontLabel,
    color: colors.primary,
    textAlign: "center",
  },
  heading: {
    fontSize: 22,
    ...fontTitle,
    color: colors.text,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 18,
    lineHeight: 20,
    ...fontBody,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 5,
  },
  cardPressed: { opacity: 0.88 },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: { fontSize: 17, ...fontTitle, color: colors.text, flex: 1 },
  cardDesc: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    ...fontBody,
  },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  badgeText: { color: colors.white, ...fontEmphasis, fontSize: 13 },
  footerHint: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textDisabled,
    textAlign: "center",
    ...fontBody,
  },
});

