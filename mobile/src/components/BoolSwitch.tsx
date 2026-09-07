import {
  ActivityIndicator,
  Pressable,
  Text,
  StyleSheet,
  View,
  Switch,
} from "react-native";

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
          trackColor={{ false: "#CBD5E1", true: "#5EEAD4" }}
          thumbColor={value ? "#0F766E" : "#F8FAFC"}
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
            color={variant === "secondary" ? "#0F766E" : "#FFFFFF"}
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
  label: { fontSize: 13, fontWeight: "600", color: "#334155", flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  hint: { color: "#64748B", fontSize: 13 },
  btn: {
    backgroundColor: "#0F766E",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  btnSecondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#0F766E",
  },
  btnDanger: { backgroundColor: "#B91C1C" },
  btnDisabled: { opacity: 0.55 },
  btnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  btnTextSecondary: { color: "#0F766E" },
  btnLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
