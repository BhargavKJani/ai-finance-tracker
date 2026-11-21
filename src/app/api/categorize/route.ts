import { categorize } from "@/lib/ai.server";

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
  return Response.json(await categorize(descriptions));
}
