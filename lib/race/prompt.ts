import { buildSolution, cellEntries, cellKey, entryCells, sortedEntries } from "../puzzle/grid";
import type { Puzzle } from "../puzzle/types";

export const PROMPT_VERSION = "v1";

export const INSTRUCTIONS = `You are a contestant in RizzWord, a live race where AI models solve a crossword made of Gen Z / internet "brainrot" slang. Speed and accuracy both count.

Output rules (the grader parses your output line by line):
- One answer per line, exactly: <id>: <ANSWER>   e.g. 1A: SIGMA
- Answers are UPPERCASE letters only, no spaces, matching the slot length.
- Write each answer as soon as you are confident, easiest first. Use crossings.
- You may revise an answer by writing its line again later; the last one counts.
- No commentary, no markdown, no numbering beyond the ids.`;

/** Render the puzzle as a compact, model-friendly brief. */
export function puzzlePrompt(puzzle: Puzzle): string {
  const solution = buildSolution(puzzle);
  const owners = cellEntries(puzzle);

  const numbers = new Map(puzzle.entries.map((e) => [cellKey(e.row, e.col), e.number]));
  const gridLines = solution.map((row, r) =>
    row
      .map((cell, c) => {
        if (cell === null) return " ##";
        const n = numbers.get(cellKey(r, c));
        return n ? String(n).padStart(3, " ") : "  .";
      })
      .join(""),
  );

  const describe = (direction: "across" | "down") =>
    sortedEntries(puzzle.entries, direction)
      .map((e) => {
        const crossings = entryCells(e)
          .map(({ row, col }, i) => {
            const slot = owners.get(cellKey(row, col));
            const other = direction === "across" ? slot?.down : slot?.across;
            if (!other) return null;
            const j = entryCells(other).findIndex((c) => c.row === row && c.col === col);
            return `letter ${i + 1} = ${other.id} letter ${j + 1}`;
          })
          .filter(Boolean);
        return `${e.id} (${e.answer.length}) ${e.clue}${crossings.length ? `  [crosses: ${crossings.join("; ")}]` : ""}`;
      })
      .join("\n");

  return `Puzzle "${puzzle.title}" (${puzzle.rows}x${puzzle.cols}). Numbers mark entry starts, ## is a black square, . is an empty cell.

${gridLines.join("\n")}

ACROSS
${describe("across")}

DOWN
${describe("down")}

Go. Answer lines only.`;
}

/** Rough token estimate (≈4 chars/token) for cost pre-checks. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
