import assert from "node:assert/strict";
import { test } from "node:test";
import { WORD_BANK } from "../../data/wordbank";
import { DAILY_LINEUP, getModel } from "../models";
import { generatePuzzle } from "../puzzle/generate";
import { AnswerStreamParser, parseAnswerLine } from "./parse";
import { simulateRace } from "./simulate";
import { deriveRace } from "./state";

test("parses common answer line shapes", () => {
  assert.deepEqual(parseAnswerLine("1A: SIGMA"), { entry: "1A", answer: "SIGMA" });
  assert.deepEqual(parseAnswerLine("**12D:** no cap"), { entry: "12D", answer: "NOCAP" });
  assert.deepEqual(parseAnswerLine("3 Across - Rizz"), { entry: "3A", answer: "RIZZ" });
  assert.deepEqual(parseAnswerLine("- 4d = touch-grass."), { entry: "4D", answer: "TOUCHGRASS" });
  assert.equal(parseAnswerLine("Let me think about 1A"), null);
  assert.equal(parseAnswerLine("99A: NOPE", new Set(["1A"])), null);
});

test("stream parser only commits complete lines", () => {
  const p = new AnswerStreamParser([{ id: "1A" }, { id: "2D" }]);
  assert.deepEqual(p.push("1A: SIG"), []);
  assert.deepEqual(p.push("MA\n2D: AU"), [{ entry: "1A", answer: "SIGMA" }]);
  assert.deepEqual(p.push("RA"), []);
  assert.deepEqual(p.end(), [{ entry: "2D", answer: "AURA" }]);
});

test("replay state is consistent with the event log", () => {
  const puzzle = generatePuzzle({ id: "2026-03-03", issue: 1, title: "T", bank: WORD_BANK });
  const models = DAILY_LINEUP.map((id) => getModel(id)!);
  const race = simulateRace(puzzle, models, WORD_BANK.map((w) => w.answer));
  const end = deriveRace(puzzle, race.models, race.events);
  assert.equal(end.allDone, true);
  assert.equal(end.standings.length, models.length);
  const first = end.lanes.find((l) => l.model.id === end.standings[0])!;
  for (const lane of end.lanes) assert.ok(first.correctEntries >= lane.correctEntries);

  const start = deriveRace(puzzle, race.models, race.events, 0);
  assert.ok(start.lanes.every((l) => l.cells.size === 0));
  assert.equal(start.allDone, false);
});
