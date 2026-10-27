/**
 * Record a REAL race through Vercel AI Gateway (or OpenRouter) and commit it as a replay.
 *
 *   AI_GATEWAY_API_KEY=... pnpm race:record                 # today's (latest) puzzle, daily lineup
 *   pnpm race:record --date 2026-10-27 --models gpt-6-luna,claude-haiku-5.5
 *   pnpm race:record --dry-run                              # print the prompt + cost ceiling, no calls
 *
 * Costs real money (roughly $0.05–0.30 for the daily lineup). Prints a cost
 * ceiling before starting and refuses to run above --max-usd (default 1.00).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { DAILY_LINEUP, getModel } from "../lib/models";
import { assertValidPuzzle } from "../lib/puzzle/validate";
import { DEFAULT_SETTINGS, runRace, transcriptHeader } from "../lib/race/engine";
import { INSTRUCTIONS, puzzlePrompt } from "../lib/race/prompt";
import { worstCaseCost } from "../lib/race/guards";
import { deriveRace } from "../lib/race/state";
import type { RaceEvent, RaceTranscript } from "../lib/race/types";
import { RACE_DIR, ROOT, readPuzzles, writeJson, writeManifest } from "./lib/files";

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(join(ROOT, file));
  } catch {}
}

const { values } = parseArgs({
  options: {
    date: { type: "string" },
    models: { type: "string" },
    "max-usd": { type: "string", default: "1.00" },
    "dry-run": { type: "boolean", default: false },
  },
});

const puzzles = readPuzzles();
const puzzle = assertValidPuzzle(
  values.date ? puzzles.find((p) => p.id === values.date)! : puzzles[puzzles.length - 1],
);
if (!puzzle) throw new Error(`No puzzle for ${values.date}`);

const ids = values.models ? values.models.split(",").map((s) => s.trim()) : [...DAILY_LINEUP];
const models = ids.map((id) => {
  const m = getModel(id);
  if (!m) throw new Error(`Unknown model "${id}". See lib/models.ts`);
  return m;
});

const ceiling = worstCaseCost(puzzle, models, DEFAULT_SETTINGS.maxOutputTokens);
console.log(`Puzzle ${puzzle.id} "${puzzle.title}" — ${models.map((m) => m.name).join(", ")}`);
console.log(`Worst-case cost: $${ceiling.toFixed(3)} (cap $${values["max-usd"]})`);

if (values["dry-run"]) {
  console.log("\n--- instructions ---\n" + INSTRUCTIONS + "\n\n--- prompt ---\n" + puzzlePrompt(puzzle));
  process.exit(0);
}
if (ceiling > Number(values["max-usd"])) {
  console.error("Refusing: worst case exceeds --max-usd.");
  process.exit(1);
}
if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN && !process.env.OPENROUTER_API_KEY) {
  console.error("Set AI_GATEWAY_API_KEY (or OPENROUTER_API_KEY, or run `vercel env pull` for an OIDC token).");
  process.exit(1);
}

const events: RaceEvent[] = [];
await runRace({
  puzzle,
  models,
  onEvent: (e) => {
    events.push(e);
    if (e.type === "fill") process.stdout.write(`  ${String(e.t).padStart(6)}ms  ${e.model.padEnd(22)} ${e.entry}: ${e.answer}\n`);
    if (e.type === "done") console.log(`  ${String(e.t).padStart(6)}ms  ${e.model.padEnd(22)} done ($${e.costUsd.toFixed(4)})`);
    if (e.type === "error") console.log(`  ${String(e.t).padStart(6)}ms  ${e.model.padEnd(22)} ERROR ${e.message}`);
  },
});

const transcript: RaceTranscript = { ...transcriptHeader(puzzle, models, DEFAULT_SETTINGS), source: "live", events };
const state = deriveRace(puzzle, transcript.models, events);
console.log("\nStandings:");
state.standings.forEach((id, i) => {
  const lane = state.lanes.find((l) => l.model.id === id)!;
  console.log(`  ${i + 1}. ${lane.model.name.padEnd(22)} ${lane.correctEntries}/${state.totalEntries}  ${((lane.finishedAt ?? 0) / 1000).toFixed(1)}s`);
});

const path = join(RACE_DIR, `${puzzle.id}.json`);
const previous = (() => {
  try {
    return JSON.parse(readFileSync(path, "utf8")).source;
  } catch {
    return null;
  }
})();
writeJson(path, transcript);
writeManifest();
console.log(`\nSaved ${path}${previous ? ` (replaced ${previous} transcript)` : ""}. Commit it to publish the replay.`);
