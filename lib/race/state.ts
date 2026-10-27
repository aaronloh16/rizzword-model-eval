import { buildSolution, cellKey, entryCells } from "../puzzle/grid";
import type { Puzzle } from "../puzzle/types";
import type { RaceEvent, RaceModelRef, TokenUsage } from "./types";

export type LaneStatus = "waiting" | "thinking" | "solving" | "done" | "error";

export interface CellFill {
  letter: string;
  correct: boolean;
  /** Event time the letter landed (ms). Used to key the fill animation. */
  at: number;
}

export interface LaneState {
  model: RaceModelRef;
  status: LaneStatus;
  answers: Map<string, string>;
  cells: Map<string, CellFill>;
  /** Tail of the streamed reasoning, for the "thinking" ticker. */
  thinking: string;
  thinkingChars: number;
  lastEntry: string | null;
  startedAt: number | null;
  firstFillAt: number | null;
  finishedAt: number | null;
  fills: number;
  revisions: number;
  correctEntries: number;
  correctLetters: number;
  usage: TokenUsage | null;
  costUsd: number | null;
  costSource: "gateway" | "estimate" | null;
  error: string | null;
}

export interface RaceState {
  lanes: LaneState[];
  /** Model ids, best first. */
  standings: string[];
  totalEntries: number;
  totalLetters: number;
  allDone: boolean;
}

const THINK_TAIL = 600;

export function emptyLane(model: RaceModelRef): LaneState {
  return {
    model,
    status: "waiting",
    answers: new Map(),
    cells: new Map(),
    thinking: "",
    thinkingChars: 0,
    lastEntry: null,
    startedAt: null,
    firstFillAt: null,
    finishedAt: null,
    fills: 0,
    revisions: 0,
    correctEntries: 0,
    correctLetters: 0,
    usage: null,
    costUsd: null,
    costSource: null,
    error: null,
  };
}

/**
 * Fold the event log (up to `now`) into per-model lane state. Pure and cheap
 * enough to run every animation frame for a few thousand events.
 */
export function deriveRace(
  puzzle: Puzzle,
  models: RaceModelRef[],
  events: RaceEvent[],
  now = Infinity,
): RaceState {
  const solution = buildSolution(puzzle);
  const entries = new Map(puzzle.entries.map((e) => [e.id, e]));
  const lanes = new Map(models.map((m) => [m.id, emptyLane(m)]));

  for (const ev of events) {
    if (ev.t > now) break;
    const lane = lanes.get(ev.model);
    if (!lane) continue;
    switch (ev.type) {
      case "start":
        lane.status = "thinking";
        lane.startedAt = ev.t;
        break;
      case "think":
        lane.thinking = (lane.thinking + ev.text).slice(-THINK_TAIL);
        lane.thinkingChars += ev.text.length;
        if (lane.status === "waiting") lane.status = "thinking";
        break;
      case "fill": {
        const entry = entries.get(ev.entry);
        if (!entry) break;
        if (lane.answers.has(ev.entry)) lane.revisions++;
        lane.answers.set(ev.entry, ev.answer);
        lane.fills++;
        lane.lastEntry = ev.entry;
        lane.firstFillAt ??= ev.t;
        lane.status = "solving";
        entryCells(entry).forEach(({ row, col }, i) => {
          const letter = ev.answer[i];
          if (!letter) return;
          lane.cells.set(cellKey(row, col), { letter, correct: solution[row][col] === letter, at: ev.t });
        });
        break;
      }
      case "done":
        lane.status = "done";
        lane.finishedAt = ev.t;
        lane.usage = ev.usage;
        lane.costUsd = ev.costUsd;
        lane.costSource = ev.costSource;
        break;
      case "error":
        lane.status = "error";
        lane.finishedAt = ev.t;
        lane.error = ev.message;
        break;
    }
  }

  let totalLetters = 0;
  for (const row of solution) for (const c of row) if (c) totalLetters++;

  for (const lane of lanes.values()) {
    lane.correctEntries = puzzle.entries.filter((e) => lane.answers.get(e.id) === e.answer).length;
    lane.correctLetters = [...lane.cells.values()].filter((c) => c.correct).length;
  }

  const list = [...lanes.values()];
  const standings = [...list].sort(compareLanes).map((l) => l.model.id);
  return {
    lanes: list,
    standings,
    totalEntries: puzzle.entries.length,
    totalLetters,
    allDone: list.every((l) => l.status === "done" || l.status === "error"),
  };
}

/** Most correct entries wins; ties go to whoever finished first, then cheaper. */
export function compareLanes(a: LaneState, b: LaneState): number {
  if (b.correctEntries !== a.correctEntries) return b.correctEntries - a.correctEntries;
  if (b.correctLetters !== a.correctLetters) return b.correctLetters - a.correctLetters;
  const fa = a.finishedAt ?? Infinity;
  const fb = b.finishedAt ?? Infinity;
  if (fa !== fb) return fa - fb;
  return (a.costUsd ?? Infinity) - (b.costUsd ?? Infinity);
}

export function raceDuration(events: RaceEvent[]): number {
  return events.reduce((max, e) => Math.max(max, e.t), 0);
}
