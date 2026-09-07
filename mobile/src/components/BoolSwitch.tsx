import {
  ActivityIndicator,
  Pressable,
  Text,
  StyleSheet,
  View,
  Switch,
} from "react-native";
import { colors, fontBody, fontLabel } from "@/theme";

type Props = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  trueLabel?: string;
  falseLabel?: string;
};

export function BoolSwitch({
  label,
  value,
  onChange,
  trueLabel = "Sim",
  falseLabel = "Não",
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Text style={styles.hint}>{value ? trueLabel : falseLabel}</Text>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor={value ? colors.primary : colors.background}
        />
      </View>
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  variant = "primary",
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  const blocked = Boolean(disabled || loading);
  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      style={({ pressed }) => [
        styles.btn,
        variant === "secondary" && styles.btnSecondary,
        variant === "danger" && styles.btnDanger,
        (blocked || pressed) && styles.btnDisabled,
      ]}
    >
      {loading ? (
        <View style={styles.btnLoadingRow}>
          <ActivityIndicator
            color={variant === "secondary" ? colors.primary : colors.white}
          />
          <Text
            style={[
              styles.btnText,
              variant === "secondary" && styles.btnTextSecondary,
            ]}
          >
            {title}
          </Text>
        </View>
      ) : (
        <Text
          style={[
            styles.btnText,
            variant === "secondary" && styles.btnTextSecondary,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: { fontSize: 13, ...fontLabel, color: colors.text, flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  hint: { color: colors.textSecondary, fontSize: 13, ...fontBody },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  btnSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  btnDanger: { backgroundColor: colors.error },
  btnDisabled: { opacity: 0.55 },
  btnText: { color: colors.white, ...fontLabel, fontSize: 16 },
  btnTextSecondary: { color: colors.primary },
  btnLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
