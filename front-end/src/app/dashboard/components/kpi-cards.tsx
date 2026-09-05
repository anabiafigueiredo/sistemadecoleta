import {
  GraduationCap,
  ClipboardList,
  HandHeart,
  Home,
  Accessibility,
  Clock3,
  Percent,
  Wifi,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types";

type Kpi = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
};

function KpiGrid({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.label}
            className="kpi-card min-w-0 overflow-hidden"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-3 sm:p-5 sm:pb-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:text-xs sm:tracking-[0.14em]">
                  {item.label}
                </p>
                <CardTitle className="mt-1 truncate text-xl tabular-nums sm:mt-2 sm:text-3xl">
                  {item.value}
                </CardTitle>
              </div>
              <span className="shrink-0 rounded-lg bg-primary/10 p-1.5 text-primary sm:p-2">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
            </CardHeader>
            <CardContent className="hidden p-3 pt-0 sm:block sm:p-5 sm:pt-2">
              <p className="text-sm text-muted-foreground">{item.hint}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function KpiCards({ stats }: { stats: DashboardStats }) {
  const principais: Kpi[] = [
    {
      label: "Alunos",
      value: String(stats.totalAlunos),
      hint: "Cadastros únicos (código do aluno)",
      icon: GraduationCap,
    },
    {
      label: "Coletas",
      value: String(stats.totalColetas),
      hint: "Pesquisas enviadas (T1+T2+T3…)",
      icon: ClipboardList,
    },
    {
      label: "Famílias",
      value: String(stats.totalFamilias),
      hint: "Núcleos únicos pesquisados",
      icon: Home,
    },
    {
      label: "Renda média",
      value: formatCurrency(stats.rendaMediaFamiliar),
      hint: "Renda mensal familiar",
      icon: Wallet,
    },
  ];

  const contexto: Kpi[] = [
    {
      label: "Com internet",
      value: formatPercent(stats.percentualComInternet),
      hint: "Núcleos com acesso em casa",
      icon: Wifi,
    },
    {
      label: "Com benefício",
      value: formatPercent(stats.percentualComBeneficio),
      hint: "Famílias com auxílio social",
      icon: HandHeart,
    },
    {
      label: "Com NEE",
      value: formatPercent(stats.percentualComNee),
      hint: "Alunos com necessidade especial",
      icon: Accessibility,
    },
    {
      label: "Freq. média",
      value: formatPercent(stats.frequenciaMediaGeral),
      hint: "Presença escolar geral",
      icon: Percent,
    },
  ];

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Visão geral
        </h2>
        <KpiGrid items={principais} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Contexto educacional e social
        </h2>
        <KpiGrid items={contexto} />
        <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5 opacity-70" />
          Deslocamento médio:{" "}
          <span className="font-semibold text-foreground">
            {stats.tempoMedioDeslocamentoMin} min
          </span>
        </p>
      </section>
    </div>
  );
}
