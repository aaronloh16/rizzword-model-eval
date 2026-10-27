/**
 * The race event log is the single source of truth for both live races and
 * recorded replays. A live race streams these events as NDJSON; a replay is
 * just the same events, saved to `data/races/<date>.json`.
 */
export type RaceEvent =
  | { t: number; model: string; type: "start" }
  | { t: number; model: string; type: "think"; text: string }
  | { t: number; model: string; type: "fill"; entry: string; answer: string }
  | {
      t: number;
      model: string;
      type: "done";
      usage: TokenUsage;
      /** USD. From the gateway when available, otherwise estimated from list price. */
      costUsd: number;
      costSource: "gateway" | "estimate";
      finishReason?: string;
    }
  | { t: number; model: string; type: "error"; message: string };

export interface TokenUsage {
  input: number;
  output: number;
  reasoning: number;
}

export interface RaceModelRef {
  id: string;
  name: string;
  gatewayId: string;
}

export interface RaceTranscript {
  version: 1;
  puzzleId: string;
  /** ISO timestamp. */
  recordedAt: string;
  /**
   * "live": captured from real models through AI Gateway (`pnpm race:record`).
   * "simulated": synthetic demo data so the site works before any keys exist.
   */
  source: "live" | "simulated";
  models: RaceModelRef[];
  settings: { reasoning: string; maxOutputTokens: number; promptVersion: string };
  events: RaceEvent[];
}

/** One line of the live NDJSON stream. */
export type LiveStreamMessage =
  | { kind: "hello"; models: RaceModelRef[]; puzzleId: string; startedAt: string }
  | { kind: "event"; event: RaceEvent }
  | { kind: "end" }
  | { kind: "fatal"; message: string };
