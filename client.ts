/**
 * SIM API Client
 * ──────────────
 * A thin wrapper around Dune SIM endpoints.
 * Every call auto-emits to the event bus so the
 * <SimActivityPanel /> shows it in real-time.
 *
 * Set SIM_API_KEY in your environment.
 * Docs: https://docs.sim.dune.com
 */

import { simBus, eventId } from "./events";

const SIM_BASE = "https://api.sim.dune.com";

function getApiKey(): string {
  const key = process.env.SIM_API_KEY;
  if (!key) {
    throw new Error(
      "Missing SIM_API_KEY. Add it to .env.local — get one at sim.dune.com"
    );
  }
  return key;
}

interface SimFetchOptions {
  endpoint: string;        // e.g. "/v1/evm/balances/0xABC"
  label: string;           // short label for the activity panel
  method?: "GET" | "POST";
  body?: unknown;
}

/**
 * Core SIM fetch. Auto-logs to the event bus.
 * Use this for every endpoint call so the Activity Panel
 * shows it on screen.
 */
export async function simFetch<T = unknown>(
  options: SimFetchOptions
): Promise<T> {
  const { endpoint, label, method = "GET", body } = options;
  const id = eventId();
  const startedAt = performance.now();

  simBus.emit({
    type: "request",
    id,
    method,
    endpoint,
    label,
    timestamp: Date.now(),
  });

  try {
    const res = await fetch(`${SIM_BASE}${endpoint}`, {
      method,
      headers: {
        "X-Sim-Api-Key": getApiKey(),
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      // Edge runtime friendly
      cache: "no-store",
    });

    const durationMs = Math.round(performance.now() - startedAt);

    if (!res.ok) {
      simBus.emit({
        type: "response",
        id,
        status: "error",
        durationMs,
        meta: `HTTP ${res.status}`,
        timestamp: Date.now(),
      });
      throw new Error(`SIM ${endpoint} failed: ${res.status}`);
    }

    const data = (await res.json()) as T;

    simBus.emit({
      type: "response",
      id,
      status: "ok",
      durationMs,
      meta: extractMeta(data),
      timestamp: Date.now(),
    });

    return data;
  } catch (err) {
    const durationMs = Math.round(performance.now() - startedAt);
    simBus.emit({
      type: "response",
      id,
      status: "error",
      durationMs,
      meta: err instanceof Error ? err.message : "unknown",
      timestamp: Date.now(),
    });
    throw err;
  }
}

/** Best-effort metadata for the activity panel display. */
function extractMeta(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.balances)) return `${obj.balances.length} balances`;
  if (Array.isArray(obj.transactions))
    return `${obj.transactions.length} txs`;
  if (Array.isArray(obj.activity)) return `${obj.activity.length} events`;
  return undefined;
}

/* ────────────────────────────────────────────────────────────
   ENDPOINT WRAPPERS
   Pre-built helpers for the endpoints Mirror uses.
   Add more as needed; each will auto-log to the panel.
   ──────────────────────────────────────────────────────────── */

export interface EvmBalance {
  chain: string;
  chain_id: number;
  address: string;
  amount: string;
  symbol?: string;
  name?: string;
  decimals?: number;
  price_usd?: number;
  value_usd?: number;
  token_metadata?: {
    logo?: string;
    url?: string;
  };
}

export interface SvmBalance {
  chain: string;
  address: string;
  amount: string;
  symbol?: string;
  name?: string;
  decimals?: number;
  price_usd?: number;
  value_usd?: number;
}

export interface ActivityEvent {
  chain: string;
  chain_id?: number;
  block_time: string;
  block_number: number;
  tx_hash: string;
  type: string;             // "send" | "receive" | "swap" | "mint" | etc
  asset_type?: string;      // "native" | "erc20" | "erc721"
  value?: string;
  value_usd?: number;
  token_address?: string;
  symbol?: string;
  from?: string;
  to?: string;
}

/** Get token balances across all 60+ EVM chains in one call. */
export async function getEvmBalances(address: string) {
  return simFetch<{ balances: EvmBalance[] }>({
    endpoint: `/v1/evm/balances/${address}`,
    label: "balances · evm",
  });
}

/** Get Solana balances. */
export async function getSvmBalances(address: string) {
  return simFetch<{ balances: SvmBalance[] }>({
    endpoint: `/beta/svm/balances/${address}`,
    label: "balances · svm",
  });
}

/** Get full transaction activity history across chains. */
export async function getEvmActivity(address: string, limit = 100) {
  return simFetch<{ activity: ActivityEvent[] }>({
    endpoint: `/v1/evm/activity/${address}?limit=${limit}`,
    label: "activity · evm",
  });
}

/** Get token metadata. */
export async function getTokenInfo(chainId: number, contract: string) {
  return simFetch({
    endpoint: `/v1/evm/token-info/${chainId}/${contract}`,
    label: "token-info",
  });
}
