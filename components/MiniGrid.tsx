"use client";

import { memo, useMemo } from "react";
import { buildSolution, cellKey, entryCells } from "@/lib/puzzle/grid";
import type { Puzzle } from "@/lib/puzzle/types";
import type { CellFill } from "@/lib/race/state";

interface MiniGridProps {
  puzzle: Puzzle;
  cells: Map<string, CellFill>;
  /** Bumps whenever `cells` changes; lets memo skip re-rendering every clock tick. */
  version: number;
  /** Entry id to outline (the one the model just answered). */
  activeEntry?: string | null;
  accent?: string;
  /** Show the true answer faintly in empty cells (end-of-race reveal). */
  reveal?: boolean;
  className?: string;
}

/**
 * Read-only grid used in race lanes. Letters pop in when they land; colour
 * tells you right (lime) vs wrong (pink). Purely visual — the lane card
 * exposes a text summary to screen readers.
 */
export const MiniGrid = memo(function MiniGrid({ puzzle, cells, activeEntry, accent = "#c6ff3d", reveal, className }: MiniGridProps) {
  const layout = useMemo(() => {
    const solution = buildSolution(puzzle);
    const numbers = new Map(puzzle.entries.map((e) => [cellKey(e.row, e.col), e.number]));
    return { solution, numbers };
  }, [puzzle]);

  const active = useMemo(() => {
    const entry = puzzle.entries.find((e) => e.id === activeEntry);
    return new Set(entry ? entryCells(entry).map((c) => cellKey(c.row, c.col)) : []);
  }, [puzzle, activeEntry]);

  return (
    <div
      aria-hidden
      className={`grid w-full gap-[2px] ${className ?? ""}`}
      style={{ gridTemplateColumns: `repeat(${puzzle.cols}, minmax(0, 1fr))`, containerType: "inline-size" }}
    >
      {layout.solution.flatMap((row, r) =>
        row.map((sol, c) => {
          const k = cellKey(r, c);
          if (sol === null) return <div key={k} className="aspect-square" />;
          const fill = cells.get(k);
          const num = layout.numbers.get(k);
          const isActive = active.has(k);
          const bg = fill ? (fill.correct ? "bg-correct" : "bg-wrong") : "bg-paper";
          return (
            <div
              key={k}
              className={`relative aspect-square overflow-hidden rounded-[3px] ${bg} text-paper-ink transition-colors duration-300`}
              style={isActive ? { boxShadow: `0 0 0 2px ${accent}`, zIndex: 1 } : undefined}
            >
              {num !== undefined && (
                <span className="absolute left-[2px] top-0 font-mono leading-none text-paper-ink/60" style={{ fontSize: `max(5px, ${26 / puzzle.cols}cqi)` }}>
                  {num}
                </span>
              )}
              {fill ? (
                <span
                  key={`${fill.letter}-${fill.at}`}
                  className="cell-fill absolute inset-0 grid place-items-center font-display font-extrabold leading-none"
                  style={{ fontSize: `max(8px, ${62 / puzzle.cols}cqi)` }}
                >
                  {fill.letter}
                </span>
              ) : reveal ? (
                <span className="absolute inset-0 grid place-items-center font-display font-bold leading-none text-paper-ink/25" style={{ fontSize: `max(8px, ${62 / puzzle.cols}cqi)` }}>
                  {sol}
                </span>
              ) : null}
            </div>
          );
        }),
      )}
    </div>
  );
}, (a, b) =>
  a.puzzle === b.puzzle && a.version === b.version && a.activeEntry === b.activeEntry && a.reveal === b.reveal && a.accent === b.accent,
);
