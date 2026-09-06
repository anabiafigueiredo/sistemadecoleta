import { z } from "zod";
import type { ColetaFormState, ColetaPayload } from "@/lib/types";
import { cpfErrorMessage, onlyDigits, parseCurrencyToNumber } from "@/lib/masks";
import {
  ACOMPANHAMENTO_FAMILIAR_OPTIONS,
  ANO_SERIE_OPTIONS,
  APOIO_PRIORITARIO_OPTIONS,
  BARREIRA_NENHUMA,
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
} from "@/lib/opcoes-questionario";

const optionalDigits = z
  .string()
  .transform((v: string) => {
    const d = onlyDigits(v);
    return d.length > 0 ? d : null;
  });

function valuesOf<T extends string>(
  options: ReadonlyArray<{ value: T }>,
): [T, ...T[]] {
  return options.map((o) => o.value) as [T, ...T[]];
}

const tipoLocalidadeValues = valuesOf(TIPO_LOCALIDADE_OPTIONS);
const escolaridadeValues = valuesOf(ESCOLARIDADE_OPTIONS);
const situacaoValues = valuesOf(SITUACAO_OCUPACIONAL_OPTIONS);
const equipamentoValues = valuesOf(EQUIPAMENTO_ESTUDO_OPTIONS);
const disponibilidadeValues = valuesOf(DISPONIBILIDADE_EQUIPAMENTO_OPTIONS);
const localEstudoValues = valuesOf(LOCAL_ESTUDO_OPTIONS);
const acompanhamentoValues = valuesOf(ACOMPANHAMENTO_FAMILIAR_OPTIONS);
const apoioValues = valuesOf(APOIO_PRIORITARIO_OPTIONS);
const barreiraValues = valuesOf(BARREIRA_OPTIONS);
const meioTransporteValues = valuesOf(MEIO_TRANSPORTE_OPTIONS);
const turnoValues = valuesOf(TURNO_OPTIONS);
const anoSerieValues = valuesOf(ANO_SERIE_OPTIONS);
const tipoAcessoValues = valuesOf(TIPO_ACESSO_INTERNET_OPTIONS);
const beneficioValues = valuesOf(BENEFICIO_SOCIAL_OPTIONS);
const parentescoValues = valuesOf(PARENTESCO_OPTIONS);

function requiredEnum(
  values: readonly string[],
  message: string,
) {
  return z.string().refine(
    (v: string) => values.includes(v),
    message,
  );
}

