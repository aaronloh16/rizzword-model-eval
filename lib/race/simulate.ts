import type { ModelConfig } from "../models";
import { estimateCost } from "../models";
import { hashString, rng, shuffle } from "../puzzle/generate";
import { cellKey, entryCells } from "../puzzle/grid";
import type { Entry, Puzzle } from "../puzzle/types";
import { INSTRUCTIONS, PROMPT_VERSION, estimateTokens, puzzlePrompt } from "./prompt";
import type { RaceEvent, RaceTranscript } from "./types";

/**
 * Synthetic race transcripts.
 *
 * These exist so the site has something to replay before anyone has spent a
 * cent on real model calls. They are clearly flagged `source: "simulated"` and
 * the UI labels them as such. Every model gets the *same* skill distribution —
 * winners are dice rolls, not claims about real model quality. Only speed
 * differs by tier (reasoning flagships think longer before answering).
 *
 * Replace with real data via `pnpm race:record`.
 */
export function simulateRace(puzzle: Puzzle, models: ModelConfig[], decoys: string[]): RaceTranscript {
  const prompt = INSTRUCTIONS + puzzlePrompt(puzzle);
  const inputTokens = estimateTokens(prompt);
  const events: RaceEvent[] = [];

  for (const model of models) {
    const rand = rng(hashString(`${puzzle.id}:${model.id}`));
    const heavy = model.tier === "heavyweight";
    const skill = 0.8 + rand() * 0.15;
    const ttft = heavy ? 2200 + rand() * 4200 : 500 + rand() * 1200;
    const gap = () => (heavy ? 260 + rand() * 700 : 120 + rand() * 380);
    let t = 40 + Math.round(rand() * 160);
    events.push({ t, model: model.id, type: "start" });

    const known = new Map<string, string>();
    let thinkChars = 0;
    let answerChars = 0;
    const think = (text: string) => {
      thinkChars += text.length;
      events.push({ t: Math.round(t), model: model.id, type: "think", text });
    };

    // Easiest-first-ish: shorter answers float up, with noise.
    const order = shuffle(puzzle.entries, rand).sort(
      (a, b) => a.answer.length + rand() * 4 - (b.answer.length + rand() * 4),
    );

    think(`Scanning ${puzzle.entries.length} clues. `);
    t += ttft * 0.4;
    think("Start with the gimmes, then lean on crossings. ");
    t += ttft * 0.6;

    const misses: Entry[] = [];
    for (const entry of order) {
      const pattern = entryCells(entry).map(({ row, col }) => known.get(cellKey(row, col)) ?? "_").join("");
      const hint = pattern.replace(/_/g, "").length ? ` Have ${pattern}.` : "";
      think(`${entry.id} (${entry.answer.length}) "${clip(entry.clue)}".${hint} `);
      t += gap() * 0.6;
      const difficulty = (entry.answer.length > 8 ? 0.12 : 0) + (hint ? -0.08 : 0);
      const correct = rand() < skill - difficulty;
      const answer = correct ? entry.answer : wrongGuess(entry.answer, decoys, rand);
      think(correct ? `Pretty sure it's ${answer}. ` : `Maybe ${answer}? `);
      t += gap() * 0.4;
      emitFill(entry, answer);
      if (!correct) misses.push(entry);
    }

    // Second pass: some misses get fixed once crossings fill in.
    for (const entry of misses) {
      if (rand() < 0.55) {
        think(`Recheck ${entry.id}: crossings don't fit. `);
        t += gap();
        emitFill(entry, entry.answer);
      }
    }

    t += 200 + rand() * 500;
    const reasoning = heavy ? Math.round((thinkChars / 4) * (2.5 + rand())) : 0;
    const output = Math.round(answerChars / 3.2) + reasoning + (heavy ? 0 : Math.round(thinkChars / 4));
    events.push({
      t: Math.round(t),
      model: model.id,
      type: "done",
      usage: { input: inputTokens, output, reasoning },
      costUsd: estimateCost(model, inputTokens, output),
      costSource: "estimate",
      finishReason: "stop",
    });

    function emitFill(entry: Entry, answer: string) {
      answerChars += entry.id.length + answer.length + 3;
      events.push({ t: Math.round(t), model: model.id, type: "fill", entry: entry.id, answer });
      entryCells(entry).forEach(({ row, col }, i) => known.set(cellKey(row, col), answer[i]));
    }
  }

  events.sort((a, b) => a.t - b.t);
  return {
    version: 1,
    puzzleId: puzzle.id,
    recordedAt: `${puzzle.id}T12:00:00.000Z`,
    source: "simulated",
    models: models.map((m) => ({ id: m.id, name: m.name, gatewayId: m.gatewayId })),
    settings: { reasoning: "low", maxOutputTokens: 3000, promptVersion: PROMPT_VERSION },
    events,
  };
}

function clip(s: string, n = 42) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function wrongGuess(answer: string, decoys: string[], rand: () => number): string {
  const sameLength = decoys.filter((d) => d.length === answer.length && d !== answer);
  if (sameLength.length && rand() < 0.5) return sameLength[Math.floor(rand() * sameLength.length)];
  // Near miss: swap one or two letters.
  const letters = answer.split("");
  const swaps = 1 + Math.floor(rand() * 2);
  for (let i = 0; i < swaps; i++) {
    const idx = Math.floor(rand() * letters.length);
    letters[idx] = String.fromCharCode(65 + Math.floor(rand() * 26));
  }
  const guess = letters.join("");
  return guess === answer ? `${answer.slice(0, -1)}${answer.at(-1) === "S" ? "Z" : "S"}` : guess;
}
