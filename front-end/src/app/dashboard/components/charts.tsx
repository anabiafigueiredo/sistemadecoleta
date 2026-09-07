"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types";
import {
  ChartTooltipContent,
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_WRAPPER_STYLE,
  WrappedYTick,
  horizontalChartHeight,
  useChartTooltipTrigger,
  useIsNarrow,
  withPercents,
} from "./chart-helpers";

const RendaBairroMap = dynamic(
  () => import("./renda-bairro-map").then((m) => m.RendaBairroMap),
  {
    ssr: false,
    loading: () => (
      <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Carregando mapa…
      </p>
    ),
  },
);

const CHART_COLORS = [
  "#0f766e",
  "#1d4e89",
  "#c2410c",
  "#ca8a04",
  "#0e7490",
  "#be123c",
  "#365314",
  "#57534e",
];

const LABEL_STYLE = { fill: "#3f4f48", fontSize: 11, fontWeight: 600 };

/** Pizza só com poucas fatias; acima disso vira barras horizontais. */
const PIE_MAX_CATEGORIES = 5;

function V2BaseNotice({ stats }: { stats: DashboardStats }) {
  if (stats.totalColetasV2 === 0) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        Ainda sem entrevistas pelo aplicativo — indicador aguarda novas coletas.
      </p>
    );
  }
  if (!stats.amostraV2Parcial) return null;
  return (
    <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
      Amostra parcial: {stats.totalColetasV2} de {stats.totalColetas} entrevistas
      foram pelo aplicativo. Base deste gráfico: entrevistas do app.
    </p>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

function ChartShell({
  children,
  height,
  className = "chart-box",
}: {
  children: ReactNode;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={height != null ? { height } : undefined}
    >
      {children}
    </div>
  );
}

type PieDatum = {
  name: string;
  total: number;
  percentLabel: string;
  unitLabel: string;
};

function PercentPie({
  data,
  nameKey,
  trigger,
  unitLabel = "registros",
}: {
  data: { total: number; percentLabel: string; [key: string]: string | number }[];
  nameKey: string;
  trigger: "hover" | "click";
  unitLabel?: string;
}) {
  const pieData: PieDatum[] = data.map((d) => ({
    name: String(d[nameKey]),
    total: d.total,
    percentLabel: d.percentLabel,
    unitLabel,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <Pie
          data={pieData}
          dataKey="total"
          nameKey="name"
          cx="50%"
          cy="40%"
          innerRadius={36}
          outerRadius={62}
          paddingAngle={2}
          isAnimationActive={false}
          label={({ percent }) => {
            const p = typeof percent === "number" ? percent : 0;
            if (p < 0.06) return "";
            return formatPercent(p * 100, 1);
          }}
          labelLine={false}
        >
          {pieData.map((_, i) => (
            <Cell
              key={`slice-${i}`}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          trigger={trigger}
          wrapperStyle={CHART_TOOLTIP_WRAPPER_STYLE}
          contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
          content={(props) => <ChartTooltipContent {...props} />}
        />
        <Legend
          verticalAlign="bottom"
          wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
          formatter={(value, entry) => {
            const pct = (entry.payload as PieDatum | undefined)?.percentLabel;
            return pct ? `${value} · ${pct}` : String(value);
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function HorizontalBars({
  data,
  categoryKey,
  trigger,
  yAxisWidth = 100,
  maxChars = 14,
  unitLabel = "registros",
  xAxisLabel,
  yAxisLabel,
}: {
  data: Array<Record<string, string | number> & { total: number }>;
  categoryKey: string;
  trigger: "hover" | "click";
  yAxisWidth?: number;
  maxChars?: number;
  unitLabel?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}) {
  const chartData = withPercents(data).map((d) => ({
    ...d,
    unitLabel,
    name: String(d[categoryKey]),
  }));
  const height = horizontalChartHeight(chartData.length, 44, 200);

  return (
    <ChartShell
      height={height + (xAxisLabel ? 20 : 0)}
      className="chart-box chart-box-auto"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{
            left: yAxisLabel ? 36 : 4,
            right: 44,
            top: 8,
            bottom: xAxisLabel ? 36 : 4,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#d6ddd8" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, "auto"]}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
          >
            {xAxisLabel ? (
              <Label
                value={xAxisLabel}
                position="bottom"
                offset={12}
                style={{ fontSize: 11, fill: "#5b6b64" }}
              />
            ) : null}
          </XAxis>
          <YAxis
            type="category"
            dataKey={categoryKey}
            width={yAxisWidth}
            interval={0}
            tick={<WrappedYTick maxChars={maxChars} maxLines={2} />}
          >
            {yAxisLabel ? (
              <Label
                value={yAxisLabel}
                angle={-90}
                position="left"
                offset={8}
                style={{ fontSize: 11, fill: "#5b6b64", textAnchor: "middle" }}
              />
            ) : null}
          </YAxis>
          <Tooltip
            trigger={trigger}
            wrapperStyle={CHART_TOOLTIP_WRAPPER_STYLE}
            contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
            content={(props) => <ChartTooltipContent {...props} />}
          />
          <Bar
            dataKey="percent"
            name="%"
            radius={[0, 8, 8, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          >
            {chartData.map((_, i) => (
              <Cell
                key={`hbar-${i}`}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
              />
            ))}
            <LabelList
              dataKey="percentLabel"
              position="right"
              style={LABEL_STYLE}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function DashboardCharts({ stats }: { stats: DashboardStats }) {
  const trigger = useChartTooltipTrigger();
  const narrow = useIsNarrow(640);

  const barreirasData = stats.barreirasDistribuicao.map((b) => ({
    nome: b.nome,
    total: b.total,
  }));

  const internetData = withPercents(stats.internetAcessoDistribuicao);
  const transporteTop = stats.transporteDistribuicao[0] ?? null;
  const transporteTopPct =
    transporteTop && stats.transporteDistribuicao.length > 0
      ? withPercents(stats.transporteDistribuicao)[0]!.percentLabel
      : null;

  const yWidth = narrow ? 88 : 112;
  const yChars = narrow ? 12 : 16;

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Visualizações prioritárias
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="chart-enter min-w-0 overflow-hidden">
            <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2">
              <CardTitle className="text-base sm:text-lg">
                Distribuição das famílias por faixa de renda mensal
              </CardTitle>
              <CardDescription>
                Faixas em salário mínimo (SM = R$ 1.621,00).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-5 sm:pt-2">
              {stats.rendaFamiliarFaixas.every((f) => f.total === 0) ? (
                <ChartShell>
                  <EmptyChart message="Sem famílias para agrupar." />
                </ChartShell>
              ) : (
                <HorizontalBars
                  data={stats.rendaFamiliarFaixas.map((f) => ({
                    nome: f.faixa,
                    total: f.total,
                  }))}
                  categoryKey="nome"
                  trigger={trigger}
                  yAxisWidth={yWidth}
                  maxChars={yChars}
                  unitLabel="famílias"
                  xAxisLabel="Percentual de famílias"
                  yAxisLabel="Faixas de renda familiar mensal"
                />
              )}
            </CardContent>
          </Card>

          <Card
            className="chart-enter min-w-0 overflow-hidden"
            style={{ animationDelay: "60ms" }}
          >
            <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2">
              <CardTitle className="text-base sm:text-lg">
                Tipo de acesso à internet
              </CardTitle>
              <CardDescription>
                Distribuição por núcleo familiar (com ou sem internet)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-5 sm:pt-2">
              {stats.internetAcessoDistribuicao.length === 0 ? (
                <ChartShell>
                  <EmptyChart message="Sem dados de internet." />
                </ChartShell>
              ) : stats.internetAcessoDistribuicao.length > PIE_MAX_CATEGORIES ? (
                <HorizontalBars
                  data={stats.internetAcessoDistribuicao.map((d) => ({
                    tipo: d.tipo,
                    total: d.total,
                  }))}
                  categoryKey="tipo"
                  trigger={trigger}
                  yAxisWidth={yWidth}
                  maxChars={yChars}
                  unitLabel="famílias"
                />
              ) : (
                <ChartShell>
                  <PercentPie
                    data={internetData.map((d) => ({
                      ...d,
                      tipo: d.tipo,
                    }))}
                    nameKey="tipo"
                    trigger={trigger}
                    unitLabel="famílias"
                  />
                </ChartShell>
              )}
            </CardContent>
          </Card>

          <Card
            className="chart-enter min-w-0 overflow-hidden"
            style={{ animationDelay: "100ms" }}
          >
            <CardHeader className="space-y-2 p-4 pb-1 sm:p-5 sm:pb-2">
              <div>
                <CardTitle className="text-base sm:text-lg">
                  Barreiras à frequência escolar
                </CardTitle>
                <CardDescription>
                  Quais barreiras mais foram apontadas (exceto “Nenhuma”)
                </CardDescription>
              </div>
              <V2BaseNotice stats={stats} />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-5 sm:pt-2">
              {stats.totalColetasV2 === 0 ? (
                <ChartShell>
                  <EmptyChart message="Sem entrevistas pelo aplicativo ainda." />
                </ChartShell>
              ) : barreirasData.length === 0 ? (
                <ChartShell>
                  <EmptyChart message="Nenhuma barreira além de “Nenhuma”." />
                </ChartShell>
              ) : (
                <HorizontalBars
                  data={barreirasData}
                  categoryKey="nome"
                  trigger={trigger}
                  yAxisWidth={yWidth}
                  maxChars={yChars}
                  unitLabel="menções"
                />
              )}
            </CardContent>
          </Card>

          <Card
            className="chart-enter min-w-0 overflow-hidden"
            style={{ animationDelay: "140ms" }}
          >
            <CardHeader className="space-y-2 p-4 pb-1 sm:p-5 sm:pb-2">
              <div>
                <CardTitle className="text-base sm:text-lg">
                  Apoio prioritário
                </CardTitle>
                <CardDescription>
                  Demanda declarada nas entrevistas pelo aplicativo
                </CardDescription>
              </div>
              <V2BaseNotice stats={stats} />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-5 sm:pt-2">
              {stats.totalColetasV2 === 0 ? (
                <ChartShell>
                  <EmptyChart message="Sem entrevistas pelo aplicativo ainda." />
                </ChartShell>
              ) : stats.apoioPrioritarioDistribuicao.length === 0 ? (
                <ChartShell>
                  <EmptyChart message="Nenhum apoio prioritário preenchido." />
                </ChartShell>
              ) : (
                <HorizontalBars
                  data={stats.apoioPrioritarioDistribuicao.map((a) => ({
                    apoio: a.apoio,
                    total: a.total,
                  }))}
                  categoryKey="apoio"
                  trigger={trigger}
                  yAxisWidth={yWidth}
                  maxChars={yChars}
                  unitLabel="entrevistas"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Complementares
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="chart-enter min-w-0 overflow-hidden">
            <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2">
              <CardTitle className="text-base sm:text-lg">
                Renda por bairro
              </CardTitle>
              <CardDescription>
                Extra — mapa de renda familiar média (não substitui as faixas)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-5 sm:pt-2">
              <ChartShell className="chart-box chart-box-map">
                <RendaBairroMap rendaPorBairro={stats.rendaPorBairro} />
              </ChartShell>
              <p className="mt-2 px-1 text-[11px] text-muted-foreground sm:hidden">
                Toque em um bairro para ver renda média e número de famílias.
              </p>
            </CardContent>
          </Card>

          <Card
            className="chart-enter min-w-0 overflow-hidden"
            style={{ animationDelay: "80ms" }}
          >
            <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2">
              <CardTitle className="text-base sm:text-lg">
                Meio de transporte
              </CardTitle>
              <CardDescription>
                Como os alunos chegam à escola no dia a dia?
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-5 sm:pt-2">
              {stats.transporteDistribuicao.length === 0 ? (
                <ChartShell>
                  <EmptyChart message="Sem dados de transporte." />
                </ChartShell>
              ) : (
                <>
                  {transporteTop && transporteTopPct ? (
                    <p className="mb-2 px-1 text-sm text-muted-foreground">
                      Mais frequente:{" "}
                      <span className="font-semibold text-foreground">
                        {transporteTop.meio}
                      </span>{" "}
                      <span className="tabular-nums">({transporteTopPct})</span>
                    </p>
                  ) : null}
                  <HorizontalBars
                    data={stats.transporteDistribuicao.map((d) => ({
                      meio: d.meio,
                      total: d.total,
                    }))}
                    categoryKey="meio"
                    trigger={trigger}
                    yAxisWidth={yWidth}
                    maxChars={yChars}
                    unitLabel="entrevistas"
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Card
            className="chart-enter min-w-0 overflow-hidden"
            style={{ animationDelay: "140ms" }}
          >
            <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2">
              <CardTitle className="text-base sm:text-lg">
                Benefícios sociais
              </CardTitle>
              <CardDescription>
                Quais programas chegam às famílias da comunidade?
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-5 sm:pt-2">
              {stats.beneficioDistribuicao.length === 0 ? (
                <ChartShell>
                  <EmptyChart message="Nenhuma família com benefício registrada." />
                </ChartShell>
              ) : (
                <HorizontalBars
                  data={stats.beneficioDistribuicao.map((b) => ({
                    beneficio: b.beneficio,
                    total: b.total,
                  }))}
                  categoryKey="beneficio"
                  trigger={trigger}
                  yAxisWidth={yWidth}
                  maxChars={yChars}
                  unitLabel="famílias"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
