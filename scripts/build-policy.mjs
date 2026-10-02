// Regenerates lib/policy/policy.json from content/policy.md. Run `npm run policy` after editing
// the policy; lib/policy/policy.test.ts fails the gate if the two drift apart.
import { readFileSync, writeFileSync } from "node:fs";
import { parsePolicy } from "../lib/policy/parse.mjs";

const policy = parsePolicy(readFileSync("content/policy.md", "utf8"));
writeFileSync("lib/policy/policy.json", JSON.stringify(policy, null, 2) + "\n");
console.log(`policy: ${policy.clauses.length} clauses written to lib/policy/policy.json`);
