import { prisma } from "@/lib/prisma";
import {
  average,
  countByRendaFamiliarSmFaixa,
  groupAverage,
  groupCount,
  median,
  percent,
  round2,
} from "@/lib/aggregations";
import { fail, ok } from "@/lib/api-response";
import {
  ACOMPANHAMENTO_FAMILIAR_OPTIONS,
  APOIO_PRIORITARIO_OPTIONS,
  BAIRRO_OPTIONS,
  BAIRROS_SEM_MAPA,
  BARREIRA_NENHUMA,
  BARREIRA_OPTIONS,
  BENEFICIO_SOCIAL_OPTIONS,
  LOCAL_ESTUDO_OPTIONS,
  MEIO_TRANSPORTE_OPTIONS,
  TIPO_ACESSO_INTERNET_OPTIONS,
  canonicalCode,
  canonicalLabel,
  splitCodes,
} from "@/lib/opcoes-questionario";

export const dynamic = "force-dynamic";

type OrigemFiltro = "PLANILHA" | "MOBILE";

function parseOrigem(request: Request): OrigemFiltro | null {
  const raw = new URL(request.url).searchParams.get("origem")?.trim().toUpperCase();
  return raw === "PLANILHA" || raw === "MOBILE" ? raw : null;
}

export async function GET(request: Request) {
  try {
    const origem = parseOrigem(request);
    const pesquisaWhere = origem ? { origem } : {};
    const pesquisaV2Where = {
      versaoQuestionario: 2,
      ...pesquisaWhere,
    };
    /** Famílias/alunos do ciclo: quem tem ao menos uma entrevista da origem. */
    const familiaWhere = origem
      ? {
          alunos: {
            some: { pesquisasSocioeconomicas: { some: { origem } } },
          },
        }
      : {};
    const alunoWhere = origem
      ? { pesquisasSocioeconomicas: { some: { origem } } }
      : {};

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
      prisma.aluno.count({ where: alunoWhere }),
      prisma.familia.count({ where: familiaWhere }),
      prisma.pesquisaSocioeconomica.count({ where: pesquisaWhere }),
      prisma.pesquisaSocioeconomica.count({ where: pesquisaV2Where }),
      prisma.familia.findMany({
        where: familiaWhere,
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
        where: pesquisaWhere,
        select: {
          meioTransporteEscola: true,
          turno: true,
          tempoDeslocamentoMin: true,
          necessidadeEducacionalEspecial: true,
          frequenciaEscolarPct: true,
          versaoQuestionario: true,
        },
      }),
      prisma.pesquisaSocioeconomica.findMany({
        where: pesquisaV2Where,
        select: {
          apoioPrioritario: true,
          localEstudo: true,
          acompanhamentoFamiliar: true,
          barreiras: {
            select: {
              barreira: { select: { codigo: true, nome: true } },
            },
          },
        },
      }),
      prisma.momentoColeta.findMany({
        where: origem ? { origemPadrao: origem } : {},
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
    // Unidade = entrevista (pesquisa), não aluno único ao longo do tempo.
    const comNee = pesquisas.filter(
      (p) => p.necessidadeEducacionalEspecial,
    ).length;

    // Unidade = entrevista do app; exclui só a opção “Nenhuma”.
    const coletasV2ComBarreira = pesquisasV2.filter((p) =>
      p.barreiras.some((pb) => pb.barreira.codigo !== BARREIRA_NENHUMA),
    ).length;

    /** Frequência escolar — entrevistas com % informada (planilha + app). */
    const FREQUENCIA_MINIMA_MANAUS = 75;
    const frequencias = pesquisas
      .map((p) =>
        p.frequenciaEscolarPct == null
          ? null
          : Number(p.frequenciaEscolarPct),
      )
      .filter((v): v is number => v != null && Number.isFinite(v));
    const comFrequenciaAbaixo75 = frequencias.filter(
      (v) => v < FREQUENCIA_MINIMA_MANAUS,
    ).length;

    /** Local adequado = SIM; base = entrevistas do app com resposta. */
    const localEstudoInformado = pesquisasV2.filter((p) => {
      if (p.localEstudo == null || p.localEstudo.trim() === "") return false;
      const code =
        canonicalCode(LOCAL_ESTUDO_OPTIONS, p.localEstudo) ??
        p.localEstudo.trim();
      return code !== "NAO_SABE";
    });
    const comLocalEstudoAdequado = localEstudoInformado.filter((p) => {
      const code =
        canonicalCode(LOCAL_ESTUDO_OPTIONS, p.localEstudo) ??
        p.localEstudo?.trim();
      return code === "SIM";
    }).length;

    const acompanhamentoInformado = pesquisasV2.filter((p) => {
      if (
        p.acompanhamentoFamiliar == null ||
        p.acompanhamentoFamiliar.trim() === ""
      ) {
        return false;
      }
      const code =
        canonicalCode(
          ACOMPANHAMENTO_FAMILIAR_OPTIONS,
          p.acompanhamentoFamiliar,
        ) ?? p.acompanhamentoFamiliar.trim().toUpperCase();
      return code !== "NAO_SABE";
    });
    const comAcompanhamentoRegular = acompanhamentoInformado.filter((p) => {
      const code =
        canonicalCode(
          ACOMPANHAMENTO_FAMILIAR_OPTIONS,
          p.acompanhamentoFamiliar,
        ) ?? p.acompanhamentoFamiliar!.trim().toUpperCase();
      return code === "SEMPRE";
    }).length;

    /** Distribuições: agrupar por código canônico; rótulo só na resposta. */
    const internetAcessoDistribuicao = groupCount(familias, (f) => {
      if (!f.possuiInternetCasa) return "Sem internet";
      const raw = f.tipoAcessoInternet?.trim();
      if (!raw) return "Com internet (tipo não informado)";
      return (
        canonicalCode(TIPO_ACESSO_INTERNET_OPTIONS, raw) ?? raw
      );
    })
      .map(({ key, total }) => ({
        tipo:
          key === "Sem internet" ||
          key === "Com internet (tipo não informado)"
            ? key
            : canonicalLabel(TIPO_ACESSO_INTERNET_OPTIONS, key),
        total,
      }))
      .sort((a, b) => b.total - a.total);

    const rendaFamiliarFaixas = countByRendaFamiliarSmFaixa(rendas);

    /** Contagem de menções a cada barreira (exceto NENHUMA) — chave = código. */
    const barreiraCounts = new Map<string, number>();
    for (const p of pesquisasV2) {
      for (const pb of p.barreiras) {
        const codigo =
          canonicalCode(BARREIRA_OPTIONS, pb.barreira.codigo) ??
          pb.barreira.codigo;
        if (codigo === BARREIRA_NENHUMA) continue;
        barreiraCounts.set(codigo, (barreiraCounts.get(codigo) ?? 0) + 1);
      }
    }
    const barreirasDistribuicao = Array.from(barreiraCounts.entries())
      .map(([codigo, total]) => ({
        codigo,
        nome: canonicalLabel(BARREIRA_OPTIONS, codigo, codigo),
        total,
      }))
      .sort((a, b) => b.total - a.total);

    const apoioCounts = new Map<string, number>();
    for (const p of pesquisasV2) {
      if (p.apoioPrioritario == null || !String(p.apoioPrioritario).trim()) {
        continue;
      }
      for (const raw of splitCodes(p.apoioPrioritario)) {
        const codigo =
          canonicalCode(APOIO_PRIORITARIO_OPTIONS, raw) ?? raw;
        apoioCounts.set(codigo, (apoioCounts.get(codigo) ?? 0) + 1);
      }
    }
    const apoioPrioritarioDistribuicao = Array.from(apoioCounts.entries())
      .map(([key, total]) => ({
        apoio: canonicalLabel(APOIO_PRIORITARIO_OPTIONS, key),
        total,
      }))
      .sort((a, b) => b.total - a.total);

    const rendaPorBairro = groupAverage(
      familias.filter((f) => {
        const b = f.bairro?.trim();
        if (!b) return false;
        return !BAIRROS_SEM_MAPA.has(b.toUpperCase());
      }),
      (f) =>
        canonicalCode(BAIRRO_OPTIONS, f.bairro) ?? f.bairro.trim(),
      (f) => Number(f.rendaFamiliarMensal),
    )
      .map(({ key, average: rendaMedia, count }) => ({
        bairro: key,
        rendaMedia: round2(rendaMedia),
        familias: count,
      }))
      .sort((a, b) => b.rendaMedia - a.rendaMedia);

    const transporteDistribuicao = groupCount(pesquisas, (p) =>
      canonicalCode(MEIO_TRANSPORTE_OPTIONS, p.meioTransporteEscola) ??
      p.meioTransporteEscola.trim(),
    )
      .map(({ key, total }) => ({
        meio: canonicalLabel(MEIO_TRANSPORTE_OPTIONS, key),
        total,
      }))
      .sort((a, b) => b.total - a.total);

    const beneficioDistribuicao = groupCount(
      familias.filter((f) => f.recebeBeneficioSocial),
      (f) =>
        canonicalCode(BENEFICIO_SOCIAL_OPTIONS, f.beneficioSocial) ??
        (f.beneficioSocial?.trim() || "NAO_INFORMADO"),
    )
      .map(({ key, total }) => ({
        beneficio:
          key === "NAO_INFORMADO"
            ? "Não informado"
            : canonicalLabel(BENEFICIO_SOCIAL_OPTIONS, key),
        total,
      }))
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
      frequenciaEscolarMediaPct: round2(average(frequencias)),
      totalComFrequenciaInformada: frequencias.length,
      comFrequenciaAbaixo75,
      percentualFrequenciaAbaixo75: percent(
        comFrequenciaAbaixo75,
        frequencias.length,
      ),
      percentualLocalEstudoAdequado: percent(
        comLocalEstudoAdequado,
        localEstudoInformado.length,
      ),
      totalLocalEstudoInformado: localEstudoInformado.length,
      percentualAcompanhamentoRegular: percent(
        comAcompanhamentoRegular,
        acompanhamentoInformado.length,
      ),
      totalAcompanhamentoInformado: acompanhamentoInformado.length,
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
      rendaFamiliarFaixas,
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
