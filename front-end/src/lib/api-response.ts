import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export type ApiErrorBody = {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    { data },
    {
      status: 200,
      ...init,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        ...(init?.headers ?? {}),
      },
    },
  );
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function fail(
  code: ApiErrorCode,
  message: string,
  status = 400,
  details?: unknown,
) {
  const error: ApiErrorBody = { code, message };
  if (details !== undefined) error.details = details;
  return NextResponse.json({ error }, { status });
}
