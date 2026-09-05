import { writeFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

const OUTPUT_PATH = path.join(
  __dirname,
  "..",
  "dados_sanitizados.xlsx",
);

function formatDateISO(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function formatMoney(value: { toString(): string } | null): string {
  if (value == null) return "";
  return Number(value.toString()).toFixed(2);
}

function formatBool(value: boolean): string {
  return value ? "Sim" : "Não";
}

async function main(): Promise<void> {
  const alunos = await prisma.aluno.findMany({
    include: {
      familia: true,
      responsavel: true,
      pesquisasSocioeconomicas: {
        orderBy: { sincronizadoEm: "desc" },
        take: 1,
      },
    },
    orderBy: { codigoAluno: "asc" },
  });

  const rows = alunos.map((aluno, index) => {
    const familia = aluno.familia;
    const responsavel = aluno.responsavel;
    const pesquisa = aluno.pesquisasSocioeconomicas[0];

    return {
      id_registro: index + 1,
      id_familia: familia.codigoFamilia,
      id_aluno: aluno.codigoAluno,
      nome_aluno: aluno.nome,
      data_nascimento: formatDateISO(aluno.dataNascimento),
      sexo: aluno.sexo ?? "",
      cpf_aluno: aluno.cpf ?? "",
      nome_responsavel: responsavel?.nome ?? "",
      parentesco_responsavel: responsavel?.parentesco ?? "",
      cpf_responsavel: responsavel?.cpf ?? "",
      telefone_responsavel: responsavel?.telefone ?? "",
      email_responsavel: responsavel?.email ?? "",
      endereco: familia.endereco,
      bairro: familia.bairro,
      comunidade: familia.comunidade,
      qtd_moradores: familia.qtdMoradores,
      renda_familiar_mensal: formatMoney(familia.rendaFamiliarMensal),
      recebe_beneficio_social: formatBool(familia.recebeBeneficioSocial),
      beneficio_social: familia.beneficioSocial ?? "",
      possui_internet_casa: formatBool(familia.possuiInternetCasa),
      tipo_acesso_internet: familia.tipoAcessoInternet ?? "",
      meio_transporte_escola: pesquisa?.meioTransporteEscola ?? "",
      tempo_deslocamento_min: pesquisa?.tempoDeslocamentoMin ?? "",
      frequencia_escolar_pct: pesquisa
        ? formatMoney(pesquisa.frequenciaEscolarPct)
        : "",
      ano_serie: pesquisa?.anoSerie ?? "",
      turno: pesquisa?.turno ?? "",
      necessidade_educacional_especial: pesquisa
        ? formatBool(pesquisa.necessidadeEducacionalEspecial)
        : "",
      descricao_necessidade: pesquisa?.descricaoNecessidade ?? "",
      observacao: pesquisa?.observacao ?? "",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Dados Sanitizados");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  writeFileSync(OUTPUT_PATH, buffer);

  console.log(`✅ Exportado: ${OUTPUT_PATH}`);
  console.log(`📊 Linhas: ${rows.length}`);
}

main()
  .catch((error) => {
    console.error("❌ Erro na exportação:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
