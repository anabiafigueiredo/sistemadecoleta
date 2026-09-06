import { Pressable, Text, StyleSheet, View } from "react-native";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label: string;
  values: readonly T[];
  options: Option<T>[];
  onToggle: (value: T) => void;
  error?: string;
  hint?: string;
};

export function MultiSelectChips<T extends string>({
  label,
  values,
  options,
  onToggle,
  error,
  hint,
}: Props<T>) {
  const selected = new Set(values);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.row}>
        {options.map((opt) => {
          const active = selected.has(opt.value);
          return (
            <Pressable
              key={opt.value}
              onPress={() => onToggle(opt.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F8FAFC",
  },
  chipActive: {
    backgroundColor: "#0F766E",
    borderColor: "#0F766E",
  },
  chipText: { color: "#475569", fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: "#FFFFFF" },
  error: { marginTop: 4, color: "#DC2626", fontSize: 12 },
});
