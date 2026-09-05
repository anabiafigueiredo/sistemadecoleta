"use client";

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
import { formatCurrency, formatPercent } from "@/lib/utils";

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

export function DashboardCharts({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="chart-enter min-w-0">
        <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2">
          <CardTitle className="text-base sm:text-lg">Renda por bairro</CardTitle>
          <CardDescription>
            Onde está a maior vulnerabilidade de renda familiar?
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 pt-0 sm:p-5 sm:pt-2">
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.rendaPorBairro}
                layout="vertical"
                margin={{ left: 4, right: 8, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d6ddd8" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="bairro"
                  width={72}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => shortenLabel(String(v), 9)}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                  labelFormatter={(label) => String(label)}
                />
                <Bar dataKey="rendaMedia" name="Renda média" radius={[0, 6, 6, 0]}>
                  {stats.rendaPorBairro.map((_, i) => (
                    <Cell
                      key={`renda-${i}`}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="chart-enter min-w-0" style={{ animationDelay: "80ms" }}>
        <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2">
          <CardTitle className="text-base sm:text-lg">Meio de transporte</CardTitle>
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

      <Card className="chart-enter min-w-0" style={{ animationDelay: "140ms" }}>
        <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2">
          <CardTitle className="text-base sm:text-lg">Frequência por turno</CardTitle>
          <CardDescription>
            Há diferença de presença entre matutino e vespertino?
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 pt-0 sm:p-5 sm:pt-2">
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.frequenciaPorTurno}
                margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d6ddd8" />
                <XAxis dataKey="turno" tick={{ fontSize: 11 }} />
                <YAxis
                  domain={[0, 100]}
                  width={36}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(value) => formatPercent(Number(value ?? 0))}
                />
                <Bar
                  dataKey="frequenciaMedia"
                  name="Frequência"
                  fill="#1d4e89"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="chart-enter min-w-0" style={{ animationDelay: "200ms" }}>
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
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Nenhuma família com benefício registrada.
              </p>
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
                  <YAxis allowDecimals={false} width={28} tick={{ fontSize: 11 }} />
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
  );
}
