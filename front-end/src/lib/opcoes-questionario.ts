/** Opções padronizadas do questionário v2 (listas oficiais). */

export const TIPO_LOCALIDADE_OPTIONS = [
  { value: "URBANA", label: "Urbana" },
  { value: "RURAL", label: "Rural" },
  { value: "COMUNIDADE_RIBEIRINHA", label: "Comunidade ribeirinha" },
  { value: "OUTRA", label: "Outra" },
] as const;

export const ESCOLARIDADE_OPTIONS = [
  { value: "SEM_ESCOLARIDADE", label: "Sem escolaridade" },
  { value: "FUNDAMENTAL_INCOMPLETO", label: "Fundamental incompleto" },
  { value: "FUNDAMENTAL_COMPLETO", label: "Fundamental completo" },
  { value: "MEDIO_INCOMPLETO", label: "Médio incompleto" },
  { value: "MEDIO_COMPLETO", label: "Médio completo" },
  { value: "SUPERIOR_INCOMPLETO", label: "Superior incompleto" },
  { value: "SUPERIOR_COMPLETO", label: "Superior completo" },
  { value: "POS_GRADUACAO", label: "Pós-graduação" },
] as const;

export const SITUACAO_OCUPACIONAL_OPTIONS = [
  { value: "EMPREGADO", label: "Empregado(a)" },
  { value: "DESEMPREGADO", label: "Desempregado(a)" },
  { value: "AUTONOMO_INFORMAL", label: "Autônomo / informal" },
  { value: "APOSENTADO", label: "Aposentado(a)" },
  { value: "ESTUDANTE", label: "Estudante" },
  { value: "DO_LAR", label: "Do lar" },
  { value: "OUTRO", label: "Outro" },
] as const;

export const EQUIPAMENTO_ESTUDO_OPTIONS = [
  { value: "COMPUTADOR", label: "Computador" },
  { value: "TABLET", label: "Tablet" },
  { value: "CELULAR", label: "Celular" },
  { value: "NENHUM", label: "Nenhum" },
] as const;

export const DISPONIBILIDADE_EQUIPAMENTO_OPTIONS = [
  { value: "EXCLUSIVO", label: "Exclusivo" },
  { value: "COMPARTILHADO_DISPONIVEL", label: "Compartilhado (disponível)" },
  {
    value: "COMPARTILHADO_LIMITADO",
    label: "Compartilhado (limitado)",
  },
  { value: "N_A", label: "Não se aplica" },
] as const;

export const LOCAL_ESTUDO_OPTIONS = [
  { value: "SIM", label: "Sim" },
  { value: "PARCIALMENTE", label: "Parcialmente" },
  { value: "NAO", label: "Não" },
] as const;

export const ACOMPANHAMENTO_FAMILIAR_OPTIONS = [
  { value: "SEMPRE", label: "Sempre" },
  { value: "FREQUENTEMENTE", label: "Frequentemente" },
  { value: "AS_VEZES", label: "Às vezes" },
  { value: "RARAMENTE", label: "Raramente" },
  { value: "NUNCA", label: "Nunca" },
] as const;

export const APOIO_PRIORITARIO_OPTIONS = [
  { value: "REFORCO", label: "Reforço escolar" },
  { value: "INCLUSAO_DIGITAL", label: "Inclusão digital" },
  { value: "AEE", label: "AEE" },
  { value: "ESPORTES_CULTURA", label: "Esportes / cultura" },
  { value: "ORIENTACAO", label: "Orientação" },
  { value: "APOIO_SOCIAL", label: "Apoio social" },
  { value: "NENHUM", label: "Nenhum" },
  { value: "OUTRO", label: "Outro" },
] as const;

/** Catálogo de barreiras (B-05). Código NENHUMA é exclusivo. */
export const BARREIRA_NENHUMA = "NENHUMA" as const;

export const BARREIRA_OPTIONS = [
  { value: "TRANSPORTE", label: "Transporte" },
  { value: "SAUDE", label: "Questões de saúde" },
  { value: "APRENDIZAGEM", label: "Dificuldade de aprendizagem" },
  { value: "FINANCEIRA", label: "Dificuldade financeira" },
  { value: "FALTA_INTERNET", label: "Falta de internet" },
  { value: "FALTA_EQUIPAMENTO", label: "Falta de equipamento" },
  { value: "TRABALHAR", label: "Necessidade de trabalhar" },
  { value: "CUIDAR_FAMILIARES", label: "Necessidade de cuidar de familiares" },
  {
    value: "FALTA_ACOMPANHAMENTO",
    label: "Falta de acompanhamento nos estudos",
  },
  { value: "OUTRA", label: "Outra" },
  { value: BARREIRA_NENHUMA, label: "Nenhuma" },
] as const;

/** B-06 — listas padronizadas (substituem texto livre no mobile v2). */
export const MEIO_TRANSPORTE_OPTIONS = [
  { value: "A_PE", label: "A pé" },
  { value: "BICICLETA", label: "Bicicleta" },
  { value: "MOTO", label: "Moto" },
  { value: "ONIBUS", label: "Ônibus" },
  { value: "VAN_ESCOLAR", label: "Van escolar" },
  { value: "CARRO", label: "Carro" },
  { value: "BARCO", label: "Barco / fluvial" },
  { value: "OUTRO", label: "Outro" },
] as const;

