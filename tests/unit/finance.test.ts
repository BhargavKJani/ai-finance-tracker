import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  addMonths,
  categoryBreakdown,
  categoryTrends,
  detectRecurring,
  forecastNextMonth,
  forecastSeries,
  monthlyTotals,
  summarize,
} from "@/lib/analytics";
import { categorizeByRules, normaliseCategory } from "@/lib/categories";
import { parseStatement } from "@/lib/csv";
import { buildSnapshot, mockCategorize, mockInsights } from "@/lib/insights";
import { importTransactions } from "@/lib/pipeline";
import type { Transaction } from "@/lib/types";
import { parseWhatIf, projectSavings, simulate } from "@/lib/whatif";

let n = 0;
const tx = (date: string, amount: number, category: string, description = "x"): Transaction => ({
  id: String(n++),
  date,
  amount,
  category,
  description,
  source: "rule",
  origin: "test",
});

describe("categorizeByRules", () => {
  it.each([
    ["UBER EATS ORDER", -20, "Food Delivery"],
    ["UBER TRIP HELP.UBER.COM", -15, "Transport"],
    ["NETFLIX.COM", -15.49, "Subscriptions"],
    ["WHOLE FOODS MARKET", -80, "Groceries"],
    ["ACME PAYROLL", 4000, "Income"],
    ["TRANSFER TO SAVINGS ACCT", -500, "Transfers"],
    ["CREDIT CARD PAYMENT AUTOPAY", -900, "Transfers"],
    ["Random deposit", 50, "Income"],
  ])("%s → %s", (desc, amount, cat) => expect(categorizeByRules(desc, amount)).toBe(cat));

  it("returns null for unknown merchants so AI can take over", () => {
    expect(categorizeByRules("SQ *MAPLE & CO", -20)).toBeNull();
  });
  it("normalises AI output", () => {
    expect(normaliseCategory("dining")).toBe("Dining");
    expect(normaliseCategory("Crypto")).toBe("Other");
  });
});

describe("analytics", () => {
  const data = [
    tx("2026-01-01", 3000, "Income"),
    tx("2026-01-05", -100, "Dining"),
    tx("2026-01-06", -500, "Transfers"),
    tx("2026-03-02", 3000, "Income"),
    tx("2026-03-05", -300, "Dining"),
    tx("2026-03-07", -100, "Groceries"),
  ];

  it("fills gap months and excludes transfers from spending", () => {
    expect(monthlyTotals(data)).toEqual([
      { month: "2026-01", income: 3000, expenses: 100, net: 2900 },
      { month: "2026-02", income: 0, expenses: 0, net: 0 },
      { month: "2026-03", income: 3000, expenses: 400, net: 2600 },
    ]);
  });
  it("breaks down categories with shares", () => {
    const b = categoryBreakdown(data, "2026-03");
    expect(b[0]).toMatchObject({ category: "Dining", total: 300, share: 0.75 });
  });
  it("computes month-over-month trends", () => {
    const t = categoryTrends([...data, tx("2026-02-03", -50, "Dining")]);
    expect(t[0]).toMatchObject({ category: "Dining", previous: 50, current: 300, change: 250 });
  });
  it("summarises the latest month", () => {
    const s = summarize(data)!;
    expect(s.latestMonth).toBe("2026-03");
    expect(s.savingsRate).toBeCloseTo(2600 / 3000);
  });
  it("adds months across years", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });
});

describe("forecast", () => {
  it("is stable for flat series and follows a trend", () => {
    expect(forecastSeries([100, 100, 100])).toBe(100);
    const up = forecastSeries([100, 200, 300, 400]);
    expect(up).toBeGreaterThan(300);
    expect(up).toBeLessThanOrEqual(600);
    expect(forecastSeries([])).toBe(0);
    expect(forecastSeries([400, 200, 0])).toBeGreaterThanOrEqual(0);
  });
  it("forecasts the month after the latest one, ignoring a partial latest month", () => {
    const data = [
      tx("2026-01-28", -100, "Dining"),
      tx("2026-02-28", -100, "Dining"),
      tx("2026-03-03", -999, "Dining"),
    ];
    const f = forecastNextMonth(data)!;
    expect(f.month).toBe("2026-04");
    expect(f.basis).toBe(2);
    expect(f.byCategory.Dining).toBe(100);
  });
});

