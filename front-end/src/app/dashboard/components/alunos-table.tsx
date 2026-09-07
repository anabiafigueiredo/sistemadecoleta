"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlunoDetailPanels } from "./aluno-detail-panels";
import { ApiRequestError, fetchJson } from "@/lib/fetch-json";
import type { AlunoListItem } from "@/lib/types";

type OrigemFiltro = "TODOS" | "PLANILHA" | "MOBILE";

function formatDataCurta(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function origemLabel(origem: "PLANILHA" | "MOBILE") {
  return origem === "PLANILHA" ? "Ciclo 1" : "Ciclo 2";
}

function dataEntrevista(aluno: AlunoListItem): string | null {
  if (!aluno.pesquisa) return null;
  if (aluno.pesquisa.origem === "MOBILE") {
    return aluno.pesquisa.sincronizadoEm;
  }
  return aluno.pesquisa.momento.dataReferencia;
}

function isAbortError(err: unknown) {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}

export function AlunosTable({
  refreshKey = 0,
  totalColetas,
  totalColetasV2,
}: {
  refreshKey?: number;
  /** Totais do painel — exibidos junto à consulta de entrevistas. */
  totalColetas?: number;
  totalColetasV2?: number;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [origemFiltro, setOrigemFiltro] = useState<OrigemFiltro>("TODOS");
  const [alunos, setAlunos] = useState<AlunoListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 280);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);
    setAlunos([]);
    setExpandedId(null);

    void (async () => {
      try {
        const params = new URLSearchParams();
        if (debounced) params.set("q", debounced);
        if (origemFiltro !== "TODOS") params.set("origem", origemFiltro);
        const qs = params.toString();
        const data = await fetchJson<AlunoListItem[]>(
          `/api/alunos${qs ? `?${qs}` : ""}`,
          { signal: controller.signal },
        );
        if (requestId !== requestIdRef.current) return;
        setAlunos(data);
      } catch (err) {
        if (isAbortError(err) || requestId !== requestIdRef.current) return;
        setError(
          err instanceof ApiRequestError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Erro ao carregar alunos",
        );
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [debounced, origemFiltro, refreshKey]);

  const countLabel = loading
    ? null
    : `${alunos.length} registro${alunos.length === 1 ? "" : "s"}`;

  const toggle = (id: string) =>
    setExpandedId((current) => (current === id ? null : id));

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg">
              Consulta de entrevistas
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {totalColetas != null ? (
                <>
                  {totalColetas} entrevista
                  {totalColetas === 1 ? "" : "s"} no total
                  {totalColetasV2 != null
                    ? ` · ${totalColetasV2} pelo aplicativo`
                    : ""}
                  .{" "}
                </>
              ) : null}
              Aluno, família/comunidade, data, ciclo (1 = baseline, 2 = campo) e
              status
            </CardDescription>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome do aluno…"
              className="pl-9"
              aria-label="Buscar por nome do aluno"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={origemFiltro === "TODOS"}
            onClick={() => setOrigemFiltro("TODOS")}
            label="Todos os ciclos"
          />
          <FilterChip
            active={origemFiltro === "PLANILHA"}
            onClick={() => setOrigemFiltro("PLANILHA")}
            label="Ciclo 1"
            hint="Baseline / importação da planilha (v1)"
          />
          <FilterChip
            active={origemFiltro === "MOBILE"}
            onClick={() => setOrigemFiltro("MOBILE")}
            label="Ciclo 2"
            hint="Entrevistas sincronizadas do app (v2)"
          />
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground sm:text-sm">
          <span>{countLabel ?? "\u00a0"}</span>
          <span className="truncate">
            {origemFiltro !== "TODOS"
              ? origemLabel(origemFiltro)
              : "Todos os ciclos"}
            {debounced ? ` · “${debounced}”` : ""}
          </span>
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : loading ? (
          <div
            className="flex min-h-[12rem] flex-col items-center justify-center gap-3 py-10 text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm">Carregando entrevistas…</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {alunos.map((aluno) => {
                const open = expandedId === aluno.id;
                const data = dataEntrevista(aluno);
                return (
                  <article
                    key={aluno.id}
                    className="rounded-xl border border-border bg-white/90 p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap gap-1">
                          {aluno.pesquisa ? (
                            <>
                              <Badge
                                variant={
                                  aluno.pesquisa.origem === "PLANILHA"
                                    ? "warning"
                                    : "default"
                                }
                              >
                                {origemLabel(aluno.pesquisa.origem)}
                              </Badge>
                              <Badge variant="success">Sincronizado</Badge>
                              <Badge variant="secondary">
                                v{aluno.pesquisa.versaoQuestionario}
                              </Badge>
                            </>
                          ) : (
                            <Badge variant="secondary">Sem entrevista</Badge>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {aluno.codigoAluno}
                        </p>
                        <h4 className="truncate font-semibold leading-tight">
                          {aluno.nome}
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {aluno.familia.codigoFamilia} ·{" "}
                          {aluno.familia.comunidade || aluno.familia.bairro}
                        </p>
                        {data ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Entrevista: {formatDataCurta(data)}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <ToggleDetails
                          open={open}
                          onClick={() => toggle(aluno.id)}
                        />
                      </div>
                    </div>
                    {open ? (
                      <div className="mt-3 border-t border-border pt-3">
                        <AlunoDetailPanels
                          aluno={aluno}
                          className="grid gap-2"
                        />
                      </div>
                    ) : null}
                  </article>
                );
              })}
              {alunos.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum aluno encontrado com estes filtros.
                </p>
              ) : null}
            </div>

            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 font-medium">Aluno</th>
                    <th className="px-3 py-3 font-medium">
                      Família / comunidade
                    </th>
                    <th className="px-3 py-3 font-medium">Data entrevista</th>
                    <th className="px-3 py-3 font-medium">Ciclo</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {alunos.map((aluno) => {
                    const open = expandedId === aluno.id;
                    return (
                      <AlunoRows
                        key={aluno.id}
                        aluno={aluno}
                        open={open}
                        onToggle={() => toggle(aluno.id)}
                      />
                    );
                  })}
                  {alunos.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-8 text-center text-muted-foreground"
                      >
                        Nenhum aluno encontrado com estes filtros.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function FilterChip({
  label,
  hint,
  active,
  onClick,
}: {
  label: string;
  hint?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={hint}
      onClick={onClick}
      className={
        active
          ? "rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
          : "rounded-lg border border-border bg-white/80 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
      }
    >
      {label}
    </button>
  );
}

function ToggleDetails({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
    >
      Detalhes
      {open ? (
        <ChevronUp className="h-3.5 w-3.5" />
      ) : (
        <ChevronDown className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function AlunoRows({
  aluno,
  open,
  onToggle,
}: {
  aluno: AlunoListItem;
  open: boolean;
  onToggle: () => void;
}) {
  const data = dataEntrevista(aluno);

  return (
    <>
      <tr className="border-t border-border hover:bg-muted/40">
        <td className="px-3 py-3">
          <div className="min-w-0">
            <p className="font-medium">{aluno.nome}</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {aluno.codigoAluno}
            </p>
          </div>
        </td>
        <td className="px-3 py-3">
          <div className="min-w-0">
            <p>{aluno.familia.codigoFamilia}</p>
            <p className="text-xs text-muted-foreground">
              {aluno.familia.comunidade}
              {aluno.familia.bairro ? ` · ${aluno.familia.bairro}` : ""}
            </p>
          </div>
        </td>
        <td className="px-3 py-3 tabular-nums">
          {data ? formatDataCurta(data) : "—"}
        </td>
        <td className="px-3 py-3">
          {aluno.pesquisa ? (
            <Badge
              variant={
                aluno.pesquisa.origem === "PLANILHA" ? "warning" : "default"
              }
            >
              {origemLabel(aluno.pesquisa.origem)}
            </Badge>
          ) : (
            "—"
          )}
        </td>
        <td className="px-3 py-3">
          {aluno.pesquisa ? (
            <div className="flex flex-wrap gap-1">
              <Badge variant="success">Sincronizado</Badge>
              <Badge variant="secondary">
                v{aluno.pesquisa.versaoQuestionario}
              </Badge>
            </div>
          ) : (
            <Badge variant="secondary">Sem entrevista</Badge>
          )}
        </td>
        <td className="px-3 py-3 text-right">
          <ToggleDetails open={open} onClick={onToggle} />
        </td>
      </tr>
      {open ? (
        <tr className="border-t border-border bg-white/60">
          <td colSpan={6} className="px-4 py-4">
            <AlunoDetailPanels aluno={aluno} />
          </td>
        </tr>
      ) : null}
    </>
  );
}
