/** Agrupa itens e conta ocorrências por chave. */
export function groupCount<T>(
  items: T[],
  keyFn: (item: T) => string,
): Array<{ key: string; total: number }> {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([key, total]) => ({ key, total }));
}

/** Agrupa itens e calcula média de um valor numérico por chave. */
export function groupAverage<T>(
  items: T[],
  keyFn: (item: T) => string,
  valueFn: (item: T) => number,
): Array<{ key: string; average: number; count: number }> {
  const map = new Map<string, { soma: number; count: number }>();

  for (const item of items) {
    const key = keyFn(item);
    const current = map.get(key) ?? { soma: 0, count: 0 };
    current.soma += valueFn(item);
    current.count += 1;
    map.set(key, current);
  }

  return Array.from(map.entries()).map(([key, { soma, count }]) => ({
    key,
    average: count > 0 ? soma / count : 0,
    count,
  }));
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, n) => acc + n, 0) / values.length;
}

/** Mediana de valores numéricos (lista vazia → 0). */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

export function percent(part: number, whole: number, digits = 1): number {
  if (whole === 0) return 0;
  return Number(((part / whole) * 100).toFixed(digits));
}

export function round2(value: number): number {
  return Number(value.toFixed(2));
}

/** Salário mínimo nacional 2026 (Decreto nº 12.797/2025). */
export const SALARIO_MINIMO = 1621;

/**
 * Faixas de renda familiar mensal em SM (ordem crescente).
 * Cada item: renda ≤ maxSm × SM (exceto a última, aberta).
 */
export const RENDA_FAMILIAR_SM_FAIXAS = [
  { id: "ate_0_5", label: "Até 0,5 SM", maxSm: 0.5 },
  { id: "0_5_1", label: "Mais de 0,5 a 1 SM", maxSm: 1 },
  { id: "1_2", label: "Mais de 1 a 2 SM", maxSm: 2 },
  { id: "2_3", label: "Mais de 2 a 3 SM", maxSm: 3 },
  { id: "3_5", label: "Mais de 3 a 5 SM", maxSm: 5 },
  { id: "5_7", label: "Mais de 5 a 7 SM", maxSm: 7 },
  { id: "acima_7", label: "Mais de 7 SM", maxSm: Infinity },
] as const;

export function faixaRendaFamiliarSm(rendaFamiliarMensal: number): string {
  const emSm = rendaFamiliarMensal / SALARIO_MINIMO;
  for (const faixa of RENDA_FAMILIAR_SM_FAIXAS) {
    if (emSm <= faixa.maxSm) return faixa.label;
  }
  return RENDA_FAMILIAR_SM_FAIXAS[RENDA_FAMILIAR_SM_FAIXAS.length - 1]!.label;
}

/** Conta famílias por faixa de SM, na ordem canônica (inclui faixas zeradas). */
export function countByRendaFamiliarSmFaixa(
  rendasFamiliares: number[],
): Array<{ faixa: string; total: number }> {
  const counts = new Map<string, number>(
    RENDA_FAMILIAR_SM_FAIXAS.map((f) => [f.label, 0]),
  );
  for (const v of rendasFamiliares) {
    const label = faixaRendaFamiliarSm(v);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return RENDA_FAMILIAR_SM_FAIXAS.map((f) => ({
    faixa: f.label,
    total: counts.get(f.label) ?? 0,
  }));
}
