import { modelColor } from "../models";
import type { Puzzle } from "../puzzle/types";
import type { RaceState } from "./state";

export interface LaneSummary {
  id: string;
  name: string;
  color: string;
  rank: number;
  correct: number;
  total: number;
  letterAccuracy: number;
  timeMs: number | null;
  firstAnswerMs: number | null;
  costUsd: number | null;
  costSource: "gateway" | "estimate" | null;
  tokensIn: number;
  tokensOut: number;
  reasoningTokens: number;
  revisions: number;
  error: string | null;
}

export function summarizeLanes(state: RaceState, puzzle: Puzzle): LaneSummary[] {
  return state.standings.map((id, i) => {
    const l = state.lanes.find((x) => x.model.id === id)!;
    return {
      id,
      name: l.model.name,
      color: modelColor(id),
      rank: i + 1,
      correct: l.correctEntries,
      total: puzzle.entries.length,
      letterAccuracy: state.totalLetters ? l.correctLetters / state.totalLetters : 0,
      timeMs: l.finishedAt,
      firstAnswerMs: l.firstFillAt !== null && l.startedAt !== null ? l.firstFillAt - l.startedAt : null,
      costUsd: l.costUsd,
      costSource: l.costSource,
      tokensIn: l.usage?.input ?? 0,
      tokensOut: l.usage?.output ?? 0,
      reasoningTokens: l.usage?.reasoning ?? 0,
      revisions: l.revisions,
      error: l.error,
    };
  });
}
