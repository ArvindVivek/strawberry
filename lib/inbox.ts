// The inbox's state and every change to it, as a pure reducer (tested in lib/inbox.test.ts).
// It lives in this browser only: localStorage under STORAGE_KEY, no account, no database.
import type { Ticket, TicketState, Triage, TriageSource } from "@/lib/contracts";
import { SAMPLES, sampleState } from "@/lib/samples";
import { PRIORITY_RANK } from "@/lib/triage";

export const STORAGE_KEY = "strawberry:inbox:v1";

export interface InboxState {
  /** Tickets written in this browser, newest first. */
  custom: Ticket[];
  states: Record<string, TicketState>;
  introDismissed: boolean;
}

export type InboxAction =
  | { type: "load"; state: InboxState }
  | { type: "add"; ticket: Ticket }
  | { type: "triaged"; id: string; triage: Triage; source: Exclude<TriageSource, "sample"> }
  | { type: "edit"; id: string; draft: { subject: string; body: string } }
  | { type: "resetDraft"; id: string }
  | { type: "send"; id: string; at: string }
  | { type: "reopen"; id: string }
  | { type: "remove"; id: string }
  | { type: "dismissIntro" }
  | { type: "resetAll"; now: Date };

const EMPTY: TicketState = { triage: null, source: null, draft: null, sent: null };

export function initialInbox(now: Date): InboxState {
  return {
    custom: [],
    states: Object.fromEntries(SAMPLES.map((s) => [s.ticket.id, sampleState(s, now)])),
    introDismissed: false,
  };
}

export function stateOf(inbox: InboxState, id: string): TicketState {
  return inbox.states[id] ?? EMPTY;
}

/** The reply as it stands: the agent's edit if any, else the drafted one. */
export function currentReply(state: TicketState): { subject: string; body: string } | null {
  return state.draft ?? state.triage?.reply ?? null;
}

function patch(inbox: InboxState, id: string, change: Partial<TicketState>): InboxState {
  return { ...inbox, states: { ...inbox.states, [id]: { ...stateOf(inbox, id), ...change } } };
}

export function inboxReducer(inbox: InboxState, action: InboxAction): InboxState {
  switch (action.type) {
    case "load":
      return action.state;
    case "add":
      return { ...inbox, custom: [action.ticket, ...inbox.custom], states: { ...inbox.states, [action.ticket.id]: EMPTY } };
    case "triaged":
      return patch(inbox, action.id, { triage: action.triage, source: action.source, draft: null });
    case "edit":
      return patch(inbox, action.id, { draft: action.draft });
    case "resetDraft":
      return patch(inbox, action.id, { draft: null });
    case "send": {
      const reply = currentReply(stateOf(inbox, action.id));
      if (!reply || !reply.body.trim()) return inbox;
      return patch(inbox, action.id, { sent: { ...reply, at: action.at } });
    }
    case "reopen": {
      const sent = stateOf(inbox, action.id).sent;
      if (!sent) return inbox;
      return patch(inbox, action.id, { sent: null, draft: { subject: sent.subject, body: sent.body } });
    }
    case "remove": {
      if (!inbox.custom.some((t) => t.id === action.id)) return inbox; // samples can't be deleted
      const states = { ...inbox.states };
      delete states[action.id];
      return { ...inbox, custom: inbox.custom.filter((t) => t.id !== action.id), states };
    }
    case "dismissIntro":
      return { ...inbox, introDismissed: true };
    case "resetAll":
      return { ...initialInbox(action.now), introDismissed: inbox.introDismissed };
  }
}

// ---------------------------------------------------------------------------------------------
// Reading and writing localStorage. Anything unreadable falls back to a fresh inbox: a broken
// save must never leave someone looking at an error.

export function parseSaved(raw: string | null, now: Date): InboxState {
  const fresh = initialInbox(now);
  if (!raw) return fresh;
  try {
    const saved = JSON.parse(raw) as Partial<InboxState>;
    if (!saved || typeof saved !== "object" || !Array.isArray(saved.custom) || typeof saved.states !== "object" || !saved.states) {
      return fresh;
    }
    const custom = saved.custom.filter(isTicket);
    const known = new Set([...SAMPLES.map((s) => s.ticket.id), ...custom.map((t) => t.id)]);
    const states: Record<string, TicketState> = { ...fresh.states };
    for (const [id, state] of Object.entries(saved.states)) {
      if (known.has(id) && state && typeof state === "object") states[id] = { ...EMPTY, ...(state as TicketState) };
    }
    return { custom, states, introDismissed: saved.introDismissed === true };
  } catch {
    return fresh;
  }
}

function isTicket(value: unknown): value is Ticket {
  const t = value as Ticket;
  return Boolean(t && typeof t.id === "string" && typeof t.subject === "string" && typeof t.body === "string" && typeof t.customerName === "string");
}

// ---------------------------------------------------------------------------------------------
// The list

export type Filter = "all" | "open" | "replied";

export interface ListItem {
  ticket: Ticket;
  state: TicketState;
  /** Minutes since the ticket arrived, for the time label and newest-first order. */
  age: number;
}

/** Every ticket, open ones first (most urgent, then newest), replied ones after (newest first). */
export function listItems(inbox: InboxState, now: Date): ListItem[] {
  const all = [...inbox.custom, ...SAMPLES.map((s) => s.ticket)].map((ticket) => ({
    ticket,
    state: stateOf(inbox, ticket.id),
    age: ageInMinutes(ticket, now),
  }));
  const rank = (i: ListItem) => (i.state.triage ? PRIORITY_RANK[i.state.triage.priority] : -1); // untriaged first: it needs you
  return all.sort((a, b) => {
    const sentA = a.state.sent ? 1 : 0;
    const sentB = b.state.sent ? 1 : 0;
    if (sentA !== sentB) return sentA - sentB;
    if (!sentA && rank(a) !== rank(b)) return rank(a) - rank(b);
    return a.age - b.age;
  });
}

export function filterItems(items: ListItem[], filter: Filter): ListItem[] {
  if (filter === "open") return items.filter((i) => !i.state.sent);
  if (filter === "replied") return items.filter((i) => i.state.sent);
  return items;
}

export function ageInMinutes(ticket: Ticket, now: Date): number {
  if (ticket.minutesAgo !== undefined) return ticket.minutesAgo;
  if (ticket.createdAt) return Math.max(0, Math.round((now.getTime() - Date.parse(ticket.createdAt)) / 60_000));
  return 0;
}

/** "Just now", "12 min ago", "3 h ago", "Yesterday", "4 days ago". */
export function agoLabel(minutes: number): string {
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

/** A short, unique id for a ticket written in this browser. */
export function newTicketId(now: Date, random: () => number = Math.random): string {
  return `c-${now.getTime().toString(36)}${Math.floor(random() * 1296).toString(36).padStart(2, "0")}`;
}
