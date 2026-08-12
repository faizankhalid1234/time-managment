"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeeklyStats } from "@/lib/api";
import { hoursFromSeconds } from "@/lib/time";
import { useTheme } from "@/lib/theme";

const COLORS = [
  "#0d9488",
  "#0284c7",
  "#ea580c",
  "#7c3aed",
  "#db2777",
  "#65a30d",
  "#0891b2",
];

type Props = {
  stats: WeeklyStats | null;
  loading?: boolean;
};

export function WeeklyChart({ stats, loading }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tick = isDark ? "#b6c4d6" : "#4a5d73";
  const grid = isDark ? "#8fa0b5" : "#94a3b8";
  const tooltipBg = isDark ? "#152033" : "#ffffff";
  const tooltipBorder = isDark
    ? "rgba(238,244,251,0.12)"
    : "rgba(15,23,42,0.08)";
  const tooltipColor = isDark ? "#eef4fb" : "#0f1c2e";

  if (loading) {
    return (
      <div className="text-faint flex h-72 items-center justify-center text-sm">
        Loading weekly chart…
      </div>
    );
  }

  if (!stats || stats.series.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-2 text-center">
        <p className="font-display text-lg text-muted">
          No tracked time this week
        </p>
        <p className="text-faint max-w-sm text-sm">
          Start a project timer to see hours stack up across the week.
        </p>
      </div>
    );
  }

  const data = stats.dayLabels.map((day) => {
    const row: Record<string, string | number> = {
      label: day.label,
      date: day.date,
    };
    for (const s of stats.series) {
      row[s.projectName] = hoursFromSeconds(s.byDay[day.key] || 0);
    }
    return row;
  });

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={grid}
            strokeOpacity={0.25}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: tick, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: tick, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}h`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: `1px solid ${tooltipBorder}`,
              background: tooltipBg,
              color: tooltipColor,
              boxShadow: "0 18px 40px -24px rgba(0,0,0,0.35)",
            }}
            formatter={(value) => [`${value} h`, ""]}
            labelFormatter={(label, payload) => {
              const date = payload?.[0]?.payload?.date;
              return date ? `${label} · ${date}` : String(label);
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: 12, fontSize: 12, color: tick }}
          />
          {stats.series.map((s, i) => (
            <Bar
              key={s.projectId}
              dataKey={s.projectName}
              stackId="week"
              fill={COLORS[i % COLORS.length]}
              radius={
                i === stats.series.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]
              }
              maxBarSize={42}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
