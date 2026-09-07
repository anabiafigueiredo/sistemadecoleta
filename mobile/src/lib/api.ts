import { API_URL } from "@/lib/config";
import type { ColetaPayload } from "@/lib/types";

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export class ApiRequestError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, error: ApiError) {
    super(error.message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = error.code;
    this.details = error.details;
  }
}

type EnvelopeSuccess<T> = { data: T };
type EnvelopeError = { error: ApiError };

function formatValidationDetails(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  const fieldErrors = (details as { fieldErrors?: Record<string, string[]> })
    .fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== "object") return null;
  const parts: string[] = [];
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (!Array.isArray(messages) || messages.length === 0) continue;
    parts.push(`${field}: ${messages.join("; ")}`);
  }
  return parts.length > 0 ? parts.join(" | ") : null;
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  const json = (await res.json()) as EnvelopeSuccess<T> & EnvelopeError;
  if (!res.ok) {
    const base = json.error ?? {
      code: "INTERNAL_ERROR",
      message: `HTTP ${res.status}`,
    };
    const detail =
      base.code === "VALIDATION_ERROR"
        ? formatValidationDetails(base.details)
        : null;
    throw new ApiRequestError(res.status, {
      ...base,
      message: detail ? `${base.message} (${detail})` : base.message,
    });
  }
  return json.data;
}

export async function postColeta(payload: ColetaPayload): Promise<{
  pesquisaId: string | null;
}> {
  const res = await fetch(`${API_URL}/api/coleta`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const data = await parseEnvelope<{ pesquisa?: { id?: string } }>(res);
  return { pesquisaId: data?.pesquisa?.id ?? null };
}

/** Espelha `AlunoListItem` do front (GET /api/alunos). */
export type AlunoRemote = {
  id: string;
  codigoAluno: string;
  nome: string;
  dataNascimento: string | null;
  sexo: string | null;
  cpf: string | null;
  familia: {
    id: string;
    codigoFamilia: string;
    endereco: string;
    bairro: string;
    comunidade: string;
    tipoLocalidade: string | null;
    qtdMoradores: number;
    rendaFamiliarMensal: number;
    recebeBeneficioSocial: boolean;
    beneficioSocial: string | null;
    possuiInternetCasa: boolean;
    tipoAcessoInternet: string | null;
  };
  responsavel: {
    id: string;
    nome: string;
    parentesco: string;
    cpf: string | null;
    telefone: string | null;
    email: string | null;
    escolaridade: string | null;
    situacaoOcupacional: string | null;
  } | null;
  pesquisa: {
    id: string;
    origem: "PLANILHA" | "MOBILE";
    versaoQuestionario: number;
    meioTransporteEscola: string;
    tempoDeslocamentoMin: number;
    frequenciaEscolarPct: number | null;
    anoSerie: string;
    turno: string;
    necessidadeEducacionalEspecial: boolean;
    descricaoNecessidade: string | null;
    observacao: string | null;
    equipamentoEstudo: string | null;
    disponibilidadeEquipamento: string | null;
    localEstudo: string | null;
    acompanhamentoFamiliar: string | null;
    apoioPrioritario: string | null;
    barreiras: Array<{ codigo: string; nome: string }>;
    sincronizadoEm: string;
    momento: {
      id: string;
      codigo: string;
      titulo: string;
      dataReferencia: string;
      origemPadrao: "PLANILHA" | "MOBILE";
    };
  } | null;
};

export async function fetchAlunos(params?: {
  q?: string;
  momento?: string;
  origem?: "PLANILHA" | "MOBILE";
}): Promise<AlunoRemote[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.momento) qs.set("momento", params.momento);
  if (params?.origem) qs.set("origem", params.origem);
  const url = `${API_URL}/api/alunos${qs.toString() ? `?${qs}` : ""}`;
  const res = await fetch(url);
  return parseEnvelope<AlunoRemote[]>(res);
}

export type MomentoRemote = { codigo: string };

export async function fetchMomentos(): Promise<MomentoRemote[]> {
  const res = await fetch(`${API_URL}/api/dashboard/stats`);
  const data = await parseEnvelope<{ momentos?: MomentoRemote[] }>(res);
  return data.momentos ?? [];
}

export type CodigosLookup = {
  aluno: {
    codigoAluno: string;
    nome: string;
    dataNascimento: string | null;
    sexo: string | null;
    cpf: string | null;
    codigoFamilia: string;
    responsavel: {
      nome: string;
      parentesco: string;
      cpf: string | null;
      telefone: string | null;
      email: string | null;
      escolaridade: string | null;
      situacaoOcupacional: string | null;
    } | null;
  } | null;
  familia: {
    codigoFamilia: string;
    endereco: string;
    bairro: string;
    comunidade: string;
    tipoLocalidade: string | null;
    qtdMoradores: number;
    rendaFamiliarMensal: number;
    recebeBeneficioSocial: boolean;
    beneficioSocial: string | null;
    possuiInternetCasa: boolean;
    tipoAcessoInternet: string | null;
    qtdAlunos: number;
  } | null;
};

/** Existência exata de códigos no servidor (unicidade / vínculo). */
export async function fetchCodigosLookup(params: {
  codigoAluno?: string;
  codigoFamilia?: string;
}): Promise<CodigosLookup> {
  const qs = new URLSearchParams();
  if (params.codigoAluno) qs.set("codigoAluno", params.codigoAluno);
  if (params.codigoFamilia) qs.set("codigoFamilia", params.codigoFamilia);
  const res = await fetch(`${API_URL}/api/coleta/lookup?${qs.toString()}`);
  return parseEnvelope<CodigosLookup>(res);
}

export type CodigosProximos = {
  codigoFamilia: string;
  codigoAluno: string;
};

export async function fetchProximosCodigos(): Promise<CodigosProximos> {
  const res = await fetch(`${API_URL}/api/codigos/proximo`);
  return parseEnvelope<CodigosProximos>(res);
}

/** IDs de pesquisas ainda existentes no servidor (+ chaves aluno|ciclo). */
export async function fetchRemoteColetaIndex(): Promise<{
  pesquisaIds: Set<string>;
  alunoMomentoKeys: Set<string>;
}> {
  const momentos = await fetchMomentos();
  const codes = momentos.map((m) => m.codigo);
  if (codes.length === 0) codes.push("T1", "T2", "T3");

  const lists = await Promise.all([
    fetchAlunos(),
    ...codes.map((codigo) => fetchAlunos({ momento: codigo })),
  ]);

  const pesquisaIds = new Set<string>();
  const alunoMomentoKeys = new Set<string>();

  for (const list of lists) {
    for (const aluno of list) {
      if (!aluno.pesquisa) continue;
      pesquisaIds.add(aluno.pesquisa.id);
      alunoMomentoKeys.add(
        `${aluno.codigoAluno}|${aluno.pesquisa.momento.codigo}`.toUpperCase(),
      );
    }
  }

  return { pesquisaIds, alunoMomentoKeys };
}
