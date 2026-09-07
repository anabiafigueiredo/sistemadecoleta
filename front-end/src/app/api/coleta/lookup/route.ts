import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

function familiaDto(familia: {
  codigoFamilia: string;
  endereco: string;
  bairro: string;
  comunidade: string;
  tipoLocalidade: string | null;
  qtdMoradores: number;
  rendaFamiliarMensal: { toString(): string } | number;
  recebeBeneficioSocial: boolean;
  beneficioSocial: string | null;
  possuiInternetCasa: boolean;
  tipoAcessoInternet: string | null;
  _count?: { alunos: number };
}) {
  return {
    codigoFamilia: familia.codigoFamilia,
    endereco: familia.endereco,
    bairro: familia.bairro,
    comunidade: familia.comunidade,
    tipoLocalidade: familia.tipoLocalidade,
    qtdMoradores: familia.qtdMoradores,
    rendaFamiliarMensal: Number(familia.rendaFamiliarMensal),
    recebeBeneficioSocial: familia.recebeBeneficioSocial,
    beneficioSocial: familia.beneficioSocial,
    possuiInternetCasa: familia.possuiInternetCasa,
    tipoAcessoInternet: familia.tipoAcessoInternet,
    qtdAlunos: familia._count?.alunos ?? 0,
  };
}

/**
 * Consulta cadastro por código (existente) para reavaliação / irmão na mesma família.
 * GET /api/coleta/lookup?codigoAluno=ALU-1001&codigoFamilia=FAM-001
 */
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const codigoAluno = params.get("codigoAluno")?.trim().toUpperCase() || null;
    const codigoFamilia =
      params.get("codigoFamilia")?.trim().toUpperCase() || null;

    if (!codigoAluno && !codigoFamilia) {
      return fail(
        "VALIDATION_ERROR",
        "Informe codigoAluno e/ou codigoFamilia",
        400,
      );
    }

    const familiaSelect = {
      codigoFamilia: true,
      endereco: true,
      bairro: true,
      comunidade: true,
      tipoLocalidade: true,
      qtdMoradores: true,
      rendaFamiliarMensal: true,
      recebeBeneficioSocial: true,
      beneficioSocial: true,
      possuiInternetCasa: true,
      tipoAcessoInternet: true,
      _count: { select: { alunos: true } },
    } as const;

    const [aluno, familiaDirect] = await Promise.all([
      codigoAluno
        ? prisma.aluno.findUnique({
            where: { codigoAluno },
            select: {
              codigoAluno: true,
              nome: true,
              dataNascimento: true,
              sexo: true,
              cpf: true,
              familia: { select: familiaSelect },
              responsavel: {
                select: {
                  nome: true,
                  parentesco: true,
                  cpf: true,
                  telefone: true,
                  email: true,
                  escolaridade: true,
                  situacaoOcupacional: true,
                },
              },
            },
          })
        : Promise.resolve(null),
      codigoFamilia
        ? prisma.familia.findUnique({
            where: { codigoFamilia },
            select: familiaSelect,
          })
        : Promise.resolve(null),
    ]);

    const familia =
      familiaDirect ?? (aluno ? aluno.familia : null);

    return ok({
      aluno: aluno
        ? {
            codigoAluno: aluno.codigoAluno,
            nome: aluno.nome,
            dataNascimento: aluno.dataNascimento
              ? aluno.dataNascimento.toISOString().slice(0, 10)
              : null,
            sexo: aluno.sexo,
            cpf: aluno.cpf,
            codigoFamilia: aluno.familia.codigoFamilia,
            responsavel: aluno.responsavel
              ? {
                  nome: aluno.responsavel.nome,
                  parentesco: aluno.responsavel.parentesco,
                  cpf: aluno.responsavel.cpf,
                  telefone: aluno.responsavel.telefone,
                  email: aluno.responsavel.email,
                  escolaridade: aluno.responsavel.escolaridade,
                  situacaoOcupacional: aluno.responsavel.situacaoOcupacional,
                }
              : null,
          }
        : null,
      familia: familia ? familiaDto(familia) : null,
    });
  } catch (error) {
    console.error("[GET /api/coleta/lookup]", error);
    return fail("INTERNAL_ERROR", "Falha ao consultar códigos", 500);
  }
}
