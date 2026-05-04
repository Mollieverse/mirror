"use client";

/**
 * <SimActivityPanel />
 * ────────────────────
 * The visible proof. A floating panel that shows every SIM
 * call and webhook event in real-time. Mounted globally so
 * it's on screen the whole demo.
 *
 * This component alone fulfills the "clear demo of how SIM
 * is being used" submission requirement.
 */

import { useEffect, useRef, useState } from "react";
import { simBus, type SimEvent } from "@/lib/sim/events";

type LogEntry = {
  id: string;
  kind: "request" | "response" | "webhook" | "subscription" | "divider";
  time: string;            // hh:mm:ss
  primary: string;
  secondary?: string;
  status?: "pending" | "ok" | "error";
  durationMs?: number;
};

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => n.toString().padStart(2, "0"))
    .join(":");
}

export function SimActivityPanel() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // map request-id → entry index, so response events can patch
  const pendingIndex = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const unsubscribe = simBus.subscribe((ev: SimEvent) => {
      setEntries((prev) => {
        const next = [...prev];

        if (ev.type === "request") {
          const entry: LogEntry = {
            id: ev.id,
            kind: "request",
            time: fmtTime(ev.timestamp),
            primary: `${ev.method}  ${ev.endpoint}`,
            secondary: ev.label,
            status: "pending",
          };
          pendingIndex.current.set(ev.id, next.length);
          next.push(entry);
        } else if (ev.type === "response") {
          const idx = pendingIndex.current.get(ev.id);
          if (idx !== undefined && next[idx]) {
            next[idx] = {
              ...next[idx],
              kind: "response",
              status: ev.status,
              durationMs: ev.durationMs,
              secondary: ev.meta ?? next[idx].secondary,
            };
            pendingIndex.current.delete(ev.id);
          }
        } else if (ev.type === "webhook") {
          next.push({
            id: ev.id,
            kind: "webhook",
            time: fmtTime(ev.timestamp),
            primary: "⚡ webhook  " + ev.label,
            secondary: previewPayload(ev.payload),
          });
        } else if (ev.type === "subscription") {
          next.push({
            id: `${ev.id}-divider`,
            kind: "divider",
            time: fmtTime(ev.timestamp),
            primary: "─── " + ev.label + " ───",
          });
        }

        // cap at 30 most recent so the panel never overflows
        return next.slice(-30);
      });
    });

    return unsubscribe;
  }, []);

  // auto-scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div
      className="fixed z-50 font-mono text-[11px] leading-[16px]"
      style={{
        bottom: "16px",
        right: "16px",
        width: collapsed ? "180px" : "min(380px, calc(100vw - 32px))",
        maxHeight: collapsed ? "32px" : "min(280px, 60vh)",
        background: "var(--color-onyx)",
        border: "1px solid var(--color-slate)",
        borderRadius: "6px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
        backdropFilter: "blur(12px)",
        transition:
          "width var(--duration-base) var(--ease-out), max-height var(--duration-base) var(--ease-out)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-3 h-8 cursor-pointer select-none"
        style={{
          color: "var(--color-pewter)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="ripple-dot" aria-hidden />
          <span>SIM Activity</span>
        </div>
        <span style={{ color: "var(--color-smoke)" }}>
          {collapsed ? "↑" : "↓"}
        </span>
      </button>

      {/* Body */}
      {!collapsed && (
        <>
          <div
            style={{
              height: "1px",
              background: "var(--color-slate)",
            }}
          />
          <div
            ref={scrollRef}
            className="px-3 py-2 overflow-y-auto"
            style={{ maxHeight: "calc(min(280px, 60vh) - 33px)" }}
          >
            {entries.length === 0 ? (
              <div style={{ color: "var(--color-whisper)", padding: "8px 0" }}>
                waiting for activity...
              </div>
            ) : (
              entries.map((e) => <Row key={e.id + e.kind} entry={e} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Row({ entry }: { entry: LogEntry }) {
  const isWebhook = entry.kind === "webhook";
  const isDivider = entry.kind === "divider";
  const isError = entry.status === "error";
  const isPending = entry.status === "pending";

  if (isDivider) {
    return (
      <div
        className="slide-in py-1 text-center"
        style={{ color: "var(--color-whisper)" }}
      >
        {entry.primary}
      </div>
    );
  }

  return (
    <div className="slide-in py-1 flex gap-2">
      <span style={{ color: "var(--color-whisper)" }}>{entry.time}</span>
      <div className="flex-1 min-w-0">
        <div
          className="truncate"
          style={{
            color: isWebhook
              ? "var(--color-live)"
              : isError
                ? "var(--color-loss)"
                : "var(--color-mercury)",
          }}
        >
          {entry.primary}
        </div>
        {entry.secondary && (
          <div
            className="truncate"
            style={{ color: "var(--color-smoke)" }}
          >
            {entry.secondary}
            {entry.durationMs !== undefined && (
              <span style={{ color: "var(--color-whisper)" }}>
                {"  ·  "}{entry.durationMs}ms
              </span>
            )}
          </div>
        )}
      </div>
      <span
        style={{
          color: isPending
            ? "var(--color-warning)"
            : isError
              ? "var(--color-loss)"
              : "var(--color-profit)",
        }}
      >
        {isPending ? "○" : isError ? "✕" : "✓"}
      </span>
    </div>
  );
}

function previewPayload(payload: Record<string, unknown>): string {
  const keys = Object.keys(payload).slice(0, 3);
  return keys.map((k) => `${k}: ${String(payload[k]).slice(0, 12)}`).join(" · ");
}