export const TURNO_OPTIONS = [
  { value: "MATUTINO", label: "Matutino" },
  { value: "VESPERTINO", label: "Vespertino" },
  { value: "NOTURNO", label: "Noturno" },
  { value: "INTEGRAL", label: "Integral" },
] as const;

export const ANO_SERIE_OPTIONS = [
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
] as const;

export const TIPO_ACESSO_INTERNET_OPTIONS = [
  { value: "WIFI_RESIDENCIAL", label: "Wi-Fi residencial" },
  { value: "DADOS_MOVEIS", label: "Dados móveis" },
  { value: "INTERNET_COMPARTILHADA", label: "Internet compartilhada" },
  { value: "OUTRO", label: "Outro" },
] as const;

export const BENEFICIO_SOCIAL_OPTIONS = [
  { value: "BOLSA_FAMILIA", label: "Bolsa Família / Auxílio Brasil" },
  { value: "AUXILIO_GAS", label: "Auxílio Gás" },
  { value: "BPC", label: "BPC" },
  { value: "OUTRO", label: "Outro" },
] as const;

export const PARENTESCO_OPTIONS = [
  { value: "MAE", label: "Mãe" },
  { value: "PAI", label: "Pai" },
  { value: "AVO", label: "Avó / Avô" },
  { value: "TIA_TIO", label: "Tia / Tio" },
  { value: "IRMAO", label: "Irmão / Irmã" },
  { value: "OUTRO", label: "Outro" },
] as const;

export type TipoLocalidadeValue =
  (typeof TIPO_LOCALIDADE_OPTIONS)[number]["value"];
export type EscolaridadeValue =
  (typeof ESCOLARIDADE_OPTIONS)[number]["value"];
export type SituacaoOcupacionalValue =
  (typeof SITUACAO_OCUPACIONAL_OPTIONS)[number]["value"];
export type EquipamentoEstudoValue =
  (typeof EQUIPAMENTO_ESTUDO_OPTIONS)[number]["value"];
export type DisponibilidadeEquipamentoValue =
  (typeof DISPONIBILIDADE_EQUIPAMENTO_OPTIONS)[number]["value"];
export type LocalEstudoValue =
  (typeof LOCAL_ESTUDO_OPTIONS)[number]["value"];
export type AcompanhamentoFamiliarValue =
  (typeof ACOMPANHAMENTO_FAMILIAR_OPTIONS)[number]["value"];
export type ApoioPrioritarioValue =
  (typeof APOIO_PRIORITARIO_OPTIONS)[number]["value"];
export type BarreiraValue = (typeof BARREIRA_OPTIONS)[number]["value"];
export type MeioTransporteValue =
  (typeof MEIO_TRANSPORTE_OPTIONS)[number]["value"];
export type TurnoValue = (typeof TURNO_OPTIONS)[number]["value"];
export type AnoSerieValue = (typeof ANO_SERIE_OPTIONS)[number]["value"];
export type TipoAcessoInternetValue =
  (typeof TIPO_ACESSO_INTERNET_OPTIONS)[number]["value"];
export type BeneficioSocialValue =
  (typeof BENEFICIO_SOCIAL_OPTIONS)[number]["value"];
export type ParentescoValue = (typeof PARENTESCO_OPTIONS)[number]["value"];

/** Alterna barreira; NENHUMA limpa as demais e vice-versa. */
export function toggleBarreira(
  selected: readonly string[],
  code: string,
): string[] {
  if (code === BARREIRA_NENHUMA) {
    return selected.includes(BARREIRA_NENHUMA) ? [] : [BARREIRA_NENHUMA];
  }
  const withoutNenhuma = selected.filter((c) => c !== BARREIRA_NENHUMA);
  if (withoutNenhuma.includes(code)) {
    return withoutNenhuma.filter((c) => c !== code);
  }
  return [...withoutNenhuma, code];
}

function normalizeOptionKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[_/+\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Resolve código ou texto legado para a opção oficial (se houver). */
export function matchOption(
  options: ReadonlyArray<{ value: string; label: string }>,
  raw: string | null | undefined,
): { value: string; label: string } | null {
  const v = (raw ?? "").trim();
  if (!v) return null;

  const byCode = options.find((o) => o.value === v);
  if (byCode) return byCode;

  const key = normalizeOptionKey(v);

  const byCodeNorm = options.find((o) => normalizeOptionKey(o.value) === key);
  if (byCodeNorm) return byCodeNorm;

  const byLabel = options.find((o) => normalizeOptionKey(o.label) === key);
  if (byLabel) return byLabel;

  // "Bolsa Família" → "Bolsa Família / Auxílio Brasil"
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

/** Código canônico (BOLSA_FAMILIA) a partir de código ou texto legado. */
export function canonicalCode(
  options: ReadonlyArray<{ value: string; label: string }>,
  raw: string | null | undefined,
): string | null {
  return matchOption(options, raw)?.value ?? null;
}

/**
 * Preferir agrupar por canonicalCode e só então exibir o label.
 * A normalização categórica do dashboard ocorre aqui (API), não nos gráficos.
 */
export function canonicalLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  raw: string | null | undefined,
  fallback = "Não informado",
): string {
  const matched = matchOption(options, raw);
  if (matched) return matched.label;
  const v = (raw ?? "").trim();
  return v || fallback;
}

/** Rótulo para UI; vazio → "—". Também unifica código e texto legado. */
export function labelOf(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | null | undefined,
): string {
  if (value == null || !String(value).trim()) return "—";
  return canonicalLabel(options, value);
}
