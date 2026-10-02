import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

// Specs read the same env as the server (Overdraft's lesson: without this the test process
// sees empty values).
loadEnvConfig(process.cwd());

// Testing never spends money (web-release-standard). The local server must run without the
// OpenAI key, so "Triage with AI" answers with the built-in rules; specs stub /api/triage in
// the browser for the AI states. Only e2e/live-ai.spec.ts, with E2E_LIVE_AI=1 against the
// deployed site, makes a real call.
const LIVE = process.env.E2E_LIVE_AI === "1";
if (!LIVE && !process.env.E2E_BASE_URL && process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is set (e.g. in .env.local). Remove it before running e2e, so tests can't spend money.");
}

/** E2E runs against the production build (`npm run build` first). Own port: 3194. */
const PORT = process.env.E2E_PORT ?? "3194";
const BASE_URL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  // One worker: this Mac is shared, and a Next server plus several browsers at once runs it
  // out of memory (docs/web/testing.md).
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: BASE_URL, trace: "retain-on-failure" },
  projects: [
    { name: "phone", use: { ...devices["iPhone 14"], browserName: "chromium", viewport: { width: 430, height: 932 } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run start -- --port ${PORT}`,
        url: BASE_URL,
        // Never adopt a server that is already running: a stale one may have been started with
        // real keys and spend money (Overdraft, 2026-09-29). Opt in with E2E_REUSE_SERVER=1.
        reuseExistingServer: process.env.E2E_REUSE_SERVER === "1",
        timeout: 120_000,
        env: { OPENAI_API_KEY: "" },
      },
});
