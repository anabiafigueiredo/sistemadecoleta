import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient, OrigemColeta } from "../generated/prisma";
import { parseTsv } from "./etl/parse-tsv";
import {
  cleanText,
  onlyDigits,
  sanitizeRow,
  type CleanRow,
} from "./etl/sanitize";

const prisma = new PrismaClient();
const DADOS_PATH = path.join(__dirname, "..", "dados_brutos.txt");

const MOMENTOS_SEED = [
  {
    codigo: "T1",
    titulo: "Coleta T1 — carga inicial (planilha)",
    descricao:
      "Primeiro ciclo de monitoramento: importação e sanitização da planilha socioeconômica.",
    dataReferencia: new Date("2026-01-15T12:00:00.000Z"),
    origemPadrao: OrigemColeta.PLANILHA,
  },
  {
    codigo: "T2",
    titulo: "Coleta T2 — campo (app mobile)",
    descricao:
      "Segundo ciclo: sincronização das coletas realizadas no aplicativo mobile.",
    dataReferencia: new Date("2026-06-15T12:00:00.000Z"),
    origemPadrao: OrigemColeta.MOBILE,
  },
  {
    codigo: "T3",
    titulo: "Coleta T3 — reavaliação",
    descricao:
      "Terceiro ciclo: reavaliação periódica das condições educacionais e socioeconômicas.",
    dataReferencia: new Date("2026-11-15T12:00:00.000Z"),
    origemPadrao: OrigemColeta.MOBILE,
  },
] as const;

const BARREIRAS_SEED = [
  { codigo: "TRANSPORTE", nome: "Transporte", ordem: 1 },
  { codigo: "SAUDE", nome: "Questões de saúde", ordem: 2 },
  { codigo: "APRENDIZAGEM", nome: "Dificuldade de aprendizagem", ordem: 3 },
  { codigo: "FINANCEIRA", nome: "Dificuldade financeira", ordem: 4 },
  { codigo: "FALTA_INTERNET", nome: "Falta de internet", ordem: 5 },
  { codigo: "FALTA_EQUIPAMENTO", nome: "Falta de equipamento", ordem: 6 },
  { codigo: "TRABALHAR", nome: "Necessidade de trabalhar", ordem: 7 },
  {
    codigo: "CUIDAR_FAMILIARES",
    nome: "Necessidade de cuidar de familiares",
    ordem: 8,
  },
  {
    codigo: "FALTA_ACOMPANHAMENTO",
    nome: "Falta de acompanhamento nos estudos",
    ordem: 9,
  },
  { codigo: "OUTRA", nome: "Outra", ordem: 10 },
  { codigo: "NENHUMA", nome: "Nenhuma", ordem: 11 },
] as const;

async function ensureMomentosColeta() {
  for (const momento of MOMENTOS_SEED) {
    await prisma.momentoColeta.upsert({
      where: { codigo: momento.codigo },
      create: { ...momento },
      update: {
        titulo: momento.titulo,
        descricao: momento.descricao,
        dataReferencia: momento.dataReferencia,
        origemPadrao: momento.origemPadrao,
      },
    });
  }

  const t1 = await prisma.momentoColeta.findUniqueOrThrow({
    where: { codigo: "T1" },
  });
  return t1;
}

async function ensureBarreiras() {
  for (const barreira of BARREIRAS_SEED) {
    await prisma.barreira.upsert({
      where: { codigo: barreira.codigo },
      create: { ...barreira },
      update: { nome: barreira.nome, ordem: barreira.ordem },
    });
  }
  return prisma.barreira.count();
}

