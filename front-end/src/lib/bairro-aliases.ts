/**
 * Normaliza nomes de bairro para matching entre API e GeoJSON.
 * Aliases cobrem variações curtas vs. oficiais (ex.: São José → São José Operário).
 */

const ALIASES: Record<string, string> = {
  "sao jose": "sao jose operario",
  "sao jose o": "sao jose operario",
  "jorge teixeira": "jorge teixeira",
  "cidade nova": "cidade nova",
  "novo aleixo": "novo aleixo",
  "petropolis": "petropolis",
  "coroado": "coroado",
  "alvorada": "alvorada",
};

export function normalizeBairroName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Resolve o nome da API para a chave canônica usada no mapa. */
export function canonicalBairroKey(apiName: string): string {
  const n = normalizeBairroName(apiName);
  return ALIASES[n] ?? n;
}

/**
 * Encontra a feature GeoJSON cujo nome casa com o bairro da API.
 * Usa igualdade canônica e, se necessário, contains (ex.: "São José" ⊂ "São José Operário").
 */
export function matchGeoBairroName(
  apiName: string,
  geoNames: string[],
): string | null {
  const key = canonicalBairroKey(apiName);
  const normalizedGeo = geoNames.map((g) => ({
    raw: g,
    key: normalizeBairroName(g),
  }));

  const exact = normalizedGeo.find((g) => g.key === key);
  if (exact) return exact.raw;

  const contains = normalizedGeo.find(
    (g) => g.key.includes(key) || key.includes(g.key),
  );
  return contains?.raw ?? null;
}
