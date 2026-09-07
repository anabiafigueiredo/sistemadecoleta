import { useState } from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { colors, fontBody, fontLabel, fontTitle } from "@/theme";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label: string;
  values: readonly T[];
  options: Option<T>[];
  onToggle: (value: T) => void;
  error?: string;
  hint?: string;
  max?: number;
  /** Ainda clicáveis no limite (ex.: NENHUM, que substitui a seleção). */
  bypassMaxValues?: readonly T[];
};

export function MultiSelectChips<T extends string>({
  label,
  values,
  options,
  onToggle,
  error,
  hint,
  max,
  bypassMaxValues,
}: Props<T>) {
  const selected = new Set(values);
  const bypass = new Set(bypassMaxValues ?? []);
  const countable = values.filter((v) => !bypass.has(v)).length;
  const atMax = max != null && countable >= max;
  const [limitFlash, setLimitFlash] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.row}>
        {options.map((opt) => {
          const active = selected.has(opt.value);
          const blocked = atMax && !active && !bypass.has(opt.value);
          return (
            <Pressable
              key={opt.value}
              onPress={() => {
                if (blocked) {
                  setLimitFlash(true);
                  return;
                }
                setLimitFlash(false);
                onToggle(opt.value);
              }}
              style={[
                styles.chip,
                active && styles.chipActive,
                blocked && styles.chipBlocked,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  active && styles.chipTextActive,
                  blocked && styles.chipTextBlocked,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {limitFlash && max != null ? (
        <Text style={styles.limitMsg}>
          Máximo de {max} opções. Desmarque uma para escolher outra.
        </Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: {
    fontSize: 13,
    ...fontTitle,
    color: colors.text,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    ...fontBody,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.background,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipBlocked: {
    opacity: 0.45,
  },
  chipText: { color: colors.textSecondary, ...fontLabel, fontSize: 13 },
  chipTextActive: { color: colors.white },
  chipTextBlocked: { color: colors.textDisabled },
  limitMsg: { marginTop: 4, color: colors.warningText, fontSize: 12, ...fontBody },
  error: { marginTop: 4, color: colors.error, fontSize: 12, ...fontBody },
});
