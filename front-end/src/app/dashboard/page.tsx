"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { KpiCards } from "./components/kpi-cards";
import { DashboardCharts } from "./components/charts";
import { AlunosTable } from "./components/alunos-table";
import { ApiRequestError, fetchJson } from "@/lib/fetch-json";
import type { DashboardStats } from "@/lib/types";

const POLL_MS = 3_000;

/** Visão do painel: consolidado (hoje) ou um ciclo isolado. */
export type VisaoDashboard = "HOJE" | "CICLO_1" | "CICLO_2";

const VISAO_OPTIONS: Array<{
  value: VisaoDashboard;
  label: string;
  hint: string;
  origem: "PLANILHA" | "MOBILE" | null;
}> = [
  {
    value: "HOJE",
    label: "Total",
    hint: "Planilha (Ciclo 1) + aplicativo (Ciclo 2)",
    origem: null,
  },
  {
    value: "CICLO_1",
    label: "Ciclo 1",
    hint: "Somente dados da planilha (baseline)",
    origem: "PLANILHA",
  },
  {
    value: "CICLO_2",
    label: "Ciclo 2",
    hint: "Somente entrevistas do aplicativo",
    origem: "MOBILE",
  },
];

function origemFromVisao(visao: VisaoDashboard): "PLANILHA" | "MOBILE" | null {
  return VISAO_OPTIONS.find((o) => o.value === visao)?.origem ?? null;
}

function isAbortError(err: unknown) {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}

export default function DashboardPage() {
  const [visao, setVisao] = useState<VisaoDashboard>("HOJE");
  /** Visão à qual os `stats` exibidos pertencem (só avança quando o fetch termina). */
  const [statsVisao, setStatsVisao] = useState<VisaoDashboard>("HOJE");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [updating, setUpdating] = useState(false);
  /** Loading explícito da troca de visão (liga no clique). */
  const [switchingVisao, setSwitchingVisao] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const visaoRef = useRef(visao);
  const switchingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  visaoRef.current = visao;
  switchingRef.current = switchingVisao;

  const loadStats = useCallback(async (opts?: { silent?: boolean }) => {
    // Poll silencioso não interrompe (nem mascara) a troca de visão.
    if (opts?.silent && switchingRef.current) return;

    const visaoPedido = visaoRef.current;
    const origem = origemFromVisao(visaoPedido);
    const requestId = ++requestIdRef.current;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!opts?.silent) setUpdating(true);
    try {
      const params = new URLSearchParams({ _: String(Date.now()) });
      if (origem) params.set("origem", origem);
      const data = await fetchJson<DashboardStats>(
        `/api/dashboard/stats?${params}`,
        { signal: controller.signal },
      );
      if (requestId !== requestIdRef.current) return;
      // Troca atômica: KPIs, gráficos e filtro da tabela mudam juntos.
      setStats(data);
      setStatsVisao(visaoPedido);
      setSwitchingVisao(false);
      setError(null);
      setLastUpdated(new Date());
      if (!opts?.silent) setRefreshKey((k) => k + 1);
    } catch (err) {
      if (isAbortError(err) || requestId !== requestIdRef.current) return;
      setSwitchingVisao(false);
      setError(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Erro ao carregar KPIs",
      );
    } finally {
      if (requestId === requestIdRef.current) setUpdating(false);
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
      abortRef.current?.abort();
    };
  }, [loadStats]);

  // Troca de visão: busca sem limpar a tela (evita flash dos gráficos).
  const isFirstVisaoEffect = useRef(true);
  useEffect(() => {
    if (isFirstVisaoEffect.current) {
      isFirstVisaoEffect.current = false;
      return;
    }
    void loadStats();
  }, [visao, loadStats]);

  const onChangeVisao = (next: VisaoDashboard) => {
    if (next === visao) return;
    setSwitchingVisao(true);
    setVisao(next);
  };

  const origemFiltro = origemFromVisao(statsVisao);
  const showVisaoLoading = switchingVisao || visao !== statsVisao;

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-5 px-3 py-5 sm:gap-8 sm:px-6 sm:py-8 lg:px-8">
      <header className="dashboard-header relative overflow-hidden rounded-xl border border-border px-4 py-5 sm:rounded-2xl sm:px-8 sm:py-8">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="min-w-0 max-w-2xl">
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

          <div className="flex shrink-0 flex-col gap-3 sm:items-end">
            <div
              className="flex flex-wrap gap-1.5 sm:justify-end"
              role="group"
              aria-label="Visão dos dados do painel"
            >
              {VISAO_OPTIONS.map((opt) => {
                const active = visao === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    title={opt.hint}
                    aria-pressed={active}
                    onClick={() => onChangeVisao(opt.value)}
                    className={
                      active
                        ? "rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                        : "rounded-lg border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
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
                disabled={updating || showVisaoLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/80 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${updating ? "animate-spin" : ""}`}
                />
                Atualizar indicadores
              </button>
            </div>
          </div>
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {stats ? (
        <div
          className={`flex flex-col gap-5 sm:gap-8 transition-opacity duration-150 ${
            showVisaoLoading ? "pointer-events-none opacity-40" : "opacity-100"
          }`}
          aria-busy={showVisaoLoading}
        >
          <KpiCards stats={stats} />
          <DashboardCharts stats={stats} />
          <AlunosTable
            refreshKey={refreshKey}
            origemFiltro={origemFiltro}
            totalColetas={stats.totalColetas}
            totalColetasV2={stats.totalColetasV2}
          />
        </div>
      ) : !error ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