async function upsertRecord(
  row: CleanRow,
  momentoColetaId: string,
): Promise<void> {
  const familiaData = {
    endereco: row.endereco,
    bairro: row.bairro,
    comunidade: row.comunidade,
    qtdMoradores: row.qtdMoradores,
    rendaFamiliarMensal: row.rendaFamiliarMensal,
    recebeBeneficioSocial: row.recebeBeneficioSocial,
    beneficioSocial: row.beneficioSocial,
    possuiInternetCasa: row.possuiInternetCasa,
    tipoAcessoInternet: row.tipoAcessoInternet,
  };

  const familia = await prisma.familia.upsert({
    where: { codigoFamilia: row.codigoFamilia },
    create: { codigoFamilia: row.codigoFamilia, ...familiaData },
    update: familiaData,
  });

  const alunoData = {
    familiaId: familia.id,
    nome: row.nomeAluno,
    dataNascimento: row.dataNascimento,
    sexo: row.sexo,
    cpf: row.cpfAluno,
  };

  const aluno = await prisma.aluno.upsert({
    where: { codigoAluno: row.codigoAluno },
    create: { codigoAluno: row.codigoAluno, ...alunoData },
    update: alunoData,
  });

  const responsavelData = {
    nome: row.nomeResponsavel,
    parentesco: row.parentesco,
    cpf: row.cpfResponsavel,
    telefone: row.telefone,
    email: row.email,
  };

  await prisma.responsavel.upsert({
    where: { alunoId: aluno.id },
    create: { alunoId: aluno.id, ...responsavelData },
    update: responsavelData,
  });

  // Idempotência do seed no ciclo T1: recria a pesquisa da planilha
  await prisma.pesquisaSocioeconomica.deleteMany({
    where: { alunoId: aluno.id, momentoColetaId },
  });

  await prisma.pesquisaSocioeconomica.create({
    data: {
      alunoId: aluno.id,
      momentoColetaId,
      origem: OrigemColeta.PLANILHA,
      versaoQuestionario: 1,
      meioTransporteEscola: row.meioTransporteEscola,
      tempoDeslocamentoMin: row.tempoDeslocamentoMin,
      frequenciaEscolarPct: row.frequenciaEscolarPct,
      anoSerie: row.anoSerie,
      turno: row.turno,
      necessidadeEducacionalEspecial: row.necessidadeEducacionalEspecial,
      descricaoNecessidade: row.descricaoNecessidade,
      observacao: row.observacao,
    },
  });
}

function dedupeRows(
  rawRows: ReturnType<typeof parseTsv>,
): { cleanRows: CleanRow[]; skippedDuplicates: number } {
  const seenAlunoIds = new Set<string>();
  const seenCpfs = new Set<string>();
  const cleanRows: CleanRow[] = [];
  let skippedDuplicates = 0;

  for (const raw of rawRows) {
    const codigoAluno = cleanText(raw.id_aluno).toUpperCase();
    const cpf = onlyDigits(raw.cpf_aluno);

    if (seenAlunoIds.has(codigoAluno)) {
      skippedDuplicates++;
      console.log(`⏭️  Duplicata ignorada (id_aluno): ${codigoAluno}`);
      continue;
    }

    if (cpf && seenCpfs.has(cpf)) {
      skippedDuplicates++;
      console.log(`⏭️  Duplicata ignorada (cpf_aluno): ${cpf} (${codigoAluno})`);
      continue;
    }

    seenAlunoIds.add(codigoAluno);
    if (cpf) seenCpfs.add(cpf);
    cleanRows.push(sanitizeRow(raw));
  }

  return { cleanRows, skippedDuplicates };
}

async function main(): Promise<void> {
  console.log("🌱 Iniciando seed ETL...\n");

  const t1 = await ensureMomentosColeta();
  console.log(`📅 Momento T1 pronto (${t1.dataReferencia.toISOString().slice(0, 10)})`);
  console.log("📅 Momentos T2 e T3 reservados para ciclos futuros (mobile)\n");

  const totalBarreiras = await ensureBarreiras();
  console.log(`🚧 Catálogo de barreiras: ${totalBarreiras} opções\n`);

  console.log(`📄 Lendo: ${DADOS_PATH}`);
  const content = readFileSync(DADOS_PATH, "utf-8");
  const rawRows = parseTsv(content);
  console.log(`📊 Registros brutos: ${rawRows.length}`);

  const { cleanRows, skippedDuplicates } = dedupeRows(rawRows);

  console.log(`✨ Registros após sanitização: ${cleanRows.length}`);
  console.log(`🗑️  Duplicatas ignoradas: ${skippedDuplicates}\n`);

  let inserted = 0;
  for (const row of cleanRows) {
    await upsertRecord(row, t1.id);
    inserted++;
    console.log(`✅ ${row.codigoAluno} → ${row.nomeAluno} (${row.codigoFamilia}) [T1]`);
  }

  const [familias, alunos, responsaveis, pesquisas, momentos] =
    await Promise.all([
      prisma.familia.count(),
      prisma.aluno.count(),
      prisma.responsavel.count(),
      prisma.pesquisaSocioeconomica.count(),
      prisma.momentoColeta.count(),
    ]);

  console.log("\n📈 Resumo do banco:");
  console.log(`   Momentos:    ${momentos}`);
  console.log(`   Famílias:    ${familias}`);
  console.log(`   Alunos:      ${alunos}`);
  console.log(`   Responsáveis:${responsaveis}`);
  console.log(`   Pesquisas:   ${pesquisas}`);
  console.log(`\n🎉 Seed concluído — ${inserted} registros no ciclo T1.`);
}

main()
  .catch((error) => {
    console.error("❌ Erro no seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
