import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { PrimaryButton } from "@/components/BoolSwitch";
import { useNetwork } from "@/hooks/useNetwork";
import { listPending } from "@/lib/storage";
import { syncPending, type SyncResult } from "@/lib/sync";
import type { ColetaLocal } from "@/lib/types";
import { API_URL } from "@/lib/config";
import { colors, fontBody, fontLabel, fontTitle } from "@/theme";

export default function SyncScreen() {
  const { online } = useNetwork();
  const [pending, setPending] = useState<ColetaLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setPending(await listPending());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  async function handleSyncAll() {
    if (!online) {
      Alert.alert("Sem internet", "Conecte-se para enviar a fila.");
      return;
    }

    const pendingBefore = await listPending();
    setSyncing(true);
    try {
      const result = await syncPending();
      setLastResult(result);
      await refresh();

      if (result.success > 0 && result.failed === 0) {
        Alert.alert(
          "Sincronização concluída",
          `${result.success} coleta(s) enviada(s) com sucesso.` +
            (result.pruned > 0
              ? `\n${result.pruned} registro(s) removido(s) do app (excluídos no servidor).`
              : ""),
        );
        return;
      }

      if (result.failed > 0) {
        Alert.alert(
          "Sincronização parcial",
          `Enviadas: ${result.success}/${result.total}\nFalhas: ${result.failed}` +
            (result.pruned > 0
              ? `\nRemovidos do app: ${result.pruned}`
              : ""),
        );
        return;
      }

      if (result.pruned > 0) {
        Alert.alert(
          "Lista alinhada",
          `${result.pruned} registro(s) removido(s) do app porque não existem mais no servidor.`,
        );
        return;
      }

      if (pendingBefore.length === 0) {
        Alert.alert(
          "Fila vazia",
          "Não há coletas pendentes. Se você acabou de salvar online, o envio já foi feito na hora do salvamento.",
        );
        return;
      }

      Alert.alert("Sincronização", "Nenhuma alteração necessária.");
    } catch (error) {
      Alert.alert(
        "Falha na sincronização",
        error instanceof Error ? error.message : "Erro inesperado",
      );
    } finally {
      setSyncing(false);
    }
  }

  return (
    <View style={styles.container}>
      <Modal visible={syncing} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.modalTitle}>Sincronizando…</Text>
            <Text style={styles.modalHint}>
              Enviando pendências e alinhando com o servidor
            </Text>
          </View>
        </View>
      </Modal>

      <View style={[styles.banner, online ? styles.online : styles.offline]}>
        <Text style={styles.bannerText}>
          {online ? "Conectado" : "Offline"} · API: {API_URL}
        </Text>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>
          Pendentes de sincronização ({pending.length})
        </Text>
        <Pressable
          onPress={() => void refresh()}
          disabled={loading || syncing}
          style={styles.reloadBtn}
        >
          <Text style={styles.reloadText}>{loading ? "…" : "Recarregar"}</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>
        Entrevistas salvas offline aguardando envio. Ao sincronizar, o app envia
        a fila e remove registros excluídos no servidor.
      </Text>

      {lastResult ? (
        <Text style={styles.result}>
          Último lote: {lastResult.success}/{lastResult.total} ok
          {lastResult.failed > 0 ? ` · ${lastResult.failed} falha(s)` : ""}
          {lastResult.pruned > 0 ? ` · ${lastResult.pruned} removido(s)` : ""}
        </Text>
      ) : null}

      <PrimaryButton
        title={syncing ? "Sincronizando…" : "Sincronizar"}
        onPress={() => void handleSyncAll()}
        disabled={syncing}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
      ) : (
        <FlatList
          style={{ marginTop: 16 }}
          data={pending}
          keyExtractor={(i) => i.id}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Nenhuma pendência. Toque em Sincronizar para alinhar com o servidor.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.payload.aluno.nome}</Text>
              <Text style={styles.meta}>
                {item.payload.aluno.codigoAluno} ·{" "}
                {item.payload.familia.codigoFamilia} ·{" "}
                {item.payload.momento.codigo}
              </Text>
              {item.lastError ? (
                <Text style={styles.error}>{item.lastError}</Text>
              ) : (
                <Text style={styles.meta}>Aguardando envio…</Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  banner: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  online: { backgroundColor: colors.primarySoft },
  offline: { backgroundColor: colors.warningBg },
  bannerText: {
    fontSize: 12,
    ...fontLabel,
    color: colors.primary,
    textAlign: "center",
  },
  title: { fontSize: 18, ...fontTitle, color: colors.text, flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reloadBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
  },
  reloadText: { color: colors.primary, ...fontLabel, fontSize: 13 },
  hint: { marginTop: 6, color: colors.textSecondary, fontSize: 13, marginBottom: 8, ...fontBody },
  result: { marginBottom: 8, color: colors.primary, ...fontTitle },
  empty: { textAlign: "center", color: colors.textSecondary, marginTop: 24, ...fontBody },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { ...fontTitle, color: colors.text },
  meta: { marginTop: 4, color: colors.textSecondary, fontSize: 12, ...fontBody },
  error: { marginTop: 6, color: colors.error, fontSize: 12, ...fontBody },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(20, 26, 31, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    minWidth: 240,
    gap: 10,
  },
  modalTitle: { fontSize: 17, ...fontTitle, color: colors.text },
  modalHint: { fontSize: 13, color: colors.textSecondary, textAlign: "center", ...fontBody },
});
