import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { AlunoListItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

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
              {aluno.familia.beneficioSocial ?? "Benefício"}
            </Badge>
          ) : null}
        </p>
      </DetailBlock>

      <DetailBlock title="Responsável">
        {aluno.responsavel ? (
          <>
            <p className="font-medium">{aluno.responsavel.nome}</p>
            <p>{aluno.responsavel.parentesco}</p>
            <p>{aluno.responsavel.telefone ?? "Sem telefone"}</p>
            <p className="break-all">
              {aluno.responsavel.email ?? "Sem e-mail"}
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
                    aluno.pesquisa.momento.origemPadrao === "PLANILHA"
                      ? "warning"
                      : "default"
                  }
                >
                  {aluno.pesquisa.momento.codigo} ·{" "}
                  {aluno.pesquisa.momento.origemPadrao === "PLANILHA"
                    ? "Planilha"
                    : "Mobile"}
                </Badge>
                <Badge variant="secondary">
                  Ref.{" "}
                  {new Date(
                    aluno.pesquisa.momento.dataReferencia,
                  ).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                </Badge>
              </p>
            ) : null}
            <p>
              {aluno.pesquisa.anoSerie} · {aluno.pesquisa.turno}
            </p>
            <p>Transporte: {aluno.pesquisa.meioTransporteEscola}</p>
            <p>Deslocamento: {aluno.pesquisa.tempoDeslocamentoMin} min</p>
            {aluno.pesquisa.necessidadeEducacionalEspecial ? (
              <Badge className="mt-1" variant="default">
                {aluno.pesquisa.descricaoNecessidade ?? "NEE"}
              </Badge>
            ) : (
              <p className="text-muted-foreground">Sem NEE registrada</p>
            )}
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
