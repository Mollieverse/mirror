/**
 * Claude API Client
 * ─────────────────
 * Wrapper around Anthropic's /v1/messages endpoint.
 * Auto-emits to the SIM event bus so Claude calls show
 * up in the Activity Panel alongside SIM calls — judges
 * see the full data → AI pipeline live.
 */

import { simBus, eventId } from "@/lib/sim/events";

const ANTHROPIC_BASE = "https://api.anthropic.com/v1/messages";
// Claude Sonnet 4 — strong reasoning, fast, JSON-reliable
const MODEL = "claude-sonnet-4-20250514";

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "Missing ANTHROPIC_API_KEY. Add it to your env vars — get one at console.anthropic.com"
    );
  }
  return key;
}

interface ClaudeCallOptions {
  system: string;
  user: string;
  label: string;            // for the Activity Panel
  maxTokens?: number;
  temperature?: number;
}

export async function callClaude(
  options: ClaudeCallOptions
): Promise<string> {
  const {
    system,
    user,
    label,
    maxTokens = 1500,
    temperature = 0.7,
  } = options;

  const id = eventId();
  const startedAt = performance.now();

  simBus.emit({
    type: "request",
    id,
    method: "POST",
    endpoint: "/v1/messages  (claude)",
    label,
    timestamp: Date.now(),
  });

  try {
    const res = await fetch(ANTHROPIC_BASE, {
      method: "POST",
      headers: {
        "x-api-key": getApiKey(),
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    const durationMs = Math.round(performance.now() - startedAt);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      simBus.emit({
        type: "response",
        id,
        status: "error",
        durationMs,
        meta: `HTTP ${res.status}`,
        timestamp: Date.now(),
      });
      throw new Error(`Claude failed: ${res.status} — ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const text =
      data?.content?.[0]?.type === "text" ? data.content[0].text : "";

    simBus.emit({
      type: "response",
      id,
      status: "ok",
      durationMs,
      meta: `${data?.usage?.output_tokens ?? "?"} tokens out`,
      timestamp: Date.now(),
    });

    return text;
  } catch (err) {
    const durationMs = Math.round(performance.now() - startedAt);
    simBus.emit({
      type: "response",
      id,
      status: "error",
      durationMs,
      meta: err instanceof Error ? err.message.slice(0, 50) : "unknown",
      timestamp: Date.now(),
    });
    throw err;
  }
}

/**
 * Strip ```json fences and parse. Claude often wraps JSON
 * even when told not to — defensive parsing.
 */
export function parseJsonResponse<T>(text: string): T {
  let cleaned = text.trim();
  // Remove ```json or ``` wrappers
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  // Find first { and last } in case there's prose around it
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned) as T;
}
