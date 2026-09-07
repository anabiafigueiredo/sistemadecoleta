/** Use só quando o responsável pode de fato não conhecer a resposta.
 * Presente em: escolaridade dos adultos, transporte, ano/série, tipo de internet, frequência.
 * Não usar em sim/não, parentesco, turno, etapa, etc.
 */
export const NAO_SABE = {
  value: "NAO_SABE",
  label: "Não sabe informar",
} as const;

export const TIPO_LOCALIDADE_OPTIONS = [
  { value: "URBANA", label: "Urbana" },
  { value: "RURAL", label: "Rural" },
  { value: "COMUNIDADE_RIBEIRINHA", label: "Comunidade ribeirinha" },
  { value: "OUTRA", label: "Outra" },
] as const;

/** Bairros oficiais (GeoJSON manaus-bairros); `geoNome` = propriedade `nome` no mapa. */
export const BAIRROS_MANAUS = [
  { value: "ADRIANOPOLIS", label: "Adrianópolis", geoNome: "ADRIANÓPOLIS" },
  { value: "ALEIXO", label: "Aleixo", geoNome: "ALEIXO" },
  { value: "ALVORADA", label: "Alvorada", geoNome: "ALVORADA" },
  { value: "ARMANDO_MENDES", label: "Armando Mendes", geoNome: "ARMANDO MENDES" },
  { value: "BETANIA", label: "Betânia", geoNome: "BETÂNIA" },
  { value: "CACHOEIRINHA", label: "Cachoeirinha", geoNome: "CACHOEIRINHA" },
  { value: "CENTRO", label: "Centro", geoNome: "CENTRO" },
  { value: "CHAPADA", label: "Chapada", geoNome: "CHAPADA" },
  { value: "CIDADE_NOVA", label: "Cidade Nova", geoNome: "CIDADE NOVA" },
  {
    value: "COL_STO_ANTONIO",
    label: "Colônia Santo Antônio",
    geoNome: "COL STO ANTÔNIO",
  },
  {
    value: "COL_TERRA_NOVA",
    label: "Colônia Terra Nova",
    geoNome: "COL TERRA NOVA",
  },
  {
    value: "COL_OLIVEIRA_MACHADO",
    label: "Colônia Oliveira Machado",
    geoNome: "COL. OLIVEIRA MACHADO",
  },
  {
    value: "COLONIA_ANTONIO_ALEIXO",
    label: "Colônia Antônio Aleixo",
    geoNome: "COLÔNIA ANTÔNIO ALEIXO",
  },
  { value: "COMPENSA", label: "Compensa", geoNome: "COMPENSA" },
  { value: "COROADO", label: "Coroado", geoNome: "COROADO" },
  { value: "CRESPO", label: "Crespo", geoNome: "CRESPO" },
  { value: "DA_PAZ", label: "Da Paz", geoNome: "DA PAZ" },
  {
    value: "DISTRITO_INDUSTRIAL_I",
    label: "Distrito Industrial I",
    geoNome: "DISTRITO INDUSTRIAL I",
  },
  {
    value: "DISTRITO_INDUSTRIAL_II",
    label: "Distrito Industrial II",
    geoNome: "DISTRITO INDUSTRIAL II",
  },
  { value: "DOM_PEDRO", label: "Dom Pedro", geoNome: "DOM PEDRO" },
  { value: "EDUCANDOS", label: "Educandos", geoNome: "EDUCANDOS" },
  { value: "FLORES", label: "Flores", geoNome: "FLORES" },
  { value: "GLORIA", label: "Glória", geoNome: "GLÓRIA" },
  { value: "JAPIIM", label: "Japiim", geoNome: "JAPIIM" },
  { value: "JORGE_TEIXEIRA", label: "Jorge Teixeira", geoNome: "JORGE TEIXEIRA" },
  { value: "LIRIO_DO_VALE", label: "Lírio do Vale", geoNome: "LÍRIO DO VALE" },
  { value: "MAUAZINHO", label: "Mauazinho", geoNome: "MAUAZINHO" },
  {
    value: "MONTE_DAS_OLIVEIRAS",
    label: "Monte das Oliveiras",
    geoNome: "MONTE DAS OLIVEIRAS",
  },
  {
    value: "MORRO_DA_LIBERDADE",
    label: "Morro da Liberdade",
    geoNome: "MORRO DA LIBERDADE",
  },
  {
    value: "N_SRA_DE_APARECIDA",
    label: "Nossa Senhora de Aparecida",
    geoNome: "N. SRA. DE APARECIDA",
  },
  {
    value: "NOSSA_SENHORA_DAS_GRACAS",
    label: "Nossa Senhora das Graças",
    geoNome: "NOSSA SENHORA DAS GRAÇAS",
  },
  { value: "NOVA_ESPERANCA", label: "Nova Esperança", geoNome: "NOVA ESPERANÇA" },
  { value: "NOVO_ISRAEL", label: "Novo Israel", geoNome: "NOVO ISRAEL" },
  {
    value: "PARQUE_10_DE_NOVEMBRO",
    label: "Parque 10 de Novembro",
    geoNome: "PARQUE 10 DE NOVEMBRO",
  },
  { value: "PETROPOLIS", label: "Petrópolis", geoNome: "PETRÓPOLIS" },
  { value: "PLANALTO", label: "Planalto", geoNome: "PLANALTO" },
  { value: "PONTA_NEGRA", label: "Ponta Negra", geoNome: "PONTA NEGRA" },
  {
    value: "PRACA_14_DE_JANEIRO",
    label: "Praça 14 de Janeiro",
    geoNome: "PRAÇA 14 DE JANEIRO",
  },
  { value: "PRES_VARGAS", label: "Presidente Vargas", geoNome: "PRES. VARGAS" },
  { value: "PURAQUEQUARA", label: "Puraquequara", geoNome: "PURAQUEQUARA" },
  { value: "RAIZ", label: "Raiz", geoNome: "RAIZ" },
  { value: "REDENCAO", label: "Redenção", geoNome: "REDENÇÃO" },
  { value: "SANTA_ETELVINA", label: "Santa Etelvina", geoNome: "SANTA ETELVINA" },
  { value: "SANTA_LUZIA", label: "Santa Luzia", geoNome: "SANTA LUZIA" },
  {
    value: "SANTO_AGOSTINHO",
    label: "Santo Agostinho",
    geoNome: "SANTO AGOSTINHO",
  },
  { value: "SANTO_ANTONIO", label: "Santo Antônio", geoNome: "SANTO ANTONIO" },
  { value: "SAO_FRANCISCO", label: "São Francisco", geoNome: "SÃO FRANCISCO" },
  { value: "SAO_GERALDO", label: "São Geraldo", geoNome: "SÃO GERALDO" },
  { value: "SAO_JORGE", label: "São Jorge", geoNome: "SÃO JORGE" },
  {
    value: "SAO_JOSE_OPERARIO",
    label: "São José Operário",
    geoNome: "SÃO JOSÉ OPERÁRIO",
  },
  { value: "SAO_LAZARO", label: "São Lázaro", geoNome: "SÃO LÁZARO" },
  { value: "SAO_RAIMUNDO", label: "São Raimundo", geoNome: "SÃO RAIMUNDO" },
  { value: "TANCREDO_NEVES", label: "Tancredo Neves", geoNome: "TANCREDO NEVES" },
  { value: "TARUMA", label: "Tarumã", geoNome: "TARUMÃ" },
  { value: "VILA_BURITI", label: "Vila Buriti", geoNome: "VILA BURITI" },
  { value: "VILA_DA_PRATA", label: "Vila da Prata", geoNome: "VILA DA PRATA" },
  {
    value: "ZUMBI_DOS_PALMARES",
    label: "Zumbi dos Palmares",
    geoNome: "ZUMBI DOS PALMARES",
  },
] as const;

