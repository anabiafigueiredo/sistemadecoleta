import { z } from "zod";
import type { ColetaFormState, ColetaPayload } from "@/lib/types";
import {
  codigoAlunoErrorMessage,
  codigoFamiliaErrorMessage,
  cpfErrorMessage,
  formatCurrencyDisplay,
  onlyDigits,
  parseCurrencyToNumber,
} from "@/lib/masks";
import {
  ACOMPANHAMENTO_FAMILIAR_OPTIONS,
  ANO_SERIE_OPTIONS,
  APOIO_NENHUM,
  APOIO_PRIORITARIO_OPTIONS,
  BAIRRO_OPTIONS,
  BARREIRA_NENHUMA,
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
  parseDescricaoNecessidade,
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
const bairroValues = valuesOf(BAIRRO_OPTIONS);
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
const necessidadeValues = valuesOf(NECESSIDADE_EDUCACIONAL_OPTIONS);

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
  momentoCodigo: z.union([
    z.literal(""),
    z.literal("T2"),
    z.literal("T3"),
  ]),
  codigoFamilia: z.string().trim().min(1, "Informe o código da família"),
  endereco: z.string().trim().min(1, "Informe o endereço"),
  bairro: requiredEnum(bairroValues, "Selecione o bairro"),
  comunidade: z.string().trim(),
  tipoLocalidade: requiredEnum(
    tipoLocalidadeValues,
    "Selecione o tipo de localidade",
  ),
  qtdMoradores: z
    .string()
    .trim()
    .min(1, "Informe a quantidade de moradores")
    .refine((v: string) => Number.isInteger(Number(v)) && Number(v) >= 1, {
      message: "Informe um número inteiro maior que zero",
    }),
  rendaFamiliarMensal: z
    .string()
    .trim()
    .min(1, "Informe a renda familiar")
    .refine((v: string) => {
      const n = parseCurrencyToNumber(v);
      return Number.isFinite(n) && n >= 0;
    }, "Informe um valor de renda válido"),
  recebeBeneficioSocial: z.boolean().nullable(),
  beneficioSocial: z.string(),
  possuiInternetCasa: z.boolean().nullable(),
  tipoAcessoInternet: z.string(),
  codigoAluno: z.string().trim().min(1, "Informe o código do aluno"),
  nomeAluno: z.string().trim().min(1, "Informe o nome completo do aluno"),
  dataNascimento: z.string(),
  sexo: z.enum(["", "M", "F"]),
  cpfAluno: z.string(),
  nomeResponsavel: z
    .string()
    .trim()
    .min(1, "Informe o nome do responsável entrevistado"),
  parentesco: requiredEnum(parentescoValues, "Selecione o parentesco com o aluno"),
  cpfResponsavel: z.string(),
  telefone: z.string(),
  email: z.string(),
  escolaridade: requiredEnum(
    escolaridadeValues,
    "Selecione a escolaridade dos adultos da residência",
  ),
  situacaoOcupacional: requiredEnum(
    situacaoValues,
    "Selecione a situação ocupacional",
  ),
  meioTransporteEscola: requiredEnum(
    meioTransporteValues,
    "Selecione o meio de transporte do aluno",
  ),
  tempoDeslocamentoMin: z
    .string()
    .trim()
    .min(1, "Informe o tempo de deslocamento")
    .refine((v: string) => Number.isInteger(Number(v)) && Number(v) >= 0, {
      message: "Informe o tempo em minutos (0 ou mais)",
    }),
  frequenciaEscolarPct: z.string(),
  anoSerie: requiredEnum(anoSerieValues, "Selecione o ano/série do aluno"),
  turno: requiredEnum(turnoValues, "Selecione o turno do aluno"),
  necessidadeEducacionalEspecial: z.boolean().nullable(),
  necessidadesEducacionais: z.array(z.string()),
  necessidadeOutraDescricao: z.string(),
  observacao: z.string(),
  equipamentosEstudo: z.array(z.string()),
  disponibilidadeEquipamento: z.string(),
  localEstudo: requiredEnum(
    localEstudoValues,
    "Selecione se o aluno tem local adequado para estudar",
  ),
  acompanhamentoFamiliar: requiredEnum(
    acompanhamentoValues,
    "Selecione com que frequência um adulto acompanha os estudos",
  ),
  apoiosPrioritarios: z.array(z.string()),
  barreiras: z.array(z.string()),
});

