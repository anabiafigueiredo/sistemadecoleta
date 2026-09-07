import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

function nextFromCodes(codes: string[], prefix: "FAM" | "ALU"): string {
  const re = new RegExp(`^${prefix}-(\\d+)$`, "i");
  let max = 0;
  for (const raw of codes) {
    const m = re.exec(raw.trim());
    if (!m) continue;
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > max) max = n;
  }
  const next = max + 1;
  const width = prefix === "FAM" ? 3 : 4;
  return `${prefix}-${String(next).padStart(width, "0")}`;
}

export async function GET() {
  try {
    const [familias, alunos] = await Promise.all([
      prisma.familia.findMany({ select: { codigoFamilia: true } }),
      prisma.aluno.findMany({ select: { codigoAluno: true } }),
    ]);

    const codigoFamilia = nextFromCodes(
      familias.map((f) => f.codigoFamilia),
      "FAM",
    );
    const codigoAluno = nextFromCodes(
      alunos.map((a) => a.codigoAluno),
      "ALU",
    );

    return ok({ codigoFamilia, codigoAluno });
  } catch (error) {
    console.error("[GET /api/codigos/proximo]", error);
    return fail("INTERNAL_ERROR", "Falha ao gerar códigos", 500);
  }
}
