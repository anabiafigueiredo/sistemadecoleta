import Constants from "expo-constants";

/**
 * Base URL da API Next.js.
 * - iOS Simulator / web: http://localhost:3000
 * - Android Emulator: http://10.0.2.2:3000
 * - Device físico: http://<IP-LAN>:3000
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ||
  (Constants.expoConfig?.extra?.apiUrl as string | undefined)?.replace(
    /\/$/,
    "",
  ) ||
  "http://localhost:3000";

export const STORAGE_KEY = "@coleta_escolar/registros_v1";

export const DEFAULT_MOMENTO: "T2" | "T3" = "T2";
