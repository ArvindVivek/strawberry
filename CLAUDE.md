# Strawberry: operating manual

**What:** a support inbox for a made-up airline (Larkspur Air). Each ticket gets a triage
(category, priority, the policy clauses that apply with their text, a drafted reply to edit and
send). First built at the Open Source AI Hackathon #16 (April 2025, Python + LlamaIndex + n8n);
rebuilt from scratch on 2026-10-02 as one Next.js app.

- **Platform:** web (Next.js 16.3.6, React 19, Tailwind v4, KL Web 1.0.3). Folder and repo:
  `Kitchen Labs/strawberry`, `ArvindVivek/strawberry`. Vercel project `strawberry`
  (`prj_1rrzituxN6dqmjjmL1ETsCnicnmC`, scope `arvindviveks-projects`), production
  https://strawberry-pied.vercel.app, deployed by pushing `main`.
- **Accounts:** none. **Database:** none; the inbox lives in localStorage (`strawberry:inbox:v1`).
- **AI:** OpenAI `gpt-5.4-mini` via `lib/kl/ai.ts`, only from `POST /api/triage`, only when
  someone presses **Triage with AI** on a ticket they wrote. Samples never call it.
- **Brand:** key `strawberry`, accent `#A3195B` (deep berry), palette in
  `kitchenlabs-kit/brand/strawberry/palette.json`. Icon source `assets/icon-source.svg`.

## Architecture

| Path | What |
|---|---|
| `lib/contracts.ts` | Frozen shapes: `Ticket`, `TicketState`, `Triage`, `Citation`, `Clause`, `TriageRequest/Response/Notice`, the category and priority lists. Change here first |
| `content/policy.md` | The policy, the source of truth. `## N. Section`, `### N.M Title`, text under it |
| `lib/policy/parse.mjs`, `scripts/build-policy.mjs`, `lib/policy/policy.json` | Parser (plain JS so the script and tests share it) and the generated clauses. **Run `npm run policy` after editing the markdown**; `lib/policy/policy.test.ts` fails otherwise |
| `lib/retrieval.ts` | BM25 over clauses (title counted twice, subject counted twice), stemming, a synonym map (both sides stemmed at build). No embeddings, no vector store |
| `lib/triage.ts` | Input rules (zod), strict JSON schema (clause ids are an enum of the 5 retrieved), system prompt, `cleanTriage` (drops unknown/duplicate citations, caps 3, safe enum fallbacks, empty reply throws), and `rulesTriage` (keyword category/priority + reply template, runs on server and in the browser) |
| `app/api/triage/route.ts` | validate → rate limit (5/min and 20/day per IP, in memory) → retrieve → `generateJSON` → `cleanTriage`; any failure answers 200 with `source: "rules"` and a `notice` (`paused`, `not_configured`, `busy`, `unavailable`, `failed`) |
| `lib/samples.ts` | 12 sample tickets with hand-written triage and replies; 3 start as sent |
| `lib/inbox.ts` | Pure reducer for the inbox, `parseSaved` (any broken save → fresh inbox), list order (untriaged, then open by priority and age, then replied) |
| `lib/inbox-store.ts` | Browser store via `useSyncExternalStore` (server snapshot = sample inbox, no hydration mismatch), hash selection, minute tick |
| `components/inbox/*` | The screen: `InboxApp` (shell), `TicketList`, `TicketDetail` (grid ≥1024px, tabs below), `TriagePanel`, `ReplyPanel`, `NewTicketDialog`, `AppChrome` (header, one-line footer) |
| `app/policy/page.tsx` | The full policy, anchored `#clause-N.M`; triage clause titles link here |

## Commands

```bash
npm run dev                 # :3194
npm run gate                # kit:check, typecheck, lint, vitest, build, leak-check
"/Users/arvind/Documents/Kitchen Labs/kitchenlabs-kit/scripts/kl-slot.sh" npm run gate   # on the shared Mac
npm run build && npm run e2e
npm run policy              # regenerate lib/policy/policy.json
scripts/build-icons.sh      # apple-icon, 192/512, favicon.ico (16/32/48) from the SVGs
npm run screenshots         # kit capture tool → docs/marketing/web (AI answer stubbed)
```

## Money rules

- Tests never call OpenAI. Unit tests stub `fetch` (`app/api/triage/route.test.ts`);
  `playwright.config.ts` throws if `OPENAI_API_KEY` is set locally and starts the server with it
  empty; e2e stubs `/api/triage` in the browser for AI states.
- The one real check is `e2e/live-ai.spec.ts` (`E2E_LIVE_AI=1`, against production, 1 call,
  ~600 in / ~300 out tokens), listed in `kitchenlabs-kit/docs/operations/ai-live-checks.md`.
- No cron, nothing scheduled. Token use per call: system ~150 tokens, ticket ≤2,000 chars,
  5 clauses, `max_completion_tokens` 700, effort `none`.

## Gotchas (with root causes)

- **Next's route announcer is `role="alert"`**, so `getByRole("alert")` in e2e matches two
  elements once any of ours shows. Match the message text instead.
- **React 19 lint (`react-hooks/purity`) rejects `Date.now()` in render.** The clock is made once
  per change in `InboxApp` (`useMemo` keyed on the inbox and a minute tick) and passed down.
- **The panes, not the page, scroll.** Any new block in the shell needs `min-h-0` on its flex
  parent or the page grows past the viewport (the e2e "fits without scrolling" test catches it).
- **`vercel link` writes `.env.local` with a `VERCEL_OIDC_TOKEN`.** It was deleted; e2e refuses
  to run if an `OPENAI_API_KEY` ever lands there.
- **Old data:** the hackathon `server/data/*.json` held a real personal email and are still in git
  history (commit `ecd346f`, also in `server/ticket_index/docstore.json`). They were removed from
  the tree on 2026-10-02; history was not rewritten (owner's call).

## Status (2026-10-02)

- Gate: kit:check, typecheck, lint, vitest 156/156, build, leak-check all pass.
- E2E: 31 passed, 3 skipped (live AI ×2, phone-only test on desktop) across phone 430×932 and
  desktop 1280×800.
- Live: deployed; `OPENAI_API_KEY` set server-side (production, preview). The org OpenAI
  balance is empty, so a real **Triage with AI** currently returns the rules draft with the
  "paused" notice; run the live check after the owner tops up.

## History rewrite (2026-10-02, owner decision)
`server/data/*.json`, `server/ticket_index/docstore.json` (a real @berkeley.edu customer address) and
the n8n screenshot (`presentation/Screenshot 2025-04-19 at 4.50.48 PM.png`, a personal name and a
tunnel URL) were removed from ALL history with `git filter-repo`, then main and email_agent were
force-pushed. The current tree is byte-identical (same tree hash). Every commit hash changed: re-clone,
don't pull. GitHub still serves the old commits by direct hash until its own cleanup; only GitHub
Support can purge them sooner. A pre-rewrite bundle was kept outside the repo, in the lead's scratchpad.
