/**
 * CI gate: every committed puzzle and transcript must be valid, and every
 * word-bank clue must be clean. Exits non-zero on any error.
 */
import { WORD_BANK } from "../data/wordbank";
import { getModel } from "../lib/models";
import { validatePuzzle } from "../lib/puzzle/validate";
import { readPuzzles, readRaces } from "./lib/files";

let errors = 0;
const fail = (msg: string) => {
  errors++;
  console.error(`✗ ${msg}`);
};

// Word bank
const seen = new Set<string>();
for (const w of WORD_BANK) {
  if (!/^[A-Z]{3,11}$/.test(w.answer)) fail(`wordbank: "${w.answer}" must be 3-11 letters A-Z`);
  if (seen.has(w.answer)) fail(`wordbank: duplicate ${w.answer}`);
  seen.add(w.answer);
  if (w.clue.toUpperCase().replace(/[^A-Z]/g, "").includes(w.answer)) fail(`wordbank: clue for ${w.answer} leaks the answer`);
}

// Puzzles
const puzzles = readPuzzles();
for (const p of puzzles) {
  const { ok, issues } = validatePuzzle(p);
  for (const i of issues) (i.level === "error" ? fail : console.warn)(`${p.id}: [${i.code}] ${i.message}`);
  if (ok) console.log(`✓ puzzle ${p.id}  ${p.rows}x${p.cols}, ${p.entries.length} entries`);
}

// Transcripts
const byId = new Map(puzzles.map((p) => [p.id, p]));
for (const r of readRaces()) {
  const p = byId.get(r.puzzleId);
  if (!p) {
    fail(`race ${r.puzzleId}: no matching puzzle`);
    continue;
  }
  const ids = new Set(p.entries.map((e) => e.id));
  const models = new Set(r.models.map((m) => m.id));
  r.models.forEach((m) => getModel(m.id) || console.warn(`race ${r.puzzleId}: model ${m.id} no longer in roster (ok for history)`));
  let last = 0;
  for (const e of r.events) {
    if (e.t < last) fail(`race ${r.puzzleId}: events out of order at t=${e.t}`);
    last = e.t;
    if (!models.has(e.model)) fail(`race ${r.puzzleId}: event for unknown model ${e.model}`);
    if (e.type === "fill" && !ids.has(e.entry)) fail(`race ${r.puzzleId}: fill for unknown entry ${e.entry}`);
  }
  for (const m of models) {
    if (!r.events.some((e) => e.model === m && (e.type === "done" || e.type === "error"))) {
      fail(`race ${r.puzzleId}: ${m} never finished`);
    }
  }
  console.log(`✓ race   ${r.puzzleId}  ${r.source}, ${r.events.length} events`);
}

if (errors) {
  console.error(`\n${errors} error(s).`);
  process.exit(1);
}
console.log("\nAll puzzles, clues and transcripts valid.");
