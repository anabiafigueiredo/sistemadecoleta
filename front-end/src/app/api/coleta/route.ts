import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { created, fail } from "@/lib/api-response";
import { coletaSchema, type ColetaInput } from "@/lib/validations/coleta";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = coletaSchema.safeParse(body);

    if (!parsed.success) {
      return fail(
        "VALIDATION_ERROR",
        "Dados da coleta inválidos",
        400,
        parsed.error.flatten(),
      );
    }

    const result = await prisma.$transaction((tx) =>
      persistColeta(tx, parsed.data),
    );
    return created(result);
  } catch (error) {
    console.error("[POST /api/coleta]", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return fail(
        "CONFLICT",
        "Conflito de unicidade (código ou CPF já existente)",
        409,
      );
    }

    return fail("INTERNAL_ERROR", "Falha ao salvar coleta", 500);
  }
}

type Tx = Prisma.TransactionClient;

async function resolveMomentoColeta(
  tx: Tx,
  momento: ColetaInput["momento"],
) {
  const codigo = momento.codigo.toUpperCase();
  const existing = await tx.momentoColeta.findUnique({ where: { codigo } });

  if (existing) {
    if (momento.dataReferencia || momento.titulo) {
      return tx.momentoColeta.update({
        where: { codigo },
        data: {
          ...(momento.titulo ? { titulo: momento.titulo } : {}),
          ...(momento.dataReferencia
            ? { dataReferencia: momento.dataReferencia }
            : {}),
        },
      });
    }
    return existing;
  }

  return tx.momentoColeta.create({
    data: {
      codigo,
      titulo: momento.titulo ?? `Coleta ${codigo} — campo (app mobile)`,
      descricao: `Ciclo ${codigo} de monitoramento via aplicativo mobile.`,
      dataReferencia: momento.dataReferencia ?? new Date(),
      origemPadrao: codigo === "T1" ? "PLANILHA" : "MOBILE",
    },
  });
}

async function persistColeta(tx: Tx, input: ColetaInput) {
  const { familia, aluno, responsavel, pesquisa, momento } = input;

  const momentoDb = await resolveMomentoColeta(tx, momento);

  const familiaData = {
    endereco: familia.endereco,
    bairro: familia.bairro,
    comunidade: familia.comunidade,
    qtdMoradores: familia.qtdMoradores,
    rendaFamiliarMensal: new Prisma.Decimal(
      familia.rendaFamiliarMensal.toFixed(2),
    ),
    recebeBeneficioSocial: familia.recebeBeneficioSocial,
    beneficioSocial: familia.beneficioSocial ?? null,
    possuiInternetCasa: familia.possuiInternetCasa,
    tipoAcessoInternet: familia.tipoAcessoInternet ?? null,
  };

  const familiaDb = await tx.familia.upsert({
    where: { codigoFamilia: familia.codigoFamilia },
    create: { codigoFamilia: familia.codigoFamilia, ...familiaData },
    update: familiaData,
  });

  const alunoData = {
    familiaId: familiaDb.id,
    nome: aluno.nome,
    dataNascimento: aluno.dataNascimento ?? null,
    sexo: aluno.sexo ?? null,
    cpf: aluno.cpf ?? null,
  };

  const alunoDb = await tx.aluno.upsert({
    where: { codigoAluno: aluno.codigoAluno },
    create: { codigoAluno: aluno.codigoAluno, ...alunoData },
    update: alunoData,
  });

  const responsavelData = {
    nome: responsavel.nome,
    parentesco: responsavel.parentesco,
    cpf: responsavel.cpf ?? null,
    telefone: responsavel.telefone ?? null,
    email: responsavel.email ?? null,
  };

  const responsavelDb = await tx.responsavel.upsert({
    where: { alunoId: alunoDb.id },
    create: { alunoId: alunoDb.id, ...responsavelData },
    update: responsavelData,
  });

  const pesquisaDb = await tx.pesquisaSocioeconomica.create({
    data: {
      alunoId: alunoDb.id,
      momentoColetaId: momentoDb.id,
      meioTransporteEscola: pesquisa.meioTransporteEscola,
      tempoDeslocamentoMin: pesquisa.tempoDeslocamentoMin,
      frequenciaEscolarPct: new Prisma.Decimal(
        pesquisa.frequenciaEscolarPct.toFixed(2),
      ),
      anoSerie: pesquisa.anoSerie,
      turno: pesquisa.turno,
      necessidadeEducacionalEspecial: pesquisa.necessidadeEducacionalEspecial,
      descricaoNecessidade: pesquisa.descricaoNecessidade ?? null,
      observacao: pesquisa.observacao ?? null,
    },
    include: { momentoColeta: true },
  });

  return {
    momento: momentoDb,
    familia: familiaDb,
    aluno: alunoDb,
    responsavel: responsavelDb,
    pesquisa: pesquisaDb,
  };
}
