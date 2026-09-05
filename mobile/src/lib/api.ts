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

async function parseEnvelope<T>(res: Response): Promise<T> {
  const json = (await res.json()) as EnvelopeSuccess<T> & EnvelopeError;
  if (!res.ok) {
    throw new ApiRequestError(
      res.status,
      json.error ?? {
        code: "INTERNAL_ERROR",
        message: `HTTP ${res.status}`,
      },
    );
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

export type AlunoRemote = {
  codigoAluno: string;
  pesquisa: {
    id: string;
    momento: { codigo: string };
  } | null;
};

export async function fetchAlunos(params?: {
  q?: string;
  momento?: string;
}): Promise<AlunoRemote[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.momento) qs.set("momento", params.momento);
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
