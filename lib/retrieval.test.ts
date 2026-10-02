import { describe, expect, it } from "vitest";
import { POLICY } from "@/lib/policy";
import { buildIndex, expandQuery, retrieveClauses, stem, tokenize } from "@/lib/retrieval";
import { SAMPLES } from "@/lib/samples";

const top = (subject: string, body = "", k = 5) => retrieveClauses(subject, body, k).map((m) => m.clause.id);

describe("tokenize", () => {
  it("lowercases, drops stopwords and short words, keeps numbers, and stems", () => {
    expect(tokenize("My BAGS were delayed for 3 hours!")).toEqual(["bag", "delay", "3", "hour"]);
  });

  it("stems plurals and endings so different forms meet", () => {
    expect(stem("bags")).toBe("bag");
    expect(stem("cancelled")).toBe(stem("cancelled"));
    expect(stem("checking")).toBe("check");
    expect(stem("class")).toBe("class");
  });

  it("adds airline synonyms for customer words", () => {
    expect(expandQuery("my luggage")).toEqual(expect.arrayContaining(["luggage", "bag", "baggage"]));
    expect(expandQuery("my cat")).toContain("pet");
  });
});

describe("retrieveClauses (BM25 over the policy)", () => {
  it("finds the obvious rule first for plain questions", () => {
    expect(top("Can my cat fly with me in the cabin?")[0]).toBe("8.1");
    expect(top("Can my dog fly with me in the cabin?").slice(0, 2)).toEqual(expect.arrayContaining(["8.1", "8.2"]));
    expect(top("Wheelchair at the airport")[0]).toBe("7.1");
    expect(top("My name is misspelled on the ticket")[0]).toBe("6.3");
    expect(top("Upgrade to business with miles")[0]).toBe("9.2");
    expect(top("The app crashed during online check-in")[0]).toBe("11.1");
  });

  it("puts the first rule each sample ticket cites in its top 5 (what the model would see)", () => {
    for (const s of SAMPLES) {
      expect(top(s.ticket.subject, s.ticket.body), s.ticket.id).toContain(s.triage.citations[0].clauseId);
    }
  });

  it("returns nothing for text with no policy words, and never more than k", () => {
    expect(retrieveClauses("hello", "thanks")).toEqual([]);
    expect(retrieveClauses("bag delay refund cancel hotel", "", 3)).toHaveLength(3);
  });

  it("scores in descending order", () => {
    const scores = retrieveClauses("lost bag after a delayed flight", "").map((m) => m.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it("works on any clause list (the index is built, not hard-coded)", () => {
    const search = buildIndex([POLICY.clauses[0], POLICY.clauses[1]]);
    expect(search("checked bag allowance")[0].clause.id).toBe("1.2");
  });
});
