// Finds the policy rules that match a ticket: BM25 keyword scoring over the clauses. No
// embeddings and no vector database; the policy is ~40 short clauses, and keyword matching with
// a few airline synonyms finds the right ones (lib/retrieval.test.ts pins the sample tickets).
import type { Clause } from "@/lib/contracts";
import { POLICY } from "@/lib/policy";

const STOPWORDS = new Set(
  ("a an and are as at be been but by can could did do does for from had has have hi hello i if in into is it its " +
    "just me my myself no not of on or our please so than that the their them then there these they this to too " +
    "us was we were what when where which who will with would you your yours dear thanks thank regards am im " +
    "get got also any all very still now one two today tomorrow yesterday").split(" "),
);

/** Words customers use → the words the policy uses. Both sides are stemmed when the map is built. */
const SYNONYMS: Record<string, string[]> = {
  luggage: ["bag", "baggage"],
  suitcase: ["bag", "baggage"],
  bag: ["baggage"],
  baggage: ["bag"],
  cancel: ["cancellation"],
  cancelled: ["cancel", "cancellation"],
  cancellation: ["cancel"],
  late: ["delay"],
  delay: ["late"],
  money: ["refund"],
  refund: ["money"],
  wheelchair: ["mobility", "assistance"],
  cat: ["pet"],
  dog: ["pet"],
  pet: ["animal"],
  app: ["website", "online"],
  website: ["app", "online"],
  crash: ["outage", "problem"],
  error: ["outage", "problem"],
  hotel: ["overnight"],
  overnight: ["hotel"],
  rude: ["complaint", "staff", "behaviour"],
  upgrade: ["miles"],
  points: ["miles"],
  connecting: ["connection"],
  connection: ["connecting"],
  misspelled: ["spelling", "name", "correction"],
  typo: ["spelling", "name", "correction"],
  storm: ["weather"],
  snow: ["weather"],
  fog: ["weather"],
  sick: ["illness", "medical"],
  hospital: ["medical", "illness"],
  surgery: ["medical"],
  broken: ["damage"],
  damaged: ["damage"],
  overweight: ["weight"],
  heavy: ["weight"],
  arrive: ["missing", "delayed"],
  arrived: ["missing", "delayed"],
  clothes: ["essentials"],
  wear: ["clothes", "essentials"],
  paid: ["reimburse"],
  mistake: ["24-hour", "cancellation"],
  phone: ["profile"],
  email: ["profile"],
};

/** Strips common English endings so "bags", "bagged" and "bag" meet. Crude on purpose. */
export function stem(word: string): string {
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith("ed")) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith("es") && !word.endsWith("ses")) return word.slice(0, -1);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

const SYNONYM_MAP = new Map(Object.entries(SYNONYMS).map(([word, alts]) => [stem(word), alts.map(stem)]));

/** Lowercase words, stopwords dropped, stemmed. Numbers stay (they matter: "21 days", "3 hours"). */
export function tokenize(text: string): string[] {
  return (text.toLowerCase().normalize("NFKD").match(/[a-z0-9]+/g) ?? [])
    .filter((w) => !STOPWORDS.has(w) && (w.length > 1 || /\d/.test(w)))
    .map(stem);
}

/** Query terms plus their synonyms (stemmed the same way as the clauses). */
export function expandQuery(text: string): string[] {
  const terms = tokenize(text);
  const out: string[] = [];
  for (const t of terms) {
    out.push(t);
    for (const s of SYNONYM_MAP.get(t) ?? []) out.push(s);
  }
  return out;
}

// BM25 defaults from the literature: k1 controls term-frequency saturation, b length normalisation.
const K1 = 1.2;
const B = 0.75;

export interface ScoredClause {
  clause: Clause;
  score: number;
}

export function buildIndex(clauses: Clause[]) {
  // The title counts twice: "Pets in the cabin" says more than any sentence under it.
  const docs = clauses.map((c) => tokenize(`${c.title} ${c.title} ${c.section} ${c.text}`));
  const avgLen = docs.reduce((n, d) => n + d.length, 0) / Math.max(1, docs.length);
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1);
  const tfs = docs.map((d) => {
    const tf = new Map<string, number>();
    for (const t of d) tf.set(t, (tf.get(t) ?? 0) + 1);
    return tf;
  });
  const idf = (t: string) => {
    const n = df.get(t) ?? 0;
    return Math.log(1 + (clauses.length - n + 0.5) / (n + 0.5));
  };

  return function search(query: string, k = 5): ScoredClause[] {
    const terms = expandQuery(query);
    if (!terms.length) return [];
    const weights = new Map<string, number>();
    for (const t of terms) weights.set(t, (weights.get(t) ?? 0) + 1);
    const scored = clauses.map((clause, i) => {
      let score = 0;
      for (const [t, qf] of weights) {
        const f = tfs[i].get(t);
        if (!f) continue;
        // A word repeated in the question counts a little more, never linearly.
        score += idf(t) * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * docs[i].length) / avgLen))) * (1 + Math.log(qf));
      }
      return { clause, score };
    });
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score || a.clause.id.localeCompare(b.clause.id, undefined, { numeric: true }))
      .slice(0, k);
  };
}

const searchPolicy = buildIndex(POLICY.clauses);

/** The `k` policy clauses that best match a ticket's subject and message. */
export function retrieveClauses(subject: string, body: string, k = 5): ScoredClause[] {
  // The subject is the customer's own summary, so it counts twice.
  return searchPolicy(`${subject} ${subject} ${body}`, k);
}
