// The triage route with OpenAI mocked: fetch is replaced for every test, so nothing here can
// reach the network or spend money (web-release-standard: testing never spends money).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import type { TriageResponse } from "@/lib/contracts";
import { POST } from "./route";

const ticket = {
  customerName: "Mei Chen",
  subject: "Flight delayed, stuck in Chicago tonight",
  body: "My connection was delayed four hours because of a broken part on the plane and the last flight has left. Where do we sleep tonight?",
};

let ip = 0;
/** Every test gets its own IP, because the route's limiters live for the whole module. */
function call(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("http://localhost/api/triage", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${++ip}`, ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function openAIAnswer(content: object) {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) }, finish_reason: "stop" }],
      usage: { prompt_tokens: 600, completion_tokens: 250 },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockRejectedValue(new Error("unexpected network call"));
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("OPENAI_API_KEY", "test-key-not-real-0000");
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/triage", () => {
  it("returns the model's triage, checked and limited to the rules it was sent", async () => {
    fetchMock.mockImplementation(async (_url, init) => {
      const sent = JSON.parse(String(init?.body));
      const allowed: string[] = sent.response_format.json_schema.schema.properties.citations.items.properties.clause_id.enum;
      return openAIAnswer({
        category: "delay",
        priority: "urgent",
        summary: "Stuck overnight after a delay caused by an aircraft fault.",
        priority_reason: "Stranded tonight.",
        citations: [
          { clause_id: allowed[0], why: "First rule." },
          { clause_id: "42.1", why: "Invented." },
        ],
        reply_subject: "Re: stuck in Chicago",
        reply_body: "Hi Mei,\n\nWe'll book you a hotel tonight.\n\nLarkspur Air Support",
      });
    });

    const res = await call(ticket);
    expect(res.status).toBe(200);
    const json = (await res.json()) as TriageResponse;
    expect(json.source).toBe("ai");
    expect(json.notice).toBeUndefined();
    expect(json.triage.priority).toBe("urgent");
    expect(json.triage.citations).toHaveLength(1); // "42.1" was dropped
    expect(json.triage.reply.body).toContain("Hi Mei");

    // One call, to OpenAI, with the default model, a strict schema and the candidate rules only.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.openai.com/v1/chat/completions");
    const sent = JSON.parse(String(init?.body));
    expect(sent.model).toBe("gpt-5.4-mini");
    expect(sent.response_format.json_schema.strict).toBe(true);
    expect(sent.max_completion_tokens).toBe(700);
    expect(sent.messages[1].content).toContain("Policy rules:");
    expect(sent.messages[1].content.match(/^\[\d+\.\d+\]/gm)).toHaveLength(5);
  });

  it("shows KL Web's paused state when the OpenAI balance is empty, with a rules draft", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "insufficient_quota", message: "You exceeded your current quota" } }), { status: 429 }),
    );
    const res = await call(ticket);
    expect(res.status).toBe(200);
    const json = (await res.json()) as TriageResponse;
    expect(json.source).toBe("rules");
    expect(json.notice).toEqual({ code: "paused", message: "AI features are paused right now. Everything else still works." });
    expect(json.triage.reply.body.startsWith("Hi Mei,")).toBe(true);
    expect(json.triage.citations.length).toBeGreaterThan(0);
  });

  it("tells a rate limit apart from an empty balance", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { code: "rate_limit_exceeded" } }), { status: 429 }));
    const json = (await (await call(ticket)).json()) as TriageResponse;
    expect(json.source).toBe("rules");
    expect(json.notice?.code).toBe("busy");
  });

  it("answers with the rules, without calling anyone, when no key is set", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const json = (await (await call(ticket)).json()) as TriageResponse;
    expect(json.source).toBe("rules");
    expect(json.notice?.code).toBe("not_configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back when the model's answer is unusable", async () => {
    fetchMock.mockResolvedValue(openAIAnswer({ category: "delay", priority: "high", summary: "", priority_reason: "", citations: [], reply_subject: "", reply_body: "" }));
    const json = (await (await call(ticket)).json()) as TriageResponse;
    expect(json.source).toBe("rules");
    expect(json.notice?.code).toBe("failed");
  });

  it("rejects bad input before any limit or model call", async () => {
    const res = await call({ ...ticket, body: "hi" });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("bad_request");
    const broken = await call("{not json");
    expect(broken.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("limits each visitor to 5 a minute", async () => {
    vi.stubEnv("OPENAI_API_KEY", ""); // no model needed to count requests
    const headers = { "x-forwarded-for": "203.0.113.7" };
    for (let i = 0; i < 5; i++) expect((await call(ticket, headers)).status).toBe(200);
    const sixth = await call(ticket, headers);
    expect(sixth.status).toBe(429);
    expect(sixth.headers.get("Retry-After")).toBeTruthy();
    expect((await sixth.json()).error.code).toBe("rate_limited");
    expect((await call(ticket, { "x-forwarded-for": "203.0.113.8" })).status).toBe(200);
  });
});
