"use client";

import type { Tell } from "@/lib/profile/types";
import { SectionHeader } from "./LedgerSection";

interface Props {
  tells: Tell[];
  archetypeHex: string;
}

/**
 * Your Tells.
 * Three numbered observations. Serif numbers, sans body.
 * The numbers in the archetype color — they're the visual rhythm.
 */
export function TellsSection({ tells, archetypeHex }: Props) {
  return (
    <section className="reveal w-full" style={{ animationDelay: "1.3s" }}>
      <SectionHeader label="YOUR TELLS" archetypeHex={archetypeHex} />

      <div className="mt-6 space-y-5">
        {tells.map((tell) => (
          <div
            key={tell.index}
            className="flex items-start gap-5"
          >
            {/* Numeral — serif, archetype color */}
            <span
              className="font-display flex-shrink-0"
              style={{
                fontSize: "32px",
                lineHeight: 1,
                color: archetypeHex,
                width: "32px",
                fontFeatureSettings: '"lnum"',
              }}
            >
              {tell.index.toString().padStart(2, "0")}
            </span>

            {/* Statement */}
            <p
              style={{
                fontSize: "17px",
                lineHeight: 1.5,
                color: "var(--color-mercury)",
                paddingTop: "4px",
              }}
            >
              {tell.statement}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
