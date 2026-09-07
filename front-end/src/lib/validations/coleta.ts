import { z } from "zod";
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
  canonicalCode,
} from "@/lib/opcoes-questionario";

function digitsOrNull(value: unknown): string | null {
  if (value == null || value === "") return null;
  const digits = String(value).replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

/** CPF opcional: vazio ok; preenchido deve passar no dígito verificador (B-08). */
function cpfErrorMessage(value: string | null | undefined): string | null {
  if (!value) return null;
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11) return "CPF inválido";
  if (/^(\d)\1{10}$/.test(cpf)) return "CPF inválido";
  const calc = (base: string, factor: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i += 1) {
      sum += Number(base[i]) * (factor - i);
    }
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };
  const d1 = calc(cpf.slice(0, 9), 10);
  const d2 = calc(cpf.slice(0, 10), 11);
  if (d1 !== Number(cpf[9]) || d2 !== Number(cpf[10])) return "CPF inválido";
  return null;
}

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
}

function emailOrNull(value: unknown): string | null {
  if (value == null || value === "") return null;
  const email = String(value).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("E-mail inválido");
  }
  return email;
}

function enumFromOptions<T extends string>(
  options: ReadonlyArray<{ value: T }>,
) {
  return z.enum(options.map((o) => o.value) as [T, ...T[]]);
}

/** Aceita código ou rótulo legado; grava só o código canônico. Texto livre desconhecido falha. */
function codeEnumFromOptions<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
) {
  const enumSchema = enumFromOptions(options);
  return z.preprocess((value) => {
    if (value == null || value === "") return value;
    const code = canonicalCode(options, String(value));
    return code ?? String(value).trim();
  }, enumSchema);
}

const tipoLocalidadeEnum = codeEnumFromOptions(TIPO_LOCALIDADE_OPTIONS);
const escolaridadeEnum = codeEnumFromOptions(ESCOLARIDADE_OPTIONS);
const situacaoOcupacionalEnum = codeEnumFromOptions(
  SITUACAO_OCUPACIONAL_OPTIONS,
);
const equipamentoEstudoEnum = codeEnumFromOptions(EQUIPAMENTO_ESTUDO_OPTIONS);
const disponibilidadeEquipamentoEnum = codeEnumFromOptions(
  DISPONIBILIDADE_EQUIPAMENTO_OPTIONS,
);
const localEstudoEnum = codeEnumFromOptions(LOCAL_ESTUDO_OPTIONS);
const acompanhamentoFamiliarEnum = codeEnumFromOptions(
  ACOMPANHAMENTO_FAMILIAR_OPTIONS,
);
const apoioPrioritarioEnum = codeEnumFromOptions(APOIO_PRIORITARIO_OPTIONS);
const barreiraCodigoEnum = codeEnumFromOptions(BARREIRA_OPTIONS);
const meioTransporteEnum = codeEnumFromOptions(MEIO_TRANSPORTE_OPTIONS);
const turnoEnum = codeEnumFromOptions(TURNO_OPTIONS);
const anoSerieEnum = codeEnumFromOptions(ANO_SERIE_OPTIONS);
const tipoAcessoInternetEnum = codeEnumFromOptions(
  TIPO_ACESSO_INTERNET_OPTIONS,
);
const beneficioSocialEnum = codeEnumFromOptions(BENEFICIO_SOCIAL_OPTIONS);
const parentescoEnum = codeEnumFromOptions(PARENTESCO_OPTIONS);

