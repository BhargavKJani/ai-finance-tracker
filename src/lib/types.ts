export type CategorySource = "rule" | "ai" | "manual" | "fallback";

export interface Transaction {
  id: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  description: string;
  /** Negative = money out (expense), positive = money in (income). */
  amount: number;
  category: string;
  source: CategorySource;
  /** Where the row came from, e.g. "checking.csv" or "manual". */
  origin: string;
}

export type NewTransaction = Omit<Transaction, "id">;

export type InsightKind = "warning" | "tip" | "win" | "info";

export interface Insight {
  title: string;
  body: string;
  kind: InsightKind;
  metric?: string;
}

export type AiMode = "claude" | "demo";
