import type { CellRef, Direction, Entry, Puzzle, SolutionGrid } from "./types";

export const cellKey = (row: number, col: number) => `${row},${col}`;

export function entryCells(entry: Pick<Entry, "row" | "col" | "direction" | "answer">): CellRef[] {
  const cells: CellRef[] = [];
  for (let i = 0; i < entry.answer.length; i++) {
    cells.push(
      entry.direction === "across"
        ? { row: entry.row, col: entry.col + i }
        : { row: entry.row + i, col: entry.col },
    );
  }
  return cells;
}

/** Build the solution grid. Conflicting letters throw — call `validatePuzzle` for friendly errors. */
export function buildSolution(puzzle: Pick<Puzzle, "rows" | "cols" | "entries">): SolutionGrid {
  const grid: SolutionGrid = Array.from({ length: puzzle.rows }, () =>
    Array<string | null>(puzzle.cols).fill(null),
  );
  for (const entry of puzzle.entries) {
    entryCells(entry).forEach(({ row, col }, i) => {
      const letter = entry.answer[i];
      const existing = grid[row]?.[col];
      if (existing === undefined) throw new Error(`${entry.id} runs off the grid`);
      if (existing !== null && existing !== letter) {
        throw new Error(`${entry.id} conflicts at (${row},${col}): ${existing} vs ${letter}`);
      }
      grid[row][col] = letter;
    });
  }
  return grid;
}

/** Map of cell key -> clue number for cells that start an entry. */
export function cellNumbers(puzzle: Pick<Puzzle, "entries">): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of puzzle.entries) map.set(cellKey(e.row, e.col), e.number);
  return map;
}

/** For each cell, which entries pass through it. */
export function cellEntries(puzzle: Pick<Puzzle, "entries">): Map<string, { across?: Entry; down?: Entry }> {
  const map = new Map<string, { across?: Entry; down?: Entry }>();
  for (const e of puzzle.entries) {
    for (const { row, col } of entryCells(e)) {
      const k = cellKey(row, col);
      const slot = map.get(k) ?? {};
      slot[e.direction] = e;
      map.set(k, slot);
    }
  }
  return map;
}

/** Entries sorted the way a printed crossword lists them. */
export function sortedEntries(entries: Entry[], direction?: Direction): Entry[] {
  return entries
    .filter((e) => !direction || e.direction === direction)
    .sort((a, b) =>
      a.direction === b.direction ? a.number - b.number : a.direction === "across" ? -1 : 1,
    );
}

/**
 * Standard crossword numbering: scan row-major, any cell that starts an across
 * or down entry gets the next number. Returns entries with corrected numbers/ids.
 */
export function renumber<T extends Omit<Entry, "number" | "id">>(entries: T[]): (T & Pick<Entry, "number" | "id">)[] {
  const starts = [...new Set(entries.map((e) => cellKey(e.row, e.col)))]
    .map((k) => k.split(",").map(Number) as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const numberOf = new Map(starts.map(([r, c], i) => [cellKey(r, c), i + 1]));
  return entries.map((e) => {
    const number = numberOf.get(cellKey(e.row, e.col))!;
    return { ...e, number, id: `${number}${e.direction === "across" ? "A" : "D"}` };
  });
}

/** Pattern like "S_G_A" given a sparse map of known letters. */
export function patternFor(entry: Entry, letters: Map<string, string>): string {
  return entryCells(entry)
    .map(({ row, col }) => letters.get(cellKey(row, col)) ?? "_")
    .join("");
}
