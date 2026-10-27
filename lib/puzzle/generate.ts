import { cellKey, renumber } from "./grid";
import type { Direction, Entry, Puzzle } from "./types";
import { validatePuzzle } from "./validate";

export interface BankWord {
  answer: string;
  clue: string;
}

export interface GenerateOptions {
  id: string;
  issue: number;
  title: string;
  bank: BankWord[];
  /** Target number of entries. The generator stops early if nothing fits. */
  targetEntries?: number;
  /** Max grid dimension after cropping. */
  maxSize?: number;
  /** Answers to avoid (e.g. used in the last few days). */
  avoid?: Set<string>;
  attempts?: number;
}

/** Small, fast, deterministic PRNG (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function shuffle<T>(items: T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Placed {
  word: BankWord;
  row: number;
  col: number;
  direction: Direction;
}

const CANVAS = 31;

/**
 * Greedy freeform crossword builder.
 *
 * Place a long seed word, then repeatedly try to cross a new word through an
 * existing letter. A placement is legal only if it doesn't touch other words
 * side-on (no accidental two-letter runs) and doesn't extend another word.
 * Among legal placements we prefer more crossings and a squarer bounding box.
 * Multiple seeded attempts; the best valid grid wins.
 */
export function generatePuzzle(opts: GenerateOptions): Puzzle {
  const { bank, targetEntries = 14, maxSize = 13, avoid = new Set(), attempts = 60 } = opts;
  const rand = rng(hashString(opts.id));
  const pool = bank.filter((w) => !avoid.has(w.answer) && w.answer.length <= maxSize);

  let best: Puzzle | null = null;
  let bestScore = -Infinity;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const words = shuffle(pool, rand);
    const placed = build(words, targetEntries, maxSize, rand);
    if (placed.length < 6) continue;
    const puzzle = toPuzzle(placed, opts);
    if (!validatePuzzle(puzzle).ok) continue;
    const crossings = countCrossings(puzzle);
    const area = puzzle.rows * puzzle.cols;
    const score = placed.length * 10 + crossings * 4 - area * 0.15 - Math.abs(puzzle.rows - puzzle.cols) * 2;
    if (score > bestScore) {
      bestScore = score;
      best = puzzle;
    }
  }
  if (!best) throw new Error(`Could not generate a valid puzzle for ${opts.id}`);
  return best;
}

function build(words: BankWord[], target: number, maxSize: number, rand: () => number): Placed[] {
  const grid = new Map<string, string>();
  const placed: Placed[] = [];
  const seed = words.find((w) => w.answer.length >= 6 && w.answer.length <= maxSize) ?? words[0];
  const mid = Math.floor(CANVAS / 2);
  commit(grid, placed, { word: seed, row: mid, col: mid - Math.floor(seed.answer.length / 2), direction: "across" });

  const remaining = words.filter((w) => w !== seed);
  let stalled = 0;
  while (placed.length < target && remaining.length && stalled < remaining.length) {
    const word = remaining.shift()!;
    const options = candidatePlacements(grid, word, maxSize, placed);
    if (!options.length) {
      remaining.push(word);
      stalled++;
      continue;
    }
    stalled = 0;
    options.sort((a, b) => b.score - a.score);
    // A touch of randomness among the top choices keeps puzzles varied.
    const pick = options[Math.floor(rand() * Math.min(3, options.length))];
    commit(grid, placed, pick.placement);
  }
  return placed;
}

function commit(grid: Map<string, string>, placed: Placed[], p: Placed) {
  for (let i = 0; i < p.word.answer.length; i++) {
    const [r, c] = p.direction === "across" ? [p.row, p.col + i] : [p.row + i, p.col];
    grid.set(cellKey(r, c), p.word.answer[i]);
  }
  placed.push(p);
}

function bounds(placed: Placed[]) {
  let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
  for (const p of placed) {
    const len = p.word.answer.length;
    minR = Math.min(minR, p.row);
    minC = Math.min(minC, p.col);
    maxR = Math.max(maxR, p.direction === "down" ? p.row + len - 1 : p.row);
    maxC = Math.max(maxC, p.direction === "across" ? p.col + len - 1 : p.col);
  }
  return { minR, minC, maxR, maxC };
}

function candidatePlacements(grid: Map<string, string>, word: BankWord, maxSize: number, placed: Placed[]) {
  const out: { placement: Placed; score: number }[] = [];
  const w = word.answer;
  for (const [key, letter] of grid) {
    const [r, c] = key.split(",").map(Number);
    for (let i = 0; i < w.length; i++) {
      if (w[i] !== letter) continue;
      for (const direction of ["across", "down"] as const) {
        const row = direction === "across" ? r : r - i;
        const col = direction === "across" ? c - i : c;
        const crossings = legalCrossings(grid, w, row, col, direction);
        if (crossings < 1) continue;
        const placement: Placed = { word, row, col, direction };
        const b = bounds([...placed, placement]);
        const h = b.maxR - b.minR + 1;
        const wd = b.maxC - b.minC + 1;
        if (h > maxSize || wd > maxSize) continue;
        out.push({ placement, score: crossings * 10 - h * wd * 0.2 - Math.abs(h - wd) });
      }
    }
  }
  return out;
}

/** Returns the number of crossings for a legal placement, or -1 if illegal. */
function legalCrossings(grid: Map<string, string>, w: string, row: number, col: number, dir: Direction): number {
  const at = (r: number, c: number) => grid.get(cellKey(r, c));
  const step = (i: number): [number, number] => (dir === "across" ? [row, col + i] : [row + i, col]);
  const [br, bc] = step(-1);
  const [ar, ac] = step(w.length);
  if (at(br, bc) || at(ar, ac)) return -1; // would extend another word
  let crossings = 0;
  for (let i = 0; i < w.length; i++) {
    const [r, c] = step(i);
    const existing = at(r, c);
    if (existing) {
      if (existing !== w[i]) return -1;
      crossings++;
      continue;
    }
    // Empty cell: its side neighbours must be empty, or we'd create a 2-letter run.
    const sides: [number, number][] = dir === "across" ? [[r - 1, c], [r + 1, c]] : [[r, c - 1], [r, c + 1]];
    if (sides.some(([sr, sc]) => at(sr, sc))) return -1;
  }
  if (crossings === w.length) return -1; // fully overlapping an existing word
  return crossings;
}

function toPuzzle(placed: Placed[], opts: GenerateOptions): Puzzle {
  const b = bounds(placed);
  const raw = placed.map((p) => ({
    direction: p.direction,
    row: p.row - b.minR,
    col: p.col - b.minC,
    answer: p.word.answer,
    clue: p.word.clue,
  }));
  const entries: Entry[] = renumber(raw)
    .map((e) => ({ id: e.id, number: e.number, direction: e.direction, row: e.row, col: e.col, answer: e.answer, clue: e.clue }))
    .sort((a, b2) => (a.direction === b2.direction ? a.number - b2.number : a.direction === "across" ? -1 : 1));
  return {
    id: opts.id,
    issue: opts.issue,
    title: opts.title,
    rows: b.maxR - b.minR + 1,
    cols: b.maxC - b.minC + 1,
    entries,
  };
}

function countCrossings(p: Puzzle): number {
  const seen = new Map<string, number>();
  for (const e of p.entries) {
    for (let i = 0; i < e.answer.length; i++) {
      const k = e.direction === "across" ? cellKey(e.row, e.col + i) : cellKey(e.row + i, e.col);
      seen.set(k, (seen.get(k) ?? 0) + 1);
    }
  }
  return [...seen.values()].filter((n) => n > 1).length;
}
