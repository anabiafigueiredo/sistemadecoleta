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

/** Faixas fixas de renda per capita (unidade família) — B-10. */
export const RENDA_PER_CAPITA_FAIXAS = [
  { id: "ate_500", label: "Até R$ 500", maxExclusive: 500.01 },
  { id: "500_1000", label: "R$ 500–1.000", maxExclusive: 1000.01 },
  { id: "1000_2000", label: "R$ 1.000–2.000", maxExclusive: 2000.01 },
  { id: "2000_3000", label: "R$ 2.000–3.000", maxExclusive: 3000.01 },
  { id: "acima_3000", label: "Acima de R$ 3.000", maxExclusive: Infinity },
] as const;

export function faixaRendaPerCapita(value: number): string {
  for (const faixa of RENDA_PER_CAPITA_FAIXAS) {
    if (value < faixa.maxExclusive) return faixa.label;
  }
  return RENDA_PER_CAPITA_FAIXAS[RENDA_PER_CAPITA_FAIXAS.length - 1]!.label;
}

/** Conta famílias por faixa, na ordem canônica (inclui faixas zeradas). */
export function countByRendaPerCapitaFaixa(
  values: number[],
): Array<{ faixa: string; total: number }> {
  const counts = new Map<string, number>(
    RENDA_PER_CAPITA_FAIXAS.map((f) => [f.label, 0]),
  );
  for (const v of values) {
    const label = faixaRendaPerCapita(v);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return RENDA_PER_CAPITA_FAIXAS.map((f) => ({
    faixa: f.label,
    total: counts.get(f.label) ?? 0,
  }));
}
