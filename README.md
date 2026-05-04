# Mirror

> The wallet that watches you back.

A real-time behavioral intelligence layer for crypto wallets. Connect any address — Mirror analyzes your full cross-chain history via **Dune SIM**, generates your trading archetype, and stays watching: every new transaction is observed and commented on by Claude in real-time via SIM webhooks.

Built for the SIM hackathon.

---

## What's in this foundation

```
mirror/
├── app/
│   ├── globals.css          # design tokens — Obsidian palette, Mercury type, mirror motifs
│   ├── layout.tsx           # root layout, fonts, mounts <SimActivityPanel />
│   └── page.tsx             # landing — "Your wallet has a personality."
├── components/
│   └── SimActivityPanel.tsx # ⭐ the visible-proof panel — judges see SIM working live
├── lib/
│   └── sim/
│       ├── events.ts        # event bus — every SIM call publishes here
│       └── client.ts        # SIM API wrapper — auto-emits to the bus
├── package.json
├── postcss.config.js
├── tsconfig.json
├── next.config.js
└── .env.example
```

The `<SimActivityPanel />` is the heart of the submission. It's mounted in the root layout, so it's on screen across the entire app. Every call routed through `simFetch()` (or any of the wrappers in `client.ts`) shows up in real-time. Webhooks too — once we wire them up.

This single component is what makes the demo unambiguous about *how* SIM is being used.

---

## Setup

1. Copy `.env.example` → `.env.local` and fill in your `SIM_API_KEY`
2. `npm install`
3. `npm run dev`

Deploy on Vercel: push to GitHub, import the repo, paste env vars, ship.

---

## What's next (build order)

- [ ] **Profile generation** — `app/[address]/page.tsx` server component, calls `getEvmBalances` + `getSvmBalances` + `getEvmActivity`, hands data to Claude for archetype + tells
- [ ] **Claude prompts** — `lib/claude/profile-prompt.ts` (one-time profiler) + `lib/claude/commentator-prompt.ts` (real-time roaster)
- [ ] **Archetype color system** — wire `--color-arch-*` to swap based on profile
- [ ] **Webhook receiver** — `app/api/webhooks/sim/route.ts`, emits to bus + persists to KV
- [ ] **Live Feed** — SSE stream from webhook receiver to client, Claude commentary on each event
- [ ] **Mirrors & Anti-Mirrors** — find behavioral twins via cross-chain matching
- [ ] **The Card** — `app/api/og/[address]/route.tsx` using `@vercel/og`

---

## Design DNA

- **Obsidian** — near-black surfaces tinted cool. Pure black is cheap; this is expensive.
- **Quicksilver** — single signature accent. Silver, not white. Polished metal, never flashy.
- **Archetype colors** — each profile swaps the accent. Your wallet has visual identity.
- **Reflection motif** — doubled type, hairline center, ripple live indicator. Mirror is a brand primitive.
- **Voice** — second person, present tense, declarative. Noir narrator, never cruel.
