import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useColetas } from "@/hooks/useColetas";
import { listPending } from "@/lib/storage";
import type { ColetaLocal } from "@/lib/types";

/** Entrevistas já sincronizadas neste aparelho (doc §3.1). */
export default function EntrevistasRealizadasScreen() {
  const [query, setQuery] = useState("");
  const { items, loading, refresh } = useColetas(query);
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const realizadas = items.filter((i) => i.sincronizado);

  const reload = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
      setPendingCount((await listPending()).length);
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.hint}>
          Entrevistas mobile enviadas com sucesso neste aparelho.
        </Text>
        <Pressable
          onPress={() => void reload()}
          disabled={loading || refreshing}
          style={({ pressed }) => [
            styles.reloadBtn,
            pressed && styles.reloadPressed,
          ]}
        >
          <Text style={styles.reloadText}>
            {refreshing || loading ? "…" : "Recarregar"}
          </Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Buscar por nome ou código…"
        placeholderTextColor="#94A3B8"
        value={query}
        onChangeText={setQuery}
      />

      {loading && realizadas.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#0F766E" />
      ) : (
        <FlatList
          data={realizadas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            realizadas.length === 0 ? styles.emptyWrap : styles.list
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.empty}>
                Nenhuma entrevista sincronizada ainda.
              </Text>
              {pendingCount > 0 ? (
                <>
                  <Text style={styles.emptyHint}>
                    Há {pendingCount} coleta(s) salva(s) aguardando envio.
                  </Text>
                  <Pressable
                    onPress={() => router.push("/sync")}
                    style={styles.linkBtn}
                  >
                    <Text style={styles.linkText}>
                      Ir para Pendentes de sincronização
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.emptyHint}>
                  Conclua uma nova entrevista e aguarde o sync (ou use a aba
                  Pendentes).
                </Text>
              )}
            </View>
          }
          renderItem={({ item }) => <ColetaRow item={item} />}
        />
      )}
    </View>
  );
}

function ColetaRow({ item }: { item: ColetaLocal }) {
  const router = useRouter();
  const { aluno, familia, momento } = item.payload;
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/coleta/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{aluno.nome}</Text>
        <View style={[styles.badge, styles.badgeOk]}>
          <Text style={styles.badgeText}>Sync</Text>
        </View>
      </View>
      <Text style={styles.meta}>
        {aluno.codigoAluno} · {familia.codigoFamilia} · {momento.codigo}
      </Text>
      <Text style={styles.meta}>
        {familia.bairro} · {familia.comunidade}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  topRow: {
    marginHorizontal: 16,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  hint: {
    flex: 1,
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  reloadBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#0F766E",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  reloadPressed: { opacity: 0.7 },
  reloadText: { color: "#0F766E", fontWeight: "700", fontSize: 13 },
  search: {
    margin: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0F172A",
  },
  list: { padding: 12, paddingBottom: 40 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 24 },
  emptyBox: { alignItems: "center", gap: 10 },
  empty: { textAlign: "center", color: "#0F172A", fontSize: 15, fontWeight: "600" },
  emptyHint: { textAlign: "center", color: "#64748B", fontSize: 13, lineHeight: 18 },
  linkBtn: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#0F766E",
  },
  linkText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  name: { fontSize: 16, fontWeight: "700", color: "#0F172A", flex: 1 },
  meta: { marginTop: 4, color: "#64748B", fontSize: 13 },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeOk: { backgroundColor: "#D1FAE5" },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#134E4A" },
});
