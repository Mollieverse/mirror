"use client";

import type { Archetype } from "@/lib/profile/types";

interface Props {
  archetype: Archetype;
  address: string;
}

/**
 * The hero of the profile page.
 * Big serif archetype name with the literal reflection motif.
 * Tagline below in pewter italic. Address as quiet metadata.
 */
export function ArchetypeHero({ archetype, address }: Props) {
  return (
    <section
      className="reveal w-full flex flex-col items-center text-center"
      style={{
        paddingTop: "clamp(48px, 12vh, 120px)",
        paddingBottom: "clamp(40px, 8vh, 80px)",
        animationDelay: "0.2s",
      }}
    >
      {/* Quiet "ARCHETYPE" label */}
      <div
        className="text-micro mb-4"
        style={{ color: "var(--color-whisper)" }}
      >
        ARCHETYPE
      </div>

      {/* The name — serif, with mirrored reflection underneath */}
      <h1
        className="font-display mirror-text"
        data-text={archetype.name}
        style={{
          fontSize: "clamp(36px, 8vw, 72px)",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          color: archetype.hex,
          // The mirror-text ::after takes color from currentColor
        }}
      >
        {archetype.name}
      </h1>

      {/* Tagline */}
      <p
        className="font-display reveal mt-6"
        style={{
          fontSize: "clamp(18px, 3vw, 24px)",
          lineHeight: 1.4,
          color: "var(--color-pewter)",
          fontStyle: "italic",
          maxWidth: "32ch",
          animationDelay: "0.6s",
        }}
      >
        &ldquo;{archetype.tagline}&rdquo;
      </p>

      {/* Address — quiet, mono */}
      <div
        className="reveal font-mono mt-10 px-3 py-1.5 rounded"
        style={{
          fontSize: "11px",
          letterSpacing: "0.04em",
          color: "var(--color-smoke)",
          background: "var(--color-onyx)",
          border: "1px solid var(--color-slate)",
          animationDelay: "0.9s",
        }}
      >
        {truncate(address)}
      </div>
    </section>
  );
}

function truncate(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
