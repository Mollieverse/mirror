/**
 * Profile Types
 * ─────────────
 * The shape of a Mirror profile, returned by Claude's
 * structured analysis of SIM data.
 */

export type ArchetypeKey =
  | "top-buyer"
  | "diamond-hands"
  | "rotator"
  | "insider"
  | "farmer"
  | "revenge-trader"
  | "ghost"
  | "sniper"
  | "whale-watcher"
  | "bag-holder"
  | "day-one"
  | "mercenary";

export interface Archetype {
  key: ArchetypeKey;
  name: string;          // "The Revenge Trader"
  tagline: string;       // "You don't lose. You retaliate."
  color: string;         // CSS variable, e.g. "var(--color-arch-ember)"
  hex: string;           // raw hex for OG card / inline styles
}

export interface Tell {
  index: number;         // 1, 2, 3...
  statement: string;     // "You buy within 6h of ATH 73% of the time."
  metric?: string;       // optional short metric, e.g. "73%"
}

export interface Ledger {
  realizedPnlUsd: number | null;   // can be null if uncomputable
  winRate: number | null;          // 0..1
  avgHoldHours: number | null;
  biggestWinUsd: number | null;
  biggestLossUsd: number | null;
  totalTransactions: number;
  chainsTouched: number;
}

export interface Profile {
  address: string;
  archetype: Archetype;
  tells: Tell[];
  ledger: Ledger;
  generatedAt: number;
}

/**
 * The 12 archetypes Mirror can assign.
 * Each has its own color drawn from the design system.
 */
export const ARCHETYPES: Record<ArchetypeKey, Omit<Archetype, "key">> = {
  "top-buyer": {
    name: "The Top Buyer",
    tagline: "You arrive when the music stops.",
    color: "var(--color-arch-rose)",
    hex: "#E17F8E",
  },
  "diamond-hands": {
    name: "The Diamond Hands",
    tagline: "You hold like grief.",
    color: "var(--color-arch-mint)",
    hex: "#7FE1B8",
  },
  rotator: {
    name: "The Rotator",
    tagline: "Everything is the next thing.",
    color: "var(--color-arch-amethyst)",
    hex: "#B89AF0",
  },
  insider: {
    name: "The Insider",
    tagline: "You knew before they did.",
    color: "var(--color-arch-gold)",
    hex: "#E8C76F",
  },
  farmer: {
    name: "The Farmer",
    tagline: "Yield is a love language.",
    color: "var(--color-arch-glacier)",
    hex: "#8FD4E8",
  },
  "revenge-trader": {
    name: "The Revenge Trader",
    tagline: "You don't lose. You retaliate.",
    color: "var(--color-arch-ember)",
    hex: "#FF6B6B",
  },
  ghost: {
    name: "The Ghost",
    tagline: "You move like nobody's watching.",
    color: "var(--color-arch-smoke)",
    hex: "#A0A0AB",
  },
  sniper: {
    name: "The Sniper",
    tagline: "In, out, no witnesses.",
    color: "var(--color-arch-copper)",
    hex: "#FF8F4F",
  },
  "whale-watcher": {
    name: "The Whale Watcher",
    tagline: "Other people's wallets are your map.",
    color: "var(--color-arch-azure)",
    hex: "#4F9FFF",
  },
  "bag-holder": {
    name: "The Bag Holder",
    tagline: "Conviction or denial. Hard to say.",
    color: "var(--color-arch-bronze)",
    hex: "#B8975F",
  },
  "day-one": {
    name: "The Day-One",
    tagline: "You were here first. You'll mention it.",
    color: "var(--color-arch-pearl)",
    hex: "#F0B8D4",
  },
  mercenary: {
    name: "The Mercenary",
    tagline: "Loyalty is a yield assumption.",
    color: "var(--color-arch-acid)",
    hex: "#9FFF6B",
  },
};