export const BAIRRO_OPTIONS = [
  ...BAIRROS_MANAUS,
  NAO_SABE,
  { value: "OUTRO", label: "Outro" },
] as const;

/** NAO_SABE / OUTRO não geocodificam. */
export const BAIRROS_SEM_MAPA = new Set(["NAO_SABE", "OUTRO"]);

export const ESCOLARIDADE_OPTIONS = [
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
  NAO_SABE,
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
  NAO_SABE,
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
  NAO_SABE,
] as const;

export const ACOMPANHAMENTO_FAMILIAR_OPTIONS = [
  { value: "SEMPRE", label: "Sempre" },
  { value: "AS_VEZES", label: "Às vezes" },
  { value: "RARAMENTE", label: "Raramente" },
  { value: "NUNCA", label: "Nunca" },
  NAO_SABE,
] as const;

export const APOIO_PRIORITARIO_OPTIONS = [
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
] as const;

/** NENHUMA é exclusivo (não combina com outras barreiras). */
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

export const MEIO_TRANSPORTE_OPTIONS = [
  { value: "A_PE", label: "A pé" },
  { value: "BICICLETA", label: "Bicicleta" },
  { value: "MOTO", label: "Moto" },
  { value: "ONIBUS", label: "Ônibus" },
  { value: "VAN_ESCOLAR", label: "Van escolar" },
  { value: "CARRO", label: "Carro" },
  { value: "BARCO", label: "Barco / fluvial" },
  { value: "OUTRO", label: "Outro" },
  NAO_SABE,
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
  NAO_SABE,
] as const;

