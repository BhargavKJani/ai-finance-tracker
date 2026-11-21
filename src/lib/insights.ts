import { categoryBreakdown, categoryTrends, detectRecurring, forecastNextMonth, monthLabel, summarize } from "./analytics";
import type { Insight, Transaction } from "./types";

/**
 * Privacy-friendly aggregate sent to the AI: totals only, never raw descriptions
 * beyond the top recurring merchants.
 */
export interface FinanceSnapshot {
  currency: string;
  latestMonth: string;
  income: number;
  expenses: number;
  savingsRate: number;
  avgMonthlyExpenses: number;
  expenseChange: number | null;
  topCategories: { category: string; total: number; share: number }[];
  biggestMoves: { category: string; previous: number; current: number }[];
  recurring: { merchant: string; amount: number }[];
  forecast: { month: string; expenses: number; income: number } | null;
}

export function buildSnapshot(txns: Transaction[], currency = "USD"): FinanceSnapshot | null {
  const s = summarize(txns);
  if (!s) return null;
  const f = forecastNextMonth(txns);
  return {
    currency,
    latestMonth: s.latestMonth,
    income: s.income,
    expenses: s.expenses,
    savingsRate: Math.round(s.savingsRate * 1000) / 1000,
    avgMonthlyExpenses: s.avgMonthlyExpenses,
    expenseChange: s.expenseChange === null ? null : Math.round(s.expenseChange * 1000) / 1000,
    topCategories: categoryBreakdown(txns, s.latestMonth)
      .slice(0, 6)
      .map((c) => ({ category: c.category, total: c.total, share: Math.round(c.share * 1000) / 1000 })),
    biggestMoves: categoryTrends(txns)
      .slice(0, 4)
      .map(({ category, previous, current }) => ({ category, previous, current })),
    // Discretionary recurring charges only: rent, bills and transfers aren't "subscriptions to review".
    recurring: detectRecurring(txns, ["Transfers", "Housing", "Utilities"])
      .slice(0, 8)
      .map(({ merchant, amount }) => ({ merchant, amount })),
    forecast: f ? { month: f.month, expenses: f.expenses, income: f.income } : null,
  };
}

const money = (n: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
const pct = (n: number) => `${Math.round(n * 100)}%`;

/** Deterministic, rule-based insights used in demo mode (no API key). */
export function mockInsights(s: FinanceSnapshot): Insight[] {
  const out: Insight[] = [];
  const c = s.currency;
  const month = monthLabel(s.latestMonth, "long");

  if (s.savingsRate >= 0.2) {
    out.push({
      kind: "win",
      title: "Strong savings month",
      body: `You kept ${pct(s.savingsRate)} of your income in ${month}. Consider moving the surplus into a high-yield account so it works for you.`,
      metric: pct(s.savingsRate),
    });
  } else if (s.income > 0) {
    out.push({
      kind: s.savingsRate < 0 ? "warning" : "tip",
      title: s.savingsRate < 0 ? "Spending exceeded income" : "Savings rate below 20%",
      body: `Your savings rate in ${month} was ${pct(s.savingsRate)}. The 50/30/20 rule suggests aiming for 20%: that's about ${money(
        Math.max(0, s.income * 0.2 - (s.income - s.expenses)),
        c,
      )} more per month.`,
      metric: pct(s.savingsRate),
    });
  }

  const top = s.topCategories[0];
  if (top) {
    out.push({
      kind: "info",
      title: `${top.category} leads your spending`,
      body: `${top.category} took ${pct(top.share)} of spending in ${month} (${money(top.total, c)}). Small changes here have the biggest impact.`,
      metric: money(top.total, c),
    });
  }

  const rising = s.biggestMoves.find((m) => m.current > m.previous && m.current - m.previous > 25);
  if (rising) {
    const delta = rising.current - rising.previous;
    out.push({
      kind: "warning",
      title: `${rising.category} is climbing`,
      body: `${rising.category} rose by ${money(delta, c)} versus last month. Try the What-if simulator to see what a 30% cut would save over a year.`,
      metric: `+${money(delta, c)}`,
    });
  }

  const subs = s.recurring.reduce((a, b) => a + b.amount, 0);
  if (s.recurring.length) {
    out.push({
      kind: "tip",
      title: `${s.recurring.length} recurring charges found`,
      body: `Recurring payments add up to ${money(subs, c)}/month (${money(subs * 12, c)}/year). Review ones you rarely use, starting with ${s.recurring[0].merchant}.`,
      metric: `${money(subs, c)}/mo`,
    });
  }

  if (s.forecast) {
    const diff = s.forecast.expenses - s.avgMonthlyExpenses;
    out.push({
      kind: diff > 0 ? "warning" : "win",
      title: `Next month forecast: ${money(s.forecast.expenses, c)}`,
      body:
        diff > 0
          ? `Your digital twin projects spending ${money(diff, c)} above your average. Planning ahead now keeps you on track.`
          : `Your digital twin projects spending ${money(-diff, c)} below your average. Nice trajectory, keep it going.`,
      metric: monthLabel(s.forecast.month, "long"),
    });
  }
  // Four cards fit the 2x2 grid; the generic "top category" card is the first to go.
  if (out.length > 4) out.splice(out.findIndex((i) => i.kind === "info"), 1);
  return out.slice(0, 4);
}

const EXTRA_HINTS: [RegExp, string][] = [
  [/roast|espresso|bakery|bagel|donut|tea house|boba|kitchen|deli|noodle|ramen|bbq|diner/i, "Dining"],
  [/market|farm|produce|butcher|organic/i, "Groceries"],
  [/cloud|software|saas|labs\*|\.io|app store|membership|monthly/i, "Subscriptions"],
  [/vet|pet|optic|yoga|pilates|wellness|therap/i, "Health"],
  [/bike|scooter|lime|bird|rail|bus|taxi|cab/i, "Transport"],
  [/books?|store|shop|outlet|boutique|mall/i, "Shopping"],
  [/museum|arcade|park|games?|music|festival/i, "Entertainment"],
  [/air|hostel|resort|inn\b|travel/i, "Travel"],
  [/insurance|electric|sewer|telecom/i, "Utilities"],
];

/** Demo-mode stand-in for the AI categoriser: heuristic hints, else "Other". */
export function mockCategorize(descriptions: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const d of descriptions) {
    const hit = EXTRA_HINTS.find(([re]) => re.test(d));
    out[d] = hit ? hit[1] : "Other";
  }
  return out;
}
