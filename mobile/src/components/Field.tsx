import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { colors, fontBody, fontLabel } from "@/theme";

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
        placeholderTextColor={colors.textDisabled}
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
    ...fontLabel,
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    ...fontBody,
  },
  inputError: { borderColor: colors.error },
  error: { marginTop: 4, color: colors.error, fontSize: 12, ...fontBody },
});
