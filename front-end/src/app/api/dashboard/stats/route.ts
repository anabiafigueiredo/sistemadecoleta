import { prisma } from "@/lib/prisma";
import {
  average,
  countByRendaPerCapitaFaixa,
  groupAverage,
  groupCount,
  median,
  percent,
  round2,
} from "@/lib/aggregations";
import { fail, ok } from "@/lib/api-response";
import {
  APOIO_PRIORITARIO_OPTIONS,
  BARREIRA_NENHUMA,
  BARREIRA_OPTIONS,
  TIPO_ACESSO_INTERNET_OPTIONS,
  labelOf,
} from "@/lib/opcoes-questionario";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      totalAlunos,
      totalFamilias,
      totalColetas,
      totalColetasV2,
      familias,
      pesquisas,
      pesquisasV2,
      momentos,
    ] = await Promise.all([
      prisma.aluno.count(),
      prisma.familia.count(),
      prisma.pesquisaSocioeconomica.count(),
      prisma.pesquisaSocioeconomica.count({
        where: { versaoQuestionario: 2 },
      }),
      prisma.familia.findMany({
        select: {
          bairro: true,
          rendaFamiliarMensal: true,
          qtdMoradores: true,
          possuiInternetCasa: true,
          tipoAcessoInternet: true,
          recebeBeneficioSocial: true,
          beneficioSocial: true,
        },
      }),
      prisma.pesquisaSocioeconomica.findMany({
        select: {
          meioTransporteEscola: true,
          turno: true,
          tempoDeslocamentoMin: true,
          necessidadeEducacionalEspecial: true,
          versaoQuestionario: true,
        },
      }),
      prisma.pesquisaSocioeconomica.findMany({
        where: { versaoQuestionario: 2 },
        select: {
          apoioPrioritario: true,
          barreiras: {
            select: {
              barreira: { select: { codigo: true, nome: true } },
            },
          },
        },
      }),
      prisma.momentoColeta.findMany({
        include: { _count: { select: { pesquisas: true } } },
        orderBy: { dataReferencia: "asc" },
      }),
    ]);

    const rendas = familias.map((f) => Number(f.rendaFamiliarMensal));
    const rendasPerCapita = familias.map((f) => {
      const renda = Number(f.rendaFamiliarMensal);
      const moradores = Math.max(1, f.qtdMoradores);
      return renda / moradores;
    });
    const comInternet = familias.filter((f) => f.possuiInternetCasa).length;
    const comBeneficio = familias.filter((f) => f.recebeBeneficioSocial).length;
    const comNee = pesquisas.filter(
      (p) => p.necessidadeEducacionalEspecial,
    ).length;

    const coletasV2ComBarreira = pesquisasV2.filter((p) =>
      p.barreiras.some((pb) => pb.barreira.codigo !== BARREIRA_NENHUMA),
    ).length;

    /** Unidade família: sem internet ou tipo de acesso. */
    const internetAcessoDistribuicao = groupCount(familias, (f) => {
      if (!f.possuiInternetCasa) return "Sem internet";
      const codigo = f.tipoAcessoInternet?.trim();
      if (!codigo) return "Com internet (tipo não informado)";
      return (
        labelOf(TIPO_ACESSO_INTERNET_OPTIONS, codigo) || codigo
      );
    })
      .map(({ key, total }) => ({ tipo: key, total }))
      .sort((a, b) => b.total - a.total);

    const rendaPerCapitaFaixas = countByRendaPerCapitaFaixa(rendasPerCapita);

    /** Contagem de menções a cada barreira (exceto NENHUMA) nas entrevistas v2. */
    const barreiraCounts = new Map<string, { nome: string; total: number }>();
    for (const p of pesquisasV2) {
      for (const pb of p.barreiras) {
        const codigo = pb.barreira.codigo;
        if (codigo === BARREIRA_NENHUMA) continue;
        const nome =
          labelOf(BARREIRA_OPTIONS, codigo) || pb.barreira.nome || codigo;
        const cur = barreiraCounts.get(codigo) ?? { nome, total: 0 };
        cur.total += 1;
        barreiraCounts.set(codigo, cur);
      }
    }
    const barreirasDistribuicao = Array.from(barreiraCounts.entries())
      .map(([codigo, { nome, total }]) => ({ codigo, nome, total }))
      .sort((a, b) => b.total - a.total);

    const apoioPrioritarioDistribuicao = groupCount(
      pesquisasV2.filter((p) => p.apoioPrioritario != null),
      (p) =>
        labelOf(APOIO_PRIORITARIO_OPTIONS, p.apoioPrioritario!) ||
        String(p.apoioPrioritario),
    )
      .map(({ key, total }) => ({ apoio: key, total }))
      .sort((a, b) => b.total - a.total);

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
      totalColetasV2,
      rendaMediaFamiliar: round2(average(rendas)),
      rendaPerCapitaMediana: round2(median(rendasPerCapita)),
      percentualComInternet: percent(comInternet, familias.length),
      percentualComBeneficio: percent(comBeneficio, familias.length),
      percentualComNee: percent(comNee, pesquisas.length),
      percentualComBarreiraV2: percent(coletasV2ComBarreira, totalColetasV2),
      coletasV2ComBarreira,
      tempoMedioDeslocamentoMin: Math.round(
        average(pesquisas.map((p) => p.tempoDeslocamentoMin)),
      ),
      /** true quando há v1 e v2 misturados — avisos nos gráficos v2. */
      amostraV2Parcial: totalColetasV2 > 0 && totalColetasV2 < totalColetas,
      momentos: momentos.map((m) => ({
        id: m.id,
        codigo: m.codigo,
        titulo: m.titulo,
        descricao: m.descricao,
        dataReferencia: m.dataReferencia.toISOString(),
        origemPadrao: m.origemPadrao,
        totalPesquisas: m._count.pesquisas,
      })),
      rendaPerCapitaFaixas,
      internetAcessoDistribuicao,
      barreirasDistribuicao,
      apoioPrioritarioDistribuicao,
      rendaPorBairro,
      transporteDistribuicao,
      beneficioDistribuicao,
    });
  } catch (error) {
    console.error("[GET /api/dashboard/stats]", error);
    return fail("INTERNAL_ERROR", "Falha ao calcular estatísticas", 500);
  }
}
