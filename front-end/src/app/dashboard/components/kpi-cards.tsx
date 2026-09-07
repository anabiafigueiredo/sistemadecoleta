import {
  GraduationCap,
  HandHeart,
  Home,
  Accessibility,
  Clock3,
  Wallet,
  BookOpenCheck,
  CalendarCheck2,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types";

type Kpi = {
  label: string;
  value: string;
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-[13px]">
                  {item.label}
                </p>
                <CardTitle className="mt-1 break-words text-[28px] font-bold tabular-nums sm:mt-2 sm:text-[36px]">
                  {item.value}
                </CardTitle>
              </div>
              <span className="shrink-0 rounded-full bg-icon-bg p-2 text-primary-strong sm:p-2.5">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-5 sm:pt-2">
              <p className="text-[13px] leading-snug text-muted-foreground sm:text-[14px]">
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
      label: "Frequência escolar média",
      value:
        stats.totalComFrequenciaInformada === 0
          ? "—"
          : formatPercent(stats.frequenciaEscolarMediaPct),
      complement:
        stats.totalComFrequenciaInformada === 0
          ? "Ainda sem frequência informada"
          : `${stats.comFrequenciaAbaixo75} de ${stats.totalComFrequenciaInformada} com frequência abaixo de 75% (mínimo em Manaus)`,
      icon: CalendarCheck2,
    },
    {
      label: "Local adequado para estudar",
      value:
        stats.totalLocalEstudoInformado === 0
          ? "—"
          : formatPercent(stats.percentualLocalEstudoAdequado),
      complement:
        stats.totalLocalEstudoInformado === 0
          ? "Ainda sem entrevistas do app com essa resposta"
          : stats.totalAcompanhamentoInformado === 0
            ? `Entre ${stats.totalLocalEstudoInformado} entrevistas do app`
            : `Acompanhamento familiar regular: ${formatPercent(stats.percentualAcompanhamentoRegular)}`,
      icon: BookOpenCheck,
    },
    {
      label: "Famílias com benefício social",
      value: formatPercent(stats.percentualComBeneficio),
      complement: "Entre todas as famílias pesquisadas",
      icon: HandHeart,
    },
    {
      label: "Alunos com necessidade educacional específica",
      value: formatPercent(stats.percentualComNee),
      complement: "Entre as entrevistas realizadas",
      icon: Accessibility,
    },
  ];

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-[22px] font-bold tracking-tight text-foreground sm:text-2xl">
          Visão geral
        </h2>
        <KpiGrid items={principais} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-[22px] font-bold tracking-tight text-foreground sm:text-2xl">
          Contexto educacional e social
        </h2>
        <KpiGrid items={contexto} />
      </section>
    </div>
  );
}
