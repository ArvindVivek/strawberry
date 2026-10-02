import { expect, test } from "@playwright/test";

// The one real OpenAI call, run once at release against the deployed site
// (kitchenlabs-kit/docs/operations/ai-live-checks.md). Skipped unless E2E_LIVE_AI=1:
//   E2E_BASE_URL=https://<prod> E2E_LIVE_AI=1 npx playwright test e2e/live-ai.spec.ts --project=desktop
// Cost: one gpt-5.4-mini call, about 600 tokens in and 300 out.
test.skip(process.env.E2E_LIVE_AI !== "1", "real AI call: opt in with E2E_LIVE_AI=1");

test("Triage with AI answers from the model, grounded in the policy", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await page.getByRole("button", { name: "New ticket" }).click();
  const dialog = page.getByRole("dialog", { name: "New ticket" });
  await dialog.getByRole("button", { name: "Fill in an example" }).click();
  await dialog.getByRole("button", { name: "Add to inbox" }).click();

  const response = page.waitForResponse((res) => res.url().includes("/api/triage"));
  await page.getByRole("button", { name: "Triage with AI" }).click();
  const json = await (await response).json();
  expect(json.notice, JSON.stringify(json.notice)).toBeUndefined();
  expect(json.source).toBe("ai");
  expect(json.triage.citations.length).toBeGreaterThan(0);
  await expect(page.getByText("Drafted by AI from the policy rules below. Check it before you send.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Reply to Noah Fischer" })).toHaveValue(/^Hi Noah/);
});
