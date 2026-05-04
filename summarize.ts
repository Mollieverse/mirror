/**
 * SIM Activity Summarizer
 * ───────────────────────
 * Takes raw SIM responses (which can be huge) and produces
 * a compact, structured digest for Claude.
 *
 * We do the math here in TypeScript, not in the prompt.
 * Claude gets clean numbers and pattern signals, not raw txs.
 * This makes the analysis far more reliable and far cheaper.
 */

import type {
  EvmBalance,
  SvmBalance,
  ActivityEvent,
} from "@/lib/sim/client";

export interface ActivityDigest {
  // Headline numbers
  totalTransactions: number;
  chainsTouched: number;
  totalValueUsd: number;          // current portfolio value
  topTokensByValue: TokenSummary[];

  // Behavioral signals (the raw material for archetypes)
  activityWindow: {
    firstTxIso: string | null;
    lastTxIso: string | null;
    daysActive: number;
  };
  txTypeBreakdown: Record<string, number>;     // send/receive/swap/mint counts
  avgTxsPerActiveDay: number;
  hasNftActivity: boolean;
  hasSolanaActivity: boolean;
  hasMultipleChains: boolean;

  // Time-of-day pattern (timezone signal)
  hourlyTxDistribution: number[];              // 24 buckets

  // Recent activity tail (for Claude to see actual patterns)
  recentTxs: RecentTxSummary[];                // last 20, condensed
}

export interface TokenSummary {
  symbol: string;
  chain: string;
  valueUsd: number;
}

export interface RecentTxSummary {
  iso: string;
  chain: string;
  type: string;
  symbol?: string;
  valueUsd?: number;
}

export function summarizeForClaude(args: {
  evmBalances?: EvmBalance[];
  svmBalances?: SvmBalance[];
  activity?: ActivityEvent[];
}): ActivityDigest {
  const { evmBalances = [], svmBalances = [], activity = [] } = args;

  // ── Portfolio value & top tokens ─────────────────────────
  const allBalances = [
    ...evmBalances.map((b) => ({
      symbol: b.symbol ?? "?",
      chain: b.chain,
      valueUsd: b.value_usd ?? 0,
    })),
    ...svmBalances.map((b) => ({
      symbol: b.symbol ?? "?",
      chain: "solana",
      valueUsd: b.value_usd ?? 0,
    })),
  ];
  const totalValueUsd = allBalances.reduce((s, b) => s + b.valueUsd, 0);
  const topTokensByValue = [...allBalances]
    .sort((a, b) => b.valueUsd - a.valueUsd)
    .slice(0, 8);

  // ── Chain breadth ────────────────────────────────────────
  const chainSet = new Set<string>();
  evmBalances.forEach((b) => chainSet.add(b.chain));
  svmBalances.forEach(() => chainSet.add("solana"));
  activity.forEach((a) => chainSet.add(a.chain));
  const chainsTouched = chainSet.size;

  // ── Activity window ──────────────────────────────────────
  const sortedByTime = [...activity].sort(
    (a, b) =>
      new Date(a.block_time).getTime() - new Date(b.block_time).getTime()
  );
  const firstTx = sortedByTime[0];
  const lastTx = sortedByTime[sortedByTime.length - 1];
  let daysActive = 0;
  if (firstTx && lastTx) {
    daysActive =
      Math.max(
        1,
        Math.round(
          (new Date(lastTx.block_time).getTime() -
            new Date(firstTx.block_time).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
  }

  // ── Tx type breakdown ────────────────────────────────────
  const txTypeBreakdown: Record<string, number> = {};
  activity.forEach((a) => {
    const t = a.type ?? "unknown";
    txTypeBreakdown[t] = (txTypeBreakdown[t] ?? 0) + 1;
  });

  // ── Time-of-day distribution ─────────────────────────────
  const hourlyTxDistribution = new Array(24).fill(0) as number[];
  activity.forEach((a) => {
    try {
      const h = new Date(a.block_time).getUTCHours();
      hourlyTxDistribution[h]++;
    } catch {
      /* ignore */
    }
  });

  // ── Flags ────────────────────────────────────────────────
  const hasNftActivity = activity.some(
    (a) => a.asset_type === "erc721" || a.asset_type === "erc1155"
  );
  const hasSolanaActivity =
    svmBalances.length > 0 ||
    activity.some((a) => a.chain.toLowerCase().includes("solana"));
  const hasMultipleChains = chainsTouched > 1;

  // ── Recent tail (last 20) ────────────────────────────────
  const recentTxs: RecentTxSummary[] = sortedByTime
    .slice(-20)
    .reverse()
    .map((a) => ({
      iso: a.block_time,
      chain: a.chain,
      type: a.type,
      symbol: a.symbol,
      valueUsd: a.value_usd,
    }));

  return {
    totalTransactions: activity.length,
    chainsTouched,
    totalValueUsd,
    topTokensByValue,
    activityWindow: {
      firstTxIso: firstTx?.block_time ?? null,
      lastTxIso: lastTx?.block_time ?? null,
      daysActive,
    },
    txTypeBreakdown,
    avgTxsPerActiveDay: daysActive > 0 ? activity.length / daysActive : 0,
    hasNftActivity,
    hasSolanaActivity,
    hasMultipleChains,
    hourlyTxDistribution,
    recentTxs,
  };
}
