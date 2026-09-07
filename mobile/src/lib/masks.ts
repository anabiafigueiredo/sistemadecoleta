/** Máscaras de digitação (somente visual; payload envia dígitos limpos). */

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function maskCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9)
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Data BR: digita só números → DD/MM/AAAA */
export function maskDateBr(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/**
 * Valida CPF (dígitos verificadores). Vazio = ok (campo opcional).
 * Retorna mensagem de erro ou null se válido.
 */
export function cpfErrorMessage(value: string): string | null {
  const cpf = onlyDigits(value);
  if (!cpf) return null;
  if (cpf.length < 11) return "CPF incompleto";
  if (cpf.length > 11) return "CPF inválido";
  if (/^(\d)\1{10}$/.test(cpf)) return "CPF inválido";

  const calc = (base: string, factor: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i += 1) {
      sum += Number(base[i]) * (factor - i);
    }
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  const d1 = calc(cpf.slice(0, 9), 10);
  const d2 = calc(cpf.slice(0, 10), 11);
  if (d1 !== Number(cpf[9]) || d2 !== Number(cpf[10])) {
    return "CPF inválido";
  }
  return null;
}

/**
 * Moeda BRL por centavos: digita só dígitos.
 * Ex.: 120050 → "1.200,50"
 */
export function maskCurrencyInput(value: string): string {
  const digits = onlyDigits(value).slice(0, 12);
  if (!digits) return "";
  const cents = Number(digits);
  if (!Number.isFinite(cents)) return "";
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseCurrencyToNumber(value: string): number {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

export function formatCurrencyDisplay(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** FAM-001 — só dígitos; prefixo aplicado automaticamente. */
export function maskCodigoFamilia(value: string): string {
  const d = onlyDigits(value).slice(0, 6);
  return d ? `FAM-${d}` : "";
}

/** ALU-1001 — só dígitos; prefixo aplicado automaticamente. */
export function maskCodigoAluno(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  return d ? `ALU-${d}` : "";
}

export const CODIGO_FAMILIA_REGEX = /^FAM-\d{3,6}$/;
export const CODIGO_ALUNO_REGEX = /^ALU-\d{3,8}$/;

export function codigoFamiliaErrorMessage(value: string): string | null {
  const v = value.trim().toUpperCase();
  if (!v) return "Código da família é obrigatório";
  if (!CODIGO_FAMILIA_REGEX.test(v)) {
    return "Use o formato FAM-001 (mín. 3 dígitos)";
  }
  return null;
}

export function codigoAlunoErrorMessage(value: string): string | null {
  const v = value.trim().toUpperCase();
  if (!v) return "Código do aluno é obrigatório";
  if (!CODIGO_ALUNO_REGEX.test(v)) {
    return "Use o formato ALU-1001 (mín. 3 dígitos)";
  }
  return null;
}
