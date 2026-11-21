"use client";

import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategoryTotal, Forecast, MonthTotal } from "@/lib/analytics";
import { monthLabel } from "@/lib/analytics";
import { getCategory } from "@/lib/categories";
import { formatMoney } from "@/lib/format";

const axis = { stroke: "#5b6085", fontSize: 11, tickLine: false, axisLine: false } as const;

function GlassTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string; payload?: { fill?: string } }[];
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl !bg-slate-950/90 px-3 py-2 text-xs">
      {label && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.payload?.fill }} />
          <span className="text-[var(--color-muted)]">{p.name}</span>
          <span className="ml-auto pl-3 tabular-nums">{formatMoney(p.value, currency)}</span>
        </p>
      ))}
    </div>
  );
}

export function MonthlyChart({ totals, forecast, currency }: { totals: MonthTotal[]; forecast: Forecast | null; currency: string }) {
  const data = [
    ...totals.slice(-12).map((t) => ({ label: monthLabel(t.month), Income: t.income, Spending: t.expenses, forecast: false })),
    ...(forecast ? [{ label: `${monthLabel(forecast.month)} ✦`, Income: forecast.income, Spending: forecast.expenses, forecast: true }] : []),
  ];
  return (
    <div className="h-72" data-testid="monthly-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4} margin={{ left: -8, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0.25} />
            </linearGradient>
            <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} tickFormatter={(v) => formatMoney(v, currency, { compact: true })} />
          <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<GlassTooltip currency={currency} />} />
          <Bar dataKey="Income" fill="url(#gIncome)" radius={[6, 6, 0, 0]} animationDuration={900}>
            {data.map((d) => (
              <Cell key={d.label} fillOpacity={d.forecast ? 0.35 : 1} stroke={d.forecast ? "#34d399" : undefined} strokeDasharray="4 3" />
            ))}
          </Bar>
          <Bar dataKey="Spending" fill="url(#gSpend)" radius={[6, 6, 0, 0]} animationDuration={900}>
            {data.map((d) => (
              <Cell key={d.label} fillOpacity={d.forecast ? 0.35 : 1} stroke={d.forecast ? "#22d3ee" : undefined} strokeDasharray="4 3" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryDonut({ breakdown, currency }: { breakdown: CategoryTotal[]; currency: string }) {
  const total = breakdown.reduce((a, b) => a + b.total, 0);
  return (
    <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr]" data-testid="category-breakdown">
      <div className="relative mx-auto h-44 w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={breakdown}
              dataKey="total"
              nameKey="category"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
              animationDuration={900}
            >
              {breakdown.map((b) => (
                <Cell key={b.category} fill={getCategory(b.category).color} />
              ))}
            </Pie>
            <Tooltip content={<GlassTooltip currency={currency} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-muted)]">Total</p>
            <p className="font-[family-name:var(--font-display)] text-lg font-bold">{formatMoney(total, currency)}</p>
          </div>
        </div>
      </div>
      <ul className="space-y-2">
        {breakdown.slice(0, 7).map((b, i) => {
          const c = getCategory(b.category);
          return (
            <li key={b.category} className="text-xs">
              <div className="mb-1 flex items-center gap-2">
                <span>{c.emoji}</span>
                <span className="flex-1 truncate">{b.category}</span>
                <span className="tabular-nums text-[var(--color-muted)]">{Math.round(b.share * 100)}%</span>
                <span className="w-16 text-right tabular-nums">{formatMoney(b.total, currency)}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${b.share * 100}%` }}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.7 }}
                  className="h-full rounded-full"
                  style={{ background: c.color, boxShadow: `0 0 10px ${c.color}` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function TrendChart({
  byMonth,
  forecast,
  categories,
  currency,
}: {
  byMonth: Record<string, Record<string, number>>;
  forecast: Forecast | null;
  categories: string[];
  currency: string;
}) {
  const months = Object.keys(byMonth).sort().slice(-12);
  const data = [
    ...months.map((m) => ({ label: monthLabel(m), ...Object.fromEntries(categories.map((c) => [c, byMonth[m][c] ?? 0])) })),
    ...(forecast
      ? [{ label: `${monthLabel(forecast.month)} ✦`, ...Object.fromEntries(categories.map((c) => [c, forecast.byCategory[c] ?? 0])) }]
      : []),
  ];
  return (
    <div className="h-64" data-testid="trend-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -8, right: 8, top: 8 }}>
          <defs>
            {categories.map((c) => (
              <linearGradient key={c} id={`t-${c.replace(/\W/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={getCategory(c).color} stopOpacity={0.55} />
                <stop offset="100%" stopColor={getCategory(c).color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} tickFormatter={(v) => formatMoney(v, currency, { compact: true })} />
          <Tooltip content={<GlassTooltip currency={currency} />} />
          {categories.map((c) => (
            <Area
              key={c}
              type="monotone"
              dataKey={c}
              stroke={getCategory(c).color}
              strokeWidth={2}
              fill={`url(#t-${c.replace(/\W/g, "")})`}
              animationDuration={1100}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[var(--color-muted)]">
        {categories.map((c) => (
          <span key={c} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: getCategory(c).color }} />
            {c}
          </span>
        ))}
        <span className="ml-auto">✦ = forecast</span>
      </div>
    </div>
  );
}

export function SavingsChart({ data, currency }: { data: { month: number; baseline: number; scenario: number }[]; currency: string }) {
  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.map((d) => ({ label: `M${d.month}`, Today: d.baseline, "With changes": d.scenario }))} margin={{ left: -8, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="gScenario" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} tickFormatter={(v) => formatMoney(v, currency, { compact: true })} />
          <Tooltip content={<GlassTooltip currency={currency} />} />
          <Area type="monotone" dataKey="Today" stroke="#8b90b8" strokeDasharray="4 4" fill="transparent" strokeWidth={2} isAnimationActive={false} />
          <Area type="monotone" dataKey="With changes" stroke="#22d3ee" fill="url(#gScenario)" strokeWidth={2.5} animationDuration={600} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
