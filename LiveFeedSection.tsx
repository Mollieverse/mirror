"use client";

import { SectionHeader } from "./LedgerSection";

interface Props {
  archetypeHex: string;
}

/**
 * Live Feed — placeholder for v0.1.
 * The webhook-driven real-time commentary lands here in the next chunk.
 * For now: explains the system + shows the "watching" state.
 */
export function LiveFeedSection({ archetypeHex }: Props) {
  return (
    <section className="reveal w-full" style={{ animationDelay: "1.5s" }}>
      <div className="flex items-center gap-3">
        <div
          className="text-micro"
          style={{ color: "var(--color-pewter)" }}
        >
          LIVE FEED
        </div>
        <div
          className="flex-1 h-px"
          style={{
            background: `linear-gradient(to right, ${archetypeHex}40, transparent)`,
          }}
        />
        <div
          className="text-micro flex items-center gap-2"
          style={{ color: "var(--color-smoke)" }}
        >
          <span className="ripple-dot" aria-hidden />
          WATCHING
        </div>
      </div>

      <div
        className="mt-6 p-5 rounded"
        style={{
          background: "var(--color-onyx)",
          border: "1px solid var(--color-slate)",
        }}
      >
        <p
          style={{
            fontSize: "15px",
            lineHeight: 1.6,
            color: "var(--color-pewter)",
          }}
        >
          Mirror is now watching this wallet. Every new transaction will
          appear here within seconds — observed, decoded, and reflected
          back to you.
        </p>
        <p
          className="mt-3 font-display italic"
          style={{
            fontSize: "16px",
            color: "var(--color-smoke)",
          }}
        >
          The next move you make, Mirror will see.
        </p>
      </div>
    </section>
  );
}
