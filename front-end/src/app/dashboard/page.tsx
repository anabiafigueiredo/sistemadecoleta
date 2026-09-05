"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { KpiCards } from "./components/kpi-cards";
import { DashboardCharts } from "./components/charts";
import { AlunosTable } from "./components/alunos-table";
import { ApiRequestError, fetchJson } from "@/lib/fetch-json";
import type { DashboardStats } from "@/lib/types";

const POLL_MS = 3_000;

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadStats = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setUpdating(true);
    try {
      const data = await fetchJson<DashboardStats>(
        `/api/dashboard/stats?_=${Date.now()}`,
      );
      setStats(data);
      setError(null);
      setLastUpdated(new Date());
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Erro ao carregar KPIs",
      );
    } finally {
      setUpdating(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();

    const interval = setInterval(() => {
      void loadStats({ silent: true });
    }, POLL_MS);

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        void loadStats({ silent: true });
      }
    };

    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [loadStats]);

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-5 px-3 py-5 sm:gap-8 sm:px-6 sm:py-8 lg:px-8">
      <header className="dashboard-header relative overflow-hidden rounded-xl border border-border px-4 py-5 sm:rounded-2xl sm:px-8 sm:py-8">
        <div className="relative z-10 flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent sm:text-xs sm:tracking-[0.2em]">
              Levantamento socioeconômico
            </p>
            <h1 className="font-display mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:mt-2 sm:text-4xl">
              Colégio Comunitário
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:mt-3 sm:text-base">
              Painel de monitoramento educacional e social das famílias e alunos
              atendidos.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            {lastUpdated ? (
              <p className="text-[11px] text-muted-foreground sm:text-xs">
                Atualizado às{" "}
                {lastUpdated.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void loadStats()}
              disabled={updating}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/80 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${updating ? "animate-spin" : ""}`}
              />
              Atualizar indicadores
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {stats ? (
        <>
          <KpiCards stats={stats} />
          <DashboardCharts stats={stats} />
          <AlunosTable momentos={stats.momentos} refreshKey={refreshKey} />
        </>
      ) : !error ? (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-muted sm:h-32"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
