import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { SearchableSelect } from "@/components/SearchableSelect";
import { MultiSelectChips } from "@/components/MultiSelectChips";
import { PrimaryButton } from "@/components/BoolSwitch";
import { gerarCodigoAluno, gerarCodigoFamilia, gerarCodigos } from "@/lib/codigos";
import {
  applyAlunoLookupToForm,
  applyFamiliaLookupToForm,
  buscarCadastroPorCodigo,
} from "@/lib/cadastro-lookup";
import {
  listarOpcoesAlunosExistentes,
  listarOpcoesFamiliasExistentes,
  type CadastroSelectOption,
} from "@/lib/cadastro-opcoes";
import { isOnline, syncOne } from "@/lib/sync";
import { saveColeta } from "@/lib/storage";
import { verificarUnicidadeCodigos } from "@/lib/unicidade";
import {
  maskCpf,
  maskCurrencyInput,
  maskDateBr,
  maskPhone,
  onlyDigits,
} from "@/lib/masks";
import {
  COLETA_WIZARD_STEPS,
  emptyForm,
  formFromPayload,
  validateColetaForm,
  validateColetaStep,
  type ColetaFormErrors,
  type ColetaWizardStepId,
} from "@/lib/validation";
import type { ColetaFormState, ColetaLocal, ColetaPayload } from "@/lib/types";
import {
  ACOMPANHAMENTO_FAMILIAR_OPTIONS,
  ANO_SERIE_OPTIONS,
  APOIO_NENHUM,
  APOIO_PRIORITARIO_OPTIONS,
  BAIRRO_OPTIONS,
  BARREIRA_OPTIONS,
  BENEFICIO_SOCIAL_OPTIONS,
  DISPONIBILIDADE_EQUIPAMENTO_OPTIONS,
  EQUIPAMENTO_ESTUDO_OPTIONS,
  EQUIPAMENTO_EXCLUSIVOS,
  ESCOLARIDADE_OPTIONS,
  LOCAL_ESTUDO_OPTIONS,
  MAX_APOIOS_PRIORITARIOS,
  MEIO_TRANSPORTE_OPTIONS,
  NECESSIDADE_EDUCACIONAL_OPTIONS,
  NECESSIDADE_OUTRA,
  PARENTESCO_OPTIONS,
  SITUACAO_OCUPACIONAL_OPTIONS,
  TIPO_ACESSO_INTERNET_OPTIONS,
  TIPO_LOCALIDADE_OPTIONS,
  TURNO_OPTIONS,
  labelOf,
  labelsOf,
  toggleBarreira,
  toggleEquipamentoEstudo,
  toggleExclusiveCode,
} from "@/lib/opcoes-questionario";

const ETAPA_COLETA_OPTIONS = [
  { value: "T2", label: "Coleta em campo" },
  { value: "T3", label: "Reavaliação" },
] as const;

const ORIGEM_CODIGO_OPTIONS = [
  { value: "novo", label: "Novo" },
  { value: "existente", label: "Existente" },
] as const;

type OrigemCodigo = "novo" | "existente";

type Props = {
  initial?: ColetaLocal | null;
  onSaved: (item: ColetaLocal) => void;
};

const SIM_NAO = [
  { value: "SIM", label: "Sim" },
  { value: "NAO", label: "Não" },
] as const;

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Garante que o loading fique visível mesmo se a operação for rápida. */
async function withMinDuration<T>(
  work: Promise<T>,
  minMs = 450,
): Promise<T> {
  const [result] = await Promise.all([work, wait(minMs)]);
  return result;
}

function alertMessagesFromErrors(errors: ColetaFormErrors): {
  title: string;
  message: string;
} {
  const entries = Object.entries(errors).filter(
    (e): e is [string, string] => Boolean(e[1]),
  );
  if (entries.length === 0) {
    return {
      title: "Etapa incompleta",
      message: "Complete os campos desta etapa para continuar.",
    };
  }
  const [[field, first]] = entries;
  if (field === "momentoCodigo") {
    return {
      title: "Etapa da coleta",
      message:
        first ||
        "Escolha se esta é uma coleta em campo ou uma reavaliação para continuar.",
    };
  }
  if (entries.length === 1) {
    return { title: "Campo obrigatório", message: first };
  }
  return {
    title: "Campos pendentes",
    message: `${first}\n\nHá mais ${entries.length - 1} campo(s) nesta etapa para preencher.`,
  };
}

function CadastroBusyBanner({ message }: { message: string }) {
  return (
    <View style={styles.busyBanner} accessibilityRole="progressbar">
      <ActivityIndicator color="#0F766E" />
      <Text style={styles.busyBannerText}>{message}</Text>
    </View>
  );
}

function boolToSeg(v: boolean | null): "" | "SIM" | "NAO" {
  if (v === null) return "";
  return v ? "SIM" : "NAO";
}

function segToBool(v: string): boolean | null {
  if (v === "SIM") return true;
  if (v === "NAO") return false;
  return null;
}

