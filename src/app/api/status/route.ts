import { connection } from "next/server";
import { hasApiKey, MODEL } from "@/lib/ai.server";
import { billingEnabled } from "@/lib/billing/config";

export async function GET() {
  await connection();
  // Claude runs only when payments are configured, so every AI call belongs to a signed-in user's plan.
  const billing = billingEnabled();
  const ai = hasApiKey() && billing;
  return Response.json({ mode: ai ? "claude" : "demo", model: MODEL, ai, billing });
}
