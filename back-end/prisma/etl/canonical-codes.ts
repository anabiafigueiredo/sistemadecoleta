/**
 * Catálogo canônico para ETL / normalize-categoricals.
 * Manter alinhado a front-end/src/lib/opcoes-questionario.ts
 * (listas e regras de match iguais — sem import cruzado entre pacotes).
 */

export type CatalogOption = { value: string; label: string };

export const MEIO_TRANSPORTE_OPTIONS: CatalogOption[] = [
  { value: "A_PE", label: "A pé" },
  { value: "BICICLETA", label: "Bicicleta" },
  { value: "MOTO", label: "Moto" },
  { value: "ONIBUS", label: "Ônibus" },
  { value: "VAN_ESCOLAR", label: "Van escolar" },
  { value: "CARRO", label: "Carro" },
  { value: "BARCO", label: "Barco / fluvial" },
  { value: "OUTRO", label: "Outro" },
];

export const TURNO_OPTIONS: CatalogOption[] = [
  { value: "MATUTINO", label: "Matutino" },
  { value: "VESPERTINO", label: "Vespertino" },
  { value: "NOTURNO", label: "Noturno" },
  { value: "INTEGRAL", label: "Integral" },
];

export const ANO_SERIE_OPTIONS: CatalogOption[] = [
  { value: "1_ANO_EF", label: "1º ano EF" },
  { value: "2_ANO_EF", label: "2º ano EF" },
  { value: "3_ANO_EF", label: "3º ano EF" },
  { value: "4_ANO_EF", label: "4º ano EF" },
  { value: "5_ANO_EF", label: "5º ano EF" },
  { value: "6_ANO_EF", label: "6º ano EF" },
  { value: "7_ANO_EF", label: "7º ano EF" },
  { value: "8_ANO_EF", label: "8º ano EF" },
  { value: "9_ANO_EF", label: "9º ano EF" },
  { value: "1_ANO_EM", label: "1º ano EM" },
  { value: "2_ANO_EM", label: "2º ano EM" },
  { value: "3_ANO_EM", label: "3º ano EM" },
  { value: "EJA", label: "EJA" },
  { value: "OUTRO", label: "Outro" },
];

export const TIPO_ACESSO_INTERNET_OPTIONS: CatalogOption[] = [
  { value: "WIFI_RESIDENCIAL", label: "Wi-Fi residencial" },
  { value: "DADOS_MOVEIS", label: "Dados móveis" },
  { value: "INTERNET_COMPARTILHADA", label: "Internet compartilhada" },
  { value: "OUTRO", label: "Outro" },
];

export const BENEFICIO_SOCIAL_OPTIONS: CatalogOption[] = [
  { value: "BOLSA_FAMILIA", label: "Bolsa Família / Auxílio Brasil" },
  { value: "AUXILIO_GAS", label: "Auxílio Gás" },
  { value: "BPC", label: "BPC" },
  { value: "OUTRO", label: "Outro" },
];

export const PARENTESCO_OPTIONS: CatalogOption[] = [
  { value: "MAE", label: "Mãe" },
  { value: "PAI", label: "Pai" },
  { value: "AVO", label: "Avó / Avô" },
  { value: "TIA_TIO", label: "Tia / Tio" },
  { value: "IRMAO", label: "Irmão / Irmã" },
  { value: "OUTRO", label: "Outro" },
];

function normalizeOptionKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[_/+\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchOption(
  options: ReadonlyArray<CatalogOption>,
  raw: string | null | undefined,
): CatalogOption | null {
  const v = (raw ?? "").trim();
  if (!v) return null;

  const byCode = options.find((o) => o.value === v);
  if (byCode) return byCode;

  const key = normalizeOptionKey(v);

  const byCodeNorm = options.find((o) => normalizeOptionKey(o.value) === key);
  if (byCodeNorm) return byCodeNorm;

  const byLabel = options.find((o) => normalizeOptionKey(o.label) === key);
  if (byLabel) return byLabel;

  const byPrefix = options.find((o) => {
    const lk = normalizeOptionKey(o.label);
    if (!lk.startsWith(key)) return false;
    if (lk.length === key.length) return true;
    const next = lk[key.length];
    return next === " " || next === "/";
  });
  if (byPrefix) return byPrefix;

  return null;
}

export function canonicalCode(
  options: ReadonlyArray<CatalogOption>,
  raw: string | null | undefined,
): string | null {
  return matchOption(options, raw)?.value ?? null;
}

/** Texto/código → código canônico; se não casar, mantém o texto limpo. */
export function toCanonicalCode(
  options: ReadonlyArray<CatalogOption>,
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return canonicalCode(options, trimmed) ?? trimmed;
}
