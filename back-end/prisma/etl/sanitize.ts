import { Prisma } from "../../generated/prisma";
import {
  ANO_SERIE_OPTIONS,
  BAIRRO_OPTIONS,
  BENEFICIO_SOCIAL_OPTIONS,
  MEIO_TRANSPORTE_OPTIONS,
  PARENTESCO_OPTIONS,
  TIPO_ACESSO_INTERNET_OPTIONS,
  TURNO_OPTIONS,
  toCanonicalCode,
} from "./canonical-codes";

export type RawRow = Record<string, string>;

export type CleanRow = {
  codigoFamilia: string;
  codigoAluno: string;
  nomeAluno: string;
  dataNascimento: Date | null;
  sexo: string | null;
  cpfAluno: string | null;
  nomeResponsavel: string;
  parentesco: string;
  cpfResponsavel: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string;
  bairro: string;
  comunidade: string;
  qtdMoradores: number;
  rendaFamiliarMensal: Prisma.Decimal;
  recebeBeneficioSocial: boolean;
  beneficioSocial: string | null;
  possuiInternetCasa: boolean;
  tipoAcessoInternet: string | null;
  meioTransporteEscola: string;
  tempoDeslocamentoMin: number;
  frequenciaEscolarPct: Prisma.Decimal;
  anoSerie: string;
  turno: string;
  necessidadeEducacionalEspecial: boolean;
  descricaoNecessidade: string | null;
  observacao: string | null;
};

export function cleanText(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

export function titleCase(value: string): string {
  const particles = new Set(["de", "da", "do", "das", "dos", "e"]);
  return cleanText(value)
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      if (index > 0 && particles.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function onlyDigits(value: string | undefined): string | null {
  const digits = cleanText(value).replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export function parseBoolean(value: string | undefined): boolean {
  const normalized = cleanText(value).toLowerCase();
  return normalized === "sim" || normalized === "true" || normalized === "1";
}

export function normalizeSexo(value: string | undefined): string | null {
  const s = cleanText(value).toUpperCase().charAt(0);
  return s === "M" || s === "F" ? s : null;
}

export function parseCurrencyBRL(value: string | undefined): Prisma.Decimal {
  const cleaned = cleanText(value)
    .replace(/R\$\s?/gi, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const num = Number.parseFloat(cleaned);
  return new Prisma.Decimal(Number.isFinite(num) ? num.toFixed(2) : "0.00");
}

export function parseFrequencyPct(value: string | undefined): Prisma.Decimal {
  const cleaned = cleanText(value).replace("%", "").replace(",", ".");
  let num = Number.parseFloat(cleaned);
  if (!Number.isFinite(num)) num = 0;
  if (num > 100) num = 100;
  if (num < 0) num = 0;
  return new Prisma.Decimal(num.toFixed(2));
}

export function parseDisplacementMin(value: string | undefined): number {
  const num = Number.parseInt(cleanText(value), 10);
  if (!Number.isFinite(num)) return 0;
  return Math.abs(num);
}

export function parseQtdMoradores(value: string | undefined): number {
  const num = Number.parseInt(cleanText(value), 10);
  if (!Number.isFinite(num) || num < 1) return 1;
  return num;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function parseEmail(value: string | undefined): string | null {
  const email = cleanText(value).toLowerCase();
  if (!email || !isValidEmail(email)) return null;
  return email;
}

/**
 * Aceita M/D/YYYY (padrão da planilha) ou DD/MM/YYYY.
 * Se o primeiro componente > 12, interpreta como dia (DD/MM/YYYY).
 * Caso contrário, assume M/D/YYYY.
 */
export function parseDateFlexible(value: string | undefined): Date | null {
  const raw = cleanText(value);
  if (!raw) return null;

  const parts = raw.split(/[/-]/).map((p) => Number.parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;

  const [a, b, year] = parts;
  let month: number;
  let day: number;

  if (a > 12) {
    day = a;
    month = b;
  } else if (b > 12) {
    month = a;
    day = b;
  } else {
    month = a;
    day = b;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function nullableText(value: string | undefined): string | null {
  const text = cleanText(value);
  if (!text || text.toLowerCase() === "nenhum") return null;
  return text;
}

export function sanitizeRow(raw: RawRow): CleanRow {
  return {
    codigoFamilia: cleanText(raw.id_familia).toUpperCase(),
    codigoAluno: cleanText(raw.id_aluno).toUpperCase(),
    nomeAluno: titleCase(raw.nome_aluno),
    dataNascimento: parseDateFlexible(raw.data_nascimento),
    sexo: normalizeSexo(raw.sexo),
    cpfAluno: onlyDigits(raw.cpf_aluno),
    nomeResponsavel: titleCase(raw.nome_responsavel),
    parentesco:
      toCanonicalCode(PARENTESCO_OPTIONS, raw.parentesco_responsavel) ??
      titleCase(raw.parentesco_responsavel),
    cpfResponsavel: onlyDigits(raw.cpf_responsavel),
    telefone: onlyDigits(raw.telefone_responsavel),
    email: parseEmail(raw.email_responsavel),
    endereco: cleanText(raw.endereco),
    bairro:
      toCanonicalCode(BAIRRO_OPTIONS, raw.bairro) ?? titleCase(raw.bairro),
    comunidade: titleCase(raw.comunidade),
    qtdMoradores: parseQtdMoradores(raw.qtd_moradores),
    rendaFamiliarMensal: parseCurrencyBRL(raw.renda_familiar_mensal),
    recebeBeneficioSocial: parseBoolean(raw.recebe_beneficio_social),
    beneficioSocial: toCanonicalCode(
      BENEFICIO_SOCIAL_OPTIONS,
      nullableText(raw.beneficio_social),
    ),
    possuiInternetCasa: parseBoolean(raw.possui_internet_casa),
    tipoAcessoInternet: toCanonicalCode(
      TIPO_ACESSO_INTERNET_OPTIONS,
      nullableText(raw.tipo_acesso_internet),
    ),
    meioTransporteEscola:
      toCanonicalCode(MEIO_TRANSPORTE_OPTIONS, raw.meio_transporte_escola) ??
      cleanText(raw.meio_transporte_escola),
    tempoDeslocamentoMin: parseDisplacementMin(raw.tempo_deslocamento_min),
    frequenciaEscolarPct: parseFrequencyPct(raw.frequencia_escolar_pct),
    anoSerie:
      toCanonicalCode(ANO_SERIE_OPTIONS, raw.ano_serie) ??
      cleanText(raw.ano_serie),
    turno:
      toCanonicalCode(TURNO_OPTIONS, raw.turno) ?? cleanText(raw.turno),
    necessidadeEducacionalEspecial: parseBoolean(
      raw.necessidade_educacional_especial,
    ),
    descricaoNecessidade: nullableText(raw.descricao_necessidade),
    observacao: nullableText(raw.observacao),
  };
}
