import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { AlunoListItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  ACOMPANHAMENTO_FAMILIAR_OPTIONS,
  ANO_SERIE_OPTIONS,
  APOIO_PRIORITARIO_OPTIONS,
  BENEFICIO_SOCIAL_OPTIONS,
  DISPONIBILIDADE_EQUIPAMENTO_OPTIONS,
  EQUIPAMENTO_ESTUDO_OPTIONS,
  ESCOLARIDADE_OPTIONS,
  LOCAL_ESTUDO_OPTIONS,
  MEIO_TRANSPORTE_OPTIONS,
  PARENTESCO_OPTIONS,
  SITUACAO_OCUPACIONAL_OPTIONS,
  TIPO_ACESSO_INTERNET_OPTIONS,
  TIPO_LOCALIDADE_OPTIONS,
  TURNO_OPTIONS,
  labelOf,
} from "@/lib/opcoes-questionario";

export function AlunoDetailPanels({
  aluno,
  className = "grid gap-4 md:grid-cols-3",
}: {
  aluno: AlunoListItem;
  className?: string;
}) {
  return (
    <div className={className}>
      <DetailBlock title="Família">
        <p>{aluno.familia.endereco}</p>
        <p>
          {aluno.familia.bairro} · {aluno.familia.comunidade}
        </p>
        <p>
          Localidade:{" "}
          {labelOf(TIPO_LOCALIDADE_OPTIONS, aluno.familia.tipoLocalidade)}
        </p>
        <p>Renda: {formatCurrency(aluno.familia.rendaFamiliarMensal)}</p>
        <p className="mt-1 flex flex-wrap gap-1">
          <Badge
            variant={
              aluno.familia.possuiInternetCasa ? "success" : "secondary"
            }
          >
            {aluno.familia.possuiInternetCasa ? "Com internet" : "Sem internet"}
          </Badge>
          {aluno.familia.recebeBeneficioSocial ? (
            <Badge variant="warning">
              {labelOf(
                BENEFICIO_SOCIAL_OPTIONS,
                aluno.familia.beneficioSocial,
              )}
            </Badge>
          ) : null}
        </p>
        {aluno.familia.possuiInternetCasa ? (
          <p>
            Acesso:{" "}
            {labelOf(
              TIPO_ACESSO_INTERNET_OPTIONS,
              aluno.familia.tipoAcessoInternet,
            )}
          </p>
        ) : null}
      </DetailBlock>

      <DetailBlock title="Responsável">
        {aluno.responsavel ? (
          <>
            <p className="font-medium">{aluno.responsavel.nome}</p>
            <p>
              {labelOf(PARENTESCO_OPTIONS, aluno.responsavel.parentesco)}
            </p>
            <p>{aluno.responsavel.telefone ?? "Sem telefone"}</p>
            <p className="break-all">
              {aluno.responsavel.email ?? "Sem e-mail"}
            </p>
            <p>
              Escolaridade:{" "}
              {labelOf(ESCOLARIDADE_OPTIONS, aluno.responsavel.escolaridade)}
            </p>
            <p>
              Ocupação:{" "}
              {labelOf(
                SITUACAO_OCUPACIONAL_OPTIONS,
                aluno.responsavel.situacaoOcupacional,
              )}
            </p>
          </>
        ) : (
          <p>Não informado</p>
        )}
      </DetailBlock>

      <DetailBlock title="Pesquisa">
        {aluno.pesquisa ? (
          <>
            {aluno.pesquisa.momento ? (
              <p className="mb-1 flex flex-wrap gap-1">
                <Badge
                  variant={
                    aluno.pesquisa.origem === "PLANILHA" ? "warning" : "default"
                  }
                >
                  {aluno.pesquisa.origem === "PLANILHA" ? "Ciclo 1" : "Ciclo 2"}
                </Badge>
                <Badge variant="secondary">
                  Questionário v{aluno.pesquisa.versaoQuestionario}
                </Badge>
                <Badge variant="secondary">
                  Data{" "}
                  {new Date(
                    aluno.pesquisa.origem === "MOBILE"
                      ? aluno.pesquisa.sincronizadoEm
                      : aluno.pesquisa.momento.dataReferencia,
                  ).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                </Badge>
              </p>
            ) : null}
            <p>
              {labelOf(ANO_SERIE_OPTIONS, aluno.pesquisa.anoSerie)} ·{" "}
              {labelOf(TURNO_OPTIONS, aluno.pesquisa.turno)}
            </p>
            <p>
              Transporte:{" "}
              {labelOf(
                MEIO_TRANSPORTE_OPTIONS,
                aluno.pesquisa.meioTransporteEscola,
              )}
            </p>
            <p>Deslocamento: {aluno.pesquisa.tempoDeslocamentoMin} min</p>
            {aluno.pesquisa.necessidadeEducacionalEspecial ? (
              <Badge className="mt-1" variant="default">
                {aluno.pesquisa.descricaoNecessidade ?? "NEE"}
              </Badge>
            ) : (
              <p className="text-muted-foreground">Sem NEE registrada</p>
            )}
            <p>
              Equipamento:{" "}
              {labelOf(
                EQUIPAMENTO_ESTUDO_OPTIONS,
                aluno.pesquisa.equipamentoEstudo,
              )}
            </p>
            <p>
              Disponibilidade:{" "}
              {labelOf(
                DISPONIBILIDADE_EQUIPAMENTO_OPTIONS,
                aluno.pesquisa.disponibilidadeEquipamento,
              )}
            </p>
            <p>
              Local de estudo:{" "}
              {labelOf(LOCAL_ESTUDO_OPTIONS, aluno.pesquisa.localEstudo)}
            </p>
            <p>
              Acompanhamento:{" "}
              {labelOf(
                ACOMPANHAMENTO_FAMILIAR_OPTIONS,
                aluno.pesquisa.acompanhamentoFamiliar,
              )}
            </p>
            <p>
              Apoio prioritário:{" "}
              {labelOf(
                APOIO_PRIORITARIO_OPTIONS,
                aluno.pesquisa.apoioPrioritario,
              )}
            </p>
            <p>
              Barreiras:{" "}
              {aluno.pesquisa.barreiras.length
                ? aluno.pesquisa.barreiras.map((b) => b.nome).join(", ")
                : "—"}
            </p>
          </>
        ) : (
          <p>Sem pesquisa vinculada</p>
        )}
      </DetailBlock>
    </div>
  );
}

function DetailBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  );
}
