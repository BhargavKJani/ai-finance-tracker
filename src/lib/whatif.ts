import { EXPENSE_CATEGORY_NAMES } from "./categories";

/** Category → percentage cut (0–100). */
export type Cuts = Record<string, number>;

const ALIASES: Record<string, string> = {
  "food delivery": "Food Delivery",
  delivery: "Food Delivery",
  takeout: "Food Delivery",
  takeaway: "Food Delivery",
  "uber eats": "Food Delivery",
  doordash: "Food Delivery",
  "eating out": "Dining",
  restaurants: "Dining",
  restaurant: "Dining",
  dining: "Dining",
  coffee: "Dining",
  subscriptions: "Subscriptions",
  subscription: "Subscriptions",
  streaming: "Subscriptions",
  subs: "Subscriptions",
  shopping: "Shopping",
  amazon: "Shopping",
  clothes: "Shopping",
  groceries: "Groceries",
  grocery: "Groceries",
  food: "Groceries",
  transport: "Transport",
  transportation: "Transport",
  rides: "Transport",
  uber: "Transport",
  fuel: "Transport",
  gas: "Transport",
  entertainment: "Entertainment",
  fun: "Entertainment",
  travel: "Travel",
  holidays: "Travel",
  utilities: "Utilities",
  bills: "Utilities",
  health: "Health",
  gym: "Health",
  housing: "Housing",
  rent: "Housing",
};

export interface ParsedWhatIf {
  category: string;
  percent: number;
}

/**
 * Parses natural-language scenarios such as "cut food delivery 30%",
 * "reduce dining by 20%", "spend 15% less on shopping".
 */
export function parseWhatIf(input: string): ParsedWhatIf | null {
  const text = input.toLowerCase();
  const pct = text.match(/(\d{1,3}(?:\.\d+)?)\s*(%|percent)/);
  const half = /\bhalf\b|\bhalve\b/.test(text);
  const stop = /\b(stop|quit|cancel|eliminate|no more|drop)\b/.test(text);
  let percent = pct ? Number(pct[1]) : half ? 50 : stop ? 100 : NaN;
  if (!Number.isFinite(percent)) return null;
  percent = Math.min(100, Math.max(0, percent));

  // Longest alias first so "food delivery" wins over "food".
  const names = [
    ...EXPENSE_CATEGORY_NAMES.map((n) => [n.toLowerCase(), n] as const),
    ...Object.entries(ALIASES),
  ].sort((a, b) => b[0].length - a[0].length);
  for (const [alias, category] of names) {
    if (new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text)) return { category, percent };
  }
  return null;
}

export interface Simulation {
  baseline: number;
  projected: number;
  monthlySavings: number;
  yearlySavings: number;
  byCategory: { category: string; baseline: number; projected: number; saved: number }[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function simulate(forecastByCategory: Record<string, number>, cuts: Cuts): Simulation {
  const byCategory = Object.entries(forecastByCategory).map(([category, baseline]) => {
    const pct = Math.min(100, Math.max(0, cuts[category] ?? 0));
    const projected = round2(baseline * (1 - pct / 100));
    return { category, baseline: round2(baseline), projected, saved: round2(baseline - projected) };
  });
  const baseline = round2(byCategory.reduce((a, b) => a + b.baseline, 0));
  const projected = round2(byCategory.reduce((a, b) => a + b.projected, 0));
  const monthlySavings = round2(baseline - projected);
  return {
    baseline,
    projected,
    monthlySavings,
    yearlySavings: round2(monthlySavings * 12),
    byCategory: byCategory.sort((a, b) => b.saved - a.saved || b.baseline - a.baseline),
  };
}

/** Cumulative savings over `months` months for a baseline monthly net vs. the scenario. */
export function projectSavings(monthlyNet: number, monthlySavings: number, months = 12) {
  return Array.from({ length: months }, (_, i) => ({
    month: i + 1,
    baseline: round2(monthlyNet * (i + 1)),
    scenario: round2((monthlyNet + monthlySavings) * (i + 1)),
  }));
}
