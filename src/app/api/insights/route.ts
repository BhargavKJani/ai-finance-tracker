import { insights } from "@/lib/ai.server";
import type { FinanceSnapshot } from "@/lib/insights";

export async function POST(request: Request) {
  let snapshot: FinanceSnapshot;
  try {
    snapshot = (await request.json()) as FinanceSnapshot;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!snapshot || typeof snapshot.latestMonth !== "string" || !Array.isArray(snapshot.topCategories)) {
    return Response.json({ error: "Invalid snapshot" }, { status: 400 });
  }
  return Response.json(await insights(snapshot));
}
