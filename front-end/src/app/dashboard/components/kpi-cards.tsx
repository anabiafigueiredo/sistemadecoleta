import {
  GraduationCap,
  ClipboardList,
  HandHeart,
  Home,
  Accessibility,
  Clock3,
  Wallet,
  OctagonAlert,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types";

type Kpi = {
  label: string;
  value: string;
  /** Métrica complementar / contexto (não criar card extra). */
  complement: string;
  icon: LucideIcon;
};

function KpiGrid({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
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
                <CardTitle className="mt-1 break-words text-xl tabular-nums sm:mt-2 sm:text-3xl">
                  {item.value}
                </CardTitle>
              </div>
              <span className="shrink-0 rounded-lg bg-primary/10 p-1.5 text-primary sm:p-2">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-5 sm:pt-2">
              <p className="text-xs leading-snug text-muted-foreground sm:text-sm">
                {item.complement}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function KpiCards({ stats }: { stats: DashboardStats }) {
  const transporteMaisFrequente =
    stats.transporteDistribuicao[0]?.meio ?? null;

  const principais: Kpi[] = [
    {
      label: "Alunos",
      value: String(stats.totalAlunos),
      complement: "Cadastros únicos (código do aluno)",
      icon: GraduationCap,
    },
    {
      label: "Famílias",
      value: String(stats.totalFamilias),
      complement: "Núcleos únicos pesquisados",
      icon: Home,
    },
    {
      label: "Renda média",
      value: formatCurrency(stats.rendaMediaFamiliar),
      complement: `Per capita (mediana): ${formatCurrency(stats.rendaPerCapitaMediana)}`,
      icon: Wallet,
    },
    {
      label: "Tempo médio de deslocamento",
      value: `${stats.tempoMedioDeslocamentoMin} min`,
      complement: transporteMaisFrequente
        ? `Meio de transporte mais frequente: ${transporteMaisFrequente}`
        : "Meio de transporte ainda sem dados",
      icon: Clock3,
    },
  ];

  const contexto: Kpi[] = [
    {
      label: "Com barreiras à frequência",
      value: formatPercent(stats.percentualComBarreiraV2),
      complement:
        stats.totalColetasV2 === 0
          ? "Ainda sem entrevistas pelo aplicativo"
          : `${stats.coletasV2ComBarreira} de ${stats.totalColetasV2} entrevistas do app`,
      icon: OctagonAlert,
    },
    {
      label: "Entrevistas realizadas",
      value: String(stats.totalColetas),
      complement: `${stats.totalColetasV2} pelo aplicativo`,
      icon: ClipboardList,
    },
    {
      label: "Com benefício",
      value: formatPercent(stats.percentualComBeneficio),
      complement: "Entre todas as famílias pesquisadas",
      icon: HandHeart,
    },
    {
      label: "Com necessidade educacional especial",
      value: formatPercent(stats.percentualComNee),
      complement: "Entre as entrevistas realizadas",
      icon: Accessibility,
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
      </section>
    </div>
  );
}
