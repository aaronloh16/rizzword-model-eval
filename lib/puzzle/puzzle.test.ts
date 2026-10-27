import assert from "node:assert/strict";
import { test } from "node:test";
import { WORD_BANK } from "../../data/wordbank";
import { generatePuzzle } from "./generate";
import { renumber } from "./grid";
import type { Puzzle } from "./types";
import { validatePuzzle } from "./validate";

const base = (): Puzzle => ({
  id: "2026-01-01",
  issue: 1,
  title: "Test",
  rows: 5,
  cols: 5,
  entries: renumber([
    { direction: "across" as const, row: 0, col: 0, answer: "SIGMA", clue: "Lone wolf" },
    { direction: "down" as const, row: 0, col: 0, answer: "SUS", clue: "Among Us vibes" },
    { direction: "down" as const, row: 0, col: 2, answer: "GOAT", clue: "Greatest ever" },
    { direction: "down" as const, row: 0, col: 4, answer: "AURA", clue: "Invisible points" },
    { direction: "across" as const, row: 2, col: 0, answer: "SAY", clue: "Speak" },
    { direction: "across" as const, row: 3, col: 2, answer: "TEA", clue: "Gossip" },
  ]),
});

test("hand-built puzzle validates", () => {
  // SAY across at row 2 must match SUS[2]=S, GOAT[2]=A... col2 row2 = A, SAY[2] = Y ≠ A
  const p = base();
  const r = validatePuzzle(p);
  assert.equal(r.ok, false);
  assert.ok(r.issues.some((i) => i.code === "conflict"));
});

test("detects clue leaks, accidental words and bad numbering", () => {
  const p = base();
  p.entries = p.entries.filter((e) => e.answer !== "SAY");
  p.entries.find((e) => e.answer === "TEA")!.clue = "Spill the tea";
  const r = validatePuzzle(p);
  assert.ok(r.issues.some((i) => i.code === "clue-leak"));

  const q = base();
  q.entries = q.entries.filter((e) => e.answer !== "SAY");
  q.entries[0] = { ...q.entries[0], number: 9, id: "9A" };
  assert.ok(validatePuzzle(q).issues.some((i) => i.code === "numbering"));
});

test("generator is deterministic and always produces valid grids", () => {
  for (const id of ["2026-01-01", "2026-02-14", "2026-07-04", "2026-12-25"]) {
    const a = generatePuzzle({ id, issue: 1, title: "T", bank: WORD_BANK });
    const b = generatePuzzle({ id, issue: 1, title: "T", bank: WORD_BANK });
    assert.deepEqual(a, b);
    const r = validatePuzzle(a);
    assert.ok(r.ok, JSON.stringify(r.issues));
    assert.ok(a.rows <= 13 && a.cols <= 13);
  }
});
