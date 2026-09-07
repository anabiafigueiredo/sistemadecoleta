import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Option<T extends string> = {
  value: T;
  label: string;
  /** Texto extra só para filtro (ex.: nomes). */
  searchText?: string;
};

type Props<T extends string> = {
  label: string;
  value: T | "";
  options: ReadonlyArray<Option<T>>;
  onChange: (value: T) => void;
  error?: string;
  placeholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  disabled?: boolean;
};

function normalizeSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function SearchableSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  error,
  placeholder = "Buscar e selecionar…",
  emptyMessage = "Nenhuma opção encontrada",
  loading = false,
  disabled = false,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? (value || "");

  const filtered = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return options;
    return options.filter((o) => {
      const hay = [o.label, o.value, o.searchText ?? ""]
        .map(normalizeSearch)
        .join(" ");
      return hay.includes(q);
    });
  }, [options, query]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => {
          if (disabled) return;
          setQuery("");
          setOpen(true);
        }}
        style={[
          styles.trigger,
          error ? styles.triggerError : null,
          disabled ? styles.triggerDisabled : null,
        ]}
      >
        <Text
          style={selectedLabel ? styles.triggerValue : styles.triggerPlaceholder}
          numberOfLines={2}
        >
          {loading
            ? "Carregando lista…"
            : selectedLabel || placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
      {!value && !loading ? (
        <Text style={styles.hint}>Nenhuma opção selecionada</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label.replace(/\s*\*$/, "")}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={12}>
              <Text style={styles.close}>Fechar</Text>
            </Pressable>
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por nome, responsável ou código…"
            placeholderTextColor="#94A3B8"
            autoFocus
            style={styles.search}
            clearButtonMode="while-editing"
          />
          <FlatList
            data={filtered as Option<T>[]}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.empty}>
                {loading ? "Carregando…" : emptyMessage}
              </Text>
            }
            renderItem={({ item }) => {
              const active = item.value === value;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  style={[styles.row, active && styles.rowActive]}
                >
                  <Text
                    style={[styles.rowText, active && styles.rowTextActive]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
  },
  trigger: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  triggerError: { borderColor: "#F87171" },
  triggerDisabled: { opacity: 0.65, backgroundColor: "#F8FAFC" },
  triggerValue: { flex: 1, color: "#0F172A", fontSize: 15 },
  triggerPlaceholder: { flex: 1, color: "#94A3B8", fontSize: 15 },
  chevron: { color: "#64748B", fontSize: 14 },
  hint: { marginTop: 4, color: "#94A3B8", fontSize: 12 },
  error: { marginTop: 4, color: "#DC2626", fontSize: 12 },
  modal: { flex: 1, backgroundColor: "#FFFFFF", paddingTop: 12 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  close: { color: "#0F766E", fontWeight: "600", fontSize: 15 },
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  rowActive: { backgroundColor: "#CCFBF1" },
  rowText: { fontSize: 15, color: "#334155" },
  rowTextActive: { color: "#0F766E", fontWeight: "700" },
  empty: {
    textAlign: "center",
    color: "#94A3B8",
    paddingVertical: 32,
    fontSize: 14,
  },
});
