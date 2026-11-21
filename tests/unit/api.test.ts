import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as categorizePOST } from "@/app/api/categorize/route";
import { POST as insightsPOST } from "@/app/api/insights/route";
import { hasApiKey } from "@/lib/ai.server";

const post = (body: unknown) =>
  new Request("http://localhost/api", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });

describe("API routes in demo mode", () => {
  const saved = process.env.ANTHROPIC_API_KEY;
  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = saved;
  });

  it("treats a missing or placeholder key as demo mode", () => {
    expect(hasApiKey()).toBe(false);
    process.env.ANTHROPIC_API_KEY = "sk-ant-your-key-here";
    expect(hasApiKey()).toBe(false);
  });

  it("categorises with the heuristic fallback", async () => {
    const res = await categorizePOST(post({ descriptions: ["BLUE HERON ROASTERS", "SQ *MAPLE & CO"] }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      mode: "demo",
      categories: { "BLUE HERON ROASTERS": "Dining", "SQ *MAPLE & CO": "Other" },
    });
  });

  it("validates input", async () => {
    expect((await categorizePOST(post("{nope"))).status).toBe(400);
    expect((await categorizePOST(post({ descriptions: [1] }))).status).toBe(400);
    expect((await insightsPOST(post({}))).status).toBe(400);
  });

  it("returns demo insights", async () => {
    const res = await insightsPOST(
      post({
        currency: "USD",
        latestMonth: "2026-10",
        income: 5000,
        expenses: 4500,
        savingsRate: 0.1,
        avgMonthlyExpenses: 4000,
        expenseChange: 0.1,
        topCategories: [{ category: "Housing", total: 2100, share: 0.46 }],
        biggestMoves: [{ category: "Food Delivery", previous: 150, current: 300 }],
        recurring: [{ merchant: "NETFLIX.COM", amount: 15.49 }],
        forecast: { month: "2026-11", expenses: 4600, income: 5000 },
      }),
    );
    const json = await res.json();
    expect(json.mode).toBe("demo");
    expect(json.insights.length).toBeGreaterThanOrEqual(4);
  });
});
