import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

type Props = TextInputProps & {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
};

export function Field({ label, error, containerStyle, style, ...rest }: Props) {
  return (
    <View style={[styles.wrap, containerStyle] as never}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#94A3B8"
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
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
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#0F172A",
  },
  inputError: { borderColor: "#DC2626" },
  error: { marginTop: 4, color: "#DC2626", fontSize: 12 },
});
