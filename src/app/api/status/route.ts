import { connection } from "next/server";
import { hasApiKey, MODEL } from "@/lib/ai.server";

export async function GET() {
  await connection();
  return Response.json({ mode: hasApiKey() ? "claude" : "demo", model: MODEL });
}
