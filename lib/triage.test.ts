import { describe, expect, it } from "vitest";
import { vi } from "vitest";
vi.mock("server-only", () => ({}));
import { strictSchemaProblems } from "@/lib/kl/ai";
import { CATEGORIES, PRIORITIES } from "@/lib/contracts";
import { retrieveClauses } from "@/lib/retrieval";
import {
  BODY_MAX,
  TRIAGE_SYSTEM,
  cleanTriage,
  firstName,
  guessCategory,
  guessPriority,
  rulesTriage,
  triageInput,
  triagePrompt,
  triageSchema,
  type ModelTriage,
} from "@/lib/triage";

const good: ModelTriage = {
  category: "baggage",
  priority: "high",
  summary: "  Bag   missing. ",
  priority_reason: "A lost bag.",
  citations: [
    { clause_id: "2.1", why: "Report it." },
    { clause_id: "2.2", why: "Essentials." },
  ],
  reply_subject: "Re: bag",
  reply_body: "Hi Sam,\r\n\r\n\r\n\r\nWe're on it.\n\nLarkspur Air Support",
};

describe("triageSchema", () => {
  it("keeps OpenAI's strict-mode contract", () => {
    expect(strictSchemaProblems(triageSchema(["2.1", "2.2"]).schema)).toEqual([]);
  });

  it("only lets the model cite the clauses it was sent, and pick from the closed lists", () => {
    const schema = triageSchema(["2.1", "2.2"]).schema as {
      properties: Record<string, { enum?: string[]; items?: { properties: { clause_id: { enum: string[] } } } }>;
    };
    expect(schema.properties.citations.items!.properties.clause_id.enum).toEqual(["2.1", "2.2"]);
    expect(schema.properties.category.enum).toEqual([...CATEGORIES]);
    expect(schema.properties.priority.enum).toEqual([...PRIORITIES]);
  });
});

describe("cleanTriage (parsing the model's answer)", () => {
  it("maps snake_case to the app's shape and tidies whitespace", () => {
    const t = cleanTriage(good, ["2.1", "2.2"]);
    expect(t).toEqual({
      category: "baggage",
      priority: "high",
      summary: "Bag missing.",
      priorityReason: "A lost bag.",
      citations: [
        { clauseId: "2.1", why: "Report it." },
        { clauseId: "2.2", why: "Essentials." },
      ],
      reply: { subject: "Re: bag", body: "Hi Sam,\n\nWe're on it.\n\nLarkspur Air Support" },
    });
  });

  it("drops citations that weren't sent, repeat, or don't exist, and keeps at most 3", () => {
    const t = cleanTriage(
      {
        ...good,
        citations: [
          { clause_id: "9.9", why: "made up" },
          { clause_id: "2.1", why: "a" },
          { clause_id: "2.1", why: "again" },
          { clause_id: "2.2", why: "b" },
          { clause_id: "2.3", why: "c" },
          { clause_id: "2.4", why: "d" },
          { clause_id: "3.1", why: "not sent" },
        ],
      },
      ["2.1", "2.2", "2.3", "2.4", "9.9"],
    );
    expect(t.citations.map((c) => c.clauseId)).toEqual(["2.1", "2.2", "2.3"]);
  });

  it("falls back to safe values for anything outside the closed lists", () => {
    const t = cleanTriage({ ...good, category: "spaceship", priority: "whenever", reply_subject: " " }, ["2.1"]);
    expect(t.category).toBe("other");
    expect(t.priority).toBe("normal");
    expect(t.reply.subject).toBe("Your Larkspur Air request");
  });

  it("rejects an empty reply, so the route answers with the rules instead", () => {
    expect(() => cleanTriage({ ...good, reply_body: "  \n " }, ["2.1"])).toThrow();
  });
});

describe("triageInput", () => {
  const ok = { customerName: "Sam Lee", subject: "Lost bag", body: "My bag did not arrive in Denver last night." };

  it("accepts a normal ticket and trims it", () => {
    expect(triageInput.parse({ ...ok, customerName: "  Sam Lee " }).customerName).toBe("Sam Lee");
  });

  it("rejects empty, tiny and oversized fields with a plain message", () => {
    expect(triageInput.safeParse({ ...ok, customerName: "" }).error?.issues[0].message).toBe("Add the customer's name.");
    expect(triageInput.safeParse({ ...ok, body: "help" }).success).toBe(false);
    expect(triageInput.safeParse({ ...ok, body: "x".repeat(BODY_MAX + 1) }).success).toBe(false);
    expect(triageInput.safeParse(null).success).toBe(false);
  });
});

describe("the prompt", () => {
  it("sends the ticket and only the candidate rules, compactly", () => {
    const clauses = retrieveClauses("Lost bag", "My bag did not arrive", 2).map((m) => m.clause);
    const prompt = triagePrompt({ customerName: "Sam", subject: "Lost bag", body: "My bag did not arrive" }, clauses);
    expect(prompt).toContain("Customer: Sam");
    expect(prompt).toContain(`[${clauses[0].id}] ${clauses[0].title}:`);
    expect(prompt.split("\n").filter((l) => l.startsWith("[")).length).toBe(2);
    expect(TRIAGE_SYSTEM.length).toBeLessThan(900); // stays small and cacheable
  });
});

describe("built-in rules (no AI)", () => {
  it("guesses the category from the strongest words", () => {
    expect(guessCategory("My cat needs to fly in the cabin")).toBe("pets");
    expect(guessCategory("The agent was rude and it was embarrassing, she said read the website")).toBe("complaint");
    expect(guessCategory("The app crashed at check-in")).toBe("app_issue");
    expect(guessCategory("Booked the wrong date by mistake, can I cancel?")).toBe("booking_change");
    expect(guessCategory("Hello there")).toBe("other");
  });

  it("guesses priority from time words", () => {
    expect(guessPriority("My flight leaves in 2 hours")).toBe("urgent");
    expect(guessPriority("I'm stranded at the airport")).toBe("urgent");
    expect(guessPriority("I fly next Tuesday")).toBe("high");
    expect(guessPriority("My suitcase never arrived")).toBe("high");
    expect(guessPriority("I'm wondering how miles work")).toBe("low");
    expect(guessPriority("Please fix my seat")).toBe("normal");
  });

  it("drafts a complete triage citing rules from the matching section", () => {
    const input = { customerName: "Noah Fischer", subject: "Suitcase arrived with a broken wheel", body: "My suitcase came off the belt damaged. Can you repair it?" };
    const t = rulesTriage(input, retrieveClauses(input.subject, input.body));
    expect(t.category).toBe("baggage");
    expect(t.citations.length).toBeGreaterThan(0);
    expect(t.citations.every((c) => /^[12]\./.test(c.clauseId))).toBe(true);
    expect(t.reply.body.startsWith("Hi Noah,")).toBe(true);
    expect(t.reply.body).toContain("Larkspur Air Support");
    expect(t.reply.subject).toBe("Re: Suitcase arrived with a broken wheel");
  });

  it("still drafts a reply when no rule matches", () => {
    const t = rulesTriage({ customerName: "A B", subject: "Hello", body: "Just saying hello to everyone there." }, []);
    expect(t.category).toBe("other");
    expect(t.citations).toEqual([]);
    expect(t.reply.body).not.toContain("policy says");
  });

  it("uses the first name in greetings", () => {
    expect(firstName("  Priya  Raman ")).toBe("Priya");
    expect(firstName("")).toBe("there");
  });
});
