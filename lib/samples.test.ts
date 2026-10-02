import { describe, expect, it } from "vitest";
import { CATEGORIES, PRIORITIES } from "@/lib/contracts";
import { clauseById } from "@/lib/policy";
import { SAMPLES, sampleState } from "@/lib/samples";
import { firstName } from "@/lib/triage";

describe("sample inbox", () => {
  it("has a dozen tickets with unique ids", () => {
    const ids = SAMPLES.map((s) => s.ticket.id);
    expect(ids.length).toBeGreaterThanOrEqual(10);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(SAMPLES.map((s) => [s.ticket.id, s] as const))("%s: a complete, policy-grounded triage", (_id, s) => {
    const { ticket, triage } = s;
    expect(CATEGORIES).toContain(triage.category);
    expect(PRIORITIES).toContain(triage.priority);
    expect(triage.citations.length).toBeGreaterThanOrEqual(1);
    expect(triage.citations.length).toBeLessThanOrEqual(3);
    for (const c of triage.citations) expect(clauseById(c.clauseId), c.clauseId).toBeDefined();
    expect(triage.reply.body.startsWith(`Hi ${firstName(ticket.customerName)},`)).toBe(true);
    expect(triage.reply.body.trim().endsWith("Larkspur Air Support")).toBe(true);
    if (ticket.bookingRef) expect(triage.reply.body).toContain(ticket.bookingRef);
    const words = triage.reply.body.split(/\s+/).length;
    expect(words).toBeGreaterThan(50);
    expect(words).toBeLessThan(190);
  });

  it("holds no email addresses or links (the old hackathon data had a real one)", () => {
    const text = JSON.stringify(SAMPLES);
    expect(text).not.toMatch(/@|https?:\/\//);
  });

  it("covers the main kinds of request and every priority", () => {
    const categories = new Set(SAMPLES.map((s) => s.triage.category));
    expect(categories.size).toBeGreaterThanOrEqual(9);
    expect(new Set(SAMPLES.map((s) => s.triage.priority))).toEqual(new Set(PRIORITIES));
  });

  it("marks the pre-answered samples as sent, relative to now", () => {
    const now = new Date("2026-10-02T12:00:00Z");
    const answered = SAMPLES.find((s) => s.sentAtMinutesAgo !== undefined)!;
    const state = sampleState(answered, now);
    expect(state.source).toBe("sample");
    expect(state.sent?.body).toBe(answered.triage.reply.body);
    expect(Date.parse(state.sent!.at)).toBe(now.getTime() - answered.sentAtMinutesAgo! * 60_000);
    expect(sampleState(SAMPLES[0], now).sent).toBeNull();
  });
});
