# Strawberry design

KL Web 1.0.3 with one accent. Light and dark both ship.

## Colour roles

| Colour | Token | Means |
|---|---|---|
| Deep berry `#A3195B` (dark-mode text `#E5599C`) | `--accent*` | Strawberry's own actions and selection: the primary button, the selected ticket, clause numbers, the intro note |
| Danger tint | `--danger-soft` / `--danger-text` | Urgent priority only |
| Warning tint | `--warning-soft` / `--warning-text` | High priority, and the AI notice (paused, busy, off) |
| Success tint | `--success-soft` / `--success-text` | A reply was sent |
| Neutral `surface-2` / `ink-2` | | Normal and low priority, categories, quoted policy text |
| Leaf green `#A8E8B2` | icon only | The strawberry's crown; never a UI colour |

Every text pair is measured in `lib/tokens.test.ts` (4.5:1 or better in both themes); the
palette table is in `kitchenlabs-kit/brand/strawberry/palette-notes.md`.

## Layout

- The inbox is an app shell one viewport tall (`h-dvh`); panes scroll inside themselves, the page
  never does (pinned by e2e at 1280×800, 1440×900 and 430×932).
- From 1024px: list (19rem) | message over reply | triage. 768 to 1023px: list | ticket with tabs.
  Under 768px: the list, then the ticket with **Message / Triage / Reply** tabs; the URL hash holds
  the open ticket so Back returns to the list.
- Footer is one line: "© 2026 Kitchen Labs", the hackathon credit (from 768px), Privacy, Support,
  Contact.

## Type

Fredoka for the name, panel titles and buttons; Nunito for everything else. Reading text is 15px
in panes, 13px only for captions; nothing smaller.

## Motion

| What | Motion |
|---|---|
| Buttons | KL press: 2px into the edge, 75 ms |
| Chips | scale 0.97 on press |
| Loading triage | skeleton pulse and a pulsing sparkle icon |
| Toasts | KL toast enter and leave |

Everything follows Reduce Motion through `KLProviders`.
