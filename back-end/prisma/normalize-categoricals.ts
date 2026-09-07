/**
 * Uso:
 *   npx tsx prisma/normalize-categoricals.ts
 *   npx tsx prisma/normalize-categoricals.ts --dry-run
 */
import { PrismaClient } from "../generated/prisma";
import {
  ANO_SERIE_OPTIONS,
  BENEFICIO_SOCIAL_OPTIONS,
  MEIO_TRANSPORTE_OPTIONS,
  PARENTESCO_OPTIONS,
  TIPO_ACESSO_INTERNET_OPTIONS,
  TURNO_OPTIONS,
  matchOption,
  type CatalogOption,
} from "./etl/canonical-codes";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

async function normalizeField(
  label: string,
  options: CatalogOption[],
  rows: Array<{ id: string; value: string | null }>,
  update: (id: string, code: string) => Promise<unknown>,
) {
  let changed = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.value?.trim()) {
      skipped += 1;
      continue;
    }
    const matched = matchOption(options, row.value);
    if (!matched || matched.value === row.value) {
      skipped += 1;
      continue;
    }
    changed += 1;
    if (!dryRun) {
      await update(row.id, matched.value);
    } else if (changed <= 8) {
      console.log(`  [${label}] "${row.value}" → ${matched.value}`);
    }
  }

  console.log(
    `${label}: ${changed} a normalizar, ${skipped} ok/ignorados${dryRun ? " (dry-run)" : ""}`,
  );
}

async function main() {
  console.log(
    dryRun
      ? "Dry-run — nenhuma escrita no banco."
      : "Normalizando categorias no banco…",
  );

  const familias = await prisma.familia.findMany({
    select: {
      id: true,
      beneficioSocial: true,
      tipoAcessoInternet: true,
    },
  });

  await normalizeField(
    "familia.beneficioSocial",
    BENEFICIO_SOCIAL_OPTIONS,
    familias.map((f) => ({ id: f.id, value: f.beneficioSocial })),
    (id, code) =>
      prisma.familia.update({
        where: { id },
        data: { beneficioSocial: code },
      }),
  );

  await normalizeField(
    "familia.tipoAcessoInternet",
    TIPO_ACESSO_INTERNET_OPTIONS,
    familias.map((f) => ({ id: f.id, value: f.tipoAcessoInternet })),
    (id, code) =>
      prisma.familia.update({
        where: { id },
        data: { tipoAcessoInternet: code },
      }),
  );

  const responsaveis = await prisma.responsavel.findMany({
    select: { id: true, parentesco: true },
  });

  await normalizeField(
    "responsavel.parentesco",
    PARENTESCO_OPTIONS,
    responsaveis.map((r) => ({ id: r.id, value: r.parentesco })),
    (id, code) =>
      prisma.responsavel.update({
        where: { id },
        data: { parentesco: code },
      }),
  );

  const pesquisas = await prisma.pesquisaSocioeconomica.findMany({
    select: {
      id: true,
      meioTransporteEscola: true,
      turno: true,
      anoSerie: true,
    },
  });

  await normalizeField(
    "pesquisa.meioTransporteEscola",
    MEIO_TRANSPORTE_OPTIONS,
    pesquisas.map((p) => ({ id: p.id, value: p.meioTransporteEscola })),
    (id, code) =>
      prisma.pesquisaSocioeconomica.update({
        where: { id },
        data: { meioTransporteEscola: code },
      }),
  );

  await normalizeField(
    "pesquisa.turno",
    TURNO_OPTIONS,
    pesquisas.map((p) => ({ id: p.id, value: p.turno })),
    (id, code) =>
      prisma.pesquisaSocioeconomica.update({
        where: { id },
        data: { turno: code },
      }),
  );

  await normalizeField(
    "pesquisa.anoSerie",
    ANO_SERIE_OPTIONS,
    pesquisas.map((p) => ({ id: p.id, value: p.anoSerie })),
    (id, code) =>
      prisma.pesquisaSocioeconomica.update({
        where: { id },
        data: { anoSerie: code },
      }),
  );

  console.log("Concluído.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