const coletaFormObject = z.object({
  momentoCodigo: z.enum(["T2", "T3"]),
  codigoFamilia: z.string().trim().min(1, "Código da família é obrigatório"),
  endereco: z.string().trim().min(1, "Endereço é obrigatório"),
  bairro: z.string().trim().min(1, "Bairro é obrigatório"),
  comunidade: z.string().trim().min(1, "Comunidade é obrigatória"),
  tipoLocalidade: requiredEnum(
    tipoLocalidadeValues,
    "Selecione o tipo de localidade",
  ),
  qtdMoradores: z
    .string()
    .trim()
    .min(1, "Qtd. moradores é obrigatória")
    .refine((v: string) => Number.isInteger(Number(v)) && Number(v) >= 1, {
      message: "Qtd. moradores deve ser inteiro ≥ 1",
    }),
  rendaFamiliarMensal: z
    .string()
    .trim()
    .min(1, "Renda familiar é obrigatória")
    .refine((v: string) => {
      const n = parseCurrencyToNumber(v);
      return Number.isFinite(n) && n >= 0;
    }, "Renda inválida (use valor ≥ 0)"),
  recebeBeneficioSocial: z.boolean(),
  beneficioSocial: z.string(),
  possuiInternetCasa: z.boolean(),
  tipoAcessoInternet: z.string(),
  codigoAluno: z.string().trim().min(1, "Código do aluno é obrigatório"),
  nomeAluno: z.string().trim().min(1, "Nome do aluno é obrigatório"),
  dataNascimento: z.string(),
  sexo: z.enum(["", "M", "F"]),
  cpfAluno: z.string(),
  nomeResponsavel: z.string().trim().min(1, "Nome do responsável é obrigatório"),
  parentesco: requiredEnum(parentescoValues, "Selecione o parentesco"),
  cpfResponsavel: z.string(),
  telefone: z.string(),
  email: z.string(),
  escolaridade: requiredEnum(
    escolaridadeValues,
    "Selecione a escolaridade do responsável",
  ),
  situacaoOcupacional: requiredEnum(
    situacaoValues,
    "Selecione a situação ocupacional",
  ),
  meioTransporteEscola: requiredEnum(
    meioTransporteValues,
    "Selecione o meio de transporte",
  ),
  tempoDeslocamentoMin: z
    .string()
    .trim()
    .min(1, "Tempo de deslocamento é obrigatório")
    .refine((v: string) => Number.isInteger(Number(v)) && Number(v) >= 0, {
      message: "Tempo deve ser inteiro ≥ 0",
    }),
  anoSerie: requiredEnum(anoSerieValues, "Selecione o ano/série"),
  turno: requiredEnum(turnoValues, "Selecione o turno"),
  necessidadeEducacionalEspecial: z.boolean(),
  descricaoNecessidade: z.string(),
  observacao: z.string(),
  equipamentoEstudo: requiredEnum(
    equipamentoValues,
    "Selecione o equipamento de estudo",
  ),
  disponibilidadeEquipamento: z.string(),
  localEstudo: requiredEnum(localEstudoValues, "Selecione o local de estudo"),
  acompanhamentoFamiliar: requiredEnum(
    acompanhamentoValues,
    "Selecione o acompanhamento familiar",
  ),
  apoioPrioritario: requiredEnum(
    apoioValues,
    "Selecione o apoio prioritário",
  ),
  barreiras: z.array(z.string()),
});

type ColetaFormObject = z.infer<typeof coletaFormObject>;

export const coletaFormSchema = coletaFormObject.superRefine(
  (data: ColetaFormObject, ctx: z.RefinementCtx) => {
    if (data.recebeBeneficioSocial) {
      if (!(beneficioValues as readonly string[]).includes(data.beneficioSocial)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["beneficioSocial"],
          message: "Selecione o benefício social",
        });
      }
    }
    if (data.possuiInternetCasa) {
      if (
        !(tipoAcessoValues as readonly string[]).includes(data.tipoAcessoInternet)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tipoAcessoInternet"],
          message: "Selecione o tipo de acesso à internet",
        });
      }
    }
    if (
      data.necessidadeEducacionalEspecial &&
      !data.descricaoNecessidade.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["descricaoNecessidade"],
        message: "Descreva a necessidade educacional especial",
      });
    }

    if (data.equipamentoEstudo === "NENHUM") {
      if (
        data.disponibilidadeEquipamento &&
        data.disponibilidadeEquipamento !== "N_A"
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["disponibilidadeEquipamento"],
          message: "Sem equipamento, disponibilidade deve ser 'Não se aplica'",
        });
      }
    } else if (
      !(disponibilidadeValues as readonly string[]).includes(
        data.disponibilidadeEquipamento,
      ) ||
      data.disponibilidadeEquipamento === "N_A"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["disponibilidadeEquipamento"],
        message: "Selecione a disponibilidade do equipamento",
      });
    }

    if (!data.barreiras.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["barreiras"],
        message: "Selecione ao menos uma barreira (ou Nenhuma)",
      });
    } else {
      const invalid = data.barreiras.filter(
        (c: string) => !(barreiraValues as readonly string[]).includes(c),
      );
      if (invalid.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["barreiras"],
          message: "Barreira inválida",
        });
      }
      if (
        data.barreiras.includes(BARREIRA_NENHUMA) &&
        data.barreiras.some((c: string) => c !== BARREIRA_NENHUMA)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["barreiras"],
          message: "'Nenhuma' não pode ser combinada com outras barreiras",
        });
      }
    }

    const cpfAlunoMsg = cpfErrorMessage(data.cpfAluno);
    if (cpfAlunoMsg) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cpfAluno"],
        message: cpfAlunoMsg,
      });
    }
    const cpfRespMsg = cpfErrorMessage(data.cpfResponsavel);
    if (cpfRespMsg) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cpfResponsavel"],
        message: cpfRespMsg,
      });
    }

    const birth = data.dataNascimento.trim();
    if (!birth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dataNascimento"],
        message: "Data de nascimento é obrigatória",
      });
    } else {
      const birthErr = birthDateErrorMessage(birth);
      if (birthErr) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dataNascimento"],
          message: birthErr,
        });
      }
    }
  });

