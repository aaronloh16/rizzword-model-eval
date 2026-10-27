"use client";

import { useMemo } from "react";
import { LaneCard } from "@/components/LaneCard";
import { modelColor } from "@/lib/models";
import type { Puzzle } from "@/lib/puzzle/types";
import { deriveRace, type RaceState } from "@/lib/race/state";
import type { RaceEvent, RaceModelRef } from "@/lib/race/types";

interface RaceBoardProps {
  puzzle: Puzzle;
  models: RaceModelRef[];
  events: RaceEvent[];
  now: number;
  pick?: string | null;
}

/** Side-by-side lanes for every model, plus a sticky standings strip. */
export function RaceBoard({ puzzle, models, events, now, pick }: RaceBoardProps) {
  const state = useMemo(() => deriveRace(puzzle, models, events, now), [puzzle, models, events, now]);
  const rank = (id: string) => state.standings.indexOf(id) + 1;

  return (
    <div>
      <Standings state={state} />
      <Announcer state={state} />
      <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-3">
        {models.map((m) => {
          const lane = state.lanes.find((l) => l.model.id === m.id)!;
          return (
            <div key={m.id} className="w-[85vw] max-w-[380px] shrink-0 snap-center md:w-auto md:max-w-none">
              <LaneCard puzzle={puzzle} lane={lane} rank={rank(m.id)} now={now} raceOver={state.allDone} picked={pick === m.id} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Compact live leaderboard. On mobile it doubles as the lane navigator. */
function Standings({ state }: { state: RaceState }) {
  return (
    <ol aria-label="Standings" className="scrollbar-none mb-4 flex gap-2 overflow-x-auto">
      {state.standings.map((id, i) => {
        const lane = state.lanes.find((l) => l.model.id === id)!;
        const pct = lane.correctEntries / state.totalEntries;
        return (
          <li
            key={id}
            className="relative flex shrink-0 items-center gap-2 overflow-hidden rounded-full border border-line bg-panel py-1 pl-1 pr-3 text-xs transition-[order] duration-300"
            style={{ order: i }}
          >
            <span className="grid size-6 place-items-center rounded-full font-mono text-[10px] font-bold text-ink" style={{ background: modelColor(id) }}>
              {i + 1}
            </span>
            <span className="font-semibold">{lane.model.name}</span>
            <span className="font-mono tabular text-dim">
              {lane.correctEntries}/{state.totalEntries}
            </span>
            <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ width: `${pct * 100}%`, background: modelColor(id) }} />
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Screen-reader commentary, derived purely from state. The text only changes
 * when the leader changes or someone finishes, so the live region never spams.
 */
function Announcer({ state }: { state: RaceState }) {
  const leader = state.lanes.find((l) => l.model.id === state.standings[0]);
  const finished = state.lanes.filter((l) => l.status === "done" || l.status === "error");
  let message = "";
  if (state.allDone && leader) message = `Race over. ${leader.model.name} wins with ${leader.correctEntries} of ${state.totalEntries}.`;
  else if (leader && leader.correctEntries > 0) {
    message = `${leader.model.name} leads.`;
    if (finished.length) message += ` Finished: ${finished.map((l) => l.model.name).join(", ")}.`;
  }
  return (
    <p className="sr-only" aria-live="polite">
      {message}
    </p>
  );
}
