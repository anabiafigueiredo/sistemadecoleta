/**
 * Tokens de design do app (guia Ana Beatriz).
 * Cores + faces Inter — use em StyleSheet / props.
 */
export const colors = {
  primary: "#0E766D",
  accent: "#318A83",
  primarySoft: "#E8F7F4",
  background: "#F5F7F7",
  card: "#FFFFFF",
  border: "#D8E1E3",
  text: "#141A1F",
  textSecondary: "#667085",
  textDisabled: "#AEB8C0",
  error: "#C94A4A",
  white: "#FFFFFF",
  /** Status auxiliares (não no guia; mantidos suaves). */
  warningBg: "#FEF3C7",
  warningText: "#92400E",
  successBg: "#E8F7F4",
} as const;

/** Faces carregadas em app/_layout.tsx via @expo-google-fonts/inter */
export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

/** Inter SemiBold — títulos e perguntas */
export const fontTitle = {
  fontFamily: fonts.semibold,
  fontWeight: "600" as const,
};

/** Inter Medium — botões, chips e labels */
export const fontLabel = {
  fontFamily: fonts.medium,
  fontWeight: "500" as const,
};

/** Inter Regular — textos auxiliares */
export const fontBody = {
  fontFamily: fonts.regular,
  fontWeight: "400" as const,
};

/** Inter Bold — números / destaques */
export const fontEmphasis = {
  fontFamily: fonts.bold,
  fontWeight: "700" as const,
};
