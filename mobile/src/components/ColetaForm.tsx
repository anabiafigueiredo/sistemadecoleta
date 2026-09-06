import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Field } from "@/components/Field";
import { Segmented } from "@/components/Segmented";
import { MultiSelectChips } from "@/components/MultiSelectChips";
import { BoolSwitch, PrimaryButton } from "@/components/BoolSwitch";
import {
  maskCpf,
  maskCurrencyInput,
  maskDateBr,
  maskPhone,
  onlyDigits,
} from "@/lib/masks";
import { isOnline, syncOne } from "@/lib/sync";
import { saveColeta } from "@/lib/storage";
import {
  COLETA_WIZARD_STEPS,
  emptyForm,
  formFromPayload,
  validateColetaForm,
  validateColetaStep,
  type ColetaFormErrors,
  type ColetaWizardStepId,
} from "@/lib/validation";
import type { ColetaFormState, ColetaLocal } from "@/lib/types";
import {
  ACOMPANHAMENTO_FAMILIAR_OPTIONS,
  ANO_SERIE_OPTIONS,
  APOIO_PRIORITARIO_OPTIONS,
  BARREIRA_OPTIONS,
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
  toggleBarreira,
} from "@/lib/opcoes-questionario";

type Props = {
  initial?: ColetaLocal | null;
  onSaved: (item: ColetaLocal) => void;
};

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

