"use client";

import type { Ledger } from "@/lib/profile/types";

interface Props {
  ledger: Ledger;
  archetypeHex: string;
}

/**
 * The Ledger.
 * Quiet, declarative, no padding around emotion.
 * Numbers are mostly Mercury — only PnL gets profit/loss color.
 */
export function LedgerSection({ ledger, archetypeHex }: Props) {
  const rows: Array<{ label: string; value: string; color?: string }> = [
    {
      label: "Transactions",
      value: ledger.totalTransactions.toLocaleString(),
    },
    {
      label: "Chains touched",
      value: ledger.chainsTouched.toString(),
    },
  ];

  // Add computed rows only if data is available
  if (ledger.realizedPnlUsd !== null) {
    rows.push({
      label: "Realized PnL",
      value: formatUsd(ledger.realizedPnlUsd, true),
      color:
        ledger.realizedPnlUsd >= 0
          ? "var(--color-profit)"
          : "var(--color-loss)",
    });
  }
  if (ledger.winRate !== null) {
    rows.push({
      label: "Win rate",
      value: `${Math.round(ledger.winRate * 100)}%`,
    });
  }
  if (ledger.avgHoldHours !== null) {
    rows.push({
      label: "Avg hold",
      value: formatHours(ledger.avgHoldHours),
    });
  }

  return (
    <section
      className="reveal w-full"
      style={{ animationDelay: "1.1s" }}
    >
      <SectionHeader label="THE LEDGER" archetypeHex={archetypeHex} />

      <div className="mt-6">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between py-3"
            style={{
              borderTop:
                i === 0 ? "none" : "1px solid var(--color-slate)",
            }}
          >
            <span
              className="text-micro"
              style={{ color: "var(--color-pewter)" }}
            >
              {row.label}
            </span>
            <span
              className="font-mono"
              style={{
                fontSize: "16px",
                color: row.color ?? "var(--color-mercury)",
                fontFeatureSettings: '"tnum"',
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SectionHeader({
  label,
  archetypeHex,
}: {
  label: string;
  archetypeHex: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="text-micro"
        style={{ color: "var(--color-pewter)" }}
      >
        {label}
      </div>
      <div
        className="flex-1 h-px"
        style={{
          background: `linear-gradient(to right, ${archetypeHex}40, transparent)`,
        }}
      />
    </div>
  );
}

function formatUsd(n: number, withSign: boolean = false): string {
  const abs = Math.abs(n);
  let formatted: string;
  if (abs >= 1_000_000) formatted = `$${(abs / 1_000_000).toFixed(2)}M`;
  else if (abs >= 1_000) formatted = `$${(abs / 1_000).toFixed(1)}K`;
  else formatted = `$${abs.toFixed(2)}`;
  if (withSign) return n >= 0 ? `+${formatted}` : `−${formatted}`;
  return formatted;
}

function formatHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${h.toFixed(1)}h`;
  const days = h / 24;
  if (days < 30) return `${days.toFixed(1)}d`;
  return `${(days / 30).toFixed(1)}mo`;
}