type ColetaFormObject = z.infer<typeof coletaFormObject>;

export const coletaFormSchema = coletaFormObject.superRefine(
  (data: ColetaFormObject, ctx: z.RefinementCtx) => {
    if (data.momentoCodigo !== "T2" && data.momentoCodigo !== "T3") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["momentoCodigo"],
        message: "Escolha se esta é uma coleta em campo ou uma reavaliação",
      });
    }

    if (data.recebeBeneficioSocial === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recebeBeneficioSocial"],
        message: "Informe se a família recebe benefício social",
      });
    } else if (data.recebeBeneficioSocial) {
      if (!(beneficioValues as readonly string[]).includes(data.beneficioSocial)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["beneficioSocial"],
          message: "Selecione o benefício social",
        });
      }
    }

    if (data.possuiInternetCasa === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["possuiInternetCasa"],
        message: "Informe se o aluno tem internet em casa para estudar",
      });
    } else if (data.possuiInternetCasa) {
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

    if (data.necessidadeEducacionalEspecial === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["necessidadeEducacionalEspecial"],
        message:
          "Informe se o aluno possui deficiência, condição do neurodesenvolvimento ou outra necessidade específica",
      });
    } else if (data.necessidadeEducacionalEspecial) {
      const needs = data.necessidadesEducacionais;
      if (!needs.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["necessidadesEducacionais"],
          message: "Selecione pelo menos uma condição ou necessidade",
        });
      } else if (
        needs.some(
          (c: string) => !(necessidadeValues as readonly string[]).includes(c),
        )
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["necessidadesEducacionais"],
          message: "Selecione uma opção da lista",
        });
      } else if (
        needs.includes(NECESSIDADE_OUTRA) &&
        !data.necessidadeOutraDescricao.trim()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["necessidadeOutraDescricao"],
          message: "Descreva a outra condição ou necessidade",
        });
      }
    }

    if (!data.equipamentosEstudo.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["equipamentosEstudo"],
        message: "Selecione os equipamentos (Nenhum ou Não sabe informar)",
      });
    } else {
      const invalidEq = data.equipamentosEstudo.filter(
        (c: string) => !(equipamentoValues as readonly string[]).includes(c),
      );
      if (invalidEq.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["equipamentosEstudo"],
          message: "Selecione um equipamento da lista",
        });
      }
      const exclusivosMarcados = data.equipamentosEstudo.filter((c: string) =>
        (EQUIPAMENTO_EXCLUSIVOS as readonly string[]).includes(c),
      );
      if (
        exclusivosMarcados.length > 0 &&
        data.equipamentosEstudo.some(
          (c: string) =>
            !(EQUIPAMENTO_EXCLUSIVOS as readonly string[]).includes(c),
        )
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["equipamentosEstudo"],
          message:
            "'Nenhum' ou 'Não sabe informar' não podem ser combinados com outros",
        });
      }
      if (exclusivosMarcados.length > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["equipamentosEstudo"],
          message: "Escolha só uma entre 'Nenhum' e 'Não sabe informar'",
        });
      }
    }

    const soSemDispositivo =
      data.equipamentosEstudo.length === 1 &&
      (EQUIPAMENTO_EXCLUSIVOS as readonly string[]).includes(
        data.equipamentosEstudo[0]!,
      );

    if (soSemDispositivo) {
      if (
        data.disponibilidadeEquipamento &&
        data.disponibilidadeEquipamento !== "N_A"
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["disponibilidadeEquipamento"],
          message: "Sem equipamento informado, use 'Não se aplica'",
        });
      }
    } else if (data.equipamentosEstudo.length > 0) {
      if (
        !(disponibilidadeValues as readonly string[]).includes(
          data.disponibilidadeEquipamento,
        ) ||
        data.disponibilidadeEquipamento === "N_A"
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["disponibilidadeEquipamento"],
          message: "Selecione a disponibilidade dos equipamentos",
        });
      }
    }

    if (!data.apoiosPrioritarios.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["apoiosPrioritarios"],
        message: "Selecione até 2 áreas de apoio (ou Nenhum)",
      });
    } else {
      const invalidAp = data.apoiosPrioritarios.filter(
        (c: string) => !(apoioValues as readonly string[]).includes(c),
      );
      if (invalidAp.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["apoiosPrioritarios"],
          message: "Selecione uma área de apoio da lista",
        });
      }
      if (
        data.apoiosPrioritarios.includes(APOIO_NENHUM) &&
        data.apoiosPrioritarios.some((c: string) => c !== APOIO_NENHUM)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["apoiosPrioritarios"],
          message: "'Nenhum' não pode ser combinado com outras áreas",
        });
      }
      const nonExclusive = data.apoiosPrioritarios.filter(
        (c: string) => c !== APOIO_NENHUM,
      );
      if (nonExclusive.length > MAX_APOIOS_PRIORITARIOS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["apoiosPrioritarios"],
          message: `Selecione no máximo ${MAX_APOIOS_PRIORITARIOS} áreas de apoio`,
        });
      }
    }

    if (!data.barreiras.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["barreiras"],
        message: "Selecione ao menos um fator (ou Nenhuma)",
      });
    } else {
      const invalid = data.barreiras.filter(
        (c: string) => !(barreiraValues as readonly string[]).includes(c),
      );
      if (invalid.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["barreiras"],
          message: "Selecione um fator da lista",
        });
      }
      if (
        data.barreiras.includes(BARREIRA_NENHUMA) &&
        data.barreiras.some((c: string) => c !== BARREIRA_NENHUMA)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["barreiras"],
          message: "'Nenhuma' não pode ser combinada com outros fatores",
        });
      }
    }

    const cpfAlunoMsg = cpfErrorMessage(data.cpfAluno);
    if (cpfAlunoMsg) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cpfAluno"],
        message: cpfAlunoMsg === "CPF incompleto" ? "CPF incompleto" : "CPF inválido",
      });
    }
    const cpfRespMsg = cpfErrorMessage(data.cpfResponsavel);
    if (cpfRespMsg) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cpfResponsavel"],
        message: cpfRespMsg === "CPF incompleto" ? "CPF incompleto" : "CPF inválido",
      });
    }

    const famMsg = codigoFamiliaErrorMessage(data.codigoFamilia);
    if (famMsg) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["codigoFamilia"],
        message: famMsg,
      });
    }
    const aluMsg = codigoAlunoErrorMessage(data.codigoAluno);
    if (aluMsg) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["codigoAluno"],
        message: aluMsg,
      });
    }

    const freq = data.frequenciaEscolarPct.trim();
    if (!freq) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["frequenciaEscolarPct"],
        message: "Informe a frequência ou escolha 'Não sabe informar'",
      });
    } else if (freq !== "NAO_SABE") {
      const n = Number(freq);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["frequenciaEscolarPct"],
          message: "Informe um percentual entre 0 e 100",
        });
      }
    }

    const phoneDigits = onlyDigits(data.telefone);
    if (phoneDigits.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["telefone"],
        message: "Informe o telefone com DDD",
      });
    }

    const emailTrim = data.email.trim();
    if (emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "E-mail inválido",
      });
    }

    const birth = data.dataNascimento.trim();
    if (!birth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dataNascimento"],
        message: "Informe a data de nascimento do aluno",
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
  },
);

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
  if (dt > now) return "A data não pode ser no futuro";
  if (yyyy < 1900) return "Data de nascimento inválida";
  return null;
}

