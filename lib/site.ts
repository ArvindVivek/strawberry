// The app's identity in one place. The icon, share card, manifest, robots and sitemap
// templates all read it. This file is yours: the sync script copies it once (--init) and never
// overwrites it.

export const site = {
  /** Shown in the header, the tab title and the share card. */
  name: "Strawberry",
  /** Home-screen label: 12 characters or fewer. */
  shortName: "Strawberry",
  /** One plain sentence: what it does and for whom. */
  description:
    "An airline support inbox that sorts each customer email, finds the policy rules that apply and drafts a reply you can edit.",
  /** Production URL, no trailing slash. Makes share-image URLs absolute. */
  url: "https://strawberry-kitchenlabs.vercel.app",
  /** Brand key: privacy and support links live at kitchenlabs-one.vercel.app/apps/<slug>/. */
  slug: "strawberry",
  /** false for private, single-owner tools: robots.ts then disallows everything. */
  isPublic: true,
  /** Must equal --bg in kl-tokens.css (light, dark) so browser chrome never flashes. */
  themeColor: { light: "#F2F4F9", dark: "#0B0F1A" },
  /** Share-card colours (Satori can't read CSS variables): the app's accent and neutrals. */
  card: { bg: "#F2F4F9", ink: "#121829", ink2: "#5A6479", accent: "#A3195B" },
} as const;