function birthDateErrorMessage(raw: string): string | null {
  const digits = onlyDigits(raw);
  if (digits.length > 0 && digits.length < 8) {
    return "Data incompleta (use DD/MM/AAAA)";
  }
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw.trim());
  if (!br) return "Data inválida (use DD/MM/AAAA)";
  const dd = Number(br[1]);
  const mm = Number(br[2]);
  const yyyy = Number(br[3]);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return "Data de nascimento inválida";
  const dt = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (
    dt.getUTCFullYear() !== yyyy ||
    dt.getUTCMonth() !== mm - 1 ||
    dt.getUTCDate() !== dd
  ) {
    return "Data de nascimento inválida";
  }
  const now = new Date();
  if (dt > now) return "Data de nascimento não pode ser no futuro";
  if (yyyy < 1900) return "Data de nascimento inválida";
  return null;
}

export type ColetaFormErrors = Partial<Record<keyof ColetaFormState, string>>;

/** Etapas do wizard (B-07). */
export const COLETA_WIZARD_STEPS = [
  {
    id: "aluno",
    title: "Identificação do aluno",
    shortTitle: "1. Aluno",
    fields: [
      "momentoCodigo",
      "codigoAluno",
      "nomeAluno",
      "cpfAluno",
      "dataNascimento",
      "sexo",
    ] as const satisfies ReadonlyArray<keyof ColetaFormState>,
  },
  {
    id: "familia",
    title: "Familiar entrevistado e residência",
    shortTitle: "2. Familiar",
    fields: [
      "codigoFamilia",
      "endereco",
      "bairro",
      "comunidade",
      "tipoLocalidade",
      "qtdMoradores",
      "rendaFamiliarMensal",
      "recebeBeneficioSocial",
      "beneficioSocial",
      "possuiInternetCasa",
      "tipoAcessoInternet",
      "nomeResponsavel",
      "parentesco",
      "cpfResponsavel",
      "telefone",
      "email",
      "escolaridade",
      "situacaoOcupacional",
    ] as const satisfies ReadonlyArray<keyof ColetaFormState>,
  },
  {
    id: "socioeconomico",
    title: "Contexto socioeconômico",
    shortTitle: "3. Socioeconômico",
    fields: [
      "meioTransporteEscola",
      "tempoDeslocamentoMin",
      "anoSerie",
      "turno",
      "necessidadeEducacionalEspecial",
      "descricaoNecessidade",
      "observacao",
    ] as const satisfies ReadonlyArray<keyof ColetaFormState>,
  },
  {
    id: "educacional",
    title: "Contexto educacional familiar",
    shortTitle: "4. Educacional",
    fields: [
      "equipamentoEstudo",
      "disponibilidadeEquipamento",
      "localEstudo",
      "acompanhamentoFamiliar",
      "apoioPrioritario",
      "barreiras",
    ] as const satisfies ReadonlyArray<keyof ColetaFormState>,
  },
  {
    id: "revisao",
    title: "Revisão e confirmação",
    shortTitle: "5. Revisão",
    fields: [] as const satisfies ReadonlyArray<keyof ColetaFormState>,
  },
] as const;

export type ColetaWizardStepId = (typeof COLETA_WIZARD_STEPS)[number]["id"];

