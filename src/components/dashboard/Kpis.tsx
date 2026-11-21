"use client";

import { ArrowDownRight, ArrowUpRight, PiggyBank, TrendingUp, Wallet, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { Forecast, Summary } from "@/lib/analytics";
import { monthLabel } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { AnimatedNumber } from "./primitives";

export function Kpis({ summary, forecast, currency }: { summary: Summary; forecast: Forecast | null; currency: string }) {
  const m = (n: number) => formatMoney(n, currency);
  const change = summary.expenseChange;
  const cards = [
    {
      label: `Spent · ${monthLabel(summary.latestMonth, "long")}`,
      value: summary.expenses,
      fmt: m,
      icon: Wallet,
      accent: "from-pink-500/30 to-violet-500/10",
      foot:
        change === null ? (
          "First month of data"
        ) : (
          <span className={change > 0 ? "text-rose-300" : "text-emerald-300"}>
            {change > 0 ? <ArrowUpRight className="inline h-3.5 w-3.5" /> : <ArrowDownRight className="inline h-3.5 w-3.5" />}
            {Math.abs(Math.round(change * 100))}% vs last month
          </span>
        ),
    },
    {
      label: "Income",
      value: summary.income,
      fmt: m,
      icon: TrendingUp,
      accent: "from-emerald-400/30 to-cyan-500/10",
      foot: `Avg spend ${m(summary.avgMonthlyExpenses)}/mo`,
    },
    {
      label: "Saved",
      value: summary.net,
      fmt: m,
      icon: PiggyBank,
      accent: "from-cyan-400/30 to-blue-500/10",
      foot: (
        <span className={summary.savingsRate >= 0.2 ? "text-emerald-300" : "text-amber-300"}>
          {Math.round(summary.savingsRate * 100)}% savings rate
        </span>
      ),
    },
    {
      label: forecast ? `Forecast · ${monthLabel(forecast.month, "long")}` : "Forecast",
      value: forecast?.expenses ?? 0,
      fmt: m,
      icon: Zap,
      accent: "from-violet-500/40 to-fuchsia-500/10",
      foot: forecast ? `Based on ${forecast.basis} month${forecast.basis === 1 ? "" : "s"} of history` : "Need more data",
      testId: "kpi-forecast",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          data-testid={c.testId}
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * 0.07, duration: 0.5 }}
          className="glass glass-hover relative overflow-hidden rounded-2xl p-4 sm:p-5"
        >
          <div className={`pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-gradient-to-br ${c.accent} blur-2xl`} />
          <div className="relative flex items-center justify-between text-xs text-[var(--color-muted)]">
            <span className="truncate">{c.label}</span>
            <c.icon className="h-4 w-4 shrink-0" />
          </div>
          <p className="relative mt-2 font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
            <AnimatedNumber value={c.value} format={c.fmt} />
          </p>
          <p className="relative mt-1 text-xs text-[var(--color-muted)]">{c.foot}</p>
        </motion.div>
      ))}
    </div>
  );
}