export type ColetaFormErrors = Partial<Record<keyof ColetaFormState, string>>;

/** Etapas do wizard — estrutura 2.1–2.5. */
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
    id: "responsavel",
    title: "Responsável entrevistado",
    shortTitle: "2. Responsável",
    fields: [
      "nomeResponsavel",
      "parentesco",
      "cpfResponsavel",
      "telefone",
      "email",
      "situacaoOcupacional",
    ] as const satisfies ReadonlyArray<keyof ColetaFormState>,
  },
  {
    id: "familia",
    title: "Família e contexto socioeconômico",
    shortTitle: "3. Família",
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
      "escolaridade",
    ] as const satisfies ReadonlyArray<keyof ColetaFormState>,
  },
  {
    id: "escolar",
    title: "Situação escolar",
    shortTitle: "4. Escolar",
    fields: [
      "anoSerie",
      "turno",
      "frequenciaEscolarPct",
      "meioTransporteEscola",
      "tempoDeslocamentoMin",
      "barreiras",
    ] as const satisfies ReadonlyArray<keyof ColetaFormState>,
  },
  {
    id: "estudo",
    title: "Condições de estudo e apoio ao aluno",
    shortTitle: "5. Estudo",
    fields: [
      "possuiInternetCasa",
      "tipoAcessoInternet",
      "equipamentosEstudo",
      "disponibilidadeEquipamento",
      "localEstudo",
      "acompanhamentoFamiliar",
      "necessidadeEducacionalEspecial",
      "necessidadesEducacionais",
      "necessidadeOutraDescricao",
      "apoiosPrioritarios",
      "observacao",
    ] as const satisfies ReadonlyArray<keyof ColetaFormState>,
  },
  {
    id: "revisao",
    title: "Revisão e confirmação",
    shortTitle: "6. Revisão",
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
  const soSemDispositivo =
    d.equipamentosEstudo.length === 1 &&
    (EQUIPAMENTO_EXCLUSIVOS as readonly string[]).includes(
      d.equipamentosEstudo[0]!,
    );
  const disponibilidade = soSemDispositivo
    ? ("N_A" as const)
    : (d.disponibilidadeEquipamento as (typeof disponibilidadeValues)[number]);

  const payload: ColetaPayload = {
    momento: { codigo: d.momentoCodigo as "T2" | "T3" },
    familia: {
      codigoFamilia: d.codigoFamilia.trim().toUpperCase(),
      endereco: d.endereco.trim(),
      bairro: d.bairro.trim(),
      comunidade: d.comunidade.trim(),
      tipoLocalidade: d.tipoLocalidade as (typeof tipoLocalidadeValues)[number],
      qtdMoradores: Number(d.qtdMoradores),
      rendaFamiliarMensal: renda,
      recebeBeneficioSocial: Boolean(d.recebeBeneficioSocial),
      beneficioSocial: d.recebeBeneficioSocial
        ? (d.beneficioSocial as (typeof beneficioValues)[number])
        : null,
      possuiInternetCasa: Boolean(d.possuiInternetCasa),
      tipoAcessoInternet: d.possuiInternetCasa
        ? (d.tipoAcessoInternet as (typeof tipoAcessoValues)[number])
        : null,
    },
    aluno: {
      codigoAluno: d.codigoAluno.trim().toUpperCase(),
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
      frequenciaEscolarPct:
        d.frequenciaEscolarPct.trim() === "NAO_SABE"
          ? null
          : Number(d.frequenciaEscolarPct),
      anoSerie: d.anoSerie as (typeof anoSerieValues)[number],
      turno: d.turno as (typeof turnoValues)[number],
      necessidadeEducacionalEspecial: Boolean(d.necessidadeEducacionalEspecial),
      necessidadesEducacionais: d.necessidadeEducacionalEspecial
        ? (d.necessidadesEducacionais as (typeof necessidadeValues)[number][])
        : null,
      necessidadeOutraDescricao:
        d.necessidadeEducacionalEspecial &&
        d.necessidadesEducacionais.includes(NECESSIDADE_OUTRA)
          ? d.necessidadeOutraDescricao.trim() || null
          : null,
      observacao: d.observacao.trim() ? d.observacao.trim() : null,
      equipamentosEstudo: d.equipamentosEstudo as (typeof equipamentoValues)[number][],
      disponibilidadeEquipamento: disponibilidade,
      localEstudo: d.localEstudo as (typeof localEstudoValues)[number],
      acompanhamentoFamiliar:
        d.acompanhamentoFamiliar as (typeof acompanhamentoValues)[number],
      apoiosPrioritarios: d.apoiosPrioritarios as (typeof apoioValues)[number][],
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
    momentoCodigo: "",
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
    frequenciaEscolarPct: "",
    anoSerie: "",
    turno: "",
    necessidadeEducacionalEspecial: null,
    necessidadesEducacionais: [],
    necessidadeOutraDescricao: "",
    observacao: "",
    equipamentosEstudo: [],
    disponibilidadeEquipamento: "",
    localEstudo: "",
    acompanhamentoFamiliar: "",
    apoiosPrioritarios: [],
    barreiras: [],
  };
}

export function formFromPayload(payload: ColetaPayload): ColetaFormState {
  const codigo = payload.momento.codigo === "T3" ? "T3" : "T2";
  const pesquisa = payload.pesquisa as ColetaPayload["pesquisa"] & {
    /** legado offline */
    equipamentoEstudo?: string;
    apoioPrioritario?: string;
    descricaoNecessidade?: string | null;
  };

  const equipamentosEstudo = (
    pesquisa.equipamentosEstudo?.length
      ? pesquisa.equipamentosEstudo
      : pesquisa.equipamentoEstudo
        ? [pesquisa.equipamentoEstudo]
        : []
  ) as ColetaFormState["equipamentosEstudo"];

  const apoiosPrioritarios = (
    pesquisa.apoiosPrioritarios?.length
      ? pesquisa.apoiosPrioritarios
      : pesquisa.apoioPrioritario
        ? [pesquisa.apoioPrioritario]
        : []
  ) as ColetaFormState["apoiosPrioritarios"];

  const parsedNee = parseDescricaoNecessidade(
    pesquisa.descricaoNecessidade ?? undefined,
  );
  const necessidadesEducacionais = (
    pesquisa.necessidadesEducacionais?.length
      ? pesquisa.necessidadesEducacionais
      : parsedNee.codes
  ) as ColetaFormState["necessidadesEducacionais"];
  const necessidadeOutraDescricao =
    (pesquisa as { necessidadeOutraDescricao?: string | null })
      .necessidadeOutraDescricao?.trim() ||
    parsedNee.outraTexto ||
    "";

  return {
    momentoCodigo: codigo,
    codigoFamilia: payload.familia.codigoFamilia,
    endereco: payload.familia.endereco,
    bairro: payload.familia.bairro,
    comunidade: payload.familia.comunidade,
    tipoLocalidade: payload.familia.tipoLocalidade ?? "",
    qtdMoradores: String(payload.familia.qtdMoradores),
    rendaFamiliarMensal: formatCurrencyDisplay(
      Number(payload.familia.rendaFamiliarMensal),
    ),
    recebeBeneficioSocial: payload.familia.recebeBeneficioSocial,
    beneficioSocial: (payload.familia.beneficioSocial ??
      "") as ColetaFormState["beneficioSocial"],
    possuiInternetCasa: payload.familia.possuiInternetCasa,
    tipoAcessoInternet: (payload.familia.tipoAcessoInternet ??
      "") as ColetaFormState["tipoAcessoInternet"],
    codigoAluno: payload.aluno.codigoAluno,
    nomeAluno: payload.aluno.nome,
    dataNascimento: payload.aluno.dataNascimento
      ? isoToBr(payload.aluno.dataNascimento)
      : "",
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
    frequenciaEscolarPct:
      payload.pesquisa.frequenciaEscolarPct == null
        ? "NAO_SABE"
        : String(payload.pesquisa.frequenciaEscolarPct),
    anoSerie: (payload.pesquisa.anoSerie ?? "") as ColetaFormState["anoSerie"],
    turno: (payload.pesquisa.turno ?? "") as ColetaFormState["turno"],
    necessidadeEducacionalEspecial:
      payload.pesquisa.necessidadeEducacionalEspecial,
    necessidadesEducacionais,
    necessidadeOutraDescricao,
    observacao: payload.pesquisa.observacao ?? "",
    equipamentosEstudo,
    disponibilidadeEquipamento:
      payload.pesquisa.disponibilidadeEquipamento ?? "",
    localEstudo: payload.pesquisa.localEstudo ?? "",
    acompanhamentoFamiliar: payload.pesquisa.acompanhamentoFamiliar ?? "",
    apoiosPrioritarios,
    barreiras: payload.barreiras ?? [],
  };
}

function isoToBr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}
