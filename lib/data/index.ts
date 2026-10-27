import type { Puzzle } from "../puzzle/types";
import { deriveRace, raceDuration } from "../race/state";
import { summarizeLanes, type LaneSummary } from "../race/summary";
import type { RaceTranscript } from "../race/types";
import { PUZZLES, RACES } from "./manifest.generated";

export type { LaneSummary };

const puzzleById = new Map(PUZZLES.map((p) => [p.id, p]));
const raceById = new Map(RACES.map((r) => [r.puzzleId, r]));

export const allPuzzles = (): Puzzle[] => PUZZLES;
export const getPuzzle = (id: string): Puzzle | undefined => puzzleById.get(id);
export const getRace = (id: string): RaceTranscript | undefined => raceById.get(id);

/** "Today" is the newest committed puzzle, so the site never 404s on a stale day. */
export function latestPuzzle(): Puzzle {
  return PUZZLES[PUZZLES.length - 1];
}

export interface RaceSummary {
  date: string;
  issue: number;
  title: string;
  source: RaceTranscript["source"];
  durationMs: number;
  winner: LaneSummary;
  lanes: LaneSummary[];
}

export function summarizeRace(race: RaceTranscript): RaceSummary | null {
  const puzzle = getPuzzle(race.puzzleId);
  if (!puzzle) return null;
  const lanes = summarizeLanes(deriveRace(puzzle, race.models, race.events), puzzle);
  return {
    date: puzzle.id,
    issue: puzzle.issue,
    title: puzzle.title,
    source: race.source,
    durationMs: raceDuration(race.events),
    winner: lanes[0],
    lanes,
  };
}

export function history(): RaceSummary[] {
  return RACES.map(summarizeRace)
    .filter((s): s is RaceSummary => s !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export interface SeasonRow {
  id: string;
  name: string;
  color: string;
  races: number;
  wins: number;
  podiums: number;
  accuracy: number;
  avgTimeMs: number;
  avgCostUsd: number;
}

/** Aggregate standings across every recorded day. */
export function seasonTable(summaries = history()): SeasonRow[] {
  const rows = new Map<string, SeasonRow & { _t: number[]; _c: number[]; _a: number[] }>();
  for (const s of summaries) {
    for (const l of s.lanes) {
      const r =
        rows.get(l.id) ??
        { id: l.id, name: l.name, color: l.color, races: 0, wins: 0, podiums: 0, accuracy: 0, avgTimeMs: 0, avgCostUsd: 0, _t: [], _c: [], _a: [] };
      r.races++;
      if (l.rank === 1) r.wins++;
      if (l.rank <= 3) r.podiums++;
      r._a.push(l.correct / l.total);
      if (l.timeMs !== null) r._t.push(l.timeMs);
      if (l.costUsd !== null) r._c.push(l.costUsd);
      rows.set(l.id, r);
    }
  }
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  return [...rows.values()]
    .map(({ _t, _c, _a, ...r }) => ({ ...r, accuracy: avg(_a), avgTimeMs: avg(_t), avgCostUsd: avg(_c) }))
    .sort((a, b) => b.wins - a.wins || b.accuracy - a.accuracy || a.avgTimeMs - b.avgTimeMs);
}
