import { prisma } from "@/lib/prisma";
import {
  average,
  groupAverage,
  groupCount,
  percent,
  round2,
} from "@/lib/aggregations";
import { fail, ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [totalAlunos, totalFamilias, totalColetas, familias, pesquisas, momentos] =
      await Promise.all([
      prisma.aluno.count(),
      prisma.familia.count(),
      prisma.pesquisaSocioeconomica.count(),
      prisma.familia.findMany({
        select: {
          bairro: true,
          rendaFamiliarMensal: true,
          possuiInternetCasa: true,
          recebeBeneficioSocial: true,
          beneficioSocial: true,
        },
      }),
      prisma.pesquisaSocioeconomica.findMany({
        select: {
          meioTransporteEscola: true,
          turno: true,
          frequenciaEscolarPct: true,
          tempoDeslocamentoMin: true,
          necessidadeEducacionalEspecial: true,
        },
      }),
      prisma.momentoColeta.findMany({
        include: { _count: { select: { pesquisas: true } } },
        orderBy: { dataReferencia: "asc" },
      }),
    ]);

    const rendas = familias.map((f) => Number(f.rendaFamiliarMensal));
    const comInternet = familias.filter((f) => f.possuiInternetCasa).length;
    const comBeneficio = familias.filter((f) => f.recebeBeneficioSocial).length;
    const comNee = pesquisas.filter(
      (p) => p.necessidadeEducacionalEspecial,
    ).length;

    const rendaPorBairro = groupAverage(
      familias,
      (f) => f.bairro,
      (f) => Number(f.rendaFamiliarMensal),
    )
      .map(({ key, average: rendaMedia, count }) => ({
        bairro: key,
        rendaMedia: round2(rendaMedia),
        familias: count,
      }))
      .sort((a, b) => b.rendaMedia - a.rendaMedia);

    const transporteDistribuicao = groupCount(
      pesquisas,
      (p) => p.meioTransporteEscola,
    )
      .map(({ key, total }) => ({ meio: key, total }))
      .sort((a, b) => b.total - a.total);

    const frequenciaPorTurno = groupAverage(
      pesquisas,
      (p) => p.turno,
      (p) => Number(p.frequenciaEscolarPct),
    )
      .map(({ key, average: frequenciaMedia, count }) => ({
        turno: key,
        frequenciaMedia: round2(frequenciaMedia),
        alunos: count,
      }))
      .sort((a, b) => a.turno.localeCompare(b.turno, "pt-BR"));

    const beneficioDistribuicao = groupCount(
      familias.filter((f) => f.recebeBeneficioSocial),
      (f) => f.beneficioSocial?.trim() || "Não informado",
    )
      .map(({ key, total }) => ({ beneficio: key, total }))
      .sort((a, b) => b.total - a.total);

    return ok({
      totalAlunos,
      totalFamilias,
      totalColetas,
      rendaMediaFamiliar: round2(average(rendas)),
      percentualComInternet: percent(comInternet, familias.length),
      percentualComBeneficio: percent(comBeneficio, familias.length),
      percentualComNee: percent(comNee, pesquisas.length),
      frequenciaMediaGeral: round2(
        average(pesquisas.map((p) => Number(p.frequenciaEscolarPct))),
      ),
      tempoMedioDeslocamentoMin: Math.round(
        average(pesquisas.map((p) => p.tempoDeslocamentoMin)),
      ),
      momentos: momentos.map((m) => ({
        id: m.id,
        codigo: m.codigo,
        titulo: m.titulo,
        descricao: m.descricao,
        dataReferencia: m.dataReferencia.toISOString(),
        origemPadrao: m.origemPadrao,
        totalPesquisas: m._count.pesquisas,
      })),
      rendaPorBairro,
      transporteDistribuicao,
      frequenciaPorTurno,
      beneficioDistribuicao,
    });
  } catch (error) {
    console.error("[GET /api/dashboard/stats]", error);
    return fail("INTERNAL_ERROR", "Falha ao calcular estatísticas", 500);
  }
}
