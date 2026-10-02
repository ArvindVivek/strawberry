import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { POLICY, clauseById, policySections } from "@/lib/policy";
import { parsePolicy } from "./parse.mjs";

const markdown = readFileSync(fileURLToPath(new URL("../../content/policy.md", import.meta.url)), "utf8");

describe("policy", () => {
  it("policy.json matches content/policy.md (run `npm run policy` after editing the policy)", () => {
    expect(POLICY).toEqual(parsePolicy(markdown));
  });

  it("has unique, numbered clauses, each with a title and text", () => {
    const ids = POLICY.clauses.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(30);
    for (const c of POLICY.clauses) {
      expect(c.id).toMatch(/^\d+\.\d+$/);
      expect(c.title.length).toBeGreaterThan(3);
      expect(c.text.length).toBeGreaterThan(40);
      expect(c.section.length).toBeGreaterThan(3);
    }
  });

  it("never names a real carrier", () => {
    expect(markdown).not.toMatch(/\b(american|delta|united|southwest|alaska|jetblue|lufthansa|emirates|ryanair)\b/i);
    expect(POLICY.intro).toMatch(/made-up airline/);
  });

  it("looks clauses up by id and groups them into sections in order", () => {
    expect(clauseById("3.1")?.title).toBe("Rebooking after a cancellation");
    expect(clauseById("99.9")).toBeUndefined();
    const sections = policySections();
    expect(sections.map((s) => s.number)).toEqual(sections.map((_, i) => String(i + 1)));
    expect(sections.flatMap((s) => s.clauses)).toEqual(POLICY.clauses);
  });
});

describe("parsePolicy", () => {
  it("splits sections and clauses and joins wrapped lines", () => {
    const parsed = parsePolicy("# T\n\nIntro line.\n\n## 1. Bags\n\n### 1.1 One\nFirst line\nsecond line.\n\n### 1.2 Two\nText two.\n");
    expect(parsed).toEqual({
      title: "T",
      intro: "Intro line.",
      clauses: [
        { id: "1.1", section: "Bags", title: "One", text: "First line second line." },
        { id: "1.2", section: "Bags", title: "Two", text: "Text two." },
      ],
    });
  });
});