export const TIPO_ACESSO_INTERNET_OPTIONS = [
  { value: "WIFI_RESIDENCIAL", label: "Wi-Fi residencial" },
  { value: "DADOS_MOVEIS", label: "Dados móveis" },
  { value: "INTERNET_COMPARTILHADA", label: "Internet compartilhada" },
  { value: "OUTRO", label: "Outro" },
  NAO_SABE,
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

export const NECESSIDADE_OUTRA = "OUTRA" as const;

export const NECESSIDADE_EDUCACIONAL_OPTIONS = [
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
  { value: NECESSIDADE_OUTRA, label: "Outra (especificar)" },
] as const;

export const EQUIPAMENTO_NENHUM = "NENHUM" as const;
export const EQUIPAMENTO_NAO_SABE = NAO_SABE.value;
/** NENHUM / NAO_SABE são exclusivos (não combinam com dispositivos). */
export const EQUIPAMENTO_EXCLUSIVOS = [
  EQUIPAMENTO_NENHUM,
  EQUIPAMENTO_NAO_SABE,
] as const;
export const APOIO_NENHUM = "NENHUM" as const;
/** @deprecated Sem limite fixo — múltipla escolha livre no catálogo. */
export const MAX_NECESSIDADES_EDUCACIONAIS =
  NECESSIDADE_EDUCACIONAL_OPTIONS.length;
export const MAX_APOIOS_PRIORITARIOS = 2;

export type TipoLocalidadeValue =
  (typeof TIPO_LOCALIDADE_OPTIONS)[number]["value"];
export type BairroValue = (typeof BAIRRO_OPTIONS)[number]["value"];
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
export type NecessidadeEducacionalValue =
  (typeof NECESSIDADE_EDUCACIONAL_OPTIONS)[number]["value"];

/** Exclusivos (ex. NENHUM) limpam as demais e vice-versa; max limita não-exclusivos. */
export function toggleExclusiveCodes(
  selected: readonly string[],
  code: string,
  exclusiveCodes: readonly string[],
  maxNonExclusive?: number,
): string[] {
  const exclusives = new Set(exclusiveCodes);
  if (exclusives.has(code)) {
    return selected.includes(code) ? [] : [code];
  }
  const withoutExclusive = selected.filter((c) => !exclusives.has(c));
  if (withoutExclusive.includes(code)) {
    return withoutExclusive.filter((c) => c !== code);
  }
  if (
    maxNonExclusive != null &&
    withoutExclusive.length >= maxNonExclusive
  ) {
    return [...withoutExclusive];
  }
  return [...withoutExclusive, code];
}

export function toggleExclusiveCode(
  selected: readonly string[],
  code: string,
  exclusiveCode: string,
  maxNonExclusive?: number,
): string[] {
  return toggleExclusiveCodes(
    selected,
    code,
    [exclusiveCode],
    maxNonExclusive,
  );
}

export function toggleEquipamentoEstudo(
  selected: readonly string[],
  code: string,
): string[] {
  return toggleExclusiveCodes(selected, code, EQUIPAMENTO_EXCLUSIVOS);
}

export function toggleMaxCodes(
  selected: readonly string[],
  code: string,
  max: number,
): string[] {
  if (selected.includes(code)) {
    return selected.filter((c) => c !== code);
  }
  if (selected.length >= max) return [...selected];
  return [...selected, code];
}

export function toggleBarreira(
  selected: readonly string[],
  code: string,
): string[] {
  return toggleExclusiveCode(selected, code, BARREIRA_NENHUMA);
}

export function splitCodes(raw: string | null | undefined): string[] {
  if (raw == null) return [];
  const trimmed = String(raw).trim();
  if (!trimmed) return [];
  return trimmed
    .split(/[,;|]/)
    .map((c) => c.trim())
    .filter(Boolean);
}

export function joinCodes(codes: readonly string[]): string | null {
  const unique = [...new Set(codes.map((c) => c.trim()).filter(Boolean))];
  return unique.length ? unique.join(",") : null;
}

/** Códigos CSV + texto livre de OUTRA na mesma coluna (`cod1,cod2###texto`). */
export const NEE_OUTRA_SEP = "###" as const;

export function encodeDescricaoNecessidade(
  codes: readonly string[],
  outraTexto?: string | null,
): string | null {
  const base = joinCodes(codes);
  if (!base) return null;
  const t = outraTexto?.trim();
  if (codes.includes(NECESSIDADE_OUTRA) && t) {
    return `${base}${NEE_OUTRA_SEP}${t}`;
  }
  return base;
}

export function parseDescricaoNecessidade(
  raw: string | null | undefined,
): { codes: string[]; outraTexto: string } {
  if (raw == null || !String(raw).trim()) {
    return { codes: [], outraTexto: "" };
  }
  const text = String(raw);
  const idx = text.indexOf(NEE_OUTRA_SEP);
  if (idx === -1) {
    return { codes: splitCodes(text), outraTexto: "" };
  }
  return {
    codes: splitCodes(text.slice(0, idx)),
    outraTexto: text.slice(idx + NEE_OUTRA_SEP.length).trim(),
  };
}

export function labelsOf(
  options: ReadonlyArray<{ value: string; label: string }>,
  values: readonly string[],
): string {
  return values
    .map((v) => options.find((o) => o.value === v)?.label ?? v)
    .filter(Boolean)
    .join(", ");
}

export function labelOf(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | null | undefined,
): string {
  if (!value) return "";
  return options.find((o) => o.value === value)?.label ?? value;
}
