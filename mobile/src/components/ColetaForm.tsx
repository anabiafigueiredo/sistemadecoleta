import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Field } from "@/components/Field";
import { Segmented } from "@/components/Segmented";
import { BoolSwitch, PrimaryButton } from "@/components/BoolSwitch";
import { maskCpf, maskCurrencyInput, maskDateBr, maskPhone, onlyDigits } from "@/lib/masks";
import { isOnline, syncOne } from "@/lib/sync";
import { saveColeta } from "@/lib/storage";
import {
  emptyForm,
  formFromPayload,
  validateColetaForm,
  type ColetaFormErrors,
} from "@/lib/validation";
import type { ColetaFormState, ColetaLocal } from "@/lib/types";

type Props = {
  initial?: ColetaLocal | null;
  onSaved: (item: ColetaLocal) => void;
};

export function ColetaForm({ initial, onSaved }: Props) {
  const [form, setForm] = useState<ColetaFormState>(() =>
    initial ? formFromPayload(initial.payload) : emptyForm(),
  );
  const [errors, setErrors] = useState<ColetaFormErrors>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof ColetaFormState>(
    key: K,
    value: ColetaFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSave() {
    const result = validateColetaForm(form);
    if (!result.ok || !result.payload) {
      setErrors(result.errors);
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.section}>Ciclo de monitoramento</Text>
        <Segmented
          label="Momento"
          value={form.momentoCodigo}
          onChange={(v) => set("momentoCodigo", v)}
          options={[
            { value: "T2", label: "T2 — Campo" },
            { value: "T3", label: "T3 — Reavaliação" },
          ]}
        />

        <Text style={styles.section}>Aluno</Text>
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
          label="CPF"
          value={maskCpf(form.cpfAluno)}
          onChangeText={(t) => set("cpfAluno", onlyDigits(t))}
          keyboardType="number-pad"
          error={errors.cpfAluno}
          placeholder="000.000.000-00"
        />
        <Field
          label="Data de nascimento"
          value={maskDateBr(form.dataNascimento)}
          onChangeText={(t) => set("dataNascimento", maskDateBr(t))}
          keyboardType="number-pad"
          placeholder="DD/MM/AAAA"
          maxLength={10}
          error={errors.dataNascimento}
        />
        <Segmented
          label="Sexo"
          value={form.sexo || ""}
          onChange={(v) => set("sexo", v as ColetaFormState["sexo"])}
          options={[
            { value: "", label: "—" },
            { value: "F", label: "Feminino" },
            { value: "M", label: "Masculino" },
          ]}
        />

        <Text style={styles.section}>Família</Text>
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
          onChange={(v) => set("recebeBeneficioSocial", v)}
        />
        {form.recebeBeneficioSocial ? (
          <Field
            label="Qual benefício? *"
            value={form.beneficioSocial}
            onChangeText={(t) => set("beneficioSocial", t)}
            error={errors.beneficioSocial}
            placeholder="Bolsa Família"
          />
        ) : null}
        <BoolSwitch
          label="Possui internet em casa?"
          value={form.possuiInternetCasa}
          onChange={(v) => set("possuiInternetCasa", v)}
        />
        {form.possuiInternetCasa ? (
          <Field
            label="Tipo de acesso *"
            value={form.tipoAcessoInternet}
            onChangeText={(t) => set("tipoAcessoInternet", t)}
            error={errors.tipoAcessoInternet}
            placeholder="Wi-Fi"
          />
        ) : null}

        <Text style={styles.section}>Responsável</Text>
        <Field
          label="Nome completo *"
          value={form.nomeResponsavel}
          onChangeText={(t) => set("nomeResponsavel", t)}
          error={errors.nomeResponsavel}
        />
        <Field
          label="Parentesco *"
          value={form.parentesco}
          onChangeText={(t) => set("parentesco", t)}
          error={errors.parentesco}
          placeholder="Mãe"
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

        <Text style={styles.section}>Pesquisa socioeconômica</Text>
        <Field
          label="Meio de transporte *"
          value={form.meioTransporteEscola}
          onChangeText={(t) => set("meioTransporteEscola", t)}
          error={errors.meioTransporteEscola}
          placeholder="Ônibus"
        />
        <Field
          label="Tempo de deslocamento (min) *"
          value={form.tempoDeslocamentoMin}
          onChangeText={(t) => set("tempoDeslocamentoMin", t.replace(/\D/g, ""))}
          keyboardType="number-pad"
          error={errors.tempoDeslocamentoMin}
        />
        <Field
          label="Frequência escolar (%) *"
          value={form.frequenciaEscolarPct}
          onChangeText={(t) =>
            set("frequenciaEscolarPct", t.replace(/[^\d.,]/g, ""))
          }
          keyboardType="decimal-pad"
          error={errors.frequenciaEscolarPct}
        />
        <Field
          label="Ano / série *"
          value={form.anoSerie}
          onChangeText={(t) => set("anoSerie", t)}
          error={errors.anoSerie}
          placeholder="4º ano EF"
        />
        <Field
          label="Turno *"
          value={form.turno}
          onChangeText={(t) => set("turno", t)}
          error={errors.turno}
          placeholder="Matutino"
        />
        <BoolSwitch
          label="Necessidade educacional especial?"
          value={form.necessidadeEducacionalEspecial}
          onChange={(v) => set("necessidadeEducacionalEspecial", v)}
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

        <PrimaryButton
          title={saving ? "Salvando…" : "Salvar coleta"}
          onPress={() => void handleSave()}
          disabled={saving}
        />
        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  section: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 17,
    fontWeight: "700",
    color: "#0F766E",
  },
});
