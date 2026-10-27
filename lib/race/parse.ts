import type { Entry } from "../puzzle/types";

/**
 * Incremental parser for model output in the `1A: ANSWER` line format.
 *
 * Models stream text in arbitrary chunks, so we buffer until a newline and
 * only commit complete lines. Accepts common variations: "1A - SIGMA",
 * "1 Across: Sigma", "**1A:** SIGMA", "1a = no cap". Unknown ids are ignored.
 */
const LINE_RE = /^[\s>*_`-]*(\d{1,2})\s*[-\s]?\s*(A|D|ACROSS|DOWN)\b[\s*_`]*[:=\-–—]+\s*[*_`]*\s*([A-Za-z][A-Za-z '\-]*?)[\s*_`.]*$/i;

export interface ParsedAnswer {
  entry: string;
  answer: string;
}

export function parseAnswerLine(line: string, validIds?: Set<string>): ParsedAnswer | null {
  const m = LINE_RE.exec(line.trim());
  if (!m) return null;
  const dir = m[2].toUpperCase().startsWith("A") ? "A" : "D";
  const entry = `${Number(m[1])}${dir}`;
  if (validIds && !validIds.has(entry)) return null;
  const answer = m[3].toUpperCase().replace(/[^A-Z]/g, "");
  if (!answer) return null;
  return { entry, answer };
}

export class AnswerStreamParser {
  private buffer = "";
  private readonly ids: Set<string>;

  constructor(entries: Pick<Entry, "id">[]) {
    this.ids = new Set(entries.map((e) => e.id));
  }

  /** Feed a text chunk; returns any answers completed by it. */
  push(chunk: string): ParsedAnswer[] {
    this.buffer += chunk;
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() ?? "";
    return lines.map((l) => parseAnswerLine(l, this.ids)).filter((a): a is ParsedAnswer => a !== null);
  }

  /** Flush the trailing partial line at end of stream. */
  end(): ParsedAnswer[] {
    const rest = this.buffer;
    this.buffer = "";
    const a = parseAnswerLine(rest, this.ids);
    return a ? [a] : [];
  }
}
