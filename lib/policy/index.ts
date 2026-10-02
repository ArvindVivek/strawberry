// The Larkspur Air policy as data: generated from content/policy.md by `npm run policy`.
import type { Clause } from "@/lib/contracts";
import data from "./policy.json";

export const POLICY: { title: string; intro: string; clauses: Clause[] } = data;

const BY_ID = new Map(POLICY.clauses.map((c) => [c.id, c]));

export function clauseById(id: string): Clause | undefined {
  return BY_ID.get(id);
}

/** Sections in policy order, each with its clauses (the /policy page). */
export function policySections(): { title: string; number: string; clauses: Clause[] }[] {
  const sections: { title: string; number: string; clauses: Clause[] }[] = [];
  for (const clause of POLICY.clauses) {
    const number = clause.id.split(".")[0];
    let section = sections.at(-1);
    if (!section || section.number !== number) {
      section = { title: clause.section, number, clauses: [] };
      sections.push(section);
    }
    section.clauses.push(clause);
  }
  return sections;
}
