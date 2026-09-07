import {
  BAIRROS_MANAUS,
  BAIRROS_SEM_MAPA,
} from "@/lib/opcoes-questionario";

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

export function canonicalBairroKey(apiName: string): string {
  const n = normalizeBairroName(apiName);
  return ALIASES[n] ?? n;
}

/** Match API ↔ GeoJSON; NAO_SABE / OUTRO → null. */
export function matchGeoBairroName(
  apiName: string,
  geoNames: string[],
): string | null {
  const raw = apiName.trim();
  if (!raw) return null;
  if (BAIRROS_SEM_MAPA.has(raw.toUpperCase())) return null;

  const normalizedGeo = geoNames.map((g) => ({
    raw: g,
    key: normalizeBairroName(g),
  }));

  const byCode = BAIRROS_MANAUS.find((b) => b.value === raw.toUpperCase());
  if (byCode) {
    const geoKey = normalizeBairroName(byCode.geoNome);
    const hit = normalizedGeo.find((g) => g.key === geoKey);
    if (hit) return hit.raw;
  }

  const key = canonicalBairroKey(raw);
  const exact = normalizedGeo.find((g) => g.key === key);
  if (exact) return exact.raw;

  const contains = normalizedGeo.find(
    (g) => g.key.includes(key) || key.includes(g.key),
  );
  return contains?.raw ?? null;
}
