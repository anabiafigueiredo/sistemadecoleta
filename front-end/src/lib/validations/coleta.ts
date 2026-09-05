import { z } from "zod";

function digitsOrNull(value: unknown): string | null {
  if (value == null || value === "") return null;
  const digits = String(value).replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

function emailOrNull(value: unknown): string | null {
  if (value == null || value === "") return null;
  const email = String(value).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("E-mail inválido");
  }
  return email;
}

export const coletaSchema = z.object({
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
    qtdMoradores: z.coerce.number().int().min(1),
    rendaFamiliarMensal: z.coerce.number().nonnegative(),
    recebeBeneficioSocial: z.boolean(),
    beneficioSocial: z.string().trim().nullable().optional(),
    possuiInternetCasa: z.boolean(),
    tipoAcessoInternet: z.string().trim().nullable().optional(),
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
    parentesco: z.string().trim().min(1),
    cpf: z.preprocess(digitsOrNull, z.string().nullable()),
    telefone: z.preprocess(digitsOrNull, z.string().nullable()),
    email: z.preprocess((v) => {
      try {
        return emailOrNull(v);
      } catch {
        return null;
      }
    }, z.string().nullable()),
  }),
  pesquisa: z.object({
    meioTransporteEscola: z.string().trim().min(1),
    tempoDeslocamentoMin: z.coerce.number().int().min(0),
    frequenciaEscolarPct: z.coerce.number().min(0).max(100),
    anoSerie: z.string().trim().min(1),
    turno: z.string().trim().min(1),
    necessidadeEducacionalEspecial: z.boolean(),
    descricaoNecessidade: z.string().trim().nullable().optional(),
    observacao: z.string().trim().nullable().optional(),
  }),
});

export type ColetaInput = z.infer<typeof coletaSchema>;
