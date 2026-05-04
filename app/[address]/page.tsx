import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchProfile } from "@/lib/profile/fetch-profile";
import { ArchetypeHero } from "@/components/profile/ArchetypeHero";
import { LedgerSection } from "@/components/profile/LedgerSection";
import { TellsSection } from "@/components/profile/TellsSection";
import { LiveFeedSection } from "@/components/profile/LiveFeedSection";
import { ProfileLoading } from "@/components/profile/ProfileLoading";

interface PageProps {
  params: Promise<{ address: string }>;
}

/* ── Validation (server-side guard) ─────────────────────────── */

function isValidAddress(s: string): boolean {
  if (!s) return false;
  if (/^0x[a-fA-F0-9]{40}$/.test(s)) return true;
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)) return true;
  return false;
}

/* ── Page ───────────────────────────────────────────────────── */

export default async function ProfilePage({ params }: PageProps) {
  const { address } = await params;

  if (!isValidAddress(address)) {
    notFound();
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Suspense fallback={<ProfileLoading address={address} />}>
        <ProfileContent address={address} />
      </Suspense>
    </main>
  );
}

/* ── Async content — actually does the fetching ─────────────── */

async function ProfileContent({ address }: { address: string }) {
  let result;
  try {
    result = await fetchProfile(address);
  } catch (err) {
    return <ProfileError address={address} error={err} />;
  }

  const { profile } = result;
  const archetypeHex = profile.archetype.hex;

  return (
    <>
      {/* Top bar */}
      <header className="px-6 pt-6 flex items-center justify-between">
        <Link
          href="/"
          className="text-micro hover:underline"
          style={{ color: "var(--color-pewter)" }}
        >
          ← MIRROR
        </Link>
        <div
          className="text-micro flex items-center gap-2"
          style={{ color: "var(--color-smoke)" }}
        >
          <span className="ripple-dot" aria-hidden />
          POWERED BY DUNE SIM
        </div>
      </header>

      {/* The vertical document */}
      <div
        className="w-full mx-auto px-6 pb-32"
        style={{ maxWidth: "640px" }}
      >
        <ArchetypeHero archetype={profile.archetype} address={address} />

        <div
          className="reflection-line w-full reveal"
          style={{ animationDelay: "1.0s" }}
        />

        <div className="mt-12">
          <LedgerSection
            ledger={profile.ledger}
            archetypeHex={archetypeHex}
          />
        </div>

        <div
          className="reflection-line w-full reveal mt-12"
          style={{ animationDelay: "1.2s" }}
        />

        <div className="mt-12">
          <TellsSection
            tells={profile.tells}
            archetypeHex={archetypeHex}
          />
        </div>

        <div
          className="reflection-line w-full reveal mt-12"
          style={{ animationDelay: "1.4s" }}
        />

        <div className="mt-12">
          <LiveFeedSection archetypeHex={archetypeHex} />
        </div>
      </div>
    </>
  );
}

/* ── Error UI ───────────────────────────────────────────────── */

function ProfileError({
  address,
  error,
}: {
  address: string;
  error: unknown;
}) {
  const msg =
    error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div
        className="text-micro mb-6"
        style={{ color: "var(--color-loss)" }}
      >
        REFLECTION INTERRUPTED
      </div>
      <h1
        className="font-display"
        style={{
          fontSize: "clamp(28px, 5vw, 40px)",
          color: "var(--color-mercury)",
          maxWidth: "32ch",
        }}
      >
        Mirror couldn&rsquo;t read this wallet.
      </h1>
      <p
        className="mt-6 font-mono"
        style={{
          fontSize: "12px",
          color: "var(--color-smoke)",
          maxWidth: "60ch",
        }}
      >
        {msg}
      </p>
      <Link
        href="/"
        className="text-micro mt-12 hover:underline"
        style={{ color: "var(--color-quicksilver)" }}
      >
        ← TRY ANOTHER WALLET
      </Link>
    </div>
  );
}

/* ── Metadata ───────────────────────────────────────────────── */

export async function generateMetadata({ params }: PageProps) {
  const { address } = await params;
  const short = address.length > 12
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address;
  return {
    title: `${short} — Mirror`,
    description: "The wallet that watches you back.",
  };
}
