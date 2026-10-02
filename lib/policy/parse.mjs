// Splits content/policy.md into clauses: "## 3. Section" starts a section, "### 3.2 Title"
// starts a clause, and the lines under it are the clause text. Plain JS so the build script
// (scripts/build-policy.mjs) and the TypeScript tests share one parser.

/**
 * @param {string} markdown
 * @returns {{ title: string, intro: string, clauses: import("../contracts").Clause[] }}
 */
export function parsePolicy(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let title = "";
  const intro = [];
  /** @type {import("../contracts").Clause[]} */
  const clauses = [];
  let section = "";
  /** @type {import("../contracts").Clause | null} */
  let current = null;
  const body = [];

  const flush = () => {
    if (current) clauses.push({ ...current, text: body.join(" ").replace(/\s+/g, " ").trim() });
    current = null;
    body.length = 0;
  };

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)$/);
    const h2 = line.match(/^##\s+\d+\.\s+(.+)$/);
    const h3 = line.match(/^###\s+(\d+\.\d+)\s+(.+)$/);
    if (h1) title = h1[1].trim();
    else if (h2) {
      flush();
      section = h2[1].trim();
    } else if (h3) {
      flush();
      current = { id: h3[1], section, title: h3[2].trim(), text: "" };
    } else if (current) body.push(line.trim());
    else if (!section && line.trim()) intro.push(line.trim());
  }
  flush();
  return { title, intro: intro.join(" "), clauses };
}
