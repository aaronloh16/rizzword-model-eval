import { cellKey, entryCells, renumber } from "./grid";
import type { Entry, Puzzle } from "./types";

export interface ValidationIssue {
  level: "error" | "warning";
  code: string;
  message: string;
  entry?: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

export const LIMITS = {
  maxRows: 15,
  maxCols: 15,
  minEntries: 6,
  maxEntries: 30,
  minAnswerLength: 3,
  maxClueLength: 120,
} as const;

const ANSWER_RE = /^[A-Z]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate a crossword grid *and* its clues. Checks, in order:
 *  - shape: bounds, answer charset, minimum lengths, entry count
 *  - grid: crossing letters agree, every run of 2+ letters is a real entry
 *    (no accidental words), every entry crosses another, the grid is connected
 *  - numbering: matches standard row-major crossword numbering
 *  - clues: present, short enough, don't leak the answer, answers unique
 */
export function validatePuzzle(puzzle: Puzzle): ValidationResult {
  const issues: ValidationIssue[] = [];
  const err = (code: string, message: string, entry?: string) =>
    issues.push({ level: "error", code, message, entry });
  const warn = (code: string, message: string, entry?: string) =>
    issues.push({ level: "warning", code, message, entry });

  if (!DATE_RE.test(puzzle.id)) err("bad-id", `Puzzle id "${puzzle.id}" must be YYYY-MM-DD`);
  if (!puzzle.title?.trim()) err("no-title", "Puzzle needs a title");
  if (puzzle.rows < 3 || puzzle.rows > LIMITS.maxRows || puzzle.cols < 3 || puzzle.cols > LIMITS.maxCols) {
    err("bad-size", `Grid ${puzzle.rows}x${puzzle.cols} outside 3..${LIMITS.maxRows}`);
  }
  if (puzzle.entries.length < LIMITS.minEntries || puzzle.entries.length > LIMITS.maxEntries) {
    err("entry-count", `Expected ${LIMITS.minEntries}-${LIMITS.maxEntries} entries, got ${puzzle.entries.length}`);
  }

  // --- shape ---
  const ids = new Set<string>();
  for (const e of puzzle.entries) {
    if (ids.has(e.id)) err("dup-id", `Duplicate entry id ${e.id}`, e.id);
    ids.add(e.id);
    if (!ANSWER_RE.test(e.answer)) err("bad-answer", `${e.id} answer "${e.answer}" must be A-Z only`, e.id);
    if (e.answer.length < LIMITS.minAnswerLength) err("short-answer", `${e.id} is shorter than ${LIMITS.minAnswerLength}`, e.id);
    const end = entryCells(e).at(-1)!;
    if (e.row < 0 || e.col < 0 || end.row >= puzzle.rows || end.col >= puzzle.cols) {
      err("out-of-bounds", `${e.id} runs off the ${puzzle.rows}x${puzzle.cols} grid`, e.id);
    }
  }
  const fatal = new Set(["dup-id", "bad-answer", "out-of-bounds", "bad-size"]);
  if (issues.some((i) => fatal.has(i.code))) return { ok: false, issues };

  // --- grid letters ---
  const letters = new Map<string, string>();
  const owners = new Map<string, Entry[]>();
  for (const e of puzzle.entries) {
    entryCells(e).forEach(({ row, col }, i) => {
      const k = cellKey(row, col);
      const prev = letters.get(k);
      if (prev && prev !== e.answer[i]) {
        err("conflict", `${e.id} puts ${e.answer[i]} at (${row},${col}) but a crossing entry has ${prev}`, e.id);
      }
      letters.set(k, e.answer[i]);
      owners.set(k, [...(owners.get(k) ?? []), e]);
    });
  }
  for (const [k, list] of owners) {
    const dirs = list.map((e) => e.direction);
    if (new Set(dirs).size !== dirs.length) err("overlap", `Two entries in the same direction share cell (${k})`);
  }

  // Every maximal run of >= 2 letters must be exactly one entry.
  const entryAt = new Map(puzzle.entries.map((e) => [`${e.direction}:${e.row},${e.col}:${e.answer.length}`, e]));
  const has = (r: number, c: number) => letters.has(cellKey(r, c));
  for (const direction of ["across", "down"] as const) {
    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        const [pr, pc] = direction === "across" ? [r, c - 1] : [r - 1, c];
        if (!has(r, c) || has(pr, pc)) continue;
        let len = 0;
        while (direction === "across" ? has(r, c + len) : has(r + len, c)) len++;
        if (len < 2) continue;
        if (!entryAt.has(`${direction}:${r},${c}:${len}`)) {
          const word = Array.from({ length: len }, (_, i) =>
            letters.get(direction === "across" ? cellKey(r, c + i) : cellKey(r + i, c)),
          ).join("");
          err("accidental-word", `Unclued ${direction} run "${word}" at (${r},${c})`);
        }
      }
    }
  }

  // Every entry crosses something, and the whole grid is one connected piece.
  for (const e of puzzle.entries) {
    const crosses = entryCells(e).some(({ row, col }) => (owners.get(cellKey(row, col))?.length ?? 0) > 1);
    if (!crosses) err("uncrossed", `${e.id} doesn't cross any other entry`, e.id);
  }
  if (puzzle.entries.length) {
    const seen = new Set<string>([puzzle.entries[0].id]);
    const queue = [puzzle.entries[0]];
    while (queue.length) {
      const e = queue.pop()!;
      for (const { row, col } of entryCells(e)) {
        for (const other of owners.get(cellKey(row, col)) ?? []) {
          if (!seen.has(other.id)) {
            seen.add(other.id);
            queue.push(other);
          }
        }
      }
    }
    if (seen.size !== puzzle.entries.length) err("disconnected", "Grid has islands that don't connect");
  }

  // --- numbering ---
  const expected = new Map(renumber(puzzle.entries).map((e) => [`${e.direction}:${e.row},${e.col}`, e]));
  for (const e of puzzle.entries) {
    const want = expected.get(`${e.direction}:${e.row},${e.col}`)!;
    if (want.number !== e.number || want.id !== e.id) {
      err("numbering", `${e.id} should be numbered ${want.id}`, e.id);
    }
  }

  // --- clues ---
  const answers = new Set<string>();
  for (const e of puzzle.entries) {
    const clue = e.clue.trim();
    if (!clue) err("no-clue", `${e.id} has no clue`, e.id);
    if (clue.length > LIMITS.maxClueLength) err("long-clue", `${e.id} clue is ${clue.length} chars`, e.id);
    const squashed = clue.toUpperCase().replace(/[^A-Z]/g, "");
    if (squashed.includes(e.answer)) err("clue-leak", `${e.id} clue contains its answer`, e.id);
    if (answers.has(e.answer)) err("dup-answer", `${e.answer} is used twice`, e.id);
    answers.add(e.answer);
    if (/\b(fill in|answer is)\b/i.test(clue)) warn("meta-clue", `${e.id} clue talks about itself`, e.id);
  }

  return { ok: !issues.some((i) => i.level === "error"), issues };
}

export function assertValidPuzzle(puzzle: Puzzle): Puzzle {
  const { ok, issues } = validatePuzzle(puzzle);
  if (!ok) {
    throw new Error(
      `Puzzle ${puzzle.id} is invalid:\n` +
        issues.filter((i) => i.level === "error").map((i) => `  - [${i.code}] ${i.message}`).join("\n"),
    );
  }
  return puzzle;
}
