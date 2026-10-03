import { expect, test, type Page } from "@playwright/test";

// The whole app on the production build, with OpenAI never reached: the server runs without a
// key (playwright.config.ts refuses otherwise), and the AI states are stubbed in the browser.

/** Fails the test on any console error or uncaught page error. */
function watchConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));
  return errors;
}

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1280) < 768;

/** Opens a ticket from the list (on a phone that also switches to the ticket view). */
async function openTicket(page: Page, name: string) {
  await page.getByRole("region", { name: "Inbox" }).getByRole("button", { name: new RegExp(name) }).click();
  await expect(page.getByRole("article", { name: `Ticket from ${name}` })).toBeVisible();
}

/** On a phone, one panel shows at a time: pick its tab. On desktop everything is on screen. */
async function showPanel(page: Page, tab: "Message" | "Triage" | "Reply") {
  if (isPhone(page)) await page.getByRole("tab", { name: tab }).click();
}

const AI_TRIAGE = {
  source: "ai",
  triage: {
    category: "baggage",
    priority: "high",
    summary: "Noah's suitcase arrived with a broken wheel and a cracked shell.",
    priorityReason: "Damage must be reported within 7 days.",
    citations: [{ clauseId: "2.5", why: "Damaged bags are repaired or replaced when reported within 7 days with photos." }],
    reply: {
      subject: "Re: Suitcase arrived with a broken wheel",
      body: "Hi Noah,\n\nI'm sorry your suitcase was damaged. Please send the photos and we'll repair it or pay a fair replacement value.\n\nLarkspur Air Support",
    },
  },
};

