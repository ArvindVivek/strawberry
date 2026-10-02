// The browser's one call to the server: POST /api/triage. Turns every outcome into either the
// answer or one plain sentence to show; the details go to the console.
import type { TriageRequest, TriageResponse } from "@/lib/contracts";

export type TriageResult = { ok: true; data: TriageResponse } | { ok: false; message: string };

export async function requestTriage(input: TriageRequest, signal?: AbortSignal): Promise<TriageResult> {
  let res: Response;
  try {
    res = await fetch("/api/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal,
    });
  } catch (err) {
    console.error("[triage] request failed", err);
    return { ok: false, message: "We couldn't reach Strawberry. Check your connection and try again." };
  }
  const json = (await res.json().catch(() => null)) as (TriageResponse & { error?: { message?: string } }) | null;
  if (res.ok && json?.triage) return { ok: true, data: json };
  console.error("[triage] error response", res.status, json);
  return { ok: false, message: json?.error?.message ?? "Something went wrong on our side. Please try again." };
}
