import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { EXPENSE_CATEGORY_NAMES, normaliseCategory } from "./categories";
import { mockCategorize, mockInsights, type FinanceSnapshot } from "./insights";
import type { AiMode, Insight } from "./types";

// Haiku 5.5 keeps a statement's AI cost well under ₹1, which makes the ₹9 / ₹49 plans profitable.
export const MODEL = "claude-haiku-5-5";

export function hasApiKey(): boolean {
  const k = process.env.ANTHROPIC_API_KEY;
  return !!k && k.trim().length > 10 && !k.includes("your-key");
}

function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function firstText(msg: Anthropic.Message): string {
  for (const block of msg.content) if (block.type === "text") return block.text;
  return "";
}

/** `allowAi` is decided by the route from the caller's plan; without it the demo engine answers. */
export async function categorize(descriptions: string[], allowAi = hasApiKey()): Promise<{ mode: AiMode; categories: Record<string, string> }> {
  const unique = [...new Set(descriptions.map((d) => d.trim()).filter(Boolean))].slice(0, 200);
  if (!unique.length) return { mode: allowAi ? "claude" : "demo", categories: {} };
  if (!allowAi) return { mode: "demo", categories: mockCategorize(unique) };

  try {
    const msg = await client().messages.create({
      model: MODEL,
      max_tokens: 4000,
      system:
        "You categorise bank-statement merchant descriptions for a personal finance app. " +
        `Use exactly one of these categories: ${EXPENSE_CATEGORY_NAMES.join(", ")}. ` +
        "If you genuinely cannot tell, use Other.",
      messages: [
        {
          role: "user",
          content: `Categorise each description. Return every input exactly once.\n\n${unique
            .map((d, i) => `${i + 1}. ${d}`)
            .join("\n")}`,
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              results: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    category: { type: "string", enum: EXPENSE_CATEGORY_NAMES },
                  },
                  required: ["description", "category"],
                  additionalProperties: false,
                },
              },
            },
            required: ["results"],
            additionalProperties: false,
          },
        },
      },
    });
    const parsed = JSON.parse(firstText(msg)) as { results: { description: string; category: string }[] };
    const categories: Record<string, string> = {};
    for (const r of parsed.results ?? []) categories[r.description] = normaliseCategory(r.category);
    // Anything the model skipped falls back to the heuristic.
    const missing = unique.filter((d) => !(d in categories));
    Object.assign(categories, mockCategorize(missing));
    return { mode: "claude", categories };
  } catch (err) {
    console.error("[categorize] Claude call failed, using demo fallback:", err);
    return { mode: "demo", categories: mockCategorize(unique) };
  }
}

export async function insights(snapshot: FinanceSnapshot, allowAi = hasApiKey()): Promise<{ mode: AiMode; insights: Insight[] }> {
  if (!allowAi) return { mode: "demo", insights: mockInsights(snapshot) };
  try {
    const msg = await client().messages.create({
      model: MODEL,
      max_tokens: 2000,
      system:
        "You are a friendly, precise personal-finance coach inside a budgeting app. " +
        "You get an aggregated monthly snapshot (no raw transactions). Write 4 short, specific, actionable insight cards. " +
        "Quote real numbers from the snapshot with the given currency. Do not give investment advice or recommend specific financial products. " +
        "Each body is at most 2 sentences.",
      messages: [{ role: "user", content: JSON.stringify(snapshot) }],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              insights: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    body: { type: "string" },
                    kind: { type: "string", enum: ["warning", "tip", "win", "info"] },
                    metric: { type: "string" },
                  },
                  required: ["title", "body", "kind", "metric"],
                  additionalProperties: false,
                },
              },
            },
            required: ["insights"],
            additionalProperties: false,
          },
        },
      },
    });
    const parsed = JSON.parse(firstText(msg)) as { insights: Insight[] };
    if (!parsed.insights?.length) throw new Error("empty insights");
    return { mode: "claude", insights: parsed.insights.slice(0, 6) };
  } catch (err) {
    console.error("[insights] Claude call failed, using demo fallback:", err);
    return { mode: "demo", insights: mockInsights(snapshot) };
  }
}
