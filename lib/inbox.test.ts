import { describe, expect, it } from "vitest";
import type { Ticket, Triage } from "@/lib/contracts";
import {
  STORAGE_KEY,
  agoLabel,
  currentReply,
  filterItems,
  inboxReducer,
  initialInbox,
  listItems,
  newTicketId,
  parseSaved,
  stateOf,
} from "@/lib/inbox";
import { SAMPLES } from "@/lib/samples";

const now = new Date("2026-10-02T12:00:00Z");
const custom: Ticket = {
  id: "c-test",
  customerName: "Mei Chen",
  bookingRef: null,
  subject: "Stuck overnight",
  body: "The last flight left and we are stuck at the airport tonight.",
  createdAt: new Date(now.getTime() - 3 * 60_000).toISOString(),
  origin: "custom",
};
const triage: Triage = {
  category: "delay",
  priority: "urgent",
  summary: "Stuck overnight.",
  priorityReason: "Tonight.",
  citations: [{ clauseId: "3.5", why: "Hotel." }],
  reply: { subject: "Re: Stuck overnight", body: "Hi Mei,\n\nA hotel is on us.\n\nLarkspur Air Support" },
};

describe("inboxReducer", () => {
  it("starts with every sample triaged and the pre-answered ones sent", () => {
    const inbox = initialInbox(now);
    expect(Object.keys(inbox.states)).toHaveLength(SAMPLES.length);
    expect(SAMPLES.every((s) => stateOf(inbox, s.ticket.id).source === "sample")).toBe(true);
    expect(SAMPLES.filter((s) => stateOf(inbox, s.ticket.id).sent).length).toBe(SAMPLES.filter((s) => s.sentAtMinutesAgo !== undefined).length);
  });

  it("adds a ticket untriaged, then stores its triage", () => {
    let inbox = inboxReducer(initialInbox(now), { type: "add", ticket: custom });
    expect(inbox.custom[0]).toBe(custom);
    expect(stateOf(inbox, custom.id)).toEqual({ triage: null, source: null, draft: null, sent: null });
    inbox = inboxReducer(inbox, { type: "triaged", id: custom.id, triage, source: "ai" });
    expect(stateOf(inbox, custom.id).triage).toBe(triage);
    expect(currentReply(stateOf(inbox, custom.id))).toEqual(triage.reply);
  });

  it("keeps edits apart from the draft, and can undo them", () => {
    let inbox = inboxReducer(inboxReducer(initialInbox(now), { type: "add", ticket: custom }), { type: "triaged", id: custom.id, triage, source: "rules" });
    inbox = inboxReducer(inbox, { type: "edit", id: custom.id, draft: { subject: "Re: hi", body: "Edited." } });
    expect(currentReply(stateOf(inbox, custom.id))).toEqual({ subject: "Re: hi", body: "Edited." });
    expect(stateOf(inbox, custom.id).triage?.reply).toEqual(triage.reply);
    inbox = inboxReducer(inbox, { type: "resetDraft", id: custom.id });
    expect(currentReply(stateOf(inbox, custom.id))).toEqual(triage.reply);
  });

  it("sends the current reply, and reopening puts the sent text back in the editor", () => {
    let inbox = inboxReducer(inboxReducer(initialInbox(now), { type: "add", ticket: custom }), { type: "triaged", id: custom.id, triage, source: "ai" });
    inbox = inboxReducer(inbox, { type: "edit", id: custom.id, draft: { subject: "S", body: "Final text." } });
    inbox = inboxReducer(inbox, { type: "send", id: custom.id, at: now.toISOString() });
    expect(stateOf(inbox, custom.id).sent).toEqual({ subject: "S", body: "Final text.", at: now.toISOString() });
    inbox = inboxReducer(inbox, { type: "reopen", id: custom.id });
    expect(stateOf(inbox, custom.id).sent).toBeNull();
    expect(stateOf(inbox, custom.id).draft).toEqual({ subject: "S", body: "Final text." });
  });

  it("won't send an empty reply or a ticket with no reply", () => {
    let inbox = inboxReducer(initialInbox(now), { type: "add", ticket: custom });
    expect(inboxReducer(inbox, { type: "send", id: custom.id, at: "x" })).toBe(inbox);
    inbox = inboxReducer(inbox, { type: "edit", id: custom.id, draft: { subject: "S", body: "   " } });
    expect(inboxReducer(inbox, { type: "send", id: custom.id, at: "x" })).toBe(inbox);
  });

  it("deletes tickets you wrote, never samples", () => {
    const inbox = inboxReducer(initialInbox(now), { type: "add", ticket: custom });
    const removed = inboxReducer(inbox, { type: "remove", id: custom.id });
    expect(removed.custom).toEqual([]);
    expect(removed.states[custom.id]).toBeUndefined();
    expect(inboxReducer(inbox, { type: "remove", id: SAMPLES[0].ticket.id })).toBe(inbox);
  });

  it("resets to the samples but remembers the dismissed note", () => {
    let inbox = inboxReducer(initialInbox(now), { type: "add", ticket: custom });
    inbox = inboxReducer(inbox, { type: "dismissIntro" });
    inbox = inboxReducer(inbox, { type: "resetAll", now });
    expect(inbox.custom).toEqual([]);
    expect(inbox.introDismissed).toBe(true);
    expect(inbox.states).toEqual(initialInbox(now).states);
  });
});

