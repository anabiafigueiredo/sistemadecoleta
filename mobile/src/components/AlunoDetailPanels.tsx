import { Text, StyleSheet, View } from "react-native";
import type { AlunoRemote } from "@/lib/api";
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
import { colors, fontBody, fontEmphasis, fontLabel } from "@/theme";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

/** Painéis de detalhe (espelho do dashboard web). */
export function AlunoDetailPanels({ aluno }: { aluno: AlunoRemote }) {
  const { familia, responsavel, pesquisa } = aluno;

  return (
    <View style={styles.wrap}>
      <DetailBlock title="Família">
        <Line>{familia.endereco}</Line>
        <Line>
          {familia.bairro} · {familia.comunidade}
        </Line>
        <Line>
          Localidade: {labelOf(TIPO_LOCALIDADE_OPTIONS, familia.tipoLocalidade)}
        </Line>
        <Line>Moradores: {familia.qtdMoradores}</Line>
        <Line>Renda: {formatCurrency(familia.rendaFamiliarMensal)}</Line>
        <Line>
          {familia.possuiInternetCasa ? "Com internet" : "Sem internet"}
          {familia.possuiInternetCasa
            ? ` · ${labelOf(TIPO_ACESSO_INTERNET_OPTIONS, familia.tipoAcessoInternet)}`
            : ""}
        </Line>
        {familia.recebeBeneficioSocial ? (
          <Line>
            Benefício:{" "}
            {labelOf(BENEFICIO_SOCIAL_OPTIONS, familia.beneficioSocial)}
          </Line>
        ) : (
          <Line>Sem benefício social</Line>
        )}
      </DetailBlock>

      <DetailBlock title="Responsável">
        {responsavel ? (
          <>
            <Line strong>{responsavel.nome}</Line>
            <Line>
              {labelOf(PARENTESCO_OPTIONS, responsavel.parentesco)}
            </Line>
            <Line>{responsavel.telefone ?? "Sem telefone"}</Line>
            <Line>{responsavel.email ?? "Sem e-mail"}</Line>
            <Line>
              Escolaridade:{" "}
              {labelOf(ESCOLARIDADE_OPTIONS, responsavel.escolaridade)}
            </Line>
            <Line>
              Ocupação:{" "}
              {labelOf(
                SITUACAO_OCUPACIONAL_OPTIONS,
                responsavel.situacaoOcupacional,
              )}
            </Line>
          </>
        ) : (
          <Line>Não informado</Line>
        )}
      </DetailBlock>

      <DetailBlock title="Pesquisa">
        {pesquisa ? (
          <>
            <Line>
              {pesquisa.momento.codigo} ·{" "}
              {pesquisa.origem === "PLANILHA" ? "Ciclo 1" : "Ciclo 2"} · v
              {pesquisa.versaoQuestionario}
            </Line>
            <Line>
              Ref. {formatDate(pesquisa.momento.dataReferencia)}
            </Line>
            <Line>
              {labelOf(ANO_SERIE_OPTIONS, pesquisa.anoSerie)} ·{" "}
              {labelOf(TURNO_OPTIONS, pesquisa.turno)}
            </Line>
            <Line>
              Transporte:{" "}
              {labelOf(
                MEIO_TRANSPORTE_OPTIONS,
                pesquisa.meioTransporteEscola,
              )}
            </Line>
            <Line>Deslocamento: {pesquisa.tempoDeslocamentoMin} min</Line>
            <Line>
              {pesquisa.necessidadeEducacionalEspecial
                ? pesquisa.descricaoNecessidade ?? "NEE"
                : "Sem NEE registrada"}
            </Line>
            {pesquisa.equipamentoEstudo ? (
              <Line>
                Equipamento:{" "}
                {labelOf(
                  EQUIPAMENTO_ESTUDO_OPTIONS,
                  pesquisa.equipamentoEstudo,
                )}
              </Line>
            ) : null}
            {pesquisa.disponibilidadeEquipamento ? (
              <Line>
                Disponibilidade:{" "}
                {labelOf(
                  DISPONIBILIDADE_EQUIPAMENTO_OPTIONS,
                  pesquisa.disponibilidadeEquipamento,
                )}
              </Line>
            ) : null}
            {pesquisa.localEstudo ? (
              <Line>
                Local de estudo:{" "}
                {labelOf(LOCAL_ESTUDO_OPTIONS, pesquisa.localEstudo)}
              </Line>
            ) : null}
            {pesquisa.acompanhamentoFamiliar ? (
              <Line>
                Acompanhamento:{" "}
                {labelOf(
                  ACOMPANHAMENTO_FAMILIAR_OPTIONS,
                  pesquisa.acompanhamentoFamiliar,
                )}
              </Line>
            ) : null}
            {pesquisa.apoioPrioritario ? (
              <Line>
                Apoio:{" "}
                {labelOf(APOIO_PRIORITARIO_OPTIONS, pesquisa.apoioPrioritario)}
              </Line>
            ) : null}
            <Line>
              Barreiras:{" "}
              {pesquisa.barreiras.length
                ? pesquisa.barreiras.map((b) => b.nome).join(", ")
                : "—"}
            </Line>
          </>
        ) : (
          <Line>Sem pesquisa vinculada</Line>
        )}
      </DetailBlock>
    </View>
  );
}

function DetailBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Line({
  children,
  strong,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <Text style={[styles.line, strong && styles.lineStrong]}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginTop: 12 },
  block: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: 12,
  },
  blockTitle: {
    fontSize: 11,
    ...fontLabel,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  line: { fontSize: 13, color: colors.text, marginTop: 2, lineHeight: 18, ...fontBody },
  lineStrong: { ...fontEmphasis, color: colors.text },
});
