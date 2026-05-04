"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = address.trim();
    if (!isValidAddress(trimmed)) {
      setError("That doesn't look like a wallet.");
      return;
    }
    setError(null);
    startTransition(() => {
      router.push(`/${trimmed}`);
    });
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Top bar — micro wordmark */}
      <header className="px-6 pt-6 flex items-center justify-between">
        <div
          className="text-micro"
          style={{ color: "var(--color-pewter)" }}
        >
          MIRROR.
        </div>
        <div
          className="text-micro flex items-center gap-2"
          style={{ color: "var(--color-smoke)" }}
        >
          <span className="ripple-dot" aria-hidden />
          POWERED BY DUNE SIM
        </div>
      </header>

      {/* Hero — centered, confident, sparse */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        <div className="w-full max-w-[640px] flex flex-col items-center text-center">
          {/* Tagline — display serif, two-line cadence */}
          <h1
            className="font-display reveal"
            style={{
              fontSize: "clamp(36px, 7vw, 64px)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--color-mercury)",
              animationDelay: "0.1s",
            }}
          >
            Your wallet has a personality.
          </h1>
          <h2
            className="font-display reveal mt-1"
            style={{
              fontSize: "clamp(36px, 7vw, 64px)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--color-pewter)",
              fontStyle: "italic",
              animationDelay: "0.4s",
            }}
          >
            Most people never meet it.
          </h2>

          {/* Reflection line — the visual signature */}
          <div
            className="reflection-line w-full reveal"
            style={{ marginTop: "48px", animationDelay: "0.8s" }}
          />

          {/* Input — no labels, no buttons. Just an address. */}
          <form
            onSubmit={handleSubmit}
            className="w-full reveal"
            style={{ marginTop: "32px", animationDelay: "1.0s" }}
          >
            <div
              className="flex items-center w-full"
              style={{
                background: "var(--color-onyx)",
                border: "1px solid",
                borderColor: error
                  ? "var(--color-loss)"
                  : "var(--color-slate)",
                borderRadius: "4px",
                transition: "border-color var(--duration-base) var(--ease-out)",
              }}
            >
              <span
                className="font-mono pl-4"
                style={{
                  color: "var(--color-whisper)",
                  fontSize: "13px",
                }}
              >
                ›
              </span>
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Paste a wallet address"
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                disabled={isPending}
                className="flex-1 bg-transparent px-3 py-4 outline-none font-mono"
                style={{
                  color: "var(--color-mercury)",
                  fontSize: "14px",
                  letterSpacing: "0.01em",
                }}
              />
              <button
                type="submit"
                disabled={isPending || !address.trim()}
                className="text-micro pr-4 pl-2 py-4 cursor-pointer disabled:cursor-not-allowed"
                style={{
                  color: address.trim()
                    ? "var(--color-quicksilver)"
                    : "var(--color-whisper)",
                  transition: "color var(--duration-fast) var(--ease-out)",
                  background: "transparent",
                  border: "none",
                }}
              >
                {isPending ? "Listening..." : "Reflect →"}
              </button>
            </div>
            {error && (
              <div
                className="text-micro mt-3 text-left pl-4"
                style={{ color: "var(--color-loss)" }}
              >
                {error}
              </div>
            )}
          </form>

          {/* Example wallets — for judges and the curious */}
          <div
            className="reveal mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
            style={{ animationDelay: "1.3s" }}
          >
            <span
              className="text-micro"
              style={{ color: "var(--color-whisper)" }}
            >
              OR TRY
            </span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex.address}
                onClick={() => {
                  setAddress(ex.address);
                  setError(null);
                }}
                className="text-micro cursor-pointer hover:underline"
                style={{
                  color: "var(--color-pewter)",
                  transition: "color var(--duration-fast) var(--ease-out)",
                  background: "transparent",
                  border: "none",
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer — the quiet signature */}
      <footer
        className="px-6 pb-6 flex items-center justify-between text-micro"
        style={{ color: "var(--color-whisper)" }}
      >
        <span>Real-time · Cross-chain · Built on Dune SIM</span>
        <span>v0.1</span>
      </footer>
    </main>
  );
}

/** Simple validator — covers EVM 0x and Solana base58. */
function isValidAddress(s: string): boolean {
  if (!s) return false;
  // EVM
  if (/^0x[a-fA-F0-9]{40}$/.test(s)) return true;
  // Solana base58 (32–44 chars, no 0/O/I/l)
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)) return true;
  return false;
}

const EXAMPLES = [
  { label: "VITALIK", address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045" },
  { label: "A WHALE", address: "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503" },
  { label: "A DEGEN", address: "0x3ddfa8ec3052539b6c9549f12cea2c295cff5296" },
];
