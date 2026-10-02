// Triage of one ticket: the input rules, the model's prompt and strict schema, the checks on
// its answer, and the built-in rules that answer when the model can't. Pure (no I/O), so every
// piece is unit-tested; app/api/triage/route.ts wires them up.
import { z } from "zod";
import {
  CATEGORIES,
  PRIORITIES,
  type Category,
  type Citation,
  type Clause,
  type Priority,
  type Triage,
  type TriageRequest,
} from "@/lib/contracts";
import { clauseById } from "@/lib/policy";
import type { ScoredClause } from "@/lib/retrieval";

// ---------------------------------------------------------------------------------------------
// Input

/** A long customer email fits in 2,000 characters; anything longer costs tokens and adds little. */
export const BODY_MAX = 2000;
export const SUBJECT_MAX = 120;
export const NAME_MAX = 60;

export const triageInput = z.object({
  customerName: z.string().trim().min(1, "Add the customer's name.").max(NAME_MAX, `Keep the name under ${NAME_MAX} characters.`),
  subject: z.string().trim().min(3, "Add a subject line.").max(SUBJECT_MAX, `Keep the subject under ${SUBJECT_MAX} characters.`),
  body: z
    .string()
    .trim()
    .min(20, "Write at least a sentence or two, so there is something to triage.")
    .max(BODY_MAX, `Keep the message under ${BODY_MAX.toLocaleString("en-US")} characters.`),
}) satisfies z.ZodType<TriageRequest>;

// ---------------------------------------------------------------------------------------------
// Labels shown in the UI

export const CATEGORY_LABEL: Record<Category, string> = {
  cancellation: "Cancellation",
  delay: "Delay",
  baggage: "Baggage",
  refund: "Refund",
  booking_change: "Booking change",
  special_assistance: "Special assistance",
  pets: "Pets",
  seats_upgrades: "Seats and upgrades",
  account: "Account and miles",
  app_issue: "App or website",
  complaint: "Complaint",
  other: "Other",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

/** Sort order in the inbox: urgent first. */
export const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

// ---------------------------------------------------------------------------------------------
// The model call

/** Strict schema. clause_id is an enum of the retrieved clauses, so the model can only cite rules
 *  we actually sent it (docs/backend/ai-openai.md: "give it a closed list"). */
export function triageSchema(clauseIds: string[]) {
  return {
    name: "triage",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["category", "priority", "summary", "priority_reason", "citations", "reply_subject", "reply_body"],
      properties: {
        category: { type: "string", enum: [...CATEGORIES] },
        priority: { type: "string", enum: [...PRIORITIES] },
        summary: { type: "string", description: "One sentence: what the customer needs." },
        priority_reason: { type: "string", description: "One short sentence: why this priority." },
        citations: {
          type: "array",
          description: "1 to 3 policy rules the reply relies on, most important first.",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["clause_id", "why"],
            properties: {
              clause_id: { type: "string", enum: clauseIds },
              why: { type: "string", description: "One short sentence: why it applies." },
            },
          },
        },
        reply_subject: { type: "string" },
        reply_body: { type: "string", description: "The email reply, 80 to 170 words, plain text." },
      },
    },
  };
}

/** What the model returns (snake_case, as in the schema). */
export interface ModelTriage {
  category: string;
  priority: string;
  summary: string;
  priority_reason: string;
  citations: { clause_id: string; why: string }[];
  reply_subject: string;
  reply_body: string;
}

// Compact and stable, so OpenAI's prompt cache can reuse it (token-efficiency rule).
export const TRIAGE_SYSTEM = [
  "You triage customer emails for Larkspur Air's support team and draft the reply.",
  "Use only the policy rules provided; never promise anything they don't allow.",
  "Priority: urgent = flying within about 12 hours or stranded now; high = travel within days, money or a lost bag at stake; normal = needs an answer, no deadline; low = general question.",
  "Reply: plain text, warm and direct, 80 to 170 words. Greet the customer by first name, answer in the first two sentences, quote the booking reference if given, say what happens next. Sign off as 'Larkspur Air Support'. No placeholders in brackets.",
].join(" ");

/** The user message: the ticket and the candidate rules, nothing else. */
export function triagePrompt(input: TriageRequest, clauses: Clause[]): string {
  const rules = clauses.map((c) => `[${c.id}] ${c.title}: ${c.text}`).join("\n");
  return `Customer: ${input.customerName}\nSubject: ${input.subject}\nMessage:\n${input.body}\n\nPolicy rules:\n${rules}`;
}

const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * Checks the model's answer and turns it into the app's shape. Unknown enums fall back to safe
 * values, citations are limited to the clauses that were sent (and to 3, which strict mode can't
 * enforce), and an empty reply is a failure the route answers with the rules instead.
 */
export function cleanTriage(raw: ModelTriage, allowedClauseIds: string[]): Triage {
  const allowed = new Set(allowedClauseIds);
  const seen = new Set<string>();
  const citations: Citation[] = [];
  for (const c of raw.citations ?? []) {
    if (!allowed.has(c.clause_id) || seen.has(c.clause_id) || !clauseById(c.clause_id)) continue;
    seen.add(c.clause_id);
    citations.push({ clauseId: c.clause_id, why: oneLine(c.why) });
    if (citations.length === 3) break;
  }
  const body = (raw.reply_body ?? "").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!body) throw new Error("model returned an empty reply");
  return {
    category: (CATEGORIES as readonly string[]).includes(raw.category) ? (raw.category as Category) : "other",
    priority: (PRIORITIES as readonly string[]).includes(raw.priority) ? (raw.priority as Priority) : "normal",
    summary: oneLine(raw.summary ?? ""),
    priorityReason: oneLine(raw.priority_reason ?? ""),
    citations,
    reply: { subject: oneLine(raw.reply_subject ?? "") || "Your Larkspur Air request", body },
  };
}