describe("what-if", () => {
  it.each([
    ["cut food delivery 30%", "Food Delivery", 30],
    ["Reduce dining by 20 percent", "Dining", 20],
    ["spend half on shopping", "Shopping", 50],
    ["cancel subscriptions", "Subscriptions", 100],
    ["cut food 10%", "Groceries", 10],
  ])("parses %s", (input, category, percent) => expect(parseWhatIf(input)).toEqual({ category, percent }));
  it("returns null without a category or amount", () => {
    expect(parseWhatIf("save more money")).toBeNull();
    expect(parseWhatIf("cut 20%")).toBeNull();
  });
  it("simulates savings", () => {
    const s = simulate({ "Food Delivery": 300, Dining: 200 }, { "Food Delivery": 30, Dining: 150 });
    expect(s.monthlySavings).toBe(290);
    expect(s.yearlySavings).toBe(3480);
    expect(s.projected).toBe(210);
    expect(s.byCategory[0].category).toBe("Dining");
  });
  it("projects cumulative savings", () => {
    expect(projectSavings(100, 50, 3)).toEqual([
      { month: 1, baseline: 100, scenario: 150 },
      { month: 2, baseline: 200, scenario: 300 },
      { month: 3, baseline: 300, scenario: 450 },
    ]);
  });
});

describe("import pipeline", () => {
  const sample = [
    ...parseStatement(readFileSync("public/samples/checking.csv", "utf8"), "checking.csv").transactions,
    ...parseStatement(readFileSync("public/samples/credit-card.csv", "utf8"), "credit-card.csv").transactions,
  ];

  it("uses rules first and sends only unknown unique merchants to AI", async () => {
    const categorizer = vi.fn(async (d: string[]) => ({ mode: "demo" as const, categories: mockCategorize(d) }));
    const r = await importTransactions(sample, [], categorizer);
    expect(r.added).toHaveLength(sample.length);
    expect(categorizer).toHaveBeenCalledTimes(1);
    const sent = categorizer.mock.calls[0][0];
    expect(new Set(sent).size).toBe(sent.length);
    expect(sent).toContain("BLUE HERON ROASTERS");
    expect(sent).not.toContain("NETFLIX.COM");
    expect(r.added.find((t) => t.description === "BLUE HERON ROASTERS")).toMatchObject({ category: "Dining", source: "ai" });
    expect(r.ruleCount).toBeGreaterThan(r.aiCount);
  });

  it("dedupes re-imports and reuses merchant memory", async () => {
    const first = await importTransactions(sample, [], async (d) => ({ mode: "demo", categories: mockCategorize(d) }));
    const categorizer = vi.fn(async () => ({ mode: "demo" as const, categories: {} }));
    const again = await importTransactions(sample, first.added, categorizer);
    expect(again.added).toHaveLength(0);
    expect(again.duplicates).toBe(sample.length);
    expect(categorizer).not.toHaveBeenCalled();
  });

  it("survives a failing AI call", async () => {
    const r = await importTransactions(sample.slice(0, 20), [], async () => {
      throw new Error("offline");
    });
    expect(r.added).toHaveLength(20);
  });

  it("produces a snapshot and demo insights on sample data", async () => {
    const { added } = await importTransactions(sample, [], async (d) => ({ mode: "demo", categories: mockCategorize(d) }));
    const snap = buildSnapshot(added)!;
    expect(snap.latestMonth).toBe("2026-10");
    expect(snap.forecast?.month).toBe("2026-11");
    expect(snap.recurring.map((r) => r.merchant)).toContain("NETFLIX.COM");
    const ins = mockInsights(snap);
    expect(ins).toHaveLength(4);
    expect(snap.recurring.some((r) => /RENT|TRANSFER|XFINITY/.test(r.merchant))).toBe(false);
    expect(ins.some((i) => /Food Delivery/.test(i.title))).toBe(true);
    expect(detectRecurring(added).length).toBeGreaterThan(3);
  });
});
