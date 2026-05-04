/**
 * Profile Fetch Orchestrator
 * ──────────────────────────
 * The full pipeline:
 *   1. Detect address type (EVM vs Solana)
 *   2. Fire SIM endpoints in parallel
 *   3. Summarize raw responses for Claude
 *   4. Generate the profile via Claude
 *   5. Return everything for the page to render
 *
 * Every SIM call auto-logs to the Activity Panel via simBus.
 * Every Claude call does too. Judges see the full pipeline.
 */

import {
  getEvmBalances,
  getSvmBalances,
  getEvmActivity,
  type EvmBalance,
  type SvmBalance,
  type ActivityEvent,
} from "@/lib/sim/client";
import { summarizeForClaude } from "@/lib/profile/summarize";
import { generateProfile } from "@/lib/claude/generate-profile";
import type { Profile } from "@/lib/profile/types";

export interface FetchedProfile {
  profile: Profile;
  evmBalances: EvmBalance[];
  svmBalances: SvmBalance[];
  activity: ActivityEvent[];
  durationMs: number;
}

function isEvmAddress(s: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(s);
}

function isSolanaAddress(s: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s) && !s.startsWith("0x");
}

/**
 * Fetch all data for an address and generate a profile.
 * Tolerates partial failures — if SVM fails on an EVM
 * address (or vice versa), we proceed with what we have.
 */
export async function fetchProfile(address: string): Promise<FetchedProfile> {
  const startedAt = Date.now();
  const isEvm = isEvmAddress(address);
  const isSvm = isSolanaAddress(address);

  if (!isEvm && !isSvm) {
    throw new Error("Invalid address format.");
  }

  // Fire SIM calls in parallel. Use settled so one failure
  // doesn't kill the whole pipeline.
  const [evmBalRes, svmBalRes, activityRes] = await Promise.allSettled([
    isEvm ? getEvmBalances(address) : Promise.resolve({ balances: [] }),
    // Try SVM too on EVM addresses if you want — but skip for now
    // since the address formats don't overlap meaningfully
    isSvm ? getSvmBalances(address) : Promise.resolve({ balances: [] }),
    isEvm ? getEvmActivity(address, 100) : Promise.resolve({ activity: [] }),
  ]);

  const evmBalances: EvmBalance[] =
    evmBalRes.status === "fulfilled" ? evmBalRes.value.balances ?? [] : [];
  const svmBalances: SvmBalance[] =
    svmBalRes.status === "fulfilled" ? svmBalRes.value.balances ?? [] : [];
  const activity: ActivityEvent[] =
    activityRes.status === "fulfilled"
      ? activityRes.value.activity ?? []
      : [];

  // Build the Claude-ready digest
  const digest = summarizeForClaude({
    evmBalances,
    svmBalances,
    activity,
  });

  // Generate the profile
  const profile = await generateProfile(address, digest);

  return {
    profile,
    evmBalances,
    svmBalances,
    activity,
    durationMs: Date.now() - startedAt,
  };
}