export const coletaSchema = z
  .object({
    /** Ciclo de monitoramento. Mobile tipicamente envia T2/T3. Default: T2 */
    momento: z
      .object({
        codigo: z
          .string()
          .trim()
          .toUpperCase()
          .regex(/^T\d+$/, "codigo do momento deve ser T1, T2, T3..."),
        titulo: z.string().trim().min(1).optional(),
        dataReferencia: z.coerce.date().optional(),
      })
      .optional()
      .default({ codigo: "T2" }),
    familia: z.object({
      codigoFamilia: z.string().trim().min(1, "codigoFamilia é obrigatório"),
      endereco: z.string().trim().min(1),
      bairro: z.string().trim().min(1),
      comunidade: z.string().trim().min(1),
      /** Obrigatório no mobile v2; null/omitido na importação v1. */
      tipoLocalidade: tipoLocalidadeEnum.nullable().optional(),
      qtdMoradores: z.coerce.number().int().min(1),
      rendaFamiliarMensal: z.coerce.number().nonnegative(),
      recebeBeneficioSocial: z.boolean(),
      beneficioSocial: beneficioSocialEnum.nullable().optional(),
      possuiInternetCasa: z.boolean(),
      tipoAcessoInternet: tipoAcessoInternetEnum.nullable().optional(),
    }),
    aluno: z.object({
      codigoAluno: z.string().trim().min(1, "codigoAluno é obrigatório"),
      nome: z.string().trim().min(1),
      dataNascimento: z.coerce.date().nullable().optional(),
      sexo: z
        .union([
          z.literal("M"),
          z.literal("F"),
          z.literal("m"),
          z.literal("f"),
          z.null(),
        ])
        .optional()
        .transform((v) => (v ? v.toUpperCase() : null)),
      cpf: z.preprocess(digitsOrNull, z.string().nullable()),
    }),
    responsavel: z.object({
      nome: z.string().trim().min(1),
      parentesco: parentescoEnum,
      cpf: z.preprocess(digitsOrNull, z.string().nullable()),
      telefone: z.preprocess(digitsOrNull, z.string().nullable()),
      email: z.preprocess((v) => {
        try {
          return emailOrNull(v);
        } catch {
          return null;
        }
      }, z.string().nullable()),
      escolaridade: escolaridadeEnum.nullable().optional(),
      situacaoOcupacional: situacaoOcupacionalEnum.nullable().optional(),
    }),
    pesquisa: z.object({
      meioTransporteEscola: meioTransporteEnum,
      tempoDeslocamentoMin: z.coerce.number().int().min(0),
      /** Administrativo; omitido/null nas coletas mobile (v2). */
      frequenciaEscolarPct: z.coerce
        .number()
        .min(0)
        .max(100)
        .nullable()
        .optional(),
      anoSerie: anoSerieEnum,
      turno: turnoEnum,
      necessidadeEducacionalEspecial: z.boolean(),
      descricaoNecessidade: z.string().trim().nullable().optional(),
      observacao: z.string().trim().nullable().optional(),
      /** Bloco D (v2); null/omitido na importação v1. */
      equipamentoEstudo: equipamentoEstudoEnum.nullable().optional(),
      disponibilidadeEquipamento:
        disponibilidadeEquipamentoEnum.nullable().optional(),
      localEstudo: localEstudoEnum.nullable().optional(),
      acompanhamentoFamiliar: acompanhamentoFamiliarEnum.nullable().optional(),
      apoioPrioritario: apoioPrioritarioEnum.nullable().optional(),
    }),
    /** Códigos do catálogo; vazio/omitido em importações v1. */
    barreiras: z.array(barreiraCodigoEnum).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.familia.recebeBeneficioSocial && !data.familia.beneficioSocial) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["familia", "beneficioSocial"],
        message: "Informe o benefício social (lista oficial)",
      });
    }
    if (data.familia.possuiInternetCasa && !data.familia.tipoAcessoInternet) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["familia", "tipoAcessoInternet"],
        message: "Informe o tipo de acesso à internet (lista oficial)",
      });
    }

    /** B-08 — Bloco A (mobile T2+; T1/planilha permanece flexível). */
    const isMobileColeta = data.momento.codigo !== "T1";
    if (isMobileColeta) {
      if (!data.aluno.dataNascimento) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["aluno", "dataNascimento"],
          message: "Data de nascimento é obrigatória",
        });
      } else {
        const birth = data.aluno.dataNascimento;
        const birthDay = new Date(
          Date.UTC(birth.getFullYear(), birth.getMonth(), birth.getDate()),
        );
        if (birthDay > startOfTodayUtc()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["aluno", "dataNascimento"],
            message: "Data de nascimento não pode ser no futuro",
          });
        }
      }
    } else if (data.aluno.dataNascimento) {
      const birth = data.aluno.dataNascimento;
      const birthDay = new Date(
        Date.UTC(birth.getFullYear(), birth.getMonth(), birth.getDate()),
      );
      if (birthDay > startOfTodayUtc()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["aluno", "dataNascimento"],
          message: "Data de nascimento não pode ser no futuro",
        });
      }
    }

    const cpfAlunoMsg = cpfErrorMessage(data.aluno.cpf);
    if (cpfAlunoMsg) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["aluno", "cpf"],
        message: cpfAlunoMsg,
      });
    }
    const cpfRespMsg = cpfErrorMessage(data.responsavel.cpf);
    if (cpfRespMsg) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["responsavel", "cpf"],
        message: cpfRespMsg,
      });
    }

    if (
      data.pesquisa.necessidadeEducacionalEspecial &&
      !data.pesquisa.descricaoNecessidade?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pesquisa", "descricaoNecessidade"],
        message: "Descreva a necessidade educacional especial",
      });
    }

    const { equipamentoEstudo, disponibilidadeEquipamento } = data.pesquisa;
    if (!(equipamentoEstudo == null && disponibilidadeEquipamento == null)) {
      if (equipamentoEstudo === "NENHUM") {
        if (
          disponibilidadeEquipamento != null &&
          disponibilidadeEquipamento !== "N_A"
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["pesquisa", "disponibilidadeEquipamento"],
            message:
              "Com equipamento 'nenhum', disponibilidade deve ser N_A ou omitida",
          });
        }
      } else if (
        equipamentoEstudo != null &&
        disponibilidadeEquipamento === "N_A"
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pesquisa", "disponibilidadeEquipamento"],
          message:
            "Disponibilidade N_A só se aplica quando não há equipamento de estudo",
        });
      }
    }

    const unique = [...new Set(data.barreiras)];
    if (unique.length !== data.barreiras.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["barreiras"],
        message: "Códigos de barreira duplicados",
      });
    }
    if (
      unique.includes(BARREIRA_NENHUMA) &&
      unique.some((c) => c !== BARREIRA_NENHUMA)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["barreiras"],
        message: "Barreira 'Nenhuma' não pode ser combinada com outras",
      });
    }
  });

export type ColetaInput = z.infer<typeof coletaSchema>;
