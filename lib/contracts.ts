// Strawberry's frozen contracts: the shapes every other file builds on. Change them here first,
// then the fixtures, the route and the UI (CLAUDE.md, "Contracts").

/** What a ticket is about. Closed list: the model must pick one, and the UI labels each. */
export const CATEGORIES = [
  "cancellation",
  "delay",
  "baggage",
  "refund",
  "booking_change",
  "special_assistance",
  "pets",
  "seats_upgrades",
  "account",
  "app_issue",
  "complaint",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

/** How soon someone should answer. Urgent = the customer is stuck or flying within hours. */
export const PRIORITIES = ["urgent", "high", "normal", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];

/** One rule from the policy (content/policy.md), e.g. id "3.2". */
export interface Clause {
  id: string;
  /** Section heading, e.g. "Delays and cancellations". */
  section: string;
  title: string;
  /** Plain text of the rule, as written in the policy. */
  text: string;
}

/** A policy rule the triage relies on. The clause text is looked up locally, never trusted from the model. */
export interface Citation {
  clauseId: string;
  /** One short sentence: why this rule applies to this ticket. */
  why: string;
}

export interface Triage {
  category: Category;
  priority: Priority;
  /** One sentence: what the customer needs. */
  summary: string;
  /** One short sentence: why this priority. */
  priorityReason: string;
  /** 1 to 3 rules, most important first. */
  citations: Citation[];
  reply: { subject: string; body: string };
}

/** Where a triage came from: written ahead for the sample inbox, the model, or the built-in rules. */
export type TriageSource = "sample" | "ai" | "rules";

export interface Ticket {
  id: string;
  customerName: string;
  /** Booking reference (6 letters and digits) or null when the customer didn't give one. */
  bookingRef: string | null;
  subject: string;
  body: string;
  /** Sample tickets: minutes before "now" (keeps the inbox fresh and server-render safe). */
  minutesAgo?: number;
  /** Tickets you write: when you added it (ISO). */
  createdAt?: string;
  origin: "sample" | "custom";
}

/** A ticket's working state in this browser. */
export interface TicketState {
  triage: Triage | null;
  source: TriageSource | null;
  /** The reply as edited by the agent; null means "the drafted reply, untouched". */
  draft: { subject: string; body: string } | null;
  /** Set when the agent pressed Send. */
  sent: { subject: string; body: string; at: string } | null;
}

/** POST /api/triage request body. */
export interface TriageRequest {
  customerName: string;
  subject: string;
  body: string;
}

/** Why the answer didn't come from the model (shown above the rules-based draft). */
export interface TriageNotice {
  code: "paused" | "not_configured" | "busy" | "unavailable" | "failed";
  message: string;
}

/** POST /api/triage response (200). Errors are `{ error: { code, message } }` with 400 or 429. */
export interface TriageResponse {
  triage: Triage;
  source: Exclude<TriageSource, "sample">;
  notice?: TriageNotice;
}
