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
  { value: "NAO_SABE", label: "Não sabe informar" },
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
  { value: "NAO_SABE", label: "Não sabe informar" },
];

export const TIPO_ACESSO_INTERNET_OPTIONS: CatalogOption[] = [
  { value: "WIFI_RESIDENCIAL", label: "Wi-Fi residencial" },
  { value: "DADOS_MOVEIS", label: "Dados móveis" },
  { value: "INTERNET_COMPARTILHADA", label: "Internet compartilhada" },
  { value: "OUTRO", label: "Outro" },
  { value: "NAO_SABE", label: "Não sabe informar" },
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

export const BAIRRO_OPTIONS: CatalogOption[] = [
  { value: "ADRIANOPOLIS", label: "Adrianópolis" },
  { value: "ALEIXO", label: "Aleixo" },
  { value: "ALVORADA", label: "Alvorada" },
  { value: "ARMANDO_MENDES", label: "Armando Mendes" },
  { value: "BETANIA", label: "Betânia" },
  { value: "CACHOEIRINHA", label: "Cachoeirinha" },
  { value: "CENTRO", label: "Centro" },
  { value: "CHAPADA", label: "Chapada" },
  { value: "CIDADE_NOVA", label: "Cidade Nova" },
  { value: "COL_STO_ANTONIO", label: "Colônia Santo Antônio" },
  { value: "COL_TERRA_NOVA", label: "Colônia Terra Nova" },
  { value: "COL_OLIVEIRA_MACHADO", label: "Colônia Oliveira Machado" },
  { value: "COLONIA_ANTONIO_ALEIXO", label: "Colônia Antônio Aleixo" },
  { value: "COMPENSA", label: "Compensa" },
  { value: "COROADO", label: "Coroado" },
  { value: "CRESPO", label: "Crespo" },
  { value: "DA_PAZ", label: "Da Paz" },
  { value: "DISTRITO_INDUSTRIAL_I", label: "Distrito Industrial I" },
  { value: "DISTRITO_INDUSTRIAL_II", label: "Distrito Industrial II" },
  { value: "DOM_PEDRO", label: "Dom Pedro" },
  { value: "EDUCANDOS", label: "Educandos" },
  { value: "FLORES", label: "Flores" },
  { value: "GLORIA", label: "Glória" },
  { value: "JAPIIM", label: "Japiim" },
  { value: "JORGE_TEIXEIRA", label: "Jorge Teixeira" },
  { value: "LIRIO_DO_VALE", label: "Lírio do Vale" },
  { value: "MAUAZINHO", label: "Mauazinho" },
  { value: "MONTE_DAS_OLIVEIRAS", label: "Monte das Oliveiras" },
  { value: "MORRO_DA_LIBERDADE", label: "Morro da Liberdade" },
  { value: "N_SRA_DE_APARECIDA", label: "Nossa Senhora de Aparecida" },
  { value: "NOSSA_SENHORA_DAS_GRACAS", label: "Nossa Senhora das Graças" },
  { value: "NOVA_ESPERANCA", label: "Nova Esperança" },
  { value: "NOVO_ISRAEL", label: "Novo Israel" },
  { value: "PARQUE_10_DE_NOVEMBRO", label: "Parque 10 de Novembro" },
  { value: "PETROPOLIS", label: "Petrópolis" },
  { value: "PLANALTO", label: "Planalto" },
  { value: "PONTA_NEGRA", label: "Ponta Negra" },
  { value: "PRACA_14_DE_JANEIRO", label: "Praça 14 de Janeiro" },
  { value: "PRES_VARGAS", label: "Presidente Vargas" },
  { value: "PURAQUEQUARA", label: "Puraquequara" },
  { value: "RAIZ", label: "Raiz" },
  { value: "REDENCAO", label: "Redenção" },
  { value: "SANTA_ETELVINA", label: "Santa Etelvina" },
  { value: "SANTA_LUZIA", label: "Santa Luzia" },
  { value: "SANTO_AGOSTINHO", label: "Santo Agostinho" },
  { value: "SANTO_ANTONIO", label: "Santo Antônio" },
  { value: "SAO_FRANCISCO", label: "São Francisco" },
  { value: "SAO_GERALDO", label: "São Geraldo" },
  { value: "SAO_JORGE", label: "São Jorge" },
  { value: "SAO_JOSE_OPERARIO", label: "São José Operário" },
  { value: "SAO_LAZARO", label: "São Lázaro" },
  { value: "SAO_RAIMUNDO", label: "São Raimundo" },
  { value: "TANCREDO_NEVES", label: "Tancredo Neves" },
  { value: "TARUMA", label: "Tarumã" },
  { value: "VILA_BURITI", label: "Vila Buriti" },
  { value: "VILA_DA_PRATA", label: "Vila da Prata" },
  { value: "ZUMBI_DOS_PALMARES", label: "Zumbi dos Palmares" },
  { value: "NAO_SABE", label: "Não sabe informar" },
  { value: "OUTRO", label: "Outro" },
];


export const EQUIPAMENTO_ESTUDO_OPTIONS: CatalogOption[] = [
  { value: "COMPUTADOR", label: "Computador" },
  { value: "TABLET", label: "Tablet" },
  { value: "CELULAR", label: "Celular" },
  { value: "NENHUM", label: "Nenhum" },
];

export const APOIO_PRIORITARIO_OPTIONS: CatalogOption[] = [
  { value: "REFORCO", label: "Reforço escolar" },
  { value: "ACESSO_TECNOLOGIA", label: "Acesso à tecnologia" },
  {
    value: "AEE",
    label: "Atendimento Educacional Especializado (AEE)",
  },
  { value: "ESPORTES_CULTURA", label: "Esportes / cultura" },
  { value: "ORIENTACAO", label: "Orientação" },
  { value: "APOIO_SOCIAL", label: "Apoio social" },
  { value: "NENHUM", label: "Nenhum" },
  { value: "OUTRO", label: "Outro" },
];

export const ESCOLARIDADE_OPTIONS: CatalogOption[] = [
  {
    value: "SEM_OU_FUND_INCOMPLETO",
    label: "Sem escolaridade ou Ensino Fundamental incompleto",
  },
  {
    value: "FUND_COMP_OU_MEDIO_INCOMP",
    label: "Ensino Fundamental completo ou Ensino Médio incompleto",
  },
  { value: "MEDIO_COMPLETO", label: "Ensino Médio completo" },
  { value: "SUPERIOR_INCOMPLETO", label: "Ensino Superior incompleto" },
  {
    value: "SUP_COMP_OU_POS",
    label: "Ensino Superior completo ou Pós-graduação",
  },
  { value: "NAO_SABE", label: "Não sabe informar" },
];

export const NECESSIDADE_EDUCACIONAL_OPTIONS: CatalogOption[] = [
  { value: "DEFICIENCIA_INTELECTUAL", label: "Deficiência intelectual" },
  { value: "DEFICIENCIA_FISICA", label: "Deficiência física" },
  { value: "DEFICIENCIA_VISUAL", label: "Deficiência visual" },
  { value: "DEFICIENCIA_AUDITIVA", label: "Deficiência auditiva" },
  {
    value: "TEA",
    label: "Transtorno do Espectro Autista (TEA)",
  },
  {
    value: "TDAH",
    label: "Transtorno de Déficit de Atenção/Hiperatividade (TDAH)",
  },
  { value: "ALTAS_HABILIDADES", label: "Altas habilidades / superdotação" },
  { value: "OUTRA", label: "Outra" },
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

const LEGACY_CODE_ALIASES: Record<string, string> = {
  SEM_ESCOLARIDADE: "SEM_OU_FUND_INCOMPLETO",
  FUNDAMENTAL_INCOMPLETO: "SEM_OU_FUND_INCOMPLETO",
  FUNDAMENTAL_COMPLETO: "FUND_COMP_OU_MEDIO_INCOMP",
  MEDIO_INCOMPLETO: "FUND_COMP_OU_MEDIO_INCOMP",
  SUPERIOR_COMPLETO: "SUP_COMP_OU_POS",
  POS_GRADUACAO: "SUP_COMP_OU_POS",
  INCLUSAO_DIGITAL: "ACESSO_TECNOLOGIA",
  FREQUENTEMENTE: "SEMPRE",
};

export function matchOption(
  options: ReadonlyArray<CatalogOption>,
  raw: string | null | undefined,
): CatalogOption | null {
  const v = (raw ?? "").trim();
  if (!v) return null;

  const aliased = LEGACY_CODE_ALIASES[v] ?? LEGACY_CODE_ALIASES[v.toUpperCase()];
  const candidate = aliased ?? v;

  const byCode = options.find((o) => o.value === candidate);
  if (byCode) return byCode;

  const key = normalizeOptionKey(candidate);

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
