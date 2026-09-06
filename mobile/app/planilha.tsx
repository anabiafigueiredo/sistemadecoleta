import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { AlunoDetailPanels } from "@/components/AlunoDetailPanels";
import { fetchAlunos, type AlunoRemote } from "@/lib/api";
import { useNetwork } from "@/hooks/useNetwork";
import { API_URL } from "@/lib/config";

/**
 * Registros da planilha (T1 / origem PLANILHA) vindos da API.
 * Requer internet — espelha a base importada no dashboard.
 */
export default function PlanilhaScreen() {
  const { online } = useNetwork();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState<AlunoRemote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    if (!online) {
      setError("Sem internet — a planilha só carrega online.");
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAlunos({
        origem: "PLANILHA",
        q: debounced || undefined,
      });
      setItems(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Falha ao carregar a planilha",
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [online, debounced]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const toggle = (id: string) =>
    setExpandedId((current) => (current === id ? null : id));

  return (
    <View style={styles.container}>
      <View style={[styles.banner, online ? styles.online : styles.offline]}>
        <Text style={styles.bannerText}>
          {online ? "Online" : "Offline"} · importação T1 ·{" "}
          {API_URL.replace(/^https?:\/\//, "")}
        </Text>
      </View>

      <View style={styles.topRow}>
        <Text style={styles.hint}>
          Alunos da planilha no servidor. Toque para ver detalhes.
        </Text>
        <Pressable
          onPress={() => void load()}
          disabled={loading || !online}
          style={({ pressed }) => [
            styles.reloadBtn,
            pressed && { opacity: 0.7 },
            (loading || !online) && { opacity: 0.45 },
          ]}
        >
          <Text style={styles.reloadText}>{loading ? "…" : "Recarregar"}</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Buscar por nome do aluno…"
        placeholderTextColor="#94A3B8"
        value={query}
        onChangeText={setQuery}
        editable={online}
      />

      {loading && items.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#0F766E" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            items.length === 0 ? styles.emptyWrap : styles.list
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              Nenhum registro da planilha encontrado.
            </Text>
          }
          renderItem={({ item }) => (
            <PlanilhaRow
              item={item}
              open={expandedId === item.id}
              onToggle={() => toggle(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

function PlanilhaRow({
  item,
  open,
  onToggle,
}: {
  item: AlunoRemote;
  open: boolean;
  onToggle: () => void;
}) {
  const p = item.pesquisa;
  return (
    <Pressable style={styles.card} onPress={onToggle}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.name}>{item.nome}</Text>
          <Text style={styles.chevron}>{open ? "▲" : "▼"}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Planilha</Text>
        </View>
      </View>
      <Text style={styles.meta}>
        {item.codigoAluno} · {item.familia.codigoFamilia}
        {p ? ` · ${p.momento.codigo}` : ""}
      </Text>
      <Text style={styles.meta}>
        {item.familia.comunidade}
        {item.familia.bairro ? ` · ${item.familia.bairro}` : ""}
      </Text>
      {p ? (
        <Text style={styles.meta}>
          {p.anoSerie} · {p.turno} · v{p.versaoQuestionario}
        </Text>
      ) : (
        <Text style={styles.meta}>Sem entrevista vinculada</Text>
      )}
      <Text style={styles.detailsHint}>
        {open ? "Ocultar detalhes" : "Ver detalhes"}
      </Text>
      {open ? (
        <View style={styles.details}>
          <AlunoDetailPanels aluno={item} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  banner: {
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 10,
    padding: 10,
  },
  online: { backgroundColor: "#CCFBF1" },
  offline: { backgroundColor: "#FEF3C7" },
  bannerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#134E4A",
    textAlign: "center",
  },
  topRow: {
    marginHorizontal: 16,
    marginTop: 10,
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
  empty: { textAlign: "center", color: "#64748B", fontSize: 15 },
  error: {
    margin: 16,
    color: "#B91C1C",
    textAlign: "center",
    fontSize: 14,
  },
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
    alignItems: "flex-start",
    gap: 8,
  },
  cardTitleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: { fontSize: 16, fontWeight: "700", color: "#0F172A", flex: 1 },
  chevron: { fontSize: 11, color: "#94A3B8" },
  meta: { marginTop: 4, color: "#64748B", fontSize: 13 },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#FEF3C7",
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#92400E" },
  detailsHint: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#0F766E",
  },
  details: {
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
    paddingTop: 4,
  },
});