async function addExampleTicket(page: Page) {
  await page.getByRole("button", { name: "New ticket" }).click();
  const dialog = page.getByRole("dialog", { name: "New ticket" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Fill in an example" }).click();
  await dialog.getByRole("button", { name: "Add to inbox" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("article", { name: "Ticket from Noah Fischer" })).toBeVisible();
}

// Every test gets a fresh browser context, so each one starts from the sample inbox.

test("the inbox loads with the sample tickets, the studio footer and no console errors", async ({ page }) => {
  const errors = watchConsole(page);
  await page.goto("/");
  await expect(page).toHaveTitle("Strawberry: AI support inbox for an airline");
  const inbox = page.getByRole("region", { name: "Inbox" });
  await expect(inbox.getByRole("button", { name: /Priya Raman/ })).toBeVisible();
  await expect(inbox.getByRole("button", { name: /^All 12$/ })).toBeVisible();
  await expect(page.getByText("© 2026 Kitchen Labs")).toBeVisible();
  await expect(page.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "https://kitchenlabs-one.vercel.app/apps/strawberry/privacy");
  await expect(page.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "https://kitchenlabs-one.vercel.app/contact");
  // No email address anywhere on the page (studio rule; the old data held a real one).
  expect(await page.locator("body").innerText()).not.toMatch(/[\w.+-]+@[\w-]+\.\w+/);
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("the main screen fits without scrolling: list, message, triage and reply on a laptop; list then ticket on a phone", async ({ page }) => {
  await page.goto("/");
  const fits = () =>
    page.evaluate(() => ({
      vertical: document.documentElement.scrollHeight <= window.innerHeight,
      horizontal: document.documentElement.scrollWidth <= window.innerWidth,
    }));
  expect(await fits()).toEqual({ vertical: true, horizontal: true });

  if (isPhone(page)) {
    await expect(page.getByRole("region", { name: "Inbox" })).toBeInViewport();
    await openTicket(page, "Priya Raman");
    expect(await fits()).toEqual({ vertical: true, horizontal: true });
    await expect(page.getByRole("tab", { name: "Message" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { name: /Flight cancelled/ })).toBeInViewport();
    return;
  }

  for (const size of [
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(size);
    expect(await fits(), `${size.width}x${size.height}`).toEqual({ vertical: true, horizontal: true });
    await expect(page.getByRole("region", { name: "Inbox" })).toBeInViewport();
    await expect(page.getByRole("heading", { name: /Flight cancelled/ })).toBeInViewport();
    await expect(page.getByRole("heading", { name: "Triage" })).toBeInViewport();
    await expect(page.getByText("Rebooking after a cancellation")).toBeInViewport();
    await expect(page.getByRole("button", { name: "Send reply" })).toBeInViewport({ ratio: 1 });
  }
});

test("each sample shows its triage with the cited policy text", async ({ page }) => {
  await page.goto("/");
  await openTicket(page, "Marcus Bell");
  await showPanel(page, "Triage");
  const triage = page.getByRole("tabpanel").filter({ has: page.getByRole("heading", { name: "Triage" }) });
  await expect(triage.getByTestId("triage-labels")).toContainText("High");
  await expect(triage.getByTestId("triage-labels")).toContainText("Baggage");
  await expect(triage.getByText("Reporting a missing bag")).toBeVisible();
  await expect(triage.getByText(/within 24 hours of landing\. The report gives them a file number/)).toBeVisible();
  await expect(triage.getByText("Written ahead of time for this sample ticket.")).toBeVisible();

  // The clause number links to the policy page, anchored at that clause.
  await triage.getByRole("link", { name: "2.1 Reporting a missing bag" }).click();
  await expect(page).toHaveURL(/\/policy#clause-2\.1$/);
  await expect(page.getByRole("heading", { name: "Larkspur Air customer service policy" })).toBeVisible();
  await expect(page.locator("#clause-2\\.1")).toBeInViewport();
});

test("edit, undo, send and reopen a reply; it survives a reload", async ({ page }) => {
  await page.goto("/");
  await openTicket(page, "Sam Whitfield");
  await showPanel(page, "Reply");
  const body = page.getByRole("textbox", { name: "Reply to Sam Whitfield" });
  await expect(body).toHaveValue(/^Hi Sam,/);

  await body.fill("Hi Sam,\n\nBiscuit is welcome on board.\n\nLarkspur Air Support");
  await page.getByRole("button", { name: "Undo my edits" }).click();
  await expect(body).toHaveValue(/Biscuit can fly with you in the cabin/);

  await body.fill("Hi Sam,\n\nBiscuit is welcome on board.\n\nLarkspur Air Support");
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(page.getByText("Reply to Sam marked as sent.")).toBeVisible();
  await expect(page.getByText(/^Sent just now$/)).toBeVisible();
  await expect(page.getByText("Biscuit is welcome on board.")).toBeVisible();

  await page.reload();
  await showPanel(page, "Reply");
  await expect(page.getByText("Biscuit is welcome on board.")).toBeVisible();
  if (isPhone(page)) await page.getByRole("button", { name: "Inbox", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Replied 4$/ })).toBeVisible();

  if (isPhone(page)) await openTicket(page, "Sam Whitfield");
  await showPanel(page, "Reply");
  await page.getByRole("button", { name: "Edit and send again" }).click();
  await expect(page.getByRole("textbox", { name: "Reply to Sam Whitfield" })).toHaveValue(/Biscuit is welcome on board/);
});

test("filters show open and replied tickets", async ({ page }) => {
  await page.goto("/");
  const inbox = page.getByRole("region", { name: "Inbox" });
  await inbox.getByRole("button", { name: /^Replied 3$/ }).click();
  await expect(inbox.getByRole("button", { name: /Grace Liu/ })).toBeVisible();
  await expect(inbox.getByRole("button", { name: /Priya Raman/ })).toHaveCount(0);
  await inbox.getByRole("button", { name: /^Open 9$/ }).click();
  await expect(inbox.getByRole("button", { name: /Priya Raman/ })).toBeVisible();
  await expect(inbox.getByRole("button", { name: /Grace Liu/ })).toHaveCount(0);
});

test("a new ticket checks its fields, then drafts without AI entirely in the browser", async ({ page }) => {
  const triageCalls: string[] = [];
  page.on("request", (req) => req.url().includes("/api/triage") && triageCalls.push(req.url()));
  await page.goto("/");

  await page.getByRole("button", { name: "New ticket" }).click();
  const dialog = page.getByRole("dialog", { name: "New ticket" });
  await dialog.getByRole("button", { name: "Add to inbox" }).click();
  await expect(dialog.getByText("Add the customer's name.")).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();

  await addExampleTicket(page);
  // On a phone the list is behind the ticket; the label shows there once you go back.
  if (!isPhone(page)) await expect(page.getByRole("region", { name: "Inbox" }).getByText("Needs triage")).toBeVisible();
  await showPanel(page, "Triage");
  await expect(page.getByText("This ticket hasn't been triaged yet.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Draft without AI" }).click();
  await expect(page.getByText("Drafted by Strawberry's built-in rules, without AI. Finish the reply by hand.")).toBeVisible();
  await expect(page.getByText("Damaged bags", { exact: true })).toBeVisible();
  await showPanel(page, "Reply");
  await expect(page.getByRole("textbox", { name: "Reply to Noah Fischer" })).toHaveValue(/^Hi Noah,/);
  expect(triageCalls).toEqual([]);
});

test("Triage with AI shows the model's draft (stubbed)", async ({ page }) => {
  await page.route("**/api/triage", (route) => route.fulfill({ json: AI_TRIAGE }));
  await page.goto("/");
  await addExampleTicket(page);
  await showPanel(page, "Triage");
  await expect(page.getByText(/sends this ticket's name, subject and message to an AI service\. Draft without AI stays in your browser\./)).toBeVisible();
  await page.getByRole("button", { name: "Triage with AI" }).click();
  await expect(page.getByText("Drafted by AI from the policy rules above. Check it before you send.")).toBeVisible();
  await expect(page.getByText("Noah's suitcase arrived with a broken wheel and a cracked shell.")).toBeVisible();
  await showPanel(page, "Reply");
  await expect(page.getByRole("textbox", { name: "Reply to Noah Fischer" })).toHaveValue(/send the photos/);
});

test("an empty OpenAI balance shows the paused state and a rules draft (stubbed)", async ({ page }) => {
  await page.route("**/api/triage", (route) =>
    route.fulfill({
      json: {
        ...AI_TRIAGE,
        source: "rules",
        notice: { code: "paused", message: "AI features are paused right now. Everything else still works." },
      },
    }),
  );
  await page.goto("/");
  await addExampleTicket(page);
  await showPanel(page, "Triage");
  await page.getByRole("button", { name: "Triage with AI" }).click();
  await expect(page.getByTestId("ai-paused")).toContainText("AI features are paused right now. Everything else still works.");
  await expect(page.getByRole("button", { name: "Try AI again" })).toBeVisible();
});

test("no page names the AI provider or model: inbox, triage panel before and after AI, policy", async ({ page }) => {
  // Owner rule: users only ever see "AI". page.content() includes the inline RSC payload too.
  const PROVIDER_NAME = /openai|gpt-/i;
  const expectClean = async () => {
    expect(await page.locator("body").innerText()).not.toMatch(PROVIDER_NAME);
    expect(await page.content()).not.toMatch(PROVIDER_NAME);
  };
  await page.route("**/api/triage", (route) => route.fulfill({ json: AI_TRIAGE }));
  await page.goto("/");
  await expect(page.getByText("Priya Raman").first()).toBeVisible();
  await expectClean();
  await addExampleTicket(page);
  await showPanel(page, "Triage");
  await expect(page.getByRole("button", { name: "Triage with AI" })).toBeVisible();
  await expectClean();
  await page.getByRole("button", { name: "Triage with AI" }).click();
  await expect(page.getByText("Drafted by AI from the policy rules above. Check it before you send.")).toBeVisible();
  await expectClean();
  await page.goto("/policy");
  await expect(page.getByText("Baggage allowance").first()).toBeVisible();
  await expectClean();
});

test("a rate-limited request shows a plain message and keeps the ticket", async ({ page }) => {
  await page.route("**/api/triage", (route) =>
    route.fulfill({ status: 429, json: { error: { code: "rate_limited", message: "That's a lot of tries in a row. Please wait 1 minute and try again." } } }),
  );
  await page.goto("/");
  await addExampleTicket(page);
  await showPanel(page, "Triage");
  await page.getByRole("button", { name: "Triage with AI" }).click();
  // (Next's route announcer is also role=alert, so match the message itself.)
  await expect(page.getByText("That's a lot of tries in a row. Please wait 1 minute and try again.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Draft without AI" })).toBeVisible();
});

test("a ticket you wrote can be deleted; samples can't", async ({ page }) => {
  await page.goto("/");
  await addExampleTicket(page);
  await page.getByRole("button", { name: "Delete this ticket" }).click();
  await expect(page.getByText("Ticket deleted.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Inbox" }).getByRole("button", { name: /Noah Fischer/ })).toHaveCount(0);
  await openTicket(page, "Priya Raman");
  await expect(page.getByRole("button", { name: "Delete this ticket" })).toHaveCount(0);
});

test("the real route answers with the rules and spends nothing (no key on this server)", async ({ request }) => {
  const res = await request.post("/api/triage", {
    data: { customerName: "Mei Chen", subject: "Stuck in Chicago tonight", body: "My flight was delayed by a broken part and the last connection has left. Where do we sleep?" },
  });
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.source).toBe("rules");
  expect(json.notice.code).toBe("not_configured");
  expect(json.triage.reply.body).toMatch(/^Hi Mei,/);

  const bad = await request.post("/api/triage", { data: { customerName: "", subject: "x", body: "y" } });
  expect(bad.status()).toBe(400);
});

test("phone: Back returns from a ticket to the list", async ({ page }) => {
  test.skip(!isPhone(page), "phone layout only");
  await page.goto("/");
  await openTicket(page, "Lucía Fernández");
  await expect(page.getByRole("region", { name: "Inbox" })).toBeHidden();
  await page.getByRole("button", { name: "Inbox", exact: true }).click();
  await expect(page.getByRole("region", { name: "Inbox" })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test("theme toggle switches light and dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(11, 15, 26)");
});

test("every visible button on the main screen is at least 44px tall", async ({ page }) => {
  await page.goto("/");
  const sizes = await page.locator("button:not([aria-pressed]):visible, a:visible").evaluateAll((els) =>
    els.map((el) => ({ label: el.textContent?.trim() || el.getAttribute("aria-label"), h: el.getBoundingClientRect().height })),
  );
  expect(sizes.length).toBeGreaterThan(5);
  for (const s of sizes) expect(s.h, `${s.label} is ${s.h}px tall`).toBeGreaterThanOrEqual(44);
});

test("policy, icons, share card, manifest, robots and sitemap are served", async ({ page, request }) => {
  for (const path of ["/policy", "/icon.svg", "/favicon.ico", "/apple-icon.png", "/opengraph-image", "/manifest.webmanifest", "/robots.txt", "/sitemap.xml"]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
  }
  const ico = await (await request.get("/favicon.ico")).body();
  expect(ico.readUInt16LE(4)).toBe(3); // 16, 32 and 48 px
  const errors = watchConsole(page);
  await page.goto("/policy");
  await expect(page.getByRole("heading", { level: 2, name: "8. Pets" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("a wrong link gets the themed 404", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
});
