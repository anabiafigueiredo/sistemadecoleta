import { z } from "zod";
import type { ColetaFormState, ColetaPayload } from "@/lib/types";
import { cpfErrorMessage, onlyDigits, parseCurrencyToNumber } from "@/lib/masks";

const optionalDigits = z
  .string()
  .transform((v) => {
    const d = onlyDigits(v);
    return d.length > 0 ? d : null;
  });

export const coletaFormSchema = z
  .object({
    momentoCodigo: z.enum(["T2", "T3"]),
    codigoFamilia: z.string().trim().min(1, "Código da família é obrigatório"),
    endereco: z.string().trim().min(1, "Endereço é obrigatório"),
    bairro: z.string().trim().min(1, "Bairro é obrigatório"),
    comunidade: z.string().trim().min(1, "Comunidade é obrigatória"),
    qtdMoradores: z
      .string()
      .trim()
      .min(1, "Qtd. moradores é obrigatória")
      .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, {
        message: "Qtd. moradores deve ser inteiro ≥ 1",
      }),
    rendaFamiliarMensal: z
      .string()
      .trim()
      .min(1, "Renda familiar é obrigatória")
      .refine((v) => {
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
    parentesco: z.string().trim().min(1, "Parentesco é obrigatório"),
    cpfResponsavel: z.string(),
    telefone: z.string(),
    email: z.string(),
    meioTransporteEscola: z
      .string()
      .trim()
      .min(1, "Meio de transporte é obrigatório"),
    tempoDeslocamentoMin: z
      .string()
      .trim()
      .min(1, "Tempo de deslocamento é obrigatório")
      .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 0, {
        message: "Tempo deve ser inteiro ≥ 0",
      }),
    frequenciaEscolarPct: z
      .string()
      .trim()
      .min(1, "Frequência escolar é obrigatória")
      .refine((v) => {
        const n = Number(v.replace(",", "."));
        return Number.isFinite(n) && n >= 0 && n <= 100;
      }, "Frequência deve estar entre 0 e 100%"),
    anoSerie: z.string().trim().min(1, "Ano/série é obrigatório"),
    turno: z.string().trim().min(1, "Turno é obrigatório"),
    necessidadeEducacionalEspecial: z.boolean(),
    descricaoNecessidade: z.string(),
    observacao: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.recebeBeneficioSocial && !data.beneficioSocial.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["beneficioSocial"],
        message: "Informe o benefício social",
      });
    }
    if (data.possuiInternetCasa && !data.tipoAcessoInternet.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tipoAcessoInternet"],
        message: "Informe o tipo de acesso à internet",
      });
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
    if (birth) {
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
  const freq = Number(d.frequenciaEscolarPct.replace(",", "."));

  const payload: ColetaPayload = {
    momento: { codigo: d.momentoCodigo },
    familia: {
      codigoFamilia: d.codigoFamilia.trim(),
      endereco: d.endereco.trim(),
      bairro: d.bairro.trim(),
      comunidade: d.comunidade.trim(),
      qtdMoradores: Number(d.qtdMoradores),
      rendaFamiliarMensal: renda,
      recebeBeneficioSocial: d.recebeBeneficioSocial,
      beneficioSocial: d.recebeBeneficioSocial
        ? d.beneficioSocial.trim()
        : null,
      possuiInternetCasa: d.possuiInternetCasa,
      tipoAcessoInternet: d.possuiInternetCasa
        ? d.tipoAcessoInternet.trim()
        : null,
    },
    aluno: {
      codigoAluno: d.codigoAluno.trim(),
      nome: d.nomeAluno.trim(),
      dataNascimento: d.dataNascimento.trim()
        ? toIsoDate(d.dataNascimento.trim())
        : null,
      sexo: d.sexo === "" ? null : d.sexo,
      cpf: optionalDigits.parse(d.cpfAluno),
    },
    responsavel: {
      nome: d.nomeResponsavel.trim(),
      parentesco: d.parentesco.trim(),
      cpf: optionalDigits.parse(d.cpfResponsavel),
      telefone: optionalDigits.parse(d.telefone),
      email: d.email.trim() ? d.email.trim().toLowerCase() : null,
    },
    pesquisa: {
      meioTransporteEscola: d.meioTransporteEscola.trim(),
      tempoDeslocamentoMin: Number(d.tempoDeslocamentoMin),
      frequenciaEscolarPct: freq,
      anoSerie: d.anoSerie.trim(),
      turno: d.turno.trim(),
      necessidadeEducacionalEspecial: d.necessidadeEducacionalEspecial,
      descricaoNecessidade: d.necessidadeEducacionalEspecial
        ? d.descricaoNecessidade.trim()
        : null,
      observacao: d.observacao.trim() ? d.observacao.trim() : null,
    },
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
    meioTransporteEscola: "",
    tempoDeslocamentoMin: "",
    frequenciaEscolarPct: "",
    anoSerie: "",
    turno: "",
    necessidadeEducacionalEspecial: false,
    descricaoNecessidade: "",
    observacao: "",
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
    qtdMoradores: String(payload.familia.qtdMoradores),
    rendaFamiliarMensal: String(payload.familia.rendaFamiliarMensal).replace(
      ".",
      ",",
    ),
    recebeBeneficioSocial: payload.familia.recebeBeneficioSocial,
    beneficioSocial: payload.familia.beneficioSocial ?? "",
    possuiInternetCasa: payload.familia.possuiInternetCasa,
    tipoAcessoInternet: payload.familia.tipoAcessoInternet ?? "",
    codigoAluno: payload.aluno.codigoAluno,
    nomeAluno: payload.aluno.nome,
    dataNascimento: payload.aluno.dataNascimento
      ? isoToBr(payload.aluno.dataNascimento)
      : "",
    sexo: payload.aluno.sexo ?? "",
    cpfAluno: payload.aluno.cpf ?? "",
    nomeResponsavel: payload.responsavel.nome,
    parentesco: payload.responsavel.parentesco,
    cpfResponsavel: payload.responsavel.cpf ?? "",
    telefone: payload.responsavel.telefone ?? "",
    email: payload.responsavel.email ?? "",
    meioTransporteEscola: payload.pesquisa.meioTransporteEscola,
    tempoDeslocamentoMin: String(payload.pesquisa.tempoDeslocamentoMin),
    frequenciaEscolarPct: String(payload.pesquisa.frequenciaEscolarPct),
    anoSerie: payload.pesquisa.anoSerie,
    turno: payload.pesquisa.turno,
    necessidadeEducacionalEspecial:
      payload.pesquisa.necessidadeEducacionalEspecial,
    descricaoNecessidade: payload.pesquisa.descricaoNecessidade ?? "",
    observacao: payload.pesquisa.observacao ?? "",
  };
}

function isoToBr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}