function WizardProgress({
  stepIndex,
  onGoTo,
}: {
  stepIndex: number;
  onGoTo: (index: number) => void;
}) {
  const pct = Math.round(((stepIndex + 1) / COLETA_WIZARD_STEPS.length) * 100);
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressMeta}>
        <Text style={styles.progressTitle}>
          {COLETA_WIZARD_STEPS[stepIndex]?.shortTitle}
        </Text>
        <Text style={styles.progressPct}>{pct}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stepChips}
      >
        {COLETA_WIZARD_STEPS.map((step, i) => {
          const active = i === stepIndex;
          const done = i < stepIndex;
          return (
            <Pressable
              key={step.id}
              onPress={() => onGoTo(i)}
              style={[
                styles.stepChip,
                active && styles.stepChipActive,
                done && styles.stepChipDone,
              ]}
            >
              <Text
                style={[
                  styles.stepChipText,
                  done && styles.stepChipTextDone,
                  active && styles.stepChipTextActive,
                ]}
              >
                {i + 1}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function ColetaForm({ initial, onSaved }: Props) {
  const [form, setForm] = useState<ColetaFormState>(() =>
    initial ? formFromPayload(initial.payload) : emptyForm(),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<ColetaFormErrors>({});
  const [saving, setSaving] = useState(false);

  const step = COLETA_WIZARD_STEPS[stepIndex]!;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === COLETA_WIZARD_STEPS.length - 1;
  const isReview = step.id === "revisao";

  function set<K extends keyof ColetaFormState>(
    key: K,
    value: ColetaFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index >= COLETA_WIZARD_STEPS.length) return;
      if (index <= stepIndex) {
        setStepIndex(index);
        setErrors({});
        return;
      }
      for (let i = stepIndex; i < index; i++) {
        const s = COLETA_WIZARD_STEPS[i]!;
        if (s.id === "revisao") continue;
        const result = validateColetaStep(form, s.id as ColetaWizardStepId);
        if (!result.ok) {
          setStepIndex(i);
          setErrors(result.errors);
          Alert.alert(
            "Etapa incompleta",
            "Complete esta etapa antes de avançar.",
          );
          return;
        }
      }
      setStepIndex(index);
      setErrors({});
    },
    [form, stepIndex],
  );

  const goNext = useCallback(() => {
    if (isLast) return;
    if (!isReview) {
      const result = validateColetaStep(form, step.id);
      if (!result.ok) {
        setErrors(result.errors);
        Alert.alert(
          "Campos inválidos",
          "Corrija os campos destacados para continuar.",
        );
        return;
      }
    }
    setErrors({});
    setStepIndex((i) => Math.min(i + 1, COLETA_WIZARD_STEPS.length - 1));
  }, [form, isLast, isReview, step.id]);

  const goBack = useCallback(() => {
    setErrors({});
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  async function handleSave() {
    const result = validateColetaForm(form);
    if (!result.ok || !result.payload) {
      setErrors(result.errors);
      const firstErrorStep = COLETA_WIZARD_STEPS.findIndex((s) =>
        s.fields.some((f) => Boolean(result.errors[f])),
      );
      if (firstErrorStep >= 0) setStepIndex(firstErrorStep);
      Alert.alert(
        "Campos inválidos",
        "Revise os campos destacados antes de salvar.",
      );
      return;
    }

    setSaving(true);
    try {
      const local = await saveColeta(result.payload, initial?.id);

      const online = await isOnline();
      if (online) {
        try {
          await syncOne(local);
          Alert.alert("Salvo e sincronizado", "Enviado para a API com sucesso.");
          onSaved({
            ...local,
            sincronizado: true,
            lastError: null,
          });
          return;
        } catch {
          Alert.alert(
            "Salvo offline",
            "Sem sucesso no envio. O registro ficou na fila de sincronização.",
          );
          onSaved(local);
          return;
        }
      }

      Alert.alert(
        "Salvo localmente",
        "Sem internet. O registro será sincronizado quando a conexão voltar.",
      );
      onSaved(local);
    } finally {
      setSaving(false);
    }
  }

  const barreirasLabels = useMemo(
    () =>
      form.barreiras
        .map((c) => labelOf(BARREIRA_OPTIONS, c) || c)
        .filter(Boolean)
        .join(", "),
    [form.barreiras],
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <WizardProgress stepIndex={stepIndex} onGoTo={goToStep} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepHeading}>{step.title}</Text>

        {step.id === "aluno" ? (
          <>
            <Segmented
              label="Momento"
              value={form.momentoCodigo}
              onChange={(v) => set("momentoCodigo", v)}
              options={[
                { value: "T2", label: "T2 — Campo" },
                { value: "T3", label: "T3 — Reavaliação" },
              ]}
            />
            <Field
              label="Código do aluno *"
              value={form.codigoAluno}
              onChangeText={(t) => set("codigoAluno", t)}
              autoCapitalize="characters"
              error={errors.codigoAluno}
              placeholder="ALU-1001"
            />
            <Field
              label="Nome completo *"
              value={form.nomeAluno}
              onChangeText={(t) => set("nomeAluno", t)}
              error={errors.nomeAluno}
            />
            <Field
              label="CPF (opcional)"
              value={maskCpf(form.cpfAluno)}
              onChangeText={(t) => set("cpfAluno", onlyDigits(t))}
              keyboardType="number-pad"
              error={errors.cpfAluno}
              placeholder="000.000.000-00"
            />
            <Field
              label="Data de nascimento *"
              value={maskDateBr(form.dataNascimento)}
              onChangeText={(t) => set("dataNascimento", maskDateBr(t))}
              keyboardType="number-pad"
              placeholder="DD/MM/AAAA"
              maxLength={10}
              error={errors.dataNascimento}
            />
            <Segmented
              label="Sexo (opcional)"
              value={form.sexo || ""}
              onChange={(v) => set("sexo", v as ColetaFormState["sexo"])}
              options={[
                { value: "", label: "—" },
                { value: "F", label: "Feminino" },
                { value: "M", label: "Masculino" },
              ]}
            />
          </>
        ) : null}

        {step.id === "familia" ? (
          <>
            <Text style={styles.section}>Residência / família</Text>
            <Field
              label="Código da família *"
              value={form.codigoFamilia}
              onChangeText={(t) => set("codigoFamilia", t)}
              autoCapitalize="characters"
              error={errors.codigoFamilia}
              placeholder="FAM-001"
            />
            <Field
              label="Endereço *"
              value={form.endereco}
              onChangeText={(t) => set("endereco", t)}
              error={errors.endereco}
            />
            <Field
              label="Bairro *"
              value={form.bairro}
              onChangeText={(t) => set("bairro", t)}
              error={errors.bairro}
            />
            <Field
              label="Comunidade *"
              value={form.comunidade}
              onChangeText={(t) => set("comunidade", t)}
              error={errors.comunidade}
            />
            <Segmented
              label="Tipo de localidade *"
              value={form.tipoLocalidade}
              onChange={(v) => set("tipoLocalidade", v)}
              options={[
                { value: "", label: "—" },
                ...TIPO_LOCALIDADE_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                })),
              ]}
              error={errors.tipoLocalidade}
            />
            <Field
              label="Qtd. moradores *"
              value={form.qtdMoradores}
              onChangeText={(t) => set("qtdMoradores", t.replace(/\D/g, ""))}
              keyboardType="number-pad"
              error={errors.qtdMoradores}
            />
            <Field
              label="Renda familiar mensal (R$) *"
              value={form.rendaFamiliarMensal}
              onChangeText={(t) => set("rendaFamiliarMensal", maskCurrencyInput(t))}
              keyboardType="decimal-pad"
              error={errors.rendaFamiliarMensal}
              placeholder="1.200,00"
            />
            <BoolSwitch
              label="Recebe benefício social?"
              value={form.recebeBeneficioSocial}
              onChange={(v) => {
                set("recebeBeneficioSocial", v);
                if (!v) set("beneficioSocial", "");
              }}
            />
            {form.recebeBeneficioSocial ? (
              <Segmented
                label="Qual benefício? *"
                value={form.beneficioSocial}
                onChange={(v) => set("beneficioSocial", v)}
                options={[
                  { value: "", label: "—" },
                  ...BENEFICIO_SOCIAL_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  })),
                ]}
                error={errors.beneficioSocial}
              />
            ) : null}
            <BoolSwitch
              label="Possui internet em casa?"
              value={form.possuiInternetCasa}
              onChange={(v) => {
                set("possuiInternetCasa", v);
                if (!v) set("tipoAcessoInternet", "");
              }}
            />
            {form.possuiInternetCasa ? (
              <Segmented
                label="Tipo de acesso *"
                value={form.tipoAcessoInternet}
                onChange={(v) => set("tipoAcessoInternet", v)}
                options={[
                  { value: "", label: "—" },
                  ...TIPO_ACESSO_INTERNET_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  })),
                ]}
                error={errors.tipoAcessoInternet}
              />
            ) : null}

            <Text style={styles.section}>Responsável</Text>
            <Field
              label="Nome completo *"
              value={form.nomeResponsavel}
              onChangeText={(t) => set("nomeResponsavel", t)}
              error={errors.nomeResponsavel}
            />
            <Segmented
              label="Parentesco *"
              value={form.parentesco}
              onChange={(v) => set("parentesco", v)}
              options={[
                { value: "", label: "—" },
                ...PARENTESCO_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                })),
              ]}
              error={errors.parentesco}
            />
            <Field
              label="CPF"
              value={maskCpf(form.cpfResponsavel)}
              onChangeText={(t) => set("cpfResponsavel", onlyDigits(t))}
              keyboardType="number-pad"
              error={errors.cpfResponsavel}
              placeholder="000.000.000-00"
            />
            <Field
              label="Telefone"
              value={maskPhone(form.telefone)}
              onChangeText={(t) => set("telefone", onlyDigits(t))}
              keyboardType="phone-pad"
              error={errors.telefone}
              placeholder="(92) 93001-1001"
            />
            <Field
              label="E-mail"
              value={form.email}
              onChangeText={(t) => set("email", t)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Segmented
              label="Escolaridade do responsável *"
              value={form.escolaridade}
              onChange={(v) => set("escolaridade", v)}
              options={[
                { value: "", label: "—" },
                ...ESCOLARIDADE_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                })),
              ]}
              error={errors.escolaridade}
            />
            <Segmented
              label="Situação ocupacional *"
              value={form.situacaoOcupacional}
              onChange={(v) => set("situacaoOcupacional", v)}
              options={[
                { value: "", label: "—" },
                ...SITUACAO_OCUPACIONAL_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                })),
              ]}
              error={errors.situacaoOcupacional}
            />
          </>
        ) : null}

        {step.id === "socioeconomico" ? (
          <>
            <Segmented
              label="Meio de transporte *"
              value={form.meioTransporteEscola}
              onChange={(v) => set("meioTransporteEscola", v)}
              options={[
                { value: "", label: "—" },
                ...MEIO_TRANSPORTE_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                })),
              ]}
              error={errors.meioTransporteEscola}
            />
            <Field
              label="Tempo de deslocamento (min) *"
              value={form.tempoDeslocamentoMin}
              onChangeText={(t) =>
                set("tempoDeslocamentoMin", t.replace(/\D/g, ""))
              }
              keyboardType="number-pad"
              error={errors.tempoDeslocamentoMin}
            />
            <Segmented
              label="Ano / série *"
              value={form.anoSerie}
              onChange={(v) => set("anoSerie", v)}
              options={[
                { value: "", label: "—" },
                ...ANO_SERIE_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                })),
              ]}
              error={errors.anoSerie}
            />
            <Segmented
              label="Turno *"
              value={form.turno}
              onChange={(v) => set("turno", v)}
              options={[
                { value: "", label: "—" },
                ...TURNO_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                })),
              ]}
              error={errors.turno}
            />
            <BoolSwitch
              label="Necessidade educacional especial?"
              value={form.necessidadeEducacionalEspecial}
              onChange={(v) => {
                set("necessidadeEducacionalEspecial", v);
                if (!v) set("descricaoNecessidade", "");
              }}
            />
            {form.necessidadeEducacionalEspecial ? (
              <Field
                label="Descrição da necessidade *"
                value={form.descricaoNecessidade}
                onChangeText={(t) => set("descricaoNecessidade", t)}
                error={errors.descricaoNecessidade}
                multiline
              />
            ) : null}
            <Field
              label="Observações"
              value={form.observacao}
              onChangeText={(t) => set("observacao", t)}
              multiline
              style={{ minHeight: 80, textAlignVertical: "top" }}
            />
          </>
        ) : null}

        {step.id === "educacional" ? (
          <>
            <Segmented
              label="Equipamento de estudo *"
              value={form.equipamentoEstudo}
              onChange={(v) => {
                setForm((prev) => ({
                  ...prev,
                  equipamentoEstudo: v as ColetaFormState["equipamentoEstudo"],
                  disponibilidadeEquipamento:
                    v === "NENHUM"
                      ? "N_A"
                      : prev.disponibilidadeEquipamento === "N_A"
                        ? ""
                        : prev.disponibilidadeEquipamento,
                }));
                setErrors((e) => ({
                  ...e,
                  equipamentoEstudo: undefined,
                  disponibilidadeEquipamento: undefined,
                }));
              }}
              options={[
                { value: "", label: "—" },
                ...EQUIPAMENTO_ESTUDO_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                })),
              ]}
              error={errors.equipamentoEstudo}
            />
            {form.equipamentoEstudo !== "NENHUM" ? (
              <Segmented
                label="Disponibilidade do equipamento *"
                value={form.disponibilidadeEquipamento}
                onChange={(v) => set("disponibilidadeEquipamento", v)}
                options={[
                  { value: "", label: "—" },
                  ...DISPONIBILIDADE_EQUIPAMENTO_OPTIONS.filter(
                    (o) => o.value !== "N_A",
                  ).map((o) => ({
                    value: o.value,
                    label: o.label,
                  })),
                ]}
                error={errors.disponibilidadeEquipamento}
              />
            ) : null}
            <Segmented
              label="Tem local adequado para estudar? *"
              value={form.localEstudo}
              onChange={(v) => set("localEstudo", v)}
              options={[
                { value: "", label: "—" },
                ...LOCAL_ESTUDO_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                })),
              ]}
              error={errors.localEstudo}
            />
            <Segmented
              label="Acompanhamento familiar nos estudos *"
              value={form.acompanhamentoFamiliar}
              onChange={(v) => set("acompanhamentoFamiliar", v)}
              options={[
                { value: "", label: "—" },
                ...ACOMPANHAMENTO_FAMILIAR_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                })),
              ]}
              error={errors.acompanhamentoFamiliar}
            />
            <Segmented
              label="Apoio prioritário *"
              value={form.apoioPrioritario}
              onChange={(v) => set("apoioPrioritario", v)}
              options={[
                { value: "", label: "—" },
                ...APOIO_PRIORITARIO_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                })),
              ]}
              error={errors.apoioPrioritario}
            />
            <MultiSelectChips
              label="Barreiras à frequência / acompanhamento *"
              hint="Pode marcar várias. 'Nenhuma' exclui as demais."
              values={form.barreiras}
              options={BARREIRA_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              onToggle={(code) => {
                setForm((prev) => ({
                  ...prev,
                  barreiras: toggleBarreira(
                    prev.barreiras,
                    code,
                  ) as ColetaFormState["barreiras"],
                }));
                if (errors.barreiras) {
                  setErrors((e) => ({ ...e, barreiras: undefined }));
                }
              }}
              error={errors.barreiras}
            />
          </>
        ) : null}

        {isReview ? (
          <View style={styles.reviewCard}>
            <Text style={styles.reviewHint}>
              Confira os dados antes de salvar. Use Voltar para corrigir.
            </Text>

            <Text style={styles.reviewSection}>Aluno</Text>
            <ReviewRow label="Momento" value={form.momentoCodigo} />
            <ReviewRow label="Código" value={form.codigoAluno} />
            <ReviewRow label="Nome" value={form.nomeAluno} />
            <ReviewRow label="CPF" value={maskCpf(form.cpfAluno)} />
            <ReviewRow
              label="Nascimento"
              value={maskDateBr(form.dataNascimento)}
            />
            <ReviewRow
              label="Sexo"
              value={
                form.sexo === "F"
                  ? "Feminino"
                  : form.sexo === "M"
                    ? "Masculino"
                    : ""
              }
            />

            <Text style={styles.reviewSection}>Família</Text>
            <ReviewRow label="Cód. família" value={form.codigoFamilia} />
            <ReviewRow label="Endereço" value={form.endereco} />
            <ReviewRow label="Bairro" value={form.bairro} />
            <ReviewRow label="Comunidade" value={form.comunidade} />
            <ReviewRow
              label="Localidade"
              value={
                labelOf(TIPO_LOCALIDADE_OPTIONS, form.tipoLocalidade) ||
                form.tipoLocalidade
              }
            />
            <ReviewRow label="Moradores" value={form.qtdMoradores} />
            <ReviewRow label="Renda" value={form.rendaFamiliarMensal} />
            <ReviewRow
              label="Benefício"
              value={
                form.recebeBeneficioSocial
                  ? labelOf(BENEFICIO_SOCIAL_OPTIONS, form.beneficioSocial) ||
                    form.beneficioSocial
                  : "Não"
              }
            />
            <ReviewRow
              label="Internet"
              value={
                form.possuiInternetCasa
                  ? labelOf(
                      TIPO_ACESSO_INTERNET_OPTIONS,
                      form.tipoAcessoInternet,
                    ) || form.tipoAcessoInternet
                  : "Não"
              }
            />
            <ReviewRow label="Responsável" value={form.nomeResponsavel} />
            <ReviewRow
              label="Parentesco"
              value={
                labelOf(PARENTESCO_OPTIONS, form.parentesco) || form.parentesco
              }
            />
            <ReviewRow label="CPF resp." value={maskCpf(form.cpfResponsavel)} />
            <ReviewRow label="Telefone" value={maskPhone(form.telefone)} />
            <ReviewRow label="E-mail" value={form.email} />
            <ReviewRow
              label="Escolaridade"
              value={
                labelOf(ESCOLARIDADE_OPTIONS, form.escolaridade) ||
                form.escolaridade
              }
            />
            <ReviewRow
              label="Ocupação"
              value={
                labelOf(SITUACAO_OCUPACIONAL_OPTIONS, form.situacaoOcupacional) ||
                form.situacaoOcupacional
              }
            />

            <Text style={styles.reviewSection}>Escola</Text>
            <ReviewRow
              label="Transporte"
              value={
                labelOf(MEIO_TRANSPORTE_OPTIONS, form.meioTransporteEscola) ||
                form.meioTransporteEscola
              }
            />
            <ReviewRow label="Desloc. (min)" value={form.tempoDeslocamentoMin} />
            <ReviewRow
              label="Ano/série"
              value={labelOf(ANO_SERIE_OPTIONS, form.anoSerie) || form.anoSerie}
            />
            <ReviewRow
              label="Turno"
              value={labelOf(TURNO_OPTIONS, form.turno) || form.turno}
            />
            <ReviewRow
              label="NEE"
              value={
                form.necessidadeEducacionalEspecial
                  ? form.descricaoNecessidade || "Sim"
                  : "Não"
              }
            />
            <ReviewRow label="Observação" value={form.observacao} />

            <Text style={styles.reviewSection}>Educacional</Text>
            <ReviewRow
              label="Equipamento"
              value={
                labelOf(EQUIPAMENTO_ESTUDO_OPTIONS, form.equipamentoEstudo) ||
                form.equipamentoEstudo
              }
            />
            <ReviewRow
              label="Disponibilidade"
              value={
                labelOf(
                  DISPONIBILIDADE_EQUIPAMENTO_OPTIONS,
                  form.disponibilidadeEquipamento,
                ) || form.disponibilidadeEquipamento
              }
            />
            <ReviewRow
              label="Local de estudo"
              value={
                labelOf(LOCAL_ESTUDO_OPTIONS, form.localEstudo) ||
                form.localEstudo
              }
            />
            <ReviewRow
              label="Acompanhamento"
              value={
                labelOf(
                  ACOMPANHAMENTO_FAMILIAR_OPTIONS,
                  form.acompanhamentoFamiliar,
                ) || form.acompanhamentoFamiliar
              }
            />
            <ReviewRow
              label="Apoio prioritário"
              value={
                labelOf(APOIO_PRIORITARIO_OPTIONS, form.apoioPrioritario) ||
                form.apoioPrioritario
              }
            />
            <ReviewRow label="Barreiras" value={barreirasLabels} />
          </View>
        ) : null}

        <View style={styles.navRow}>
          {!isFirst ? (
            <View style={styles.navHalf}>
              <PrimaryButton
                title="Voltar"
                onPress={goBack}
                disabled={saving}
                variant="secondary"
              />
            </View>
          ) : (
            <View style={styles.navHalf} />
          )}
          <View style={styles.navHalf}>
            {isLast ? (
              <PrimaryButton
                title={saving ? "Salvando…" : "Salvar e sincronizar"}
                onPress={() => void handleSave()}
                disabled={saving}
              />
            ) : (
              <PrimaryButton
                title="Avançar"
                onPress={goNext}
                disabled={saving}
              />
            )}
          </View>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  progressWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  progressPct: { fontSize: 13, fontWeight: "600", color: "#0F766E" },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#0F766E",
  },
  stepChips: { flexDirection: "row", gap: 8, paddingBottom: 2 },
  stepChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  stepChipActive: {
    backgroundColor: "#0F766E",
    borderColor: "#0F766E",
  },
  stepChipDone: {
    backgroundColor: "#CCFBF1",
    borderColor: "#5EEAD4",
  },
  stepChipText: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  stepChipTextDone: { color: "#0F766E" },
  stepChipTextActive: { color: "#FFFFFF" },
  content: { padding: 16, paddingBottom: 40 },
  stepHeading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
  },
  section: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 17,
    fontWeight: "700",
    color: "#0F766E",
  },
  reviewCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    gap: 2,
  },
  reviewHint: { fontSize: 13, color: "#64748B", marginBottom: 8 },
  reviewSection: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 15,
    fontWeight: "700",
    color: "#0F766E",
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  reviewLabel: {
    fontSize: 13,
    color: "#64748B",
    flexShrink: 0,
    maxWidth: "42%",
  },
  reviewValue: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  navRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  navHalf: { flex: 1 },
});
