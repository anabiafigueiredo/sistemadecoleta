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

export function percent(part: number, whole: number, digits = 1): number {
  if (whole === 0) return 0;
  return Number(((part / whole) * 100).toFixed(digits));
}

export function round2(value: number): number {
  return Number(value.toFixed(2));
}
