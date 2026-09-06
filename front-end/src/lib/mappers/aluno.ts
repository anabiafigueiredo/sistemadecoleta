import type { Prisma } from "@/generated/prisma";
import type { AlunoListItem } from "@/lib/types";

type AlunoWithRelations = Prisma.AlunoGetPayload<{
  include: {
    familia: true;
    responsavel: true;
    pesquisasSocioeconomicas: {
      include: {
        momentoColeta: true;
        barreiras: { include: { barreira: true } };
      };
    };
  };
}>;

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export function toAlunoListItem(aluno: AlunoWithRelations): AlunoListItem {
  const pesquisa = aluno.pesquisasSocioeconomicas[0] ?? null;

  return {
    id: aluno.id,
    codigoAluno: aluno.codigoAluno,
    nome: aluno.nome,
    dataNascimento: toIso(aluno.dataNascimento),
    sexo: aluno.sexo,
    cpf: aluno.cpf,
    familia: {
      id: aluno.familia.id,
      codigoFamilia: aluno.familia.codigoFamilia,
      endereco: aluno.familia.endereco,
      bairro: aluno.familia.bairro,
      comunidade: aluno.familia.comunidade,
      tipoLocalidade: aluno.familia.tipoLocalidade,
      qtdMoradores: aluno.familia.qtdMoradores,
      rendaFamiliarMensal: Number(aluno.familia.rendaFamiliarMensal),
      recebeBeneficioSocial: aluno.familia.recebeBeneficioSocial,
      beneficioSocial: aluno.familia.beneficioSocial,
      possuiInternetCasa: aluno.familia.possuiInternetCasa,
      tipoAcessoInternet: aluno.familia.tipoAcessoInternet,
    },
    responsavel: aluno.responsavel
      ? {
          id: aluno.responsavel.id,
          nome: aluno.responsavel.nome,
          parentesco: aluno.responsavel.parentesco,
          cpf: aluno.responsavel.cpf,
          telefone: aluno.responsavel.telefone,
          email: aluno.responsavel.email,
          escolaridade: aluno.responsavel.escolaridade,
          situacaoOcupacional: aluno.responsavel.situacaoOcupacional,
        }
      : null,
    pesquisa: pesquisa
      ? {
          id: pesquisa.id,
          origem: pesquisa.origem,
          versaoQuestionario: pesquisa.versaoQuestionario,
          meioTransporteEscola: pesquisa.meioTransporteEscola,
          tempoDeslocamentoMin: pesquisa.tempoDeslocamentoMin,
          frequenciaEscolarPct:
            pesquisa.frequenciaEscolarPct == null
              ? null
              : Number(pesquisa.frequenciaEscolarPct),
          anoSerie: pesquisa.anoSerie,
          turno: pesquisa.turno,
          necessidadeEducacionalEspecial:
            pesquisa.necessidadeEducacionalEspecial,
          descricaoNecessidade: pesquisa.descricaoNecessidade,
          observacao: pesquisa.observacao,
          equipamentoEstudo: pesquisa.equipamentoEstudo,
          disponibilidadeEquipamento: pesquisa.disponibilidadeEquipamento,
          localEstudo: pesquisa.localEstudo,
          acompanhamentoFamiliar: pesquisa.acompanhamentoFamiliar,
          apoioPrioritario: pesquisa.apoioPrioritario,
          barreiras: (pesquisa.barreiras ?? [])
            .map((pb) => ({
              codigo: pb.barreira.codigo,
              nome: pb.barreira.nome,
            }))
            .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
          sincronizadoEm: pesquisa.sincronizadoEm.toISOString(),
          momento: {
            id: pesquisa.momentoColeta.id,
            codigo: pesquisa.momentoColeta.codigo,
            titulo: pesquisa.momentoColeta.titulo,
            dataReferencia: pesquisa.momentoColeta.dataReferencia.toISOString(),
            origemPadrao: pesquisa.momentoColeta.origemPadrao,
          },
        }
      : null,
  };
}