function chipOpts<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
) {
  return options.map((o) => ({ value: o.value, label: o.label }));
}

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
  const [generatingCodes, setGeneratingCodes] = useState(false);
  const [buscandoAluno, setBuscandoAluno] = useState(false);
  const [buscandoFamilia, setBuscandoFamilia] = useState(false);
  const [cadastroBusyMsg, setCadastroBusyMsg] = useState<string | null>(null);
  const [opcoesAlunos, setOpcoesAlunos] = useState<CadastroSelectOption[]>([]);
  const [opcoesFamilias, setOpcoesFamilias] = useState<CadastroSelectOption[]>(
    [],
  );
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [carregandoFamilias, setCarregandoFamilias] = useState(false);
  const [origemAluno, setOrigemAluno] = useState<OrigemCodigo>(() =>
    initial ? "existente" : "novo",
  );
  const [origemFamilia, setOrigemFamilia] = useState<OrigemCodigo>(() =>
    initial ? "existente" : "novo",
  );
  const isNewColeta = !initial;

  const step = COLETA_WIZARD_STEPS[stepIndex]!;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === COLETA_WIZARD_STEPS.length - 1;
  const isReview = step.id === "revisao";

  const gerarAlunoNovo = useCallback(async () => {
    setGeneratingCodes(true);
    try {
      const codigoAluno = await gerarCodigoAluno({
        evitar: form.codigoAluno ? [form.codigoAluno] : [],
      });
      setForm((prev) => ({ ...prev, codigoAluno }));
      setErrors((e) => ({ ...e, codigoAluno: undefined }));
    } catch {
      Alert.alert(
        "Não foi possível gerar",
        "Tente de novo. Se estiver offline, o código será gerado neste aparelho.",
      );
    } finally {
      setGeneratingCodes(false);
    }
  }, [form.codigoAluno]);

  const gerarFamiliaNova = useCallback(async () => {
    setGeneratingCodes(true);
    try {
      const codigoFamilia = await gerarCodigoFamilia({
        evitar: form.codigoFamilia ? [form.codigoFamilia] : [],
      });
      setForm((prev) => ({ ...prev, codigoFamilia }));
      setErrors((e) => ({ ...e, codigoFamilia: undefined }));
    } catch {
      Alert.alert(
        "Não foi possível gerar",
        "Tente de novo. Se estiver offline, o código será gerado neste aparelho.",
      );
    } finally {
      setGeneratingCodes(false);
    }
  }, [form.codigoFamilia]);

  const gerarAmbosNovos = useCallback(async () => {
    setGeneratingCodes(true);
    try {
      const codes = await gerarCodigos({
        evitarAluno: form.codigoAluno ? [form.codigoAluno] : [],
        evitarFamilia: form.codigoFamilia ? [form.codigoFamilia] : [],
      });
      setForm((prev) => ({
        ...prev,
        codigoAluno: codes.codigoAluno,
        codigoFamilia: codes.codigoFamilia,
      }));
      setErrors((e) => ({
        ...e,
        codigoAluno: undefined,
        codigoFamilia: undefined,
      }));
    } catch {
      Alert.alert(
        "Não foi possível gerar",
        "Tente de novo. Se estiver offline, os códigos serão gerados neste aparelho.",
      );
    } finally {
      setGeneratingCodes(false);
    }
  }, [form.codigoAluno, form.codigoFamilia]);

  useEffect(() => {
    if (!isNewColeta) return;
    if (origemAluno !== "novo" && origemFamilia !== "novo") return;
    void (async () => {
      if (origemAluno === "novo" && origemFamilia === "novo") {
        if (!form.codigoAluno || !form.codigoFamilia) await gerarAmbosNovos();
        return;
      }
      if (origemAluno === "novo" && !form.codigoAluno) await gerarAlunoNovo();
      if (origemFamilia === "novo" && !form.codigoFamilia) {
        await gerarFamiliaNova();
      }
    })();
    // Só na montagem de coleta nova
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregarOpcoesAlunos = useCallback(async () => {
    setCarregandoAlunos(true);
    try {
      setOpcoesAlunos(await listarOpcoesAlunosExistentes());
    } finally {
      setCarregandoAlunos(false);
    }
  }, []);

  const carregarOpcoesFamilias = useCallback(async () => {
    setCarregandoFamilias(true);
    try {
      setOpcoesFamilias(await listarOpcoesFamiliasExistentes());
    } finally {
      setCarregandoFamilias(false);
    }
  }, []);

  useEffect(() => {
    if (origemAluno === "existente") void carregarOpcoesAlunos();
  }, [origemAluno, carregarOpcoesAlunos]);

  useEffect(() => {
    if (origemFamilia === "existente") void carregarOpcoesFamilias();
  }, [origemFamilia, carregarOpcoesFamilias]);

  const cadastroOcupado =
    Boolean(cadastroBusyMsg) ||
    buscandoAluno ||
    buscandoFamilia ||
    generatingCodes;

  async function onChangeOrigemAluno(next: OrigemCodigo) {
    if (cadastroOcupado) return;
    if (form.momentoCodigo === "T3" && next === "novo") {
      Alert.alert(
        "Reavaliação",
        "Na reavaliação, selecione um aluno já cadastrado.",
      );
      return;
    }
    setOrigemAluno(next);
    if (next === "novo") {
      // Voltar a “novo” descarta qualquer aluno/família carregados da busca
      setOrigemFamilia("novo");
      setGeneratingCodes(true);
      setCadastroBusyMsg("Limpando dados e gerando novos códigos…");
      try {
        await withMinDuration(
          (async () => {
            const codes = await gerarCodigos({
              evitarAluno: form.codigoAluno ? [form.codigoAluno] : [],
              evitarFamilia: form.codigoFamilia ? [form.codigoFamilia] : [],
            });
            setForm((prev) => ({
              ...prev,
              codigoAluno: codes.codigoAluno,
              codigoFamilia: codes.codigoFamilia,
              nomeAluno: "",
              dataNascimento: "",
              sexo: "",
              cpfAluno: "",
              nomeResponsavel: "",
              parentesco: "",
              cpfResponsavel: "",
              telefone: "",
              email: "",
              escolaridade: "",
              situacaoOcupacional: "",
              endereco: "",
              bairro: "",
              comunidade: "",
              tipoLocalidade: "",
              qtdMoradores: "",
              rendaFamiliarMensal: "",
              recebeBeneficioSocial: null,
              beneficioSocial: "",
              possuiInternetCasa: null,
              tipoAcessoInternet: "",
            }));
            setErrors((e) => ({
              ...e,
              codigoAluno: undefined,
              codigoFamilia: undefined,
              nomeAluno: undefined,
              dataNascimento: undefined,
              sexo: undefined,
              cpfAluno: undefined,
              nomeResponsavel: undefined,
              parentesco: undefined,
              cpfResponsavel: undefined,
              telefone: undefined,
              email: undefined,
              escolaridade: undefined,
              situacaoOcupacional: undefined,
              endereco: undefined,
              bairro: undefined,
              comunidade: undefined,
              tipoLocalidade: undefined,
              qtdMoradores: undefined,
              rendaFamiliarMensal: undefined,
              recebeBeneficioSocial: undefined,
              beneficioSocial: undefined,
              possuiInternetCasa: undefined,
              tipoAcessoInternet: undefined,
            }));
          })(),
        );
      } catch {
        Alert.alert(
          "Não foi possível gerar",
          "Tente de novo. Se estiver offline, os códigos serão gerados neste aparelho.",
        );
      } finally {
        setGeneratingCodes(false);
        setCadastroBusyMsg(null);
      }
      return;
    }
    // Preparando lista: limpa pré-preenchimento de família até escolher um aluno
    setOrigemFamilia("novo");
    setCadastroBusyMsg("Preparando seleção de aluno existente…");
    try {
      await withMinDuration(
        (async () => {
          setForm((prev) => ({
            ...prev,
            codigoAluno: "",
            nomeAluno: "",
            dataNascimento: "",
            sexo: "",
            cpfAluno: "",
            nomeResponsavel: "",
            parentesco: "",
            cpfResponsavel: "",
            telefone: "",
            email: "",
            escolaridade: "",
            situacaoOcupacional: "",
            codigoFamilia: "",
            endereco: "",
            bairro: "",
            comunidade: "",
            tipoLocalidade: "",
            qtdMoradores: "",
            rendaFamiliarMensal: "",
            recebeBeneficioSocial: null,
            beneficioSocial: "",
            possuiInternetCasa: null,
            tipoAcessoInternet: "",
          }));
          setErrors((e) => ({
            ...e,
            codigoAluno: undefined,
            codigoFamilia: undefined,
            nomeAluno: undefined,
            dataNascimento: undefined,
            sexo: undefined,
            cpfAluno: undefined,
            nomeResponsavel: undefined,
            parentesco: undefined,
            cpfResponsavel: undefined,
            telefone: undefined,
            email: undefined,
            escolaridade: undefined,
            situacaoOcupacional: undefined,
            endereco: undefined,
            bairro: undefined,
            comunidade: undefined,
            tipoLocalidade: undefined,
            qtdMoradores: undefined,
            rendaFamiliarMensal: undefined,
            recebeBeneficioSocial: undefined,
            beneficioSocial: undefined,
            possuiInternetCasa: undefined,
            tipoAcessoInternet: undefined,
          }));
          await carregarOpcoesAlunos();
        })(),
      );
    } finally {
      setCadastroBusyMsg(null);
    }
  }

  async function onChangeOrigemFamilia(next: OrigemCodigo) {
    if (cadastroOcupado) return;
    if (form.momentoCodigo === "T3" && next === "novo") {
      Alert.alert(
        "Reavaliação",
        "Na reavaliação, use a família já vinculada ao aluno.",
      );
      return;
    }
    setOrigemFamilia(next);
    if (next === "novo") {
      setGeneratingCodes(true);
      setCadastroBusyMsg("Limpando dados e gerando novo código da família…");
      try {
        await withMinDuration(
          (async () => {
            const codigoFamilia = await gerarCodigoFamilia({
              evitar: form.codigoFamilia ? [form.codigoFamilia] : [],
            });
            setForm((prev) => ({
              ...prev,
              codigoFamilia,
              endereco: "",
              bairro: "",
              comunidade: "",
              tipoLocalidade: "",
              qtdMoradores: "",
              rendaFamiliarMensal: "",
              recebeBeneficioSocial: null,
              beneficioSocial: "",
              possuiInternetCasa: null,
              tipoAcessoInternet: "",
            }));
            setErrors((e) => ({
              ...e,
              codigoFamilia: undefined,
              endereco: undefined,
              bairro: undefined,
              comunidade: undefined,
              tipoLocalidade: undefined,
              qtdMoradores: undefined,
              rendaFamiliarMensal: undefined,
              recebeBeneficioSocial: undefined,
              beneficioSocial: undefined,
              possuiInternetCasa: undefined,
              tipoAcessoInternet: undefined,
            }));
          })(),
        );
      } catch {
        Alert.alert(
          "Não foi possível gerar",
          "Tente de novo. Se estiver offline, o código será gerado neste aparelho.",
        );
      } finally {
        setGeneratingCodes(false);
        setCadastroBusyMsg(null);
      }
      return;
    }
    setCadastroBusyMsg("Preparando seleção de família existente…");
    try {
      await withMinDuration(
        (async () => {
          setForm((prev) => ({
            ...prev,
            codigoFamilia: "",
            endereco: "",
            bairro: "",
            comunidade: "",
            tipoLocalidade: "",
            qtdMoradores: "",
            rendaFamiliarMensal: "",
            recebeBeneficioSocial: null,
            beneficioSocial: "",
            possuiInternetCasa: null,
            tipoAcessoInternet: "",
          }));
          setErrors((e) => ({
            ...e,
            codigoFamilia: undefined,
            endereco: undefined,
            bairro: undefined,
            comunidade: undefined,
            tipoLocalidade: undefined,
            qtdMoradores: undefined,
            rendaFamiliarMensal: undefined,
            recebeBeneficioSocial: undefined,
            beneficioSocial: undefined,
            possuiInternetCasa: undefined,
            tipoAcessoInternet: undefined,
          }));
          await carregarOpcoesFamilias();
        })(),
      );
    } finally {
      setCadastroBusyMsg(null);
    }
  }

  async function selecionarAlunoExistente(codigo: string) {
    if (cadastroOcupado) return;
    setBuscandoAluno(true);
    setCadastroBusyMsg("Carregando informações do aluno…");
    try {
      const found = await withMinDuration(
        buscarCadastroPorCodigo({ codigoAluno: codigo }),
      );
      if (!found.aluno) {
        Alert.alert(
          "Não encontrado",
          `Nenhum aluno com o código ${codigo}. Atualize a lista ou escolha outro.`,
        );
        return;
      }
      setOrigemFamilia("existente");
      setForm((prev) =>
        applyAlunoLookupToForm(prev, {
          aluno: found.aluno!,
          familia: found.familia,
        }),
      );
      setErrors((e) => ({
        ...e,
        codigoAluno: undefined,
        codigoFamilia: undefined,
      }));
    } finally {
      setBuscandoAluno(false);
      setCadastroBusyMsg(null);
    }
  }

  async function selecionarFamiliaExistente(codigo: string) {
    if (cadastroOcupado) return;
    setBuscandoFamilia(true);
    setCadastroBusyMsg("Carregando informações da família…");
    try {
      const found = await withMinDuration(
        buscarCadastroPorCodigo({ codigoFamilia: codigo }),
      );
      if (!found.familia) {
        Alert.alert(
          "Não encontrada",
          `Nenhuma família com o código ${codigo}. Atualize a lista ou escolha outra.`,
        );
        return;
      }
      setForm((prev) => applyFamiliaLookupToForm(prev, found.familia!));
      setErrors((e) => ({ ...e, codigoFamilia: undefined }));
    } finally {
      setBuscandoFamilia(false);
      setCadastroBusyMsg(null);
    }
  }

  function set<K extends keyof ColetaFormState>(
    key: K,
    value: ColetaFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function onChangeMomento(v: ColetaFormState["momentoCodigo"]) {
    set("momentoCodigo", v);
    if (!isNewColeta) return;
    // Reavaliação = aluno (e família) já existentes — não faz sentido “novo”.
    if (v === "T3") {
      if (origemAluno === "novo") {
        void onChangeOrigemAluno("existente");
      } else if (origemFamilia === "novo") {
        setOrigemFamilia("existente");
      }
    }
  }

  const isReavaliacao = form.momentoCodigo === "T3";
  const origemAlunoOptions = isReavaliacao
    ? ([{ value: "existente", label: "Existente" }] as const)
    : ORIGEM_CODIGO_OPTIONS;
  const origemFamiliaOptions = isReavaliacao
    ? ([{ value: "existente", label: "Existente" }] as const)
    : ([
        { value: "novo", label: "Nova" },
        { value: "existente", label: "Existente" },
      ] as const);

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
          const alert = alertMessagesFromErrors(result.errors);
          Alert.alert(alert.title, alert.message);
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
        const alert = alertMessagesFromErrors(result.errors);
        Alert.alert(alert.title, alert.message);
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

  async function persistAfterChecks(payload: ColetaPayload) {
    setSaving(true);
    try {
      const local = await saveColeta(payload, initial?.id);

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
        } catch (error) {
          const msg =
            error instanceof Error
              ? error.message
              : "Sem sucesso no envio. O registro ficou na fila de sincronização.";
          Alert.alert(
            msg.includes("vinculado") || msg.includes("CONFLICT")
              ? "Código em conflito"
              : "Salvo offline",
            msg.includes("vinculado") || msg.includes("CONFLICT")
              ? msg.replace(/^CONFLICT:\s*/i, "")
              : "Sem sucesso no envio. O registro ficou na fila de sincronização.",
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

    const payload = result.payload;
    setSaving(true);
    try {
      const unicidade = await verificarUnicidadeCodigos(payload, {
        excludeLocalId: initial?.id,
      });

      if (!unicidade.ok) {
        setErrors((e) => ({
          ...e,
          ...(unicidade.field ? { [unicidade.field]: unicidade.message } : {}),
        }));
        if (unicidade.field === "codigoAluno") setStepIndex(0);
        else if (unicidade.field === "codigoFamilia") setStepIndex(2);
        Alert.alert("Código já utilizado", unicidade.message);
        return;
      }

      if (unicidade.warnings.length > 0) {
        setSaving(false);
        Alert.alert("Código já cadastrado", unicidade.warnings.join("\n\n"), [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Continuar",
            onPress: () => {
              void persistAfterChecks(payload);
            },
          },
        ]);
        return;
      }

      await persistAfterChecks(payload);
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
      <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        pointerEvents={saving ? "none" : "auto"}
        style={saving ? styles.formSavingDim : undefined}
      >
        <Text style={styles.stepHeading}>{step.title}</Text>

        {step.id === "aluno" ? (
          <>
            <Text style={styles.stepIntro}>
              Dados de identificação do aluno. A entrevista é feita com o
              responsável.
            </Text>
            <Segmented
              label="Etapa da coleta *"
              value={form.momentoCodigo}
              onChange={(v) =>
                onChangeMomento(v as ColetaFormState["momentoCodigo"])
              }
              options={[...ETAPA_COLETA_OPTIONS]}
              error={errors.momentoCodigo}
            />
            <Text style={styles.fieldHelp}>
              Use “Coleta em campo” na visita principal e “Reavaliação” quando
              for retornar para acompanhar o mesmo aluno (sempre a partir de um
              cadastro existente).
            </Text>
            <Segmented
              label="Código do aluno *"
              value={origemAluno}
              onChange={(v) => {
                if (cadastroOcupado) return;
                if (isReavaliacao && v === "novo") {
                  Alert.alert(
                    "Reavaliação",
                    "Na reavaliação, selecione um aluno já cadastrado.",
                  );
                  return;
                }
                void onChangeOrigemAluno(v as OrigemCodigo);
              }}
              options={[...origemAlunoOptions]}
            />
            {cadastroBusyMsg ? (
              <CadastroBusyBanner message={cadastroBusyMsg} />
            ) : null}
            {origemAluno === "novo" ? (
              <>
                <Field
                  label="Código gerado"
                  value={form.codigoAluno}
                  editable={false}
                  error={errors.codigoAluno}
                  placeholder="Gerando…"
                  style={styles.inputReadonly}
                />
                <Text style={styles.fieldHelp}>
                  Novo aluno: o código é gerado automaticamente.
                </Text>
                {isNewColeta ? (
                  <View style={{ marginBottom: 12 }}>
                    <PrimaryButton
                      title={
                        generatingCodes
                          ? "Gerando…"
                          : "Gerar novo código do aluno"
                      }
                      onPress={() => void gerarAlunoNovo()}
                      disabled={generatingCodes || saving}
                      variant="secondary"
                    />
                  </View>
                ) : null}
              </>
            ) : (
              <>
                <SearchableSelect
                  label="Selecionar aluno existente *"
                  value={form.codigoAluno}
                  options={opcoesAlunos}
                  onChange={(codigo) => void selecionarAlunoExistente(codigo)}
                  error={errors.codigoAluno}
                  placeholder="Buscar por nome, responsável ou código…"
                  emptyMessage={
                    carregandoAlunos
                      ? "Carregando alunos…"
                      : "Nenhum aluno cadastrado encontrado. Verifique a conexão ou salve uma coleta antes."
                  }
                  loading={carregandoAlunos || buscandoAluno}
                  disabled={cadastroOcupado}
                />
                <Text style={styles.fieldHelp}>
                  Reavaliação: busque pelo nome do aluno ou do responsável. Os
                  dados dele e da família serão preenchidos automaticamente.
                </Text>
                <View style={{ marginBottom: 12 }}>
                  <PrimaryButton
                    title={
                      carregandoAlunos
                        ? "Atualizando lista…"
                        : "Atualizar lista de alunos"
                    }
                    onPress={() => void carregarOpcoesAlunos()}
                    disabled={carregandoAlunos || saving || cadastroOcupado}
                    variant="secondary"
                  />
                </View>
              </>
            )}
            <View
              pointerEvents={cadastroOcupado ? "none" : "auto"}
              style={cadastroOcupado ? styles.formDimmed : undefined}
            >
            <Field
              label="Nome completo do aluno *"
              value={form.nomeAluno}
              onChangeText={(t) => set("nomeAluno", t)}
              error={errors.nomeAluno}
            />
            <Field
              label="CPF do aluno (opcional)"
              value={maskCpf(form.cpfAluno)}
              onChangeText={(t) => set("cpfAluno", onlyDigits(t))}
              keyboardType="number-pad"
              error={errors.cpfAluno}
              placeholder="000.000.000-00"
            />
            <Field
              label="Data de nascimento do aluno *"
              value={maskDateBr(form.dataNascimento)}
              onChangeText={(t) => set("dataNascimento", maskDateBr(t))}
              keyboardType="number-pad"
              placeholder="DD/MM/AAAA"
              maxLength={10}
              error={errors.dataNascimento}
            />
            <Segmented
              label="Sexo do aluno (opcional)"
              value={form.sexo || ""}
              onChange={(v) => set("sexo", v as ColetaFormState["sexo"])}
              options={[
                { value: "F", label: "Feminino" },
                { value: "M", label: "Masculino" },
              ]}
            />
            </View>
          </>
        ) : null}

        {step.id === "responsavel" ? (
          <>
            <Text style={styles.stepIntro}>
              Dados do responsável que está respondendo a entrevista.
            </Text>
            <Field
              label="Nome completo do responsável entrevistado *"
              value={form.nomeResponsavel}
              onChangeText={(t) => set("nomeResponsavel", t)}
              error={errors.nomeResponsavel}
            />
            <Segmented
              label="Parentesco com o aluno *"
              value={form.parentesco}
              onChange={(v) => set("parentesco", v)}
              options={chipOpts(PARENTESCO_OPTIONS)}
              error={errors.parentesco}
            />
            <Field
              label="CPF do responsável (opcional)"
              value={maskCpf(form.cpfResponsavel)}
              onChangeText={(t) => set("cpfResponsavel", onlyDigits(t))}
              keyboardType="number-pad"
              error={errors.cpfResponsavel}
              placeholder="000.000.000-00"
            />
            <Field
              label="Telefone *"
              value={maskPhone(form.telefone)}
              onChangeText={(t) => set("telefone", onlyDigits(t))}
              keyboardType="phone-pad"
              error={errors.telefone}
              placeholder="(92) 93001-1001"
            />
            <Field
              label="E-mail (opcional)"
              value={form.email}
              onChangeText={(t) => set("email", t)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Segmented
              label="Situação ocupacional *"
              value={form.situacaoOcupacional}
              onChange={(v) => set("situacaoOcupacional", v)}
              options={chipOpts(SITUACAO_OCUPACIONAL_OPTIONS)}
              error={errors.situacaoOcupacional}
            />
          </>
        ) : null}

        {step.id === "familia" ? (
          <>
            <Text style={styles.stepIntro}>
              Dados da residência e do contexto socioeconômico da família.
            </Text>
            <Segmented
              label="Código da família *"
              value={origemFamilia}
              onChange={(v) => {
                if (cadastroOcupado) return;
                if (isReavaliacao && v === "novo") {
                  Alert.alert(
                    "Reavaliação",
                    "Na reavaliação, use a família já vinculada ao aluno.",
                  );
                  return;
                }
                void onChangeOrigemFamilia(v as OrigemCodigo);
              }}
              options={[...origemFamiliaOptions]}
            />
            {cadastroBusyMsg ? (
              <CadastroBusyBanner message={cadastroBusyMsg} />
            ) : null}
            {origemFamilia === "novo" ? (
              <>
                <Field
                  label="Código gerado"
                  value={form.codigoFamilia}
                  editable={false}
                  error={errors.codigoFamilia}
                  placeholder="Gerando…"
                  style={styles.inputReadonly}
                />
                <Text style={styles.fieldHelp}>
                  Família nova: o código é gerado automaticamente. Para irmão
                  na mesma casa, use “Existente”.
                </Text>
                {isNewColeta ? (
                  <View style={{ marginBottom: 12 }}>
                    <PrimaryButton
                      title={
                        generatingCodes
                          ? "Gerando…"
                          : "Gerar novo código da família"
                      }
                      onPress={() => void gerarFamiliaNova()}
                      disabled={generatingCodes || saving}
                      variant="secondary"
                    />
                  </View>
                ) : null}
              </>
            ) : (
              <>
                <SearchableSelect
                  label="Selecionar família existente *"
                  value={form.codigoFamilia}
                  options={opcoesFamilias}
                  onChange={(codigo) => void selecionarFamiliaExistente(codigo)}
                  error={errors.codigoFamilia}
                  placeholder="Buscar por responsável, aluno ou código…"
                  emptyMessage={
                    carregandoFamilias
                      ? "Carregando famílias…"
                      : "Nenhuma família cadastrada encontrada."
                  }
                  loading={carregandoFamilias || buscandoFamilia}
                  disabled={origemAluno === "existente" || cadastroOcupado}
                />
                <Text style={styles.fieldHelp}>
                  {origemAluno === "existente"
                    ? "Vinculada ao aluno selecionado. Para trocar, escolha outro aluno."
                    : "Irmão na mesma casa: busque pelo nome do responsável ou de um aluno já cadastrado na família (não precisa saber o código)."}
                </Text>
                {origemAluno !== "existente" ? (
                  <View style={{ marginBottom: 12 }}>
                    <PrimaryButton
                      title={
                        carregandoFamilias
                          ? "Atualizando lista…"
                          : "Atualizar lista de famílias"
                      }
                      onPress={() => void carregarOpcoesFamilias()}
                      disabled={carregandoFamilias || saving || cadastroOcupado}
                      variant="secondary"
                    />
                  </View>
                ) : null}
              </>
            )}
            <View
              pointerEvents={cadastroOcupado ? "none" : "auto"}
              style={cadastroOcupado ? styles.formDimmed : undefined}
            >
            <Field
              label="Endereço *"
              value={form.endereco}
              onChangeText={(t) => set("endereco", t)}
              error={errors.endereco}
            />
            <SearchableSelect
              label="Bairro *"
              value={form.bairro}
              onChange={(v) => set("bairro", v)}
              options={chipOpts(BAIRRO_OPTIONS)}
              error={errors.bairro}
              placeholder="Buscar bairro…"
            />
            <Field
              label="Comunidade (opcional)"
              value={form.comunidade}
              onChangeText={(t) => set("comunidade", t)}
              error={errors.comunidade}
              placeholder="Se houver (ex.: comunidade ribeirinha)"
            />
            <Segmented
              label="Tipo de localidade *"
              value={form.tipoLocalidade}
              onChange={(v) => set("tipoLocalidade", v)}
              options={chipOpts(TIPO_LOCALIDADE_OPTIONS)}
              error={errors.tipoLocalidade}
            />
            <Field
              label="Quantidade de moradores da residência *"
              value={form.qtdMoradores}
              onChangeText={(t) => set("qtdMoradores", t.replace(/\D/g, ""))}
              keyboardType="number-pad"
              error={errors.qtdMoradores}
            />
            <Text style={styles.fieldHelp}>Incluindo o entrevistado.</Text>
            <Field
              label="Renda familiar mensal (R$) *"
              value={form.rendaFamiliarMensal}
              onChangeText={(t) =>
                set("rendaFamiliarMensal", maskCurrencyInput(t))
              }
              keyboardType="number-pad"
              error={errors.rendaFamiliarMensal}
              placeholder="0,00"
            />
            <Text style={styles.fieldHelp}>
              Digite só números (centavos). Ex.: 120050 → R$ 1.200,50.
            </Text>
            <Segmented
              label="Recebe benefício social? *"
              value={boolToSeg(form.recebeBeneficioSocial)}
              onChange={(v) => {
                const next = segToBool(v);
                set("recebeBeneficioSocial", next);
                if (!next) set("beneficioSocial", "");
              }}
              options={[...SIM_NAO]}
              error={errors.recebeBeneficioSocial}
            />
            {form.recebeBeneficioSocial ? (
              <Segmented
                label="Qual benefício? *"
                value={form.beneficioSocial}
                onChange={(v) => set("beneficioSocial", v)}
                options={chipOpts(BENEFICIO_SOCIAL_OPTIONS)}
                error={errors.beneficioSocial}
              />
            ) : null}
            <Segmented
              label="Qual é o nível mais alto de escolaridade entre os adultos que moram com o aluno? *"
              value={form.escolaridade}
              onChange={(v) => set("escolaridade", v)}
              options={chipOpts(ESCOLARIDADE_OPTIONS)}
              error={errors.escolaridade}
            />
            </View>
          </>
        ) : null}

        {step.id === "escolar" ? (
          <>
            <Text style={styles.stepIntro}>
              As próximas perguntas são sobre a situação escolar atual do aluno
              e sua frequência à escola.
            </Text>
            <Segmented
              label="Ano / série do aluno *"
              value={form.anoSerie}
              onChange={(v) => set("anoSerie", v)}
              options={chipOpts(ANO_SERIE_OPTIONS)}
              error={errors.anoSerie}
            />
            <Segmented
              label="Turno *"
              value={form.turno}
              onChange={(v) => set("turno", v)}
              options={chipOpts(TURNO_OPTIONS)}
              error={errors.turno}
            />
            <Segmented
              label="Frequência escolar do aluno *"
              value={
                form.frequenciaEscolarPct === "NAO_SABE"
                  ? "NAO_SABE"
                  : form.frequenciaEscolarPct !== ""
                    ? "INFORMAR"
                    : ""
              }
              onChange={(v) => {
                if (v === "NAO_SABE") {
                  set("frequenciaEscolarPct", "NAO_SABE");
                } else {
                  set(
                    "frequenciaEscolarPct",
                    form.frequenciaEscolarPct === "NAO_SABE"
                      ? ""
                      : form.frequenciaEscolarPct,
                  );
                }
              }}
              options={[
                { value: "INFORMAR", label: "Informar percentual" },
                { value: "NAO_SABE", label: "Não sabe informar" },
              ]}
              error={
                form.frequenciaEscolarPct === "NAO_SABE" ||
                form.frequenciaEscolarPct === ""
                  ? errors.frequenciaEscolarPct
                  : undefined
              }
            />
            {form.frequenciaEscolarPct !== "NAO_SABE" ? (
              <Field
                label="Percentual de frequência (0 a 100) *"
                value={form.frequenciaEscolarPct}
                onChangeText={(t) =>
                  set(
                    "frequenciaEscolarPct",
                    t.replace(/\D/g, "").slice(0, 3),
                  )
                }
                keyboardType="number-pad"
                error={errors.frequenciaEscolarPct}
                placeholder="0 a 100"
              />
            ) : null}
            <Segmented
              label="Meio de transporte utilizado para ir à escola *"
              value={form.meioTransporteEscola}
              onChange={(v) => set("meioTransporteEscola", v)}
              options={chipOpts(MEIO_TRANSPORTE_OPTIONS)}
              error={errors.meioTransporteEscola}
            />
            <Field
              label="Tempo médio de deslocamento do aluno até a escola (min) *"
              value={form.tempoDeslocamentoMin}
              onChangeText={(t) =>
                set("tempoDeslocamentoMin", t.replace(/\D/g, ""))
              }
              keyboardType="number-pad"
              error={errors.tempoDeslocamentoMin}
            />
            <Text style={styles.fieldHelp}>Informe um número inteiro (0 ou mais).</Text>
            <MultiSelectChips
              label="Hoje, quais fatores podem dificultar a frequência do aluno à escola? *"
              hint="Pode marcar várias. 'Nenhuma' exclui as demais."
              values={form.barreiras}
              options={chipOpts(BARREIRA_OPTIONS)}
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

        {step.id === "estudo" ? (
          <>
            <Text style={styles.stepIntro}>
              As próximas perguntas são sobre os recursos, condições de estudo e
              apoio disponíveis ao aluno.
            </Text>
            <Segmented
              label="O aluno possui acesso à internet em casa para estudar? *"
              value={boolToSeg(form.possuiInternetCasa)}
              onChange={(v) => {
                const next = segToBool(v);
                set("possuiInternetCasa", next);
                if (!next) set("tipoAcessoInternet", "");
              }}
              options={[...SIM_NAO]}
              error={errors.possuiInternetCasa}
            />
            {form.possuiInternetCasa ? (
              <Segmented
                label="Qual é o principal tipo de acesso à internet utilizado pelo aluno? *"
                value={form.tipoAcessoInternet}
                onChange={(v) => set("tipoAcessoInternet", v)}
                options={chipOpts(TIPO_ACESSO_INTERNET_OPTIONS)}
                error={errors.tipoAcessoInternet}
              />
            ) : null}
            <MultiSelectChips
              label="Quais equipamentos o aluno tem disponíveis para estudar? *"
              hint="Pode marcar vários. 'Nenhum' ou 'Não sabe informar' excluem as demais."
              bypassMaxValues={[...EQUIPAMENTO_EXCLUSIVOS]}
              values={form.equipamentosEstudo}
              options={chipOpts(EQUIPAMENTO_ESTUDO_OPTIONS)}
              onToggle={(code) => {
                setForm((prev) => {
                  const next = toggleEquipamentoEstudo(
                    prev.equipamentosEstudo,
                    code,
                  ) as ColetaFormState["equipamentosEstudo"];
                  const semDispositivo =
                    next.length === 1 &&
                    (EQUIPAMENTO_EXCLUSIVOS as readonly string[]).includes(
                      next[0]!,
                    );
                  return {
                    ...prev,
                    equipamentosEstudo: next,
                    disponibilidadeEquipamento: semDispositivo
                      ? "N_A"
                      : prev.disponibilidadeEquipamento === "N_A"
                        ? ""
                        : prev.disponibilidadeEquipamento,
                  };
                });
                setErrors((e) => ({
                  ...e,
                  equipamentosEstudo: undefined,
                  disponibilidadeEquipamento: undefined,
                }));
              }}
              error={errors.equipamentosEstudo}
            />
            {!form.equipamentosEstudo.some((c) =>
              (EQUIPAMENTO_EXCLUSIVOS as readonly string[]).includes(c),
            ) && form.equipamentosEstudo.length > 0 ? (
              <Segmented
                label="Qual é a disponibilidade desses equipamentos para o aluno estudar? *"
                value={form.disponibilidadeEquipamento}
                onChange={(v) => set("disponibilidadeEquipamento", v)}
                options={chipOpts(
                  DISPONIBILIDADE_EQUIPAMENTO_OPTIONS.filter(
                    (o) => o.value !== "N_A",
                  ),
                )}
                error={errors.disponibilidadeEquipamento}
              />
            ) : null}
            <Segmented
              label="O aluno tem em casa um local adequado para estudar? *"
              value={form.localEstudo}
              onChange={(v) => set("localEstudo", v)}
              options={chipOpts(LOCAL_ESTUDO_OPTIONS)}
              error={errors.localEstudo}
            />
            <Segmented
              label="Com que frequência algum adulto acompanha o aluno nos estudos? *"
              value={form.acompanhamentoFamiliar}
              onChange={(v) => set("acompanhamentoFamiliar", v)}
              options={chipOpts(ACOMPANHAMENTO_FAMILIAR_OPTIONS)}
              error={errors.acompanhamentoFamiliar}
            />
            <Segmented
              label="O aluno possui alguma deficiência, condição do neurodesenvolvimento ou outra necessidade específica que possa demandar apoio ou adaptação no ambiente escolar? *"
              value={boolToSeg(form.necessidadeEducacionalEspecial)}
              onChange={(v) => {
                const next = segToBool(v);
                setForm((prev) => ({
                  ...prev,
                  necessidadeEducacionalEspecial: next,
                  necessidadesEducacionais: next
                    ? prev.necessidadesEducacionais
                    : [],
                  necessidadeOutraDescricao: next
                    ? prev.necessidadeOutraDescricao
                    : "",
                }));
                setErrors((e) => ({
                  ...e,
                  necessidadeEducacionalEspecial: undefined,
                  necessidadesEducacionais: undefined,
                  necessidadeOutraDescricao: undefined,
                }));
              }}
              options={[...SIM_NAO]}
              error={errors.necessidadeEducacionalEspecial}
            />
            {form.necessidadeEducacionalEspecial ? (
              <>
                <MultiSelectChips
                  label="Se sim, quais condições ou necessidades? *"
                  hint="Pode selecionar mais de uma. Em 'Outra', descreva qual."
                  values={form.necessidadesEducacionais}
                  options={chipOpts(NECESSIDADE_EDUCACIONAL_OPTIONS)}
                  onToggle={(code) => {
                    setForm((prev) => {
                      const next = prev.necessidadesEducacionais.includes(
                        code as (typeof prev.necessidadesEducacionais)[number],
                      )
                        ? prev.necessidadesEducacionais.filter((c) => c !== code)
                        : [
                            ...prev.necessidadesEducacionais,
                            code as (typeof prev.necessidadesEducacionais)[number],
                          ];
                      return {
                        ...prev,
                        necessidadesEducacionais: next,
                        necessidadeOutraDescricao: next.includes(
                          NECESSIDADE_OUTRA,
                        )
                          ? prev.necessidadeOutraDescricao
                          : "",
                      };
                    });
                    if (
                      errors.necessidadesEducacionais ||
                      errors.necessidadeOutraDescricao
                    ) {
                      setErrors((e) => ({
                        ...e,
                        necessidadesEducacionais: undefined,
                        necessidadeOutraDescricao: undefined,
                      }));
                    }
                  }}
                  error={errors.necessidadesEducacionais}
                />
                {form.necessidadesEducacionais.includes(NECESSIDADE_OUTRA) ? (
                  <Field
                    label="Qual outra condição ou necessidade? *"
                    value={form.necessidadeOutraDescricao}
                    onChangeText={(t) => {
                      set("necessidadeOutraDescricao", t);
                    }}
                    placeholder="Descreva brevemente"
                    error={errors.necessidadeOutraDescricao}
                  />
                ) : null}
              </>
            ) : null}
            <MultiSelectChips
              label="Em qual área o aluno mais precisa de apoio atualmente? *"
              hint="Selecione até 2 opções. 'Nenhum' exclui as demais."
              max={MAX_APOIOS_PRIORITARIOS}
              bypassMaxValues={[APOIO_NENHUM]}
              values={form.apoiosPrioritarios}
              options={chipOpts(APOIO_PRIORITARIO_OPTIONS)}
              onToggle={(code) => {
                setForm((prev) => ({
                  ...prev,
                  apoiosPrioritarios: toggleExclusiveCode(
                    prev.apoiosPrioritarios,
                    code,
                    APOIO_NENHUM,
                    MAX_APOIOS_PRIORITARIOS,
                  ) as ColetaFormState["apoiosPrioritarios"],
                }));
                if (errors.apoiosPrioritarios) {
                  setErrors((e) => ({ ...e, apoiosPrioritarios: undefined }));
                }
              }}
              error={errors.apoiosPrioritarios}
            />
            <Field
              label="Observações gerais (opcional)"
              value={form.observacao}
              onChangeText={(t) => set("observacao", t)}
              error={errors.observacao}
              multiline
              placeholder="Registre informações relevantes da entrevista"
            />
          </>
        ) : null}

        {isReview ? (
          <View style={styles.reviewCard}>
            <Text style={styles.reviewHint}>
              Confira os dados antes de salvar. Use Voltar para corrigir.
            </Text>

            <Text style={styles.reviewSection}>Aluno</Text>
            <ReviewRow
              label="Etapa"
              value={labelOf(ETAPA_COLETA_OPTIONS, form.momentoCodigo)}
            />
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

            <Text style={styles.reviewSection}>Responsável</Text>
            <ReviewRow label="Nome" value={form.nomeResponsavel} />
            <ReviewRow
              label="Parentesco"
              value={
                labelOf(PARENTESCO_OPTIONS, form.parentesco) || form.parentesco
              }
            />
            <ReviewRow label="CPF" value={maskCpf(form.cpfResponsavel)} />
            <ReviewRow label="Telefone" value={maskPhone(form.telefone)} />
            <ReviewRow label="E-mail" value={form.email} />
            <ReviewRow
              label="Ocupação"
              value={
                labelOf(SITUACAO_OCUPACIONAL_OPTIONS, form.situacaoOcupacional) ||
                form.situacaoOcupacional
              }
            />

            <Text style={styles.reviewSection}>Família</Text>
            <ReviewRow label="Cód. família" value={form.codigoFamilia} />
            <ReviewRow label="Endereço" value={form.endereco} />
            <ReviewRow
              label="Bairro"
              value={labelOf(BAIRRO_OPTIONS, form.bairro)}
            />
            <ReviewRow
              label="Comunidade"
              value={form.comunidade.trim() || "—"}
            />
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
                form.recebeBeneficioSocial === null
                  ? ""
                  : form.recebeBeneficioSocial
                    ? labelOf(BENEFICIO_SOCIAL_OPTIONS, form.beneficioSocial) ||
                      form.beneficioSocial
                    : "Não"
              }
            />
            <ReviewRow
              label="Escolaridade (adultos)"
              value={
                labelOf(ESCOLARIDADE_OPTIONS, form.escolaridade) ||
                form.escolaridade
              }
            />

            <Text style={styles.reviewSection}>Situação escolar</Text>
            <ReviewRow
              label="Ano/série"
              value={labelOf(ANO_SERIE_OPTIONS, form.anoSerie) || form.anoSerie}
            />
            <ReviewRow
              label="Turno"
              value={labelOf(TURNO_OPTIONS, form.turno) || form.turno}
            />
            <ReviewRow
              label="Frequência"
              value={
                form.frequenciaEscolarPct === "NAO_SABE"
                  ? "Não sabe informar"
                  : form.frequenciaEscolarPct
                    ? `${form.frequenciaEscolarPct}%`
                    : ""
              }
            />
            <ReviewRow
              label="Transporte"
              value={
                labelOf(MEIO_TRANSPORTE_OPTIONS, form.meioTransporteEscola) ||
                form.meioTransporteEscola
              }
            />
            <ReviewRow label="Desloc. (min)" value={form.tempoDeslocamentoMin} />
            <ReviewRow label="Barreiras" value={barreirasLabels} />

            <Text style={styles.reviewSection}>Condições de estudo</Text>
            <ReviewRow
              label="Internet"
              value={
                form.possuiInternetCasa === null
                  ? ""
                  : form.possuiInternetCasa
                    ? labelOf(
                        TIPO_ACESSO_INTERNET_OPTIONS,
                        form.tipoAcessoInternet,
                      ) || form.tipoAcessoInternet
                    : "Não"
              }
            />
            <ReviewRow
              label="Equipamentos"
              value={labelsOf(
                EQUIPAMENTO_ESTUDO_OPTIONS,
                form.equipamentosEstudo,
              )}
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
              label="Necessidades / condições"
              value={
                form.necessidadeEducacionalEspecial === null
                  ? ""
                  : form.necessidadeEducacionalEspecial
                    ? [
                        labelsOf(
                          NECESSIDADE_EDUCACIONAL_OPTIONS,
                          form.necessidadesEducacionais,
                        ),
                        form.necessidadesEducacionais.includes(NECESSIDADE_OUTRA) &&
                        form.necessidadeOutraDescricao.trim()
                          ? `(${form.necessidadeOutraDescricao.trim()})`
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ") || "Sim"
                    : "Não"
              }
            />
            <ReviewRow
              label="Apoio prioritário"
              value={labelsOf(
                APOIO_PRIORITARIO_OPTIONS,
                form.apoiosPrioritarios,
              )}
            />
            <ReviewRow label="Observações" value={form.observacao} />
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
                loading={saving}
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
      {saving ? (
        <View style={styles.savingOverlay} pointerEvents="auto">
          <View style={styles.savingCard}>
            <ActivityIndicator size="large" color="#0F766E" />
            <Text style={styles.savingCardText}>Salvando coleta…</Text>
          </View>
        </View>
      ) : null}
      </View>
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
    marginBottom: 6,
  },
  stepIntro: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 14,
  },
  fieldHelp: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 17,
    marginTop: -6,
    marginBottom: 12,
  },
  busyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#99F6E4",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  busyBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#0F766E",
    lineHeight: 18,
  },
  formDimmed: {
    opacity: 0.45,
  },
  formSavingDim: {
    opacity: 0.4,
  },
  savingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 23, 42, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  savingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: "center",
    gap: 12,
    minWidth: 180,
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  savingCardText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F766E",
  },
  inputReadonly: {
    backgroundColor: "#F1F5F9",
    color: "#334155",
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
