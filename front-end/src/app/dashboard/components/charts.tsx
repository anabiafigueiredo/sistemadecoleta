"use client";

import dynamic from "next/dynamic";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import type { DashboardStats } from "@/lib/types";

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

function shortenLabel(value: string, max = 10) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function V2BaseNotice({ stats }: { stats: DashboardStats }) {
  if (stats.totalColetasV2 === 0) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        Base v2 ainda vazia — indicador aguarda entrevistas mobile.
      </p>
    );
  }
  if (!stats.amostraV2Parcial) return null;
  return (
    <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
      Amostra parcial: {stats.totalColetasV2} de {stats.totalColetas} entrevistas
      são v2 (mobile). Base: entrevistas mobile v2.
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

export function DashboardCharts({ stats }: { stats: DashboardStats }) {
  const barreirasData = stats.barreirasDistribuicao.map((b) => ({
    nome: b.nome,
    total: b.total,
  }));

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Visualizações prioritárias
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="chart-enter min-w-0">
            <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2">
              <CardTitle className="text-base sm:text-lg">
                Renda per capita por faixa
              </CardTitle>
              <CardDescription>
                Famílias agrupadas por renda mensal ÷ moradores
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-5 sm:pt-2">
              <div className="chart-box">
                {stats.rendaPerCapitaFaixas.every((f) => f.total === 0) ? (
                  <EmptyChart message="Sem famílias para agrupar." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.rendaPerCapitaFaixas}
                      margin={{ left: 0, right: 8, top: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#d6ddd8" />
                      <XAxis
                        dataKey="faixa"
                        tick={{ fontSize: 10 }}
                        interval={0}
                        angle={-18}
                        textAnchor="end"
                        height={56}
                        tickFormatter={(v) => shortenLabel(String(v), 14)}
                      />
                      <YAxis
                        allowDecimals={false}
                        width={28}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip />
                      <Bar dataKey="total" name="Famílias" radius={[8, 8, 0, 0]}>
                        {stats.rendaPerCapitaFaixas.map((_, i) => (
                          <Cell
                            key={`faixa-${i}`}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card
            className="chart-enter min-w-0"
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
              <div className="chart-box">
                {stats.internetAcessoDistribuicao.length === 0 ? (
                  <EmptyChart message="Sem dados de internet." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.internetAcessoDistribuicao}
                        dataKey="total"
                        nameKey="tipo"
                        cx="50%"
                        cy="42%"
                        innerRadius={40}
                        outerRadius={68}
                        paddingAngle={2}
                      >
                        {stats.internetAcessoDistribuicao.map((_, i) => (
                          <Cell
                            key={`net-${i}`}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card
            className="chart-enter min-w-0"
            style={{ animationDelay: "100ms" }}
          >
            <CardHeader className="space-y-2 p-4 pb-1 sm:p-5 sm:pb-2">
              <div>
                <CardTitle className="text-base sm:text-lg">
                  Principais barreiras
                </CardTitle>
                <CardDescription>
                  Menções nas entrevistas (exceto “Nenhuma”)
                </CardDescription>
              </div>
              <V2BaseNotice stats={stats} />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-5 sm:pt-2">
              <div className="chart-box">
                {stats.totalColetasV2 === 0 ? (
                  <EmptyChart message="Sem entrevistas v2 ainda." />
                ) : barreirasData.length === 0 ? (
                  <EmptyChart message="Nenhuma barreira além de “Nenhuma”." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={barreirasData}
                      margin={{ left: 8, right: 16, top: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#d6ddd8" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="nome"
                        width={118}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => shortenLabel(String(v), 18)}
                      />
                      <Tooltip />
                      <Bar dataKey="total" name="Entrevistas" radius={[0, 8, 8, 0]}>
                        {barreirasData.map((_, i) => (
                          <Cell
                            key={`bar-${i}`}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card
            className="chart-enter min-w-0"
            style={{ animationDelay: "140ms" }}
          >
            <CardHeader className="space-y-2 p-4 pb-1 sm:p-5 sm:pb-2">
              <div>
                <CardTitle className="text-base sm:text-lg">
                  Apoio prioritário
                </CardTitle>
                <CardDescription>
                  Demanda declarada nas entrevistas mobile v2
                </CardDescription>
              </div>
              <V2BaseNotice stats={stats} />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-5 sm:pt-2">
              <div className="chart-box">
                {stats.totalColetasV2 === 0 ? (
                  <EmptyChart message="Sem entrevistas v2 ainda." />
                ) : stats.apoioPrioritarioDistribuicao.length === 0 ? (
                  <EmptyChart message="Nenhum apoio prioritário preenchido." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={stats.apoioPrioritarioDistribuicao}
                      margin={{ left: 8, right: 16, top: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#d6ddd8" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="apoio"
                        width={118}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => shortenLabel(String(v), 18)}
                      />
                      <Tooltip />
                      <Bar dataKey="total" name="Entrevistas" radius={[0, 8, 8, 0]}>
                        {stats.apoioPrioritarioDistribuicao.map((_, i) => (
                          <Cell
                            key={`apoio-${i}`}
                            fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Complementares
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="chart-enter min-w-0">
            <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2">
              <CardTitle className="text-base sm:text-lg">
                Renda por bairro
              </CardTitle>
              <CardDescription>
                Extra — mapa de renda familiar média (não substitui as faixas)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-5 sm:pt-2">
              <div className="chart-box">
                <RendaBairroMap rendaPorBairro={stats.rendaPorBairro} />
              </div>
            </CardContent>
          </Card>

          <Card
            className="chart-enter min-w-0"
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
              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.transporteDistribuicao}
                      dataKey="total"
                      nameKey="meio"
                      cx="50%"
                      cy="42%"
                      innerRadius={40}
                      outerRadius={68}
                      paddingAngle={2}
                    >
                      {stats.transporteDistribuicao.map((_, i) => (
                        <Cell
                          key={`tr-${i}`}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card
            className="chart-enter min-w-0"
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
              <div className="chart-box">
                {stats.beneficioDistribuicao.length === 0 ? (
                  <EmptyChart message="Nenhuma família com benefício registrada." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.beneficioDistribuicao}
                      margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#d6ddd8" />
                      <XAxis
                        dataKey="beneficio"
                        tick={{ fontSize: 10 }}
                        interval={0}
                        tickFormatter={(v) => shortenLabel(String(v), 12)}
                      />
                      <YAxis
                        allowDecimals={false}
                        width={28}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip />
                      <Bar dataKey="total" name="Famílias" radius={[8, 8, 0, 0]}>
                        {stats.beneficioDistribuicao.map((_, i) => (
                          <Cell
                            key={`ben-${i}`}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
