import { Pressable, Text, StyleSheet, View } from "react-native";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label: string;
  value: T | "";
  options: Option<T>[];
  onChange: (value: T) => void;
  error?: string;
};

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  error,
}: Props<T>) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {!value ? (
        <Text style={styles.hint}>Nenhuma opção selecionada</Text>
      ) : null}
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
    marginBottom: 6,
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
  hint: { marginTop: 4, color: "#94A3B8", fontSize: 12 },
  error: { marginTop: 4, color: "#DC2626", fontSize: 12 },
});