/** Valida só os campos da etapa (não exige o restante do formulário). */
export function validateColetaStep(
  form: ColetaFormState,
  stepId: ColetaWizardStepId,
): { ok: boolean; errors: ColetaFormErrors } {
  if (stepId === "revisao") return { ok: true, errors: {} };

  const step = COLETA_WIZARD_STEPS.find((s) => s.id === stepId);
  if (!step) return { ok: true, errors: {} };

  const fieldSet = new Set<string>(step.fields);
  const parsed = coletaFormSchema.safeParse(form);
  if (parsed.success) return { ok: true, errors: {} };

  const errors: ColetaFormErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as keyof ColetaFormState | undefined;
    if (key && fieldSet.has(key) && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateColetaForm(form: ColetaFormState): {
  ok: boolean;
  errors: ColetaFormErrors;
  payload?: ColetaPayload;
} {
  const parsed = coletaFormSchema.safeParse(form);
  if (!parsed.success) {
    const errors: ColetaFormErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ColetaFormState | undefined;
      if (key && !errors[key]) errors[key] = issue.message;
    }
    return { ok: false, errors };
  }

  const d = parsed.data;
  const renda = parseCurrencyToNumber(d.rendaFamiliarMensal);
  const disponibilidade =
    d.equipamentoEstudo === "NENHUM"
      ? ("N_A" as const)
      : (d.disponibilidadeEquipamento as (typeof disponibilidadeValues)[number]);

  const payload: ColetaPayload = {
    momento: { codigo: d.momentoCodigo },
    familia: {
      codigoFamilia: d.codigoFamilia.trim(),
      endereco: d.endereco.trim(),
      bairro: d.bairro.trim(),
      comunidade: d.comunidade.trim(),
      tipoLocalidade: d.tipoLocalidade as (typeof tipoLocalidadeValues)[number],
      qtdMoradores: Number(d.qtdMoradores),
      rendaFamiliarMensal: renda,
      recebeBeneficioSocial: d.recebeBeneficioSocial,
      beneficioSocial: d.recebeBeneficioSocial
        ? (d.beneficioSocial as (typeof beneficioValues)[number])
        : null,
      possuiInternetCasa: d.possuiInternetCasa,
      tipoAcessoInternet: d.possuiInternetCasa
        ? (d.tipoAcessoInternet as (typeof tipoAcessoValues)[number])
        : null,
    },
    aluno: {
      codigoAluno: d.codigoAluno.trim(),
      nome: d.nomeAluno.trim(),
      dataNascimento: toIsoDate(d.dataNascimento.trim())!,
      sexo: d.sexo === "" ? null : d.sexo,
      cpf: optionalDigits.parse(d.cpfAluno),
    },
    responsavel: {
      nome: d.nomeResponsavel.trim(),
      parentesco: d.parentesco as (typeof parentescoValues)[number],
      cpf: optionalDigits.parse(d.cpfResponsavel),
      telefone: optionalDigits.parse(d.telefone),
      email: d.email.trim() ? d.email.trim().toLowerCase() : null,
      escolaridade: d.escolaridade as (typeof escolaridadeValues)[number],
      situacaoOcupacional: d.situacaoOcupacional as (typeof situacaoValues)[number],
    },
    pesquisa: {
      meioTransporteEscola:
        d.meioTransporteEscola as (typeof meioTransporteValues)[number],
      tempoDeslocamentoMin: Number(d.tempoDeslocamentoMin),
      frequenciaEscolarPct: null,
      anoSerie: d.anoSerie as (typeof anoSerieValues)[number],
      turno: d.turno as (typeof turnoValues)[number],
      necessidadeEducacionalEspecial: d.necessidadeEducacionalEspecial,
      descricaoNecessidade: d.necessidadeEducacionalEspecial
        ? d.descricaoNecessidade.trim()
        : null,
      observacao: d.observacao.trim() ? d.observacao.trim() : null,
      equipamentoEstudo: d.equipamentoEstudo as (typeof equipamentoValues)[number],
      disponibilidadeEquipamento: disponibilidade,
      localEstudo: d.localEstudo as (typeof localEstudoValues)[number],
      acompanhamentoFamiliar:
        d.acompanhamentoFamiliar as (typeof acompanhamentoValues)[number],
      apoioPrioritario: d.apoioPrioritario as (typeof apoioValues)[number],
    },
    barreiras: d.barreiras as (typeof barreiraValues)[number][],
  };

  return { ok: true, errors: {}, payload };
}

/** Aceita DD/MM/AAAA ou AAAA-MM-DD → ISO date string */
function toIsoDate(raw: string): string | null {
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  if (br) {
    const [, dd, mm, yyyy] = br;
    return `${yyyy}-${mm}-${dd}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function emptyForm(): ColetaFormState {
  return {
    momentoCodigo: "T2",
    codigoFamilia: "",
    endereco: "",
    bairro: "",
    comunidade: "",
    tipoLocalidade: "",
    qtdMoradores: "",
    rendaFamiliarMensal: "",
    recebeBeneficioSocial: false,
    beneficioSocial: "",
    possuiInternetCasa: false,
    tipoAcessoInternet: "",
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
    meioTransporteEscola: "",
    tempoDeslocamentoMin: "",
    anoSerie: "",
    turno: "",
    necessidadeEducacionalEspecial: false,
    descricaoNecessidade: "",
    observacao: "",
    equipamentoEstudo: "",
    disponibilidadeEquipamento: "",
    localEstudo: "",
    acompanhamentoFamiliar: "",
    apoioPrioritario: "",
    barreiras: [],
  };
}

export function formFromPayload(payload: ColetaPayload): ColetaFormState {
  const codigo = payload.momento.codigo === "T3" ? "T3" : "T2";
  return {
    momentoCodigo: codigo,
    codigoFamilia: payload.familia.codigoFamilia,
    endereco: payload.familia.endereco,
    bairro: payload.familia.bairro,
    comunidade: payload.familia.comunidade,
    tipoLocalidade: payload.familia.tipoLocalidade ?? "",
    qtdMoradores: String(payload.familia.qtdMoradores),
    rendaFamiliarMensal: String(payload.familia.rendaFamiliarMensal).replace(
      ".",
      ",",
    ),
    recebeBeneficioSocial: payload.familia.recebeBeneficioSocial,
    beneficioSocial: (payload.familia.beneficioSocial ?? "") as ColetaFormState["beneficioSocial"],
    possuiInternetCasa: payload.familia.possuiInternetCasa,
    tipoAcessoInternet: (payload.familia.tipoAcessoInternet ??
      "") as ColetaFormState["tipoAcessoInternet"],
    codigoAluno: payload.aluno.codigoAluno,
    nomeAluno: payload.aluno.nome,
    dataNascimento: payload.aluno.dataNascimento
      ? isoToBr(payload.aluno.dataNascimento)
      : "", // legado / edição incompleta — validação exige na gravação
    sexo: payload.aluno.sexo ?? "",
    cpfAluno: payload.aluno.cpf ?? "",
    nomeResponsavel: payload.responsavel.nome,
    parentesco: (payload.responsavel.parentesco ??
      "") as ColetaFormState["parentesco"],
    cpfResponsavel: payload.responsavel.cpf ?? "",
    telefone: payload.responsavel.telefone ?? "",
    email: payload.responsavel.email ?? "",
    escolaridade: payload.responsavel.escolaridade ?? "",
    situacaoOcupacional: payload.responsavel.situacaoOcupacional ?? "",
    meioTransporteEscola: (payload.pesquisa.meioTransporteEscola ??
      "") as ColetaFormState["meioTransporteEscola"],
    tempoDeslocamentoMin: String(payload.pesquisa.tempoDeslocamentoMin),
    anoSerie: (payload.pesquisa.anoSerie ?? "") as ColetaFormState["anoSerie"],
    turno: (payload.pesquisa.turno ?? "") as ColetaFormState["turno"],
    necessidadeEducacionalEspecial:
      payload.pesquisa.necessidadeEducacionalEspecial,
    descricaoNecessidade: payload.pesquisa.descricaoNecessidade ?? "",
    observacao: payload.pesquisa.observacao ?? "",
    equipamentoEstudo: payload.pesquisa.equipamentoEstudo ?? "",
    disponibilidadeEquipamento:
      payload.pesquisa.disponibilidadeEquipamento ?? "",
    localEstudo: payload.pesquisa.localEstudo ?? "",
    acompanhamentoFamiliar: payload.pesquisa.acompanhamentoFamiliar ?? "",
    apoioPrioritario: payload.pesquisa.apoioPrioritario ?? "",
    barreiras: payload.barreiras ?? [],
  };
}

function isoToBr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}
