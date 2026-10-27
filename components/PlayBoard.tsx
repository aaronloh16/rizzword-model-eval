"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { buildSolution, cellEntries, cellKey, entryCells, sortedEntries } from "@/lib/puzzle/grid";
import type { Direction, Entry, Puzzle } from "@/lib/puzzle/types";
import { fmtTime, ordinal } from "@/lib/format";

interface Props {
  puzzle: Puzzle;
  /** Model finish times for the "where would you place" comparison. */
  benchmarks: { name: string; color: string; timeMs: number | null; correct: number }[];
}

interface Saved {
  letters: [string, string][];
  elapsed: number;
  done: boolean;
}

/**
 * Human solve mode. Fully keyboard-driven:
 *   letters type · arrows move · Space/Enter flips direction ·
 *   Tab / Shift+Tab jump entries · Backspace deletes and steps back.
 * A single real <input> follows the cursor so mobile keyboards and screen
 * readers both work; its label always describes the current clue and cell.
 */
const noop = () => () => {};

function readSaved(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function PlayBoard(props: Props) {
  const storageKey = `rizzword:play:${props.puzzle.id}`;
  // Read saved progress once on the client; remount the board when it appears.
  const raw = useSyncExternalStore(noop, () => readSaved(storageKey), () => null);
  const saved = useMemo<Saved | null>(() => {
    try {
      return raw ? (JSON.parse(raw) as Saved) : null;
    } catch {
      return null;
    }
  }, [raw]);
  return <Board key={raw ? "saved" : "fresh"} {...props} saved={saved} storageKey={storageKey} />;
}

function Board({ puzzle, benchmarks, saved, storageKey }: Props & { saved: Saved | null; storageKey: string }) {
  const solution = useMemo(() => buildSolution(puzzle), [puzzle]);
  const owners = useMemo(() => cellEntries(puzzle), [puzzle]);
  const numbers = useMemo(() => new Map(puzzle.entries.map((e) => [cellKey(e.row, e.col), e.number])), [puzzle]);
  const ordered = useMemo(() => sortedEntries(puzzle.entries), [puzzle]);
  const first = ordered[0];
  const [letters, setLetters] = useState<Map<string, string>>(() => new Map(saved?.letters ?? []));
  const [cursor, setCursor] = useState({ row: first.row, col: first.col });
  const [dir, setDir] = useState<Direction>(first.direction);
  const [checked, setChecked] = useState(false);
  const [elapsed, setElapsed] = useState(saved?.elapsed ?? 0);
  const [done, setDone] = useState(saved?.done ?? false);
  const [announce, setAnnounce] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!letters.size && !elapsed) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ letters: [...letters], elapsed, done } satisfies Saved));
    } catch {}
  }, [letters, elapsed, done, storageKey]);

  // Timer runs while unsolved and the tab is visible.
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setElapsed((e) => e + 1000);
    }, 1000);
    return () => clearInterval(id);
  }, [done]);

  const isCell = useCallback((r: number, c: number) => solution[r]?.[c] != null, [solution]);

  const activeEntry: Entry = useMemo(() => {
    const slot = owners.get(cellKey(cursor.row, cursor.col));
    return (slot?.[dir] ?? slot?.across ?? slot?.down)!;
  }, [owners, cursor, dir]);
  const activeCells = useMemo(() => new Set(entryCells(activeEntry).map((c) => cellKey(c.row, c.col))), [activeEntry]);
  const indexInEntry = entryCells(activeEntry).findIndex((c) => c.row === cursor.row && c.col === cursor.col);

  // The effective direction: a cell that only belongs to one entry forces it.
  const curDir = activeEntry.direction;

  const focusInput = () => inputRef.current?.focus({ preventScroll: true });

  const goEntry = useCallback(
    (entry: Entry, at: "start" | "firstEmpty" = "firstEmpty") => {
      const cells = entryCells(entry);
      const target = at === "firstEmpty" ? cells.find((c) => !letters.get(cellKey(c.row, c.col))) ?? cells[0] : cells[0];
      setDir(entry.direction);
      setCursor(target);
    },
    [letters],
  );

  const move = (dr: number, dc: number) => {
    let r = cursor.row + dr;
    let c = cursor.col + dc;
    while (r >= 0 && c >= 0 && r < puzzle.rows && c < puzzle.cols) {
      if (isCell(r, c)) {
        setCursor({ row: r, col: c });
        return;
      }
      r += dr;
      c += dc;
    }
  };

  const step = (delta: 1 | -1) => {
    const cells = entryCells(activeEntry);
    const next = cells[indexInEntry + delta];
    if (next) setCursor(next);
  };

  const finishCheck = (next: Map<string, string>) => {
    const complete = puzzle.entries.every((e) => entryCells(e).every((c) => next.get(cellKey(c.row, c.col))));
    if (!complete) return;
    const right = puzzle.entries.every((e) => entryCells(e).every((c, i) => next.get(cellKey(c.row, c.col)) === e.answer[i]));
    if (right) {
      setDone(true);
      setAnnounce(`Solved in ${fmtTime(elapsed)}!`);
    } else {
      setAnnounce("Grid is full but something's off. Try Check.");
    }
  };

  const type = (ch: string) => {
    if (done) return;
    const next = new Map(letters);
    next.set(cellKey(cursor.row, cursor.col), ch);
    setLetters(next);
    // Advance to the next empty cell in this entry, else the next cell.
    const cells = entryCells(activeEntry);
    const after = cells.slice(indexInEntry + 1).find((c) => !next.get(cellKey(c.row, c.col))) ?? cells[indexInEntry + 1];
    if (after) setCursor(after);
    else {
      const i = ordered.indexOf(activeEntry);
      const upcoming = [...ordered.slice(i + 1), ...ordered.slice(0, i)].find((e) => entryCells(e).some((c) => !next.get(cellKey(c.row, c.col))));
      if (upcoming) {
        const target = entryCells(upcoming).find((c) => !next.get(cellKey(c.row, c.col)))!;
        setDir(upcoming.direction);
        setCursor(target);
      }
    }
    finishCheck(next);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const k = e.key;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[a-zA-Z]$/.test(k)) {
      e.preventDefault();
      type(k.toUpperCase());
    } else if (k === "Backspace" || k === "Delete") {
      e.preventDefault();
      if (done) return;
      const key = cellKey(cursor.row, cursor.col);
      const next = new Map(letters);
      if (next.get(key) || k === "Delete") next.delete(key);
      else {
        step(-1);
        const prev = entryCells(activeEntry)[indexInEntry - 1];
        if (prev) next.delete(cellKey(prev.row, prev.col));
      }
      setLetters(next);
    } else if (k === "ArrowRight" || k === "ArrowLeft" || k === "ArrowUp" || k === "ArrowDown") {
      e.preventDefault();
      const horizontal = k === "ArrowRight" || k === "ArrowLeft";
      const want: Direction = horizontal ? "across" : "down";
      const slot = owners.get(cellKey(cursor.row, cursor.col));
      if (curDir !== want && slot?.[want]) setDir(want);
      else move(k === "ArrowDown" ? 1 : k === "ArrowUp" ? -1 : 0, k === "ArrowRight" ? 1 : k === "ArrowLeft" ? -1 : 0);
    } else if (k === " " || k === "Enter") {
      e.preventDefault();
      const other: Direction = curDir === "across" ? "down" : "across";
      if (owners.get(cellKey(cursor.row, cursor.col))?.[other]) setDir(other);
    } else if (k === "Tab") {
      e.preventDefault();
      const i = ordered.indexOf(activeEntry);
      goEntry(ordered[(i + (e.shiftKey ? -1 : 1) + ordered.length) % ordered.length]);
    } else if (k === "Escape") {
      inputRef.current?.blur();
    }
  };

  // Mobile keyboards often send "Unidentified" keydowns; read the input value instead.
  const onInput = (e: React.FormEvent<HTMLInputElement>) => {
    const v = e.currentTarget.value.replace(/[^a-zA-Z]/g, "");
    e.currentTarget.value = "";
    if (v) type(v.at(-1)!.toUpperCase());
  };

  const clickCell = (r: number, c: number) => {
    if (cursor.row === r && cursor.col === c) {
      const other: Direction = curDir === "across" ? "down" : "across";
      if (owners.get(cellKey(r, c))?.[other]) setDir(other);
    } else setCursor({ row: r, col: c });
    focusInput();
  };

  const revealEntry = () => {
    const next = new Map(letters);
    entryCells(activeEntry).forEach((c, i) => next.set(cellKey(c.row, c.col), activeEntry.answer[i]));
    setLetters(next);
    setAnnounce(`${activeEntry.id} revealed: ${activeEntry.answer}`);
    finishCheck(next);
  };

  const wrongCount = useMemo(
    () => [...letters].filter(([k, v]) => {
      const [r, c] = k.split(",").map(Number);
      return solution[r][c] !== v;
    }).length,
    [letters, solution],
  );

  const check = () => {
    setChecked(true);
    setAnnounce(wrongCount ? `${wrongCount} wrong letter${wrongCount === 1 ? "" : "s"} highlighted.` : "Everything so far is correct.");
  };

  const reset = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setLetters(new Map());
    setElapsed(0);
    setDone(false);
    setChecked(false);
    goEntry(first, "start");
    setAnnounce("Board cleared.");
  };

  const cellLetter = letters.get(cellKey(cursor.row, cursor.col));
  const inputLabel = `${activeEntry.number} ${activeEntry.direction}: ${activeEntry.clue}. ${activeEntry.answer.length} letters. Letter ${indexInEntry + 1}, ${
    cellLetter ? cellLetter : "blank"
  }.`;

  const place = useMemo(() => {
    if (!done) return null;
    const times = benchmarks.filter((b) => b.timeMs !== null && b.correct === puzzle.entries.length).map((b) => b.timeMs!);
    return times.filter((t) => t < elapsed).length + 1;
  }, [done, benchmarks, elapsed, puzzle.entries.length]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-line bg-panel px-4 py-3">
          <p className="min-w-0 text-sm sm:text-base">
            <span className="mr-2 rounded bg-lime px-1.5 py-0.5 font-mono text-xs font-bold text-ink">{activeEntry.id}</span>
            <span className="font-semibold">{activeEntry.clue}</span>
            <span className="ml-1 text-dim">({activeEntry.answer.length})</span>
          </p>
          <span className="shrink-0 font-mono text-sm tabular text-muted" aria-label={`Time ${fmtTime(elapsed)}`}>{fmtTime(elapsed)}</span>
        </div>

        <div className="relative mx-auto max-w-[620px]">
          <div
            className="grid gap-[3px] rounded-xl bg-black p-[3px]"
            style={{ gridTemplateColumns: `repeat(${puzzle.cols}, minmax(0, 1fr))`, containerType: "inline-size" }}
            aria-hidden
          >
            {solution.flatMap((row, r) =>
              row.map((sol, c) => {
                const k = cellKey(r, c);
                if (sol === null) return <div key={k} className="aspect-square bg-ink" />;
                const v = letters.get(k);
                const isCursor = cursor.row === r && cursor.col === c;
                const inEntry = activeCells.has(k);
                const wrong = checked && v && v !== sol;
                const bg = done ? "bg-correct" : isCursor ? "bg-sun" : inEntry ? "bg-[#cfe7ff]" : "bg-paper";
                return (
                  <div
                    key={k}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      clickCell(r, c);
                    }}
                    className={`relative aspect-square cursor-pointer select-none rounded-[3px] ${bg} text-paper-ink transition-colors duration-100`}
                  >
                    {numbers.has(k) && (
                      <span className="absolute left-[3px] top-[1px] font-mono leading-none text-paper-ink/70" style={{ fontSize: `max(7px, ${24 / puzzle.cols}cqi)` }}>
                        {numbers.get(k)}
                      </span>
                    )}
                    {v && (
                      <span
                        className={`absolute inset-0 grid place-items-center font-display font-extrabold leading-none ${wrong ? "text-hot" : ""}`}
                        style={{ fontSize: `max(12px, ${58 / puzzle.cols}cqi)` }}
                      >
                        {v}
                      </span>
                    )}
                    {wrong && <span className="absolute inset-x-1 top-1/2 h-0.5 -rotate-12 bg-hot" />}
                  </div>
                );
              }),
            )}
          </div>
          <input
            ref={inputRef}
            onKeyDown={onKeyDown}
            onInput={onInput}
            aria-label={inputLabel}
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            enterKeyHint="next"
            className="absolute opacity-0"
            style={{
              left: `${(cursor.col / puzzle.cols) * 100}%`,
              top: `${(cursor.row / puzzle.rows) * 100}%`,
              width: `${100 / puzzle.cols}%`,
              height: `${100 / puzzle.rows}%`,
              caretColor: "transparent",
            }}
          />
          <p className="mt-2 hidden text-center text-xs text-dim sm:block">
            Click the grid or press any letter. Arrows move · Space flips direction · Tab next clue · Backspace erases
          </p>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={check} className="rounded-full border border-line px-4 py-2 text-sm hover:border-dim">Check</button>
          <button type="button" onClick={revealEntry} className="rounded-full border border-line px-4 py-2 text-sm hover:border-dim">Reveal {activeEntry.id}</button>
          <button type="button" onClick={reset} className="rounded-full border border-line px-4 py-2 text-sm text-muted hover:border-hot hover:text-hot">Reset</button>
          <button type="button" onClick={focusInput} className="sticker bg-lime px-4 py-2 text-sm font-bold text-ink lg:hidden">Keyboard</button>
        </div>
        <p className="sr-only" aria-live="polite">{announce}</p>

        {done && (
          <div className="mt-6 animate-rise rounded-2xl border border-lime bg-lime/10 p-5 text-center">
            <p className="font-display text-3xl font-extrabold">Solved in {fmtTime(elapsed)} 🏁</p>
            {place !== null && (
              <p className="mt-1 text-muted">
                Against today&apos;s models you&apos;d have finished <strong className="text-white">{ordinal(place)}</strong> of {benchmarks.length + 1}.
                {place === 1 ? " Absolute sigma." : place > benchmarks.length ? " The clankers win this round." : ""}
              </p>
            )}
          </div>
        )}
      </div>

      <aside aria-label="Clues" className="space-y-5 lg:max-h-[calc(100dvh-140px)] lg:overflow-y-auto lg:pr-1">
        {(["across", "down"] as const).map((d) => (
          <section key={d}>
            <h2 className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-dim">{d}</h2>
            <ol className="space-y-1">
              {sortedEntries(puzzle.entries, d).map((e) => {
                const filled = entryCells(e).every((c) => letters.get(cellKey(c.row, c.col)));
                const on = e.id === activeEntry.id;
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => {
                        goEntry(e);
                        focusInput();
                      }}
                      aria-current={on ? "true" : undefined}
                      className={`flex w-full gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${on ? "bg-white text-ink" : "hover:bg-panel-2"} ${
                        filled && !on ? "text-dim line-through decoration-dim/50" : ""
                      }`}
                    >
                      <span className="w-6 shrink-0 font-mono font-bold">{e.number}</span>
                      <span>{e.clue}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </aside>
    </div>
  );
}