describe("parseSaved (localStorage)", () => {
  it("round-trips a saved inbox", () => {
    let inbox = inboxReducer(initialInbox(now), { type: "add", ticket: custom });
    inbox = inboxReducer(inbox, { type: "triaged", id: custom.id, triage, source: "ai" });
    expect(parseSaved(JSON.stringify(inbox), now)).toEqual(inbox);
  });

  it("falls back to a fresh inbox for missing, broken or foreign data", () => {
    const fresh = initialInbox(now);
    expect(parseSaved(null, now)).toEqual(fresh);
    expect(parseSaved("{not json", now)).toEqual(fresh);
    expect(parseSaved('"a string"', now)).toEqual(fresh);
    expect(parseSaved(JSON.stringify({ custom: "nope", states: {} }), now)).toEqual(fresh);
  });

  it("drops malformed tickets and states for unknown ids", () => {
    const saved = { custom: [custom, { id: 4 }], states: { ghost: { triage: null }, [custom.id]: { triage } }, introDismissed: true };
    const inbox = parseSaved(JSON.stringify(saved), now);
    expect(inbox.custom).toEqual([custom]);
    expect(inbox.states.ghost).toBeUndefined();
    expect(stateOf(inbox, custom.id)).toEqual({ triage, source: null, draft: null, sent: null });
    expect(inbox.introDismissed).toBe(true);
  });

  it("uses a versioned key", () => {
    expect(STORAGE_KEY).toMatch(/:v\d+$/);
  });
});

describe("the list", () => {
  it("puts untriaged tickets first, then open ones by priority, then replied ones", () => {
    const inbox = inboxReducer(initialInbox(now), { type: "add", ticket: custom });
    const items = listItems(inbox, now);
    expect(items[0].ticket.id).toBe(custom.id);
    expect(items[0].age).toBe(3);
    const open = items.slice(1).filter((i) => !i.state.sent);
    const ranks = open.map((i) => ["urgent", "high", "normal", "low"].indexOf(i.state.triage!.priority));
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
    const firstReplied = items.findIndex((i) => i.state.sent);
    expect(items.slice(firstReplied).every((i) => i.state.sent)).toBe(true);
  });

  it("filters open and replied", () => {
    const items = listItems(initialInbox(now), now);
    expect(filterItems(items, "all")).toHaveLength(items.length);
    expect(filterItems(items, "open").length + filterItems(items, "replied").length).toBe(items.length);
    expect(filterItems(items, "replied").every((i) => i.state.sent)).toBe(true);
  });

  it("labels ages in plain words", () => {
    expect(agoLabel(0)).toBe("Just now");
    expect(agoLabel(12)).toBe("12 min ago");
    expect(agoLabel(180)).toBe("3 h ago");
    expect(agoLabel(1500)).toBe("Yesterday");
    expect(agoLabel(2880)).toBe("2 days ago");
  });

  it("makes short unique ids", () => {
    expect(newTicketId(now, () => 0)).toMatch(/^c-[0-9a-z]+$/);
    expect(newTicketId(now, () => 0)).not.toBe(newTicketId(now, () => 0.5));
  });
});
