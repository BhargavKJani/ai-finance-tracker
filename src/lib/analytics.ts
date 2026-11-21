import { EXPENSE_CATEGORY_NAMES } from "./categories";
import type { Transaction } from "./types";

/** Transfers move money between your own accounts, so they are not spending. */
const NON_SPENDING = new Set(["Transfers", "Income"]);

export const monthKey = (iso: string) => iso.slice(0, 7);

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string, style: "short" | "long" = "short"): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", {
    month: style,
    year: style === "long" ? "numeric" : "2-digit",
    timeZone: "UTC",
  });
}

export const isSpending = (t: Transaction) => t.amount < 0 && !NON_SPENDING.has(t.category);
export const isIncome = (t: Transaction) => t.amount > 0 && t.category !== "Transfers";

export interface MonthTotal {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Every month from the first to the last transaction, gaps filled with zeros. */
export function monthRange(txns: Transaction[]): string[] {
  if (!txns.length) return [];
  const months = txns.map((t) => monthKey(t.date)).sort();
  const out: string[] = [];
  for (let m = months[0]; m <= months[months.length - 1]; m = addMonths(m, 1)) out.push(m);
  return out;
}

export function monthlyTotals(txns: Transaction[]): MonthTotal[] {
  const map = new Map<string, MonthTotal>();
  for (const m of monthRange(txns)) map.set(m, { month: m, income: 0, expenses: 0, net: 0 });
  for (const t of txns) {
    const row = map.get(monthKey(t.date))!;
    if (isIncome(t)) row.income += t.amount;
    else if (isSpending(t)) row.expenses += -t.amount;
  }
  return [...map.values()].map((r) => ({
    month: r.month,
    income: round2(r.income),
    expenses: round2(r.expenses),
    net: round2(r.income - r.expenses),
  }));
}

export interface CategoryTotal {
  category: string;
  total: number;
  share: number;
  count: number;
}

export function categoryBreakdown(txns: Transaction[], month?: string): CategoryTotal[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const t of txns) {
    if (!isSpending(t)) continue;
    if (month && monthKey(t.date) !== month) continue;
    const row = map.get(t.category) ?? { total: 0, count: 0 };
    row.total += -t.amount;
    row.count++;
    map.set(t.category, row);
  }
  const sum = [...map.values()].reduce((a, b) => a + b.total, 0);
  return [...map.entries()]
    .map(([category, v]) => ({ category, total: round2(v.total), count: v.count, share: sum ? v.total / sum : 0 }))
    .sort((a, b) => b.total - a.total);
}

/** Spending per category per month: { "2026-01": { Dining: 120, ... } } */
export function categoryByMonth(txns: Transaction[]): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (const m of monthRange(txns)) out[m] = {};
  for (const t of txns) {
    if (!isSpending(t)) continue;
    const m = monthKey(t.date);
    out[m][t.category] = round2((out[m][t.category] ?? 0) - t.amount);
  }
  return out;
}

/**
 * Forecasts the next value of a series: a recency-weighted average blended
 * with a damped linear trend. Never negative.
 */
export function forecastSeries(values: number[]): number {
  const v = values.filter((x) => Number.isFinite(x));
  if (!v.length) return 0;
  if (v.length === 1) return round2(Math.max(0, v[0]));
  const n = v.length;
  let wSum = 0;
  let wavg = 0;
  v.forEach((x, i) => {
    const w = i + 1;
    wSum += w;
    wavg += x * w;
  });
  wavg /= wSum;
  // least squares slope
  const xMean = (n - 1) / 2;
  const yMean = v.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  v.forEach((y, i) => {
    num += (i - xMean) * (y - yMean);
    den += (i - xMean) ** 2;
  });
  const slope = den ? num / den : 0;
  const trendNext = yMean + slope * (n - xMean);
  const blended = 0.6 * wavg + 0.4 * trendNext;
  // keep forecasts within a sane band around recent history
  const max = Math.max(...v);
  return round2(Math.max(0, Math.min(blended, max * 1.5)));
}

export interface Forecast {
  month: string;
  income: number;
  expenses: number;
  net: number;
  byCategory: Record<string, number>;
  /** Number of historical months used. */
  basis: number;
}

