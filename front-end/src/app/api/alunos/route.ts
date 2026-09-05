import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/api-response";
import { toAlunoListItem } from "@/lib/mappers/aluno";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const q = params.get("q")?.trim() ?? "";
    const momento = params.get("momento")?.trim().toUpperCase() || null;

    const alunos = await prisma.aluno.findMany({
      where: {
        AND: [
          momento
            ? {
                pesquisasSocioeconomicas: {
                  some: { momentoColeta: { codigo: momento } },
                },
              }
            : {},
          q
            ? {
                OR: [
                  { nome: { contains: q, mode: "insensitive" } },
                  { codigoAluno: { contains: q, mode: "insensitive" } },
                  { cpf: { contains: q } },
                  {
                    familia: {
                      OR: [
                        { bairro: { contains: q, mode: "insensitive" } },
                        { comunidade: { contains: q, mode: "insensitive" } },
                        {
                          codigoFamilia: { contains: q, mode: "insensitive" },
                        },
                      ],
                    },
                  },
                  {
                    responsavel: {
                      nome: { contains: q, mode: "insensitive" },
                    },
                  },
                ],
              }
            : {},
        ],
      },
      include: {
        familia: true,
        responsavel: true,
        pesquisasSocioeconomicas: {
          where: momento
            ? { momentoColeta: { codigo: momento } }
            : undefined,
          include: { momentoColeta: true },
          orderBy: { sincronizadoEm: "desc" },
          take: 1,
        },
      },
      orderBy: { codigoAluno: "asc" },
    });

    return ok(alunos.map(toAlunoListItem));
  } catch (error) {
    console.error("[GET /api/alunos]", error);
    return fail("INTERNAL_ERROR", "Falha ao listar alunos", 500);
  }
}
