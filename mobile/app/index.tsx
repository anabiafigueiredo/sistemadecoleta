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
import { Link, useFocusEffect } from "expo-router";
import { useColetas } from "@/hooks/useColetas";
import { useNetwork } from "@/hooks/useNetwork";
import { pruneDeletedRemoteColetas } from "@/lib/sync";
import type { ColetaLocal } from "@/lib/types";

export default function ListaScreen() {
  const [query, setQuery] = useState("");
  const { items, loading, refresh } = useColetas(query);
  const { online } = useNetwork();

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        if (online) {
          try {
            await pruneDeletedRemoteColetas();
          } catch {
            // mantém lista local se a API falhar
          }
        }
        await refresh();
      })();
    }, [online, refresh]),
  );

  return (
    <View style={styles.container}>
      <View style={[styles.banner, online ? styles.online : styles.offline]}>
        <Text style={styles.bannerText}>
          {online ? "Online — sync automático ativo" : "Offline — salvando só no aparelho"}
        </Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Buscar por nome ou código da família…"
        placeholderTextColor="#94A3B8"
        value={query}
        onChangeText={setQuery}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#0F766E" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            items.length === 0 ? styles.emptyWrap : styles.list
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              Nenhum registro local. Toque em Coletar para iniciar.
            </Text>
          }
          renderItem={({ item }) => <ColetaRow item={item} />}
        />
      )}
    </View>
  );
}

function ColetaRow({ item }: { item: ColetaLocal }) {
  const { aluno, familia, momento } = item.payload;
  return (
    <Link href={`/coleta/${item.id}`} asChild>
      <Pressable style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{aluno.nome}</Text>
          <View
            style={[
              styles.badge,
              item.sincronizado ? styles.badgeOk : styles.badgePending,
            ]}
          >
            <Text style={styles.badgeText}>
              {item.sincronizado ? "Sync" : "Pendente"}
            </Text>
          </View>
        </View>
        <Text style={styles.meta}>
          {aluno.codigoAluno} · {familia.codigoFamilia} · {momento.codigo}
        </Text>
        <Text style={styles.meta}>
          {familia.bairro} · {familia.comunidade}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  banner: { paddingVertical: 8, paddingHorizontal: 16 },
  online: { backgroundColor: "#CCFBF1" },
  offline: { backgroundColor: "#FEF3C7" },
  bannerText: { fontSize: 12, fontWeight: "600", color: "#134E4A", textAlign: "center" },
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
  list: { padding: 12, paddingBottom: 40, gap: 10 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 24 },
  empty: { textAlign: "center", color: "#64748B", fontSize: 15 },
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
  badgePending: { backgroundColor: "#FFEDD5" },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#134E4A" },
});
