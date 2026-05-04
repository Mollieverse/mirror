"use client";

import { useEffect, useState } from "react";

const WORDS = [
  "Reading...",
  "Listening...",
  "Recognizing...",
  "Mirror sees you.",
];

interface Props {
  address: string;
}

/**
 * The 1.5-second cinematic loading sequence.
 * Replaces spinners. Word cycles in rhythm with what's
 * happening in the SIM Activity Panel below.
 */
export function ProfileLoading({ address }: Props) {
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    if (wordIdx >= WORDS.length - 1) return;
    const t = setTimeout(() => setWordIdx((i) => i + 1), 600);
    return () => clearTimeout(t);
  }, [wordIdx]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
    >
      {/* Echoed address */}
      <div
        className="font-mono mb-12 reveal"
        style={{
          fontSize: "13px",
          letterSpacing: "0.04em",
          color: "var(--color-smoke)",
          animationDelay: "0.0s",
        }}
      >
        {truncate(address)}
      </div>

      {/* Word cycle */}
      <div
        className="font-display"
        style={{
          fontSize: "clamp(28px, 5vw, 40px)",
          color: "var(--color-mercury)",
          minHeight: "1.5em",
          fontStyle: wordIdx === WORDS.length - 1 ? "normal" : "italic",
        }}
      >
        <span
          key={wordIdx}
          className="reveal inline-block"
          style={{
            color:
              wordIdx === WORDS.length - 1
                ? "var(--color-quicksilver)"
                : "var(--color-pewter)",
          }}
        >
          {WORDS[wordIdx]}
        </span>
      </div>

      {/* Subtle hint about where to look */}
      <div
        className="text-micro mt-16 reveal"
        style={{
          color: "var(--color-whisper)",
          animationDelay: "1.2s",
        }}
      >
        ↓ WATCH SIM WORK
      </div>
    </div>
  );
}

function truncate(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
