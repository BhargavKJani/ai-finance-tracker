import { categorizeByRules, normaliseCategory } from "./categories";
import type { AiMode, NewTransaction, Transaction } from "./types";

export const txnKey = (t: Pick<Transaction, "date" | "description" | "amount">) =>
  `${t.date}|${t.description.toLowerCase()}|${t.amount.toFixed(2)}`;

let counter = 0;
export function makeId(): string {
  counter = (counter + 1) % 1e6;
  return `t_${Date.now().toString(36)}_${counter.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Applies rules. Returns categorised rows plus the unique descriptions that still need AI. */
export function applyRules(rows: NewTransaction[]): { rows: NewTransaction[]; unknown: string[] } {
  const unknown = new Set<string>();
  const out = rows.map((r) => {
    const cat = categorizeByRules(r.description, r.amount);
    if (cat) return { ...r, category: cat, source: "rule" as const };
    unknown.add(r.description);
    return { ...r, category: "Other", source: "fallback" as const };
  });
  return { rows: out, unknown: [...unknown] };
}

export type Categorizer = (descriptions: string[]) => Promise<{ mode: AiMode; categories: Record<string, string> }>;

export const remoteCategorizer: Categorizer = (descriptions) => sessionCategorizer(null, "")(descriptions);

/** Categoriser that carries an AI session and sign-in token, so the server may use Claude. */
export const sessionCategorizer = (session: string | null, token: string): Categorizer => async (descriptions) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch("/api/categorize", {
    method: "POST",
    headers,
    body: JSON.stringify(session ? { descriptions, session } : { descriptions }),
  });
  if (!res.ok) throw new Error(`categorize failed: ${res.status}`);
  return res.json();
};

export interface ImportResult {
  added: Transaction[];
  duplicates: number;
  ruleCount: number;
  aiCount: number;
  mode: AiMode | null;
}

/**
 * Full import: dedupe against existing data, rules first, then AI for unknown
 * merchants. Learned categories from user edits are reused before calling AI.
 */
export async function importTransactions(
  incoming: NewTransaction[],
  existing: Transaction[],
  categorizer: Categorizer = remoteCategorizer,
): Promise<ImportResult> {
  const seen = new Set(existing.map(txnKey));
  const fresh: NewTransaction[] = [];
  let duplicates = 0;
  for (const r of incoming) {
    const k = txnKey(r);
    if (seen.has(k)) {
      duplicates++;
      continue;
    }
    seen.add(k);
    fresh.push(r);
  }

  // Merchant memory: categories the user (or AI) already assigned.
  const memory = new Map<string, string>();
  for (const t of existing) if (t.source === "manual" || t.source === "ai") memory.set(t.description.toLowerCase(), t.category);

  const { rows, unknown } = applyRules(fresh);
  const needAi = unknown.filter((d) => !memory.has(d.toLowerCase()));
  let aiMap: Record<string, string> = {};
  let mode: AiMode | null = null;
  if (needAi.length) {
    try {
      const r = await categorizer(needAi);
      aiMap = r.categories;
      mode = r.mode;
    } catch {
      aiMap = {};
    }
  }

  let ruleCount = 0;
  let aiCount = 0;
  const added: Transaction[] = rows.map((r) => {
    if (r.source === "rule") {
      ruleCount++;
      return { ...r, id: makeId() };
    }
    const remembered = memory.get(r.description.toLowerCase());
    if (remembered) return { ...r, id: makeId(), category: remembered, source: "ai" };
    const ai = aiMap[r.description];
    if (ai) {
      aiCount++;
      return { ...r, id: makeId(), category: normaliseCategory(ai), source: "ai" };
    }
    return { ...r, id: makeId() };
  });

  return { added, duplicates, ruleCount, aiCount, mode };
}
