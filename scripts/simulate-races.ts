/**
 * Write *simulated* race transcripts for any puzzle that has no race yet.
 * Real recordings (source: "live") are never overwritten.
 *
 *   pnpm race:simulate            # fill gaps
 *   pnpm race:simulate --force    # rewrite all simulated transcripts
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { WORD_BANK } from "../data/wordbank";
import { DAILY_LINEUP, getModel } from "../lib/models";
import { simulateRace } from "../lib/race/simulate";
import { RACE_DIR, readPuzzles, writeJson, writeManifest } from "./lib/files";

const { values } = parseArgs({ options: { force: { type: "boolean", default: false } } });
const models = DAILY_LINEUP.map((id) => getModel(id)!);
const decoys = WORD_BANK.map((w) => w.answer);

for (const puzzle of readPuzzles()) {
  const path = join(RACE_DIR, `${puzzle.id}.json`);
  if (existsSync(path)) {
    const current = JSON.parse(readFileSync(path, "utf8"));
    if (current.source === "live" || !values.force) continue;
  }
  writeJson(path, simulateRace(puzzle, models, decoys));
  console.log(`~ simulated ${puzzle.id}`);
}
writeManifest();
