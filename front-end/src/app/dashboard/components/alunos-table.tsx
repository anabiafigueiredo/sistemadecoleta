"use client";

import { useEffect, useState, useTransition } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
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
import type { AlunoListItem, MomentoColetaResumo } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

function formatDataCurta(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function AlunosTable({
  momentos = [],
  refreshKey = 0,
}: {
  momentos?: MomentoColetaResumo[];
  /** Incrementado pelo dashboard quando os KPIs são recarregados. */
  refreshKey?: number;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [momentoFiltro, setMomentoFiltro] = useState<string>("TODOS");
  const [alunos, setAlunos] = useState<AlunoListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 280);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();

    startTransition(async () => {
      try {
        setError(null);
        const params = new URLSearchParams();
        if (debounced) params.set("q", debounced);
        if (momentoFiltro !== "TODOS") params.set("momento", momentoFiltro);
        const qs = params.toString();
        const data = await fetchJson<AlunoListItem[]>(
          `/api/alunos${qs ? `?${qs}` : ""}`,
          { signal: controller.signal },
        );
        setAlunos(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (err instanceof Error && err.name === "AbortError") return;
        setError(
          err instanceof ApiRequestError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Erro ao carregar alunos",
        );
      }
    });

    return () => controller.abort();
  }, [debounced, momentoFiltro, refreshKey]);

  const countLabel = isPending
    ? "Buscando…"
    : `${alunos.length} registro${alunos.length === 1 ? "" : "s"}`;

  const toggle = (id: string) =>
    setExpandedId((current) => (current === id ? null : id));

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg">
              Alunos e coletas
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Consulte por ciclo de monitoramento (T1, T2, T3) e busque
              registros
            </CardDescription>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar alunos…"
              className="pl-9"
              aria-label="Buscar alunos"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <MomentoChip
            active={momentoFiltro === "TODOS"}
            onClick={() => setMomentoFiltro("TODOS")}
            label="Todos"
          />
          {momentos.map((m) => (
            <MomentoChip
              key={m.id}
              active={momentoFiltro === m.codigo}
              onClick={() => setMomentoFiltro(m.codigo)}
              label={`${m.codigo} · ${formatDataCurta(m.dataReferencia)}`}
              hint={`${m.totalPesquisas} pesquisa(s) · ${m.origemPadrao}`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground sm:text-sm">
          <span>{countLabel}</span>
          <span className="truncate">
            {momentoFiltro !== "TODOS" ? `Ciclo ${momentoFiltro}` : "Todos os ciclos"}
            {debounced ? ` · “${debounced}”` : ""}
          </span>
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {alunos.map((aluno) => {
                const open = expandedId === aluno.id;
                return (
                  <article
                    key={aluno.id}
                    className="rounded-xl border border-border bg-white/90 p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap gap-1">
                          {aluno.pesquisa?.momento ? (
                            <Badge
                              variant={
                                aluno.pesquisa.momento.origemPadrao ===
                                "PLANILHA"
                                  ? "warning"
                                  : "default"
                              }
                            >
                              {aluno.pesquisa.momento.codigo}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {aluno.codigoAluno}
                        </p>
                        <h4 className="truncate font-semibold leading-tight">
                          {aluno.nome}
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {aluno.familia.bairro} ·{" "}
                          {aluno.pesquisa?.turno ?? "Sem turno"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge variant="secondary">
                          {aluno.pesquisa
                            ? formatPercent(
                                aluno.pesquisa.frequenciaEscolarPct,
                                0,
                              )
                            : "—"}
                        </Badge>
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
              {alunos.length === 0 && !isPending ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum aluno encontrado neste ciclo.
                </p>
              ) : null}
            </div>

            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 font-medium">Ciclo</th>
                    <th className="px-3 py-3 font-medium">Código</th>
                    <th className="px-3 py-3 font-medium">Aluno</th>
                    <th className="px-3 py-3 font-medium">Família</th>
                    <th className="px-3 py-3 font-medium">Bairro</th>
                    <th className="px-3 py-3 font-medium">Turno</th>
                    <th className="px-3 py-3 font-medium">Freq.</th>
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
                  {alunos.length === 0 && !isPending ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-8 text-center text-muted-foreground"
                      >
                        Nenhum aluno encontrado neste ciclo.
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

function MomentoChip({
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
  return (
    <>
      <tr className="border-t border-border hover:bg-muted/40">
        <td className="px-3 py-3">
          {aluno.pesquisa?.momento ? (
            <Badge
              variant={
                aluno.pesquisa.momento.origemPadrao === "PLANILHA"
                  ? "warning"
                  : "default"
              }
            >
              {aluno.pesquisa.momento.codigo}
            </Badge>
          ) : (
            "—"
          )}
        </td>
        <td className="px-3 py-3 font-mono text-xs">{aluno.codigoAluno}</td>
        <td className="px-3 py-3 font-medium">{aluno.nome}</td>
        <td className="px-3 py-3">{aluno.familia.codigoFamilia}</td>
        <td className="px-3 py-3">{aluno.familia.bairro}</td>
        <td className="px-3 py-3">{aluno.pesquisa?.turno ?? "—"}</td>
        <td className="px-3 py-3 tabular-nums">
          {aluno.pesquisa
            ? formatPercent(aluno.pesquisa.frequenciaEscolarPct, 0)
            : "—"}
        </td>
        <td className="px-3 py-3 text-right">
          <ToggleDetails open={open} onClick={onToggle} />
        </td>
      </tr>
      {open ? (
        <tr className="border-t border-border bg-white/60">
          <td colSpan={8} className="px-4 py-4">
            <AlunoDetailPanels aluno={aluno} />
          </td>
        </tr>
      ) : null}
    </>
  );
}