// ---------------------------------------------------------------------------------------------
// Built-in rules: the answer when the model is off, busy or out of credit

/** Words that point to each category, checked against the subject and message. The category
 *  with the most distinct matching words wins; ties go to the earlier line. */
const CATEGORY_WORDS: [Category, RegExp][] = [
  ["pets", /\b(cat|dog|pet|puppy|kitten|service dog|carrier)s?\b/gi],
  ["special_assistance", /\b(wheelchair|mobility|walker|scooter|assistance|disab\w*|unaccompanied|travell?ing alone)\b/gi],
  ["complaint", /\b(rude\w*|complain\w*|unacceptable|unprofessional|embarrass\w*|upsett?\w*|disrespect\w*)\b/gi],
  ["app_issue", /\b(app|website|online check-?in|crash\w*|error|log ?in|outage|bug)\b/gi],
  ["baggage", /\b(bag|bags|baggage|luggage|suitcase\w*|baggage claim)\b/gi],
  ["cancellation", /\bcancel+(ed|led|ation)?\b/gi],
  ["refund", /\b(refund|refunds|money back|reimburs\w*)\b/gi],
  ["delay", /\b(delay\w*|late|missed (my |the )?connection)\b/gi],
  ["booking_change", /\b(change|reschedul\w*|misspel\w*|spelling|wrong (date|name|day)|by mistake|name on (my|the) ticket)\b/gi],
  ["seats_upgrades", /\b(seat|seats|upgrade\w*|legroom)\b/gi],
  ["account", /\b(account|profile|miles|points|password|emergency contact)\b/gi],
];

/** Which policy sections answer each category (the rules draft cites from these first). */
const CATEGORY_SECTIONS: Record<Category, string[]> = {
  cancellation: ["3", "4", "5"],
  delay: ["3", "4"],
  baggage: ["1", "2"],
  refund: ["5", "3"],
  booking_change: ["6", "5"],
  special_assistance: ["7"],
  pets: ["8"],
  seats_upgrades: ["9"],
  account: ["10"],
  app_issue: ["11"],
  complaint: ["12"],
  other: [],
};

export function guessCategory(text: string): Category {
  let best: Category = "other";
  let bestScore = 0;
  for (const [category, re] of CATEGORY_WORDS) {
    const score = new Set((text.match(re) ?? []).map((m) => m.toLowerCase())).size;
    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  }
  return best;
}

const URGENT = /\b(today|tonight|in (an?|one|two|\d+) hours?|this (morning|afternoon|evening)|right now|stranded|stuck at|boarding|gate closes)\b/i;
const HIGH =
  /\b(tomorrow|this week|next week|next (monday|tuesday|wednesday|thursday|friday|saturday|sunday)|in \d+ days|urgent|asap|lost|missing|never (arrived|came)|did(n't| not) arrive|refund|medical|hospital)\b/i;
const LOW = /\b(wondering|curious|question about|is it possible|in general)\b/i;

export function guessPriority(text: string): Priority {
  if (URGENT.test(text)) return "urgent";
  if (HIGH.test(text)) return "high";
  if (LOW.test(text)) return "low";
  return "normal";
}

const PRIORITY_REASON: Record<Priority, string> = {
  urgent: "The message mentions travel or trouble within hours.",
  high: "The message mentions a near date, money or a missing bag.",
  normal: "The customer needs an answer, with no deadline mentioned.",
  low: "A general question with nothing at stake today.",
};

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

/**
 * A complete triage without a model: keyword category and priority, the best-matching rules
 * from the category's own sections (falling back to the overall best matches), and a reply
 * built around those rules that the agent finishes by hand.
 */
export function rulesTriage(input: TriageRequest, matches: ScoredClause[]): Triage {
  const text = `${input.subject} ${input.body}`;
  const category = guessCategory(text);
  const priority = guessPriority(text);
  const sections = CATEGORY_SECTIONS[category];
  const inSection = matches.filter((m) => sections.includes(m.clause.id.split(".")[0]));
  const picked = (inSection.length ? inSection : matches).slice(0, 2).map((m) => m.clause);

  const ruleLines = picked.map((c) => `- ${c.text}`).join("\n");
  const body = [
    `Hi ${firstName(input.customerName)},`,
    "",
    `Thank you for writing to us about "${input.subject}". We're sorry for the trouble, and we're looking into it now.`,
    ...(picked.length ? ["", "Here is what our policy says about this:", ruleLines] : []),
    "",
    "We'll follow up as soon as we've checked your booking. If anything changes in the meantime, reply to this email and it will reach the same team.",
    "",
    "Larkspur Air Support",
  ].join("\n");

  return {
    category,
    priority,
    summary: `${input.customerName} wrote about: ${oneLine(input.subject)}.`,
    priorityReason: PRIORITY_REASON[priority],
    citations: picked.map((c) => ({ clauseId: c.id, why: "Picked because the ticket uses the same words as this rule." })),
    reply: { subject: `Re: ${oneLine(input.subject)}`, body },
  };
}
