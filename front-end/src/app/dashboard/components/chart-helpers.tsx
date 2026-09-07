"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { TooltipContentProps } from "recharts";
import { formatPercent } from "@/lib/utils";

/** Fundo opaco — evita o gráfico “vazar” atrás do tooltip (sobretudo no toque). */
export const CHART_TOOLTIP_WRAPPER_STYLE: CSSProperties = {
  backgroundColor: "#ffffff",
  opacity: 1,
  outline: "none",
  zIndex: 40,
};

export const CHART_TOOLTIP_CONTENT_STYLE: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "none",
  boxShadow: "none",
  padding: 0,
};

/** Hover no desktop fino; clique/toque em touch ou sem hover. */
export function useChartTooltipTrigger(): "hover" | "click" {
  const [trigger, setTrigger] = useState<"hover" | "click">("hover");

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setTrigger(mq.matches ? "hover" : "click");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return trigger;
}

export function useIsNarrow(breakpointPx = 640): boolean {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [breakpointPx]);

  return narrow;
}

export function wrapLabelLines(
  text: string,
  maxChars: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines - 1) {
      const rest = [current, ...words.slice(i + 1)].join(" ");
      lines.push(
        rest.length > maxChars ? `${rest.slice(0, maxChars - 1)}…` : rest,
      );
      return lines;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

type TickProps = {
  x?: number;
  y?: number;
  payload?: { value?: string | number };
};

/** Eixo Y (barras horizontais): rótulos com quebra de linha. */
export function WrappedYTick({
  x = 0,
  y = 0,
  payload,
  maxChars = 14,
  maxLines = 2,
  fontSize = 10,
}: TickProps & { maxChars?: number; maxLines?: number; fontSize?: number }) {
  const lines = wrapLabelLines(String(payload?.value ?? ""), maxChars, maxLines);
  const lineHeight = fontSize + 2;
  const offset = ((lines.length - 1) * lineHeight) / 2;

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, i) => (
        <text
          key={`${line}-${i}`}
          x={-4}
          y={i * lineHeight - offset}
          dy="0.35em"
          textAnchor="end"
          fill="#5b6b64"
          fontSize={fontSize}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

export function ChartTooltipContent({
  active,
  payload,
  label,
}: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  const rows = payload.filter((p) => p.value != null);
  if (rows.length === 0) return null;

  const entry = rows[0]!;
  const extra = entry.payload as
    | {
        name?: string;
        total?: number;
        percentLabel?: string;
        unitLabel?: string;
      }
    | undefined;
  const category = String(
    extra?.name ?? label ?? entry.name ?? "",
  ).trim();
  const total = extra?.total;
  const pct = extra?.percentLabel;
  const unit = extra?.unitLabel ?? "registros";

  // Ex.: "Wi-Fi residencial • 18 famílias • 72,0%"
  if (category && total != null && pct) {
    return (
      <div
        className="rounded-md border border-border px-2.5 py-2 text-xs shadow-md"
        style={{ backgroundColor: "#ffffff" }}
      >
        <p className="max-w-[16rem] break-words font-semibold tabular-nums text-foreground">
          {category} • {total} {unit} • {pct}
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-md border border-border px-2.5 py-2 text-xs shadow-md"
      style={{ backgroundColor: "#ffffff" }}
    >
      {category ? (
        <p className="mb-1 max-w-[14rem] break-words font-medium text-foreground">
          {category}
        </p>
      ) : null}
      <p className="font-semibold tabular-nums text-foreground">
        {Array.isArray(entry.value) ? entry.value.join(", ") : entry.value}
        {pct ? ` • ${pct}` : ""}
      </p>
    </div>
  );
}

export function withPercents<T extends { total: number }>(
  items: T[],
): (T & { percent: number; percentLabel: string })[] {
  const sum = items.reduce((acc, item) => acc + item.total, 0);
  return items.map((item) => {
    const percent = sum > 0 ? (item.total / sum) * 100 : 0;
    return {
      ...item,
      percent,
      percentLabel: formatPercent(percent, 1),
    };
  });
}

export function horizontalChartHeight(rows: number, rowPx = 40, min = 200) {
  return Math.max(min, rows * rowPx + 24);
}
