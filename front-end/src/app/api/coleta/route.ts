import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { created, fail } from "@/lib/api-response";
import { coletaSchema, type ColetaInput } from "@/lib/validations/coleta";
import { QUESTIONARIO_V2 } from "@/lib/questionario";

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

    const result = await persistColeta(prisma, parsed.data);
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

    if (error instanceof Error && error.message.startsWith("BARREIRAS:")) {
      return fail("VALIDATION_ERROR", error.message.replace(/^BARREIRAS:\s*/, ""), 400);
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

async function replaceBarreiras(
  tx: Tx,
  pesquisaId: string,
  codigos: string[],
) {
  await tx.pesquisaBarreira.deleteMany({ where: { pesquisaId } });

  if (codigos.length === 0) return;

  const unique = [...new Set(codigos)];
  const catalog = await tx.barreira.findMany({
    where: { codigo: { in: unique } },
  });

  if (catalog.length !== unique.length) {
    const found = new Set(catalog.map((b) => b.codigo));
    const missing = unique.filter((c) => !found.has(c));
    throw new Error(`BARREIRAS: Códigos inválidos: ${missing.join(", ")}`);
  }

  await tx.pesquisaBarreira.createMany({
    data: catalog.map((b) => ({
      pesquisaId,
      barreiraId: b.id,
    })),
    skipDuplicates: true,
  });
}

async function persistColeta(tx: Tx, input: ColetaInput) {
  const { familia, aluno, responsavel, pesquisa, momento, barreiras } = input;

  const momentoDb = await resolveMomentoColeta(tx, momento);

  const familiaData = {
    endereco: familia.endereco,
    bairro: familia.bairro,
    comunidade: familia.comunidade,
    tipoLocalidade: familia.tipoLocalidade ?? null,
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
    escolaridade: responsavel.escolaridade ?? null,
    situacaoOcupacional: responsavel.situacaoOcupacional ?? null,
  };

  const responsavelDb = await tx.responsavel.upsert({
    where: { alunoId: alunoDb.id },
    create: { alunoId: alunoDb.id, ...responsavelData },
    update: responsavelData,
  });

  const pesquisaScalars = {
    origem: "MOBILE" as const,
    versaoQuestionario: QUESTIONARIO_V2,
    meioTransporteEscola: pesquisa.meioTransporteEscola,
    tempoDeslocamentoMin: pesquisa.tempoDeslocamentoMin,
    frequenciaEscolarPct:
      pesquisa.frequenciaEscolarPct == null
        ? null
        : new Prisma.Decimal(pesquisa.frequenciaEscolarPct.toFixed(2)),
    anoSerie: pesquisa.anoSerie,
    turno: pesquisa.turno,
    necessidadeEducacionalEspecial: pesquisa.necessidadeEducacionalEspecial,
    descricaoNecessidade: pesquisa.descricaoNecessidade ?? null,
    observacao: pesquisa.observacao ?? null,
    equipamentoEstudo: pesquisa.equipamentoEstudo ?? null,
    disponibilidadeEquipamento:
      pesquisa.equipamentoEstudo === "NENHUM"
        ? ("N_A" as const)
        : (pesquisa.disponibilidadeEquipamento ?? null),
    localEstudo: pesquisa.localEstudo ?? null,
    acompanhamentoFamiliar: pesquisa.acompanhamentoFamiliar ?? null,
    apoioPrioritario: pesquisa.apoioPrioritario ?? null,
    sincronizadoEm: new Date(),
  };

  const existingPesquisa = await tx.pesquisaSocioeconomica.findFirst({
    where: {
      alunoId: alunoDb.id,
      momentoColetaId: momentoDb.id,
    },
    orderBy: { sincronizadoEm: "desc" },
  });

  const includePesquisa = {
    momentoColeta: true,
    barreiras: { include: { barreira: true } },
  } as const;

  const pesquisaDb = existingPesquisa
    ? await tx.pesquisaSocioeconomica.update({
        where: { id: existingPesquisa.id },
        data: pesquisaScalars,
        include: includePesquisa,
      })
    : await tx.pesquisaSocioeconomica.create({
        data: {
          alunoId: alunoDb.id,
          momentoColetaId: momentoDb.id,
          ...pesquisaScalars,
        },
        include: includePesquisa,
      });

  await replaceBarreiras(tx, pesquisaDb.id, barreiras);

  const pesquisaComBarreiras = await tx.pesquisaSocioeconomica.findUniqueOrThrow(
    {
      where: { id: pesquisaDb.id },
      include: includePesquisa,
    },
  );

  return {
    momento: momentoDb,
    familia: familiaDb,
    aluno: alunoDb,
    responsavel: responsavelDb,
    pesquisa: pesquisaComBarreiras,
  };
}
