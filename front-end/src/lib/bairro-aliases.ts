/**
 * Normaliza nomes de bairro para matching entre API e GeoJSON.
 * Aliases cobrem variações curtas vs. oficiais (ex.: São José → São José Operário).
 * Códigos canônicos (PETROPOLIS) resolvem via BAIRROS_MANAUS.geoNome.
 */

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

/** Resolve o nome da API para a chave canônica usada no mapa. */
export function canonicalBairroKey(apiName: string): string {
  const n = normalizeBairroName(apiName);
  return ALIASES[n] ?? n;
}

/**
 * Encontra a feature GeoJSON cujo nome casa com o bairro da API.
 * Aceita código canônico (PETROPOLIS), rótulo ou texto legado.
 * NAO_SABE / OUTRO → null (sem geocoding).
 */
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
