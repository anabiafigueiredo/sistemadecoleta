import { z } from "zod";
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
  EQUIPAMENTO_NENHUM,
  ESCOLARIDADE_OPTIONS,
  LOCAL_ESTUDO_OPTIONS,
  MAX_APOIOS_PRIORITARIOS,
  MAX_NECESSIDADES_EDUCACIONAIS,
  MEIO_TRANSPORTE_OPTIONS,
  NECESSIDADE_EDUCACIONAL_OPTIONS,
  PARENTESCO_OPTIONS,
  SITUACAO_OCUPACIONAL_OPTIONS,
  TIPO_ACESSO_INTERNET_OPTIONS,
  TIPO_LOCALIDADE_OPTIONS,
  TURNO_OPTIONS,
  canonicalCode,
  joinCodes,
  splitCodes,
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

/** Aceita array, string CSV ou valor único legado → array de códigos. */
function codesArrayFromOptions<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
) {
  const item = codeEnumFromOptions(options);
  return z.preprocess((value) => {
    if (value == null || value === "") return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return splitCodes(value);
    return value;
  }, z.array(item));
}

const equipamentosEstudoArray = codesArrayFromOptions(EQUIPAMENTO_ESTUDO_OPTIONS);
const apoiosPrioritariosArray = codesArrayFromOptions(APOIO_PRIORITARIO_OPTIONS);
const necessidadesEducacionaisArray = codesArrayFromOptions(
  NECESSIDADE_EDUCACIONAL_OPTIONS,
);

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
      codigoFamilia: z
        .string()
        .trim()
        .toUpperCase()
        .min(1, "codigoFamilia é obrigatório"),
      endereco: z.string().trim().min(1),
      bairro: codeEnumFromOptions(BAIRRO_OPTIONS),
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
      codigoAluno: z
        .string()
        .trim()
        .toUpperCase()
        .min(1, "codigoAluno é obrigatório"),
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
    pesquisa: z
      .object({
        meioTransporteEscola: meioTransporteEnum,
        tempoDeslocamentoMin: z.coerce.number().int().min(0),
        /** Percentual 0–100; preenchido nas coletas mobile v2. */
        frequenciaEscolarPct: z.coerce
          .number()
          .min(0)
          .max(100)
          .nullable()
          .optional(),
        anoSerie: anoSerieEnum,
        turno: turnoEnum,
        necessidadeEducacionalEspecial: z.boolean(),
        /** Códigos NEE (até 2). Aceita também descricaoNecessidade CSV legada. */
        necessidadesEducacionais: necessidadesEducacionaisArray.optional(),
        descricaoNecessidade: z.string().trim().nullable().optional(),
        observacao: z.string().trim().nullable().optional(),
        /** Arrays v2; campos singulares legados ainda aceitos. */
        equipamentosEstudo: equipamentosEstudoArray.optional(),
        equipamentoEstudo: z.union([
          equipamentosEstudoArray,
          equipamentoEstudoEnum,
        ]).optional(),
        disponibilidadeEquipamento:
          disponibilidadeEquipamentoEnum.nullable().optional(),
        localEstudo: localEstudoEnum.nullable().optional(),
        acompanhamentoFamiliar: acompanhamentoFamiliarEnum.nullable().optional(),
        apoiosPrioritarios: apoiosPrioritariosArray.optional(),
        apoioPrioritario: z.union([
          apoiosPrioritariosArray,
          apoioPrioritarioEnum,
        ]).optional(),
      })
      .transform((p) => {
        const fromEquipLegacy = Array.isArray(p.equipamentoEstudo)
          ? p.equipamentoEstudo
          : p.equipamentoEstudo
            ? [p.equipamentoEstudo]
            : [];
        const equipamentosEstudo =
          p.equipamentosEstudo && p.equipamentosEstudo.length > 0
            ? p.equipamentosEstudo
            : fromEquipLegacy;

        const fromApoioLegacy = Array.isArray(p.apoioPrioritario)
          ? p.apoioPrioritario
          : p.apoioPrioritario
            ? [p.apoioPrioritario]
            : [];
        const apoiosPrioritarios =
          p.apoiosPrioritarios && p.apoiosPrioritarios.length > 0
            ? p.apoiosPrioritarios
            : fromApoioLegacy;

        const fromNeeText = splitCodes(p.descricaoNecessidade ?? undefined)
          .map((c) => canonicalCode(NECESSIDADE_EDUCACIONAL_OPTIONS, c) ?? c)
          .filter(Boolean);
        const necessidadesEducacionais =
          p.necessidadesEducacionais && p.necessidadesEducacionais.length > 0
            ? p.necessidadesEducacionais
            : fromNeeText;

        return {
          meioTransporteEscola: p.meioTransporteEscola,
          tempoDeslocamentoMin: p.tempoDeslocamentoMin,
          frequenciaEscolarPct: p.frequenciaEscolarPct,
          anoSerie: p.anoSerie,
          turno: p.turno,
          necessidadeEducacionalEspecial: p.necessidadeEducacionalEspecial,
          necessidadesEducacionais,
          observacao: p.observacao ?? null,
          equipamentosEstudo,
          disponibilidadeEquipamento: p.disponibilidadeEquipamento ?? null,
          localEstudo: p.localEstudo ?? null,
          acompanhamentoFamiliar: p.acompanhamentoFamiliar ?? null,
          apoiosPrioritarios,
        };
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
      if (!/^FAM-\d{3,6}$/.test(data.familia.codigoFamilia)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["familia", "codigoFamilia"],
          message: "codigoFamilia deve estar no formato FAM-001",
        });
      }
      if (!/^ALU-\d{3,8}$/.test(data.aluno.codigoAluno)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["aluno", "codigoAluno"],
          message: "codigoAluno deve estar no formato ALU-1001",
        });
      }
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

    if (data.pesquisa.necessidadeEducacionalEspecial) {
      const needs = data.pesquisa.necessidadesEducacionais;
      if (!needs.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pesquisa", "necessidadesEducacionais"],
          message: "Selecione até 2 necessidades educacionais",
        });
      } else if (needs.length > MAX_NECESSIDADES_EDUCACIONAIS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pesquisa", "necessidadesEducacionais"],
          message: `Selecione no máximo ${MAX_NECESSIDADES_EDUCACIONAIS} opções`,
        });
      }
    }

    const { equipamentosEstudo, disponibilidadeEquipamento, apoiosPrioritarios } =
      data.pesquisa;

    if (isMobileColeta && equipamentosEstudo.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pesquisa", "equipamentosEstudo"],
        message: "Informe os equipamentos de estudo",
      });
    }

    const soNenhum =
      equipamentosEstudo.length === 1 &&
      equipamentosEstudo[0] === EQUIPAMENTO_NENHUM;
    const hasEquip = equipamentosEstudo.length > 0;

    if (hasEquip) {
      if (
        equipamentosEstudo.includes(EQUIPAMENTO_NENHUM) &&
        equipamentosEstudo.some((c) => c !== EQUIPAMENTO_NENHUM)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pesquisa", "equipamentosEstudo"],
          message: "'Nenhum' não pode ser combinado com outros equipamentos",
        });
      }
      if (soNenhum) {
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
      } else if (disponibilidadeEquipamento === "N_A") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pesquisa", "disponibilidadeEquipamento"],
          message:
            "Disponibilidade N_A só se aplica quando não há equipamento de estudo",
        });
      } else if (isMobileColeta && disponibilidadeEquipamento == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pesquisa", "disponibilidadeEquipamento"],
          message: "Informe a disponibilidade dos equipamentos",
        });
      }
    }

    if (isMobileColeta && apoiosPrioritarios.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pesquisa", "apoiosPrioritarios"],
        message: "Informe as áreas de apoio prioritário",
      });
    }
    if (apoiosPrioritarios.length > 0) {
      if (
        apoiosPrioritarios.includes(APOIO_NENHUM) &&
        apoiosPrioritarios.some((c) => c !== APOIO_NENHUM)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pesquisa", "apoiosPrioritarios"],
          message: "'Nenhum' não pode ser combinado com outras áreas",
        });
      }
      const nonEx = apoiosPrioritarios.filter((c) => c !== APOIO_NENHUM);
      if (nonEx.length > MAX_APOIOS_PRIORITARIOS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pesquisa", "apoiosPrioritarios"],
          message: `Selecione no máximo ${MAX_APOIOS_PRIORITARIOS} áreas de apoio`,
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

/** Serializa arrays para colunas String do banco (CSV). */
export function pesquisaToDbScalars(pesquisa: ColetaInput["pesquisa"]) {
  const soNenhum =
    pesquisa.equipamentosEstudo.length === 1 &&
    pesquisa.equipamentosEstudo[0] === EQUIPAMENTO_NENHUM;
  return {
    necessidadeEducacionalEspecial: pesquisa.necessidadeEducacionalEspecial,
    descricaoNecessidade: pesquisa.necessidadeEducacionalEspecial
      ? joinCodes(pesquisa.necessidadesEducacionais)
      : null,
    observacao: pesquisa.observacao ?? null,
    equipamentoEstudo: joinCodes(pesquisa.equipamentosEstudo),
    disponibilidadeEquipamento: soNenhum
      ? ("N_A" as const)
      : (pesquisa.disponibilidadeEquipamento ?? null),
    localEstudo: pesquisa.localEstudo ?? null,
    acompanhamentoFamiliar: pesquisa.acompanhamentoFamiliar ?? null,
    apoioPrioritario: joinCodes(pesquisa.apoiosPrioritarios),
  };
}
