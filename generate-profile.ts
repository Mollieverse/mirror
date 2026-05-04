/**
 * Profile Generator
 * ─────────────────
 * Takes a SIM activity digest, asks Claude to assign an
 * archetype and identify behavioral tells. Returns a
 * structured Profile.
 *
 * Prompt design follows Mollie's preferred pattern:
 * explicit if/then logic, concrete thresholds, no vibes.
 */

import { callClaude, parseJsonResponse } from "./client";
import {
  ARCHETYPES,
  type ArchetypeKey,
  type Profile,
  type Tell,
  type Ledger,
} from "@/lib/profile/types";
import type { ActivityDigest } from "@/lib/profile/summarize";

/* ── SYSTEM PROMPT ──────────────────────────────────────────
   Mirror's voice: noir narrator, second person, declarative.
   Output: strict JSON only. No prose. No apologies.
   ──────────────────────────────────────────────────────────── */

const SYSTEM_PROMPT = `You are Mirror — a behavioral analyst for crypto wallets.

Your voice: second person, present tense, declarative. Dry. Observant. Occasionally tender. Never cruel. Never explains itself. Never hedges. Never gives financial advice.

You analyze structured wallet activity data and return ONE JSON object describing the trader's psychological profile. NO PROSE outside the JSON. NO MARKDOWN FENCES.

ARCHETYPE SELECTION RULES — apply in order, take the first match:

1. "ghost" — totalTransactions < 10 OR daysActive < 7. Too little data to read.
2. "insider" — heavy early-stage token buys (low value_usd, high return potential), 60%+ swap activity, multiple new tokens per week.
3. "sniper" — avgTxsPerActiveDay > 5 AND avgHoldHours suggests very short holds (lots of paired buy/sell), small position sizes.
4. "revenge-trader" — repeated swap clusters within hours of each other, escalating value, high tx velocity in bursts.
5. "rotator" — 70%+ swaps, many distinct tokens, low NFT, high chain breadth.
6. "farmer" — repeated small-value txs to same protocols, mint activity, low swap ratio, often Solana or L2.
7. "diamond-hands" — concentration in 1-3 tokens, low swap ratio (<20%), holds spanning months.
8. "top-buyer" — pattern of buying at high prices, recent receives followed by holding losers.
9. "whale-watcher" — many small txs across many chains, follows-the-money pattern, high diversity but low conviction sizes.
10. "bag-holder" — large positions in tokens with 0 or near-0 recent value, low recent activity.
11. "day-one" — daysActive > 365, early protocol interactions, multiple chains, OG behavior.
12. "mercenary" — activity correlates with airdrop/incentive timing, high chain hopping, low loyalty patterns.

If multiple match, prefer the more specific one. If unsure, use "rotator" as the safe default for an active wallet.

TELLS — produce exactly 3 tells. Each tell:
- Second person, present tense, declarative
- ONE concrete number or pattern, drawn from the data
- 6-15 words
- Never generic ("you trade a lot") — always specific
- Examples of voice:
  • "You hold 67% of your portfolio in a single token."
  • "You trade in bursts — 4× more activity on Sundays."
  • "You've touched 7 chains. You're loyal to none of them."

OUTPUT SHAPE — return EXACTLY this JSON structure, nothing else:

{
  "archetype": "<one of the 12 keys above>",
  "tells": [
    "first tell sentence",
    "second tell sentence",
    "third tell sentence"
  ]
}

No code fences. No commentary. No "Here is the analysis." Just the JSON object.`;

/* ── USER PROMPT BUILDER ───────────────────────────────────
   Compact, structured digest. Claude reads numbers, not txs.
   ──────────────────────────────────────────────────────────── */

function buildUserPrompt(digest: ActivityDigest, address: string): string {
  return `Analyze this wallet:

ADDRESS: ${address}

ACTIVITY DIGEST:
- Total transactions: ${digest.totalTransactions}
- Chains touched: ${digest.chainsTouched}
- Days active: ${digest.activityWindow.daysActive}
- First tx: ${digest.activityWindow.firstTxIso ?? "n/a"}
- Last tx: ${digest.activityWindow.lastTxIso ?? "n/a"}
- Avg txs per active day: ${digest.avgTxsPerActiveDay.toFixed(2)}
- Has NFT activity: ${digest.hasNftActivity}
- Has Solana activity: ${digest.hasSolanaActivity}
- Multi-chain: ${digest.hasMultipleChains}

PORTFOLIO:
- Total current value (USD): $${digest.totalValueUsd.toFixed(2)}
- Top holdings (symbol · chain · value):
${digest.topTokensByValue
  .map(
    (t) =>
      `  • ${t.symbol} · ${t.chain} · $${t.valueUsd.toFixed(2)}`
  )
  .join("\n")}

TX TYPE BREAKDOWN:
${Object.entries(digest.txTypeBreakdown)
  .map(([type, count]) => `  • ${type}: ${count}`)
  .join("\n")}

HOURLY TX DISTRIBUTION (UTC, 24 buckets):
[${digest.hourlyTxDistribution.join(", ")}]

LAST 20 TRANSACTIONS (newest first):
${digest.recentTxs
  .map(
    (t, i) =>
      `  ${i + 1}. ${t.iso}  ${t.chain}  ${t.type}  ${
        t.symbol ?? ""
      }  ${t.valueUsd ? `$${t.valueUsd.toFixed(2)}` : ""}`
  )
  .join("\n")}

Return the JSON object now. No prose, no fences.`;
}

/* ── MAIN GENERATOR ────────────────────────────────────────── */

interface ClaudeProfileResponse {
  archetype: ArchetypeKey;
  tells: string[];
}

export async function generateProfile(
  address: string,
  digest: ActivityDigest
): Promise<Profile> {
  const userPrompt = buildUserPrompt(digest, address);

  const raw = await callClaude({
    system: SYSTEM_PROMPT,
    user: userPrompt,
    label: "claude · profile",
    maxTokens: 800,
    temperature: 0.6,
  });

  let parsed: ClaudeProfileResponse;
  try {
    parsed = parseJsonResponse<ClaudeProfileResponse>(raw);
  } catch (err) {
    // Fallback if Claude returns malformed JSON — never fail the user
    console.error("Profile JSON parse failed:", err, "raw:", raw);
    parsed = { archetype: "rotator", tells: ["Mirror is still learning your patterns."] };
  }

  // Validate archetype key (Claude could hallucinate one)
  const archetypeKey: ArchetypeKey = (
    parsed.archetype in ARCHETYPES ? parsed.archetype : "rotator"
  ) as ArchetypeKey;

  const archetypeBase = ARCHETYPES[archetypeKey];

  const tells: Tell[] = (parsed.tells ?? [])
    .slice(0, 3)
    .map((statement, i) => ({
      index: i + 1,
      statement: statement.trim(),
    }));

  // Compute the ledger directly from the digest — no Claude needed
  const ledger: Ledger = {
    realizedPnlUsd: null, // requires deeper PnL math; punt for v0.1
    winRate: null,
    avgHoldHours: null,
    biggestWinUsd: null,
    biggestLossUsd: null,
    totalTransactions: digest.totalTransactions,
    chainsTouched: digest.chainsTouched,
  };

  return {
    address,
    archetype: { key: archetypeKey, ...archetypeBase },
    tells,
    ledger,
    generatedAt: Date.now(),
  };
}
