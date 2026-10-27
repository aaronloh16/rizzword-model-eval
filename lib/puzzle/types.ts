export type Direction = "across" | "down";

/** A single crossword answer slot. `id` is the conventional "1A" / "4D" label. */
export interface Entry {
  id: string;
  number: number;
  direction: Direction;
  row: number;
  col: number;
  answer: string;
  clue: string;
}

export interface Puzzle {
  /** ISO date (YYYY-MM-DD). One puzzle per day. */
  id: string;
  /** Sequential issue number, starting at 1. */
  issue: number;
  title: string;
  rows: number;
  cols: number;
  entries: Entry[];
}

/** A cell in the solution grid. `null` = black square. */
export type SolutionGrid = (string | null)[][];

export interface CellRef {
  row: number;
  col: number;
}
