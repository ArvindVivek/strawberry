// POST /api/triage { customerName, subject, body } → TriageResponse (lib/contracts.ts).
// The app's only paid call, and only when someone presses "Triage with AI" on a ticket they
// wrote; the sample inbox ships with its triage already written. Validate → limit → retrieve
// the matching policy rules → model → check its answer; on any failure, answer with the
// built-in rules and say why (docs/web/ai.md).
import type { TriageNotice, TriageResponse } from "@/lib/contracts";
import { generateJSON, toAIError } from "@/lib/kl/ai";
import { createRateLimiter, rateLimitKey, rateLimitedResponse } from "@/lib/kl/rate-limit";
import { retrieveClauses } from "@/lib/retrieval";
import { TRIAGE_SYSTEM, cleanTriage, rulesTriage, triageInput, triagePrompt, triageSchema, type ModelTriage } from "@/lib/triage";

export const runtime = "nodejs";
export const maxDuration = 30;

/** 5 a minute per visitor: enough to try a few tickets back to back, too few for a loop. */
const burst = createRateLimiter({ limit: 5, windowMs: 60_000 });
/** 20 a day per visitor: a day of trying the app costs cents. In memory, so a speed bump, not a
 *  hard cap (see lib/kl/rate-limit.ts); there are no accounts to hang a real quota on. */
const daily = createRateLimiter({ limit: 20, windowMs: 24 * 60 * 60_000 });

/** How many policy rules the model sees. Five keeps the prompt near 600 tokens. */
const CANDIDATES = 5;

export async function POST(req: Request) {
  // 1. Validate first, so a typo costs nothing.
  const parsed = triageInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Check the ticket and try again.";
    return Response.json({ error: { code: "bad_request", message } }, { status: 400 });
  }
  const input = parsed.data;

  // 2. Limit (the daily window only counts requests the burst limit let through).
  const key = rateLimitKey(req);
  const minute = burst.check(key);
  if (!minute.ok) return rateLimitedResponse(minute);
  const day = daily.check(key);
  if (!day.ok) return rateLimitedResponse(day, "That's today's limit for AI triage. Try again tomorrow, or write the reply yourself.");

  // 3. Retrieve: free, and the rules answer needs it too.
  const matches = retrieveClauses(input.subject, input.body, CANDIDATES);
  const clauses = matches.map((m) => m.clause);

  // 4. Model, 5. fallback.
  try {
    if (!clauses.length) throw new Error("no policy rules matched, nothing to ground a reply on");
    const ids = clauses.map((c) => c.id);
    const raw = await generateJSON<ModelTriage>({
      system: TRIAGE_SYSTEM,
      user: triagePrompt(input, clauses),
      schema: triageSchema(ids),
      maxOutputTokens: 700,
      label: "strawberry-triage",
      signal: req.signal,
    });
    const body: TriageResponse = { triage: cleanTriage(raw, ids), source: "ai" };
    return Response.json(body);
  } catch (err) {
    const e = toAIError(err);
    console.error(`[ai] fell back to rules (${e.code})`, e.detail);
    const body: TriageResponse = { triage: rulesTriage(input, matches), source: "rules", notice: noticeFor(e.code, e.userMessage) };
    return Response.json(body);
  }
}

function noticeFor(code: string, message: string): TriageNotice {
  switch (code) {
    case "paused":
      return { code: "paused", message };
    case "not_configured":
      return { code: "not_configured", message: "AI triage is off on this copy of Strawberry." };
    case "busy":
      return { code: "busy", message };
    case "unavailable":
    case "timeout":
      return { code: "unavailable", message };
    default:
      return { code: "failed", message: "We couldn't get an AI triage this time." };
  }
}
