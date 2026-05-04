/**
 * SIM Event Bus
 * ─────────────
 * A singleton pub-sub for SIM activity events.
 * Every SIM call and webhook event publishes here.
 * The <SimActivityPanel /> subscribes and renders the log.
 *
 * This is the spine that makes "SIM is being used" visible
 * to the user (and to hackathon judges) in real-time.
 */

export type SimEvent =
  | {
      type: "request";
      id: string;
      method: "GET" | "POST";
      endpoint: string;          // e.g. "/v1/evm/balances/0xABC"
      label: string;             // short human label, e.g. "balances · evm"
      timestamp: number;
    }
  | {
      type: "response";
      id: string;                // matches the originating request
      status: "ok" | "error";
      durationMs: number;
      meta?: string;             // e.g. "6 chains · 247ms"
      timestamp: number;
    }
  | {
      type: "webhook";
      id: string;
      label: string;             // e.g. "tx received"
      payload: Record<string, unknown>;
      timestamp: number;
    }
  | {
      type: "subscription";
      id: string;
      label: string;             // e.g. "wallet activity · 0xABC"
      timestamp: number;
    };

type Listener = (event: SimEvent) => void;

class SimEventBus {
  private listeners: Set<Listener> = new Set();
  private buffer: SimEvent[] = [];
  private readonly MAX_BUFFER = 50;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // replay buffered events to new subscribers (so panel hydrates correctly)
    this.buffer.forEach(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: SimEvent): void {
    this.buffer.push(event);
    if (this.buffer.length > this.MAX_BUFFER) {
      this.buffer.shift();
    }
    this.listeners.forEach((l) => l(event));
  }

  history(): SimEvent[] {
    return [...this.buffer];
  }

  clear(): void {
    this.buffer = [];
  }
}

// Module-level singleton — survives across the app lifecycle.
export const simBus = new SimEventBus();

/** Generate a short id for correlating request/response pairs. */
export function eventId(): string {
  return Math.random().toString(36).slice(2, 8);
}