/**
 * Forecasts next month from up to `lookback` most recent months. If the latest
 * month looks partial (fewer days covered than 25), it is excluded from the basis.
 */
export function forecastNextMonth(txns: Transaction[], lookback = 6): Forecast | null {
  const totals = monthlyTotals(txns);
  if (!totals.length) return null;
  const last = totals[totals.length - 1].month;
  let history = totals;
  const lastDay = Math.max(...txns.filter((t) => monthKey(t.date) === last).map((t) => Number(t.date.slice(8, 10))));
  if (lastDay < 25 && totals.length > 1) history = totals.slice(0, -1);
  history = history.slice(-lookback);
  const months = history.map((h) => h.month);
  const byMonth = categoryByMonth(txns);
  const byCategory: Record<string, number> = {};
  for (const cat of EXPENSE_CATEGORY_NAMES) {
    if (NON_SPENDING.has(cat)) continue;
    const series = months.map((m) => byMonth[m]?.[cat] ?? 0);
    const f = forecastSeries(series);
    if (f > 0) byCategory[cat] = f;
  }
  const expenses = round2(Object.values(byCategory).reduce((a, b) => a + b, 0));
  const income = forecastSeries(history.map((h) => h.income));
  return {
    month: addMonths(last, 1),
    income,
    expenses,
    net: round2(income - expenses),
    byCategory,
    basis: history.length,
  };
}

export interface Summary {
  latestMonth: string;
  income: number;
  expenses: number;
  net: number;
  savingsRate: number;
  avgMonthlyExpenses: number;
  expenseChange: number | null;
  transactionCount: number;
}

export function summarize(txns: Transaction[]): Summary | null {
  const totals = monthlyTotals(txns);
  if (!totals.length) return null;
  const latest = totals[totals.length - 1];
  const prev = totals.length > 1 ? totals[totals.length - 2] : null;
  const avg = totals.reduce((a, b) => a + b.expenses, 0) / totals.length;
  return {
    latestMonth: latest.month,
    income: latest.income,
    expenses: latest.expenses,
    net: latest.net,
    savingsRate: latest.income > 0 ? latest.net / latest.income : 0,
    avgMonthlyExpenses: round2(avg),
    expenseChange: prev && prev.expenses > 0 ? (latest.expenses - prev.expenses) / prev.expenses : null,
    transactionCount: txns.length,
  };
}

export interface CategoryTrend {
  category: string;
  previous: number;
  current: number;
  change: number;
}

/** Month-over-month change per category between the last two months. */
export function categoryTrends(txns: Transaction[]): CategoryTrend[] {
  const byMonth = categoryByMonth(txns);
  const months = Object.keys(byMonth).sort();
  if (months.length < 2) return [];
  const cur = byMonth[months[months.length - 1]];
  const prev = byMonth[months[months.length - 2]];
  const cats = new Set([...Object.keys(cur), ...Object.keys(prev)]);
  return [...cats]
    .map((category) => {
      const previous = prev[category] ?? 0;
      const current = cur[category] ?? 0;
      return { category, previous, current, change: round2(current - previous) };
    })
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}

/** Detects recurring charges: same normalised merchant in ≥3 distinct months with stable amounts. */
export function detectRecurring(
  txns: Transaction[],
  excludeCategories: string[] = ["Transfers"],
): { merchant: string; amount: number; months: number; category: string }[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of txns) {
    if (t.amount >= 0 || excludeCategories.includes(t.category)) continue;
    const key = t.description.toLowerCase().replace(/[0-9#*]+/g, "").replace(/\s+/g, " ").trim();
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }
  const out: { merchant: string; amount: number; months: number; category: string }[] = [];
  for (const list of groups.values()) {
    const months = new Set(list.map((t) => monthKey(t.date)));
    if (months.size < 3) continue;
    const amounts = list.map((t) => -t.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stable = amounts.every((a) => Math.abs(a - avg) <= Math.max(1, avg * 0.1));
    if (stable) out.push({ merchant: list[0].description, amount: round2(avg), months: months.size, category: list[0].category });
  }
  return out.sort((a, b) => b.amount - a.amount);
}
