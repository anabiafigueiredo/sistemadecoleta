import type { ApiErrorBody } from "@/lib/api-response";

type ApiSuccess<T> = { data: T; error?: undefined };
type ApiFailure = { data?: undefined; error: ApiErrorBody };
type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, error: ApiErrorBody) {
    super(error.message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = error.code;
    this.details = error.details;
  }
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, { cache: "no-store", ...init });
  const json = (await res.json()) as ApiEnvelope<T>;

  if (!res.ok || json.error || json.data === undefined) {
    throw new ApiRequestError(
      res.status,
      json.error ?? {
        code: "INTERNAL_ERROR",
        message: "Resposta inválida da API",
      },
    );
  }

  return json.data;
}
