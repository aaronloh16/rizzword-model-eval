/**
 * Generate daily puzzles from the word bank.
 *
 *   pnpm puzzles:generate                      # fill any missing days up to today
 *   pnpm puzzles:generate --from 2026-10-20 --to 2026-11-02
 *   pnpm puzzles:generate --date 2026-10-28 --force
 *
 * Each puzzle is seeded by its date, so regenerating is deterministic. Answers
 * used in the previous 3 days are avoided. Every puzzle is validated before
 * it's written.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { WORD_BANK } from "../data/wordbank";
import { generatePuzzle } from "../lib/puzzle/generate";
import { assertValidPuzzle } from "../lib/puzzle/validate";
import { PUZZLE_DIR, readPuzzles, writeJson, writeManifest } from "./lib/files";

const FIRST_ISSUE = "2026-10-20";
const TITLES = [
  "Rizz Check", "Aura Audit", "Certified Ohio Moment", "Let Him Cook", "No Cap Zone",
  "Main Character Hours", "Sigma Grindset", "Delulu Is the Solulu", "Mid or Fire", "Touch Grass Edition",
  "Fanum Tax Season", "Skibidi Sunday", "Lock-In Monday", "Brainrot Bootcamp", "Glaze Week",
];

const { values } = parseArgs({
  options: {
    from: { type: "string" },
    to: { type: "string" },
    date: { type: "string" },
    force: { type: "boolean", default: false },
  },
});

const today = new Date().toISOString().slice(0, 10);
const from = values.date ?? values.from ?? FIRST_ISSUE;
const to = values.date ?? values.to ?? today;

const existing = new Map(readPuzzles().map((p) => [p.id, p]));
let written = 0;

for (const date of days(from, to)) {
  const path = join(PUZZLE_DIR, `${date}.json`);
  if (existsSync(path) && !values.force) continue;
  const issue = dayIndex(FIRST_ISSUE, date) + 1;
  const avoid = new Set<string>();
  for (let back = 1; back <= 3; back++) {
    existing.get(shift(date, -back))?.entries.forEach((e) => avoid.add(e.answer));
  }
  const puzzle = assertValidPuzzle(
    generatePuzzle({
      id: date,
      issue,
      title: TITLES[(issue - 1) % TITLES.length],
      bank: WORD_BANK,
      avoid,
    }),
  );
  writeJson(path, puzzle);
  existing.set(date, puzzle);
  written++;
  console.log(`✓ ${date}  #${issue} "${puzzle.title}"  ${puzzle.rows}x${puzzle.cols}, ${puzzle.entries.length} entries`);
}

writeManifest();
console.log(written ? `Wrote ${written} puzzle(s).` : "Nothing to do — all days present (use --force to regenerate).");

function days(a: string, b: string): string[] {
  const out: string[] = [];
  for (let d = a; d <= b; d = shift(d, 1)) out.push(d);
  return out;
}
function shift(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function dayIndex(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}
