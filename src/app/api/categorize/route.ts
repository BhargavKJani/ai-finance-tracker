import { categorize } from "@/lib/ai.server";
import { aiGate } from "@/lib/billing/gate";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const descriptions = (body as { descriptions?: unknown })?.descriptions;
  if (!Array.isArray(descriptions) || !descriptions.every((d) => typeof d === "string")) {
    return Response.json({ error: "`descriptions` must be an array of strings" }, { status: 400 });
  }
  if (descriptions.length > 500) {
    return Response.json({ error: "Too many descriptions (max 500)" }, { status: 413 });
  }
  // Claude only for a signed-in user with an open AI session (free uses or a paid plan).
  return Response.json(await categorize(descriptions, await aiGate(request, body)));
}
