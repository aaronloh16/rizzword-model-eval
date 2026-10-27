"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Countdown } from "@/components/Countdown";
import { Prediction, usePrediction } from "@/components/Prediction";
import { RaceBoard } from "@/components/RaceBoard";
import { ResultsTable } from "@/components/ResultsTable";
import { fmtTime } from "@/lib/format";
import type { Puzzle } from "@/lib/puzzle/types";
import { deriveRace, raceDuration } from "@/lib/race/state";
import { summarizeLanes, type LaneSummary } from "@/lib/race/summary";
import type { RaceTranscript } from "@/lib/race/types";

const SPEEDS = [1, 2, 4, 8] as const;

interface ReplayPlayerProps {
  puzzle: Puzzle;
  race: RaceTranscript;
}

/**
 * Plays back a recorded race from its event log. No network, no keys: the
 * transcript ships with the page. The clock is a rAF loop scaled by speed;
 * all lane state is derived from (events, t).
 */
export function ReplayPlayer({ puzzle, race }: ReplayPlayerProps) {
  const duration = useMemo(() => raceDuration(race.events) + 400, [race.events]);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [counting, setCounting] = useState(false);
  const [started, setStarted] = useState(false);
  const { pick, choose, crowd } = usePrediction(puzzle.id, race.models);
  const raf = useRef<number>(0);
  const last = useRef<number>(0);
  const sectionRef = useRef<HTMLElement>(null);
  const visible = useRef(true);

  // Only claim the space bar / arrows while the replay is on screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const finished = t >= duration;

  useEffect(() => {
    if (!playing) return;
    last.current = performance.now();
    // ~30fps is plenty for letters popping in and keeps six grids cheap to render.
    const tick = (now: number) => {
      const dt = now - last.current;
      if (dt < 33) {
        raf.current = requestAnimationFrame(tick);
        return;
      }
      last.current = now;
      setT((prev) => {
        const next = Math.min(duration, prev + dt * speed);
        if (next >= duration) setPlaying(false);
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, speed, duration]);

  const start = useCallback(() => {
    setStarted(true);
    setT(0);
    setCounting(true);
  }, []);

  const onCountdownDone = useCallback(() => {
    setCounting(false);
    setPlaying(true);
  }, []);

  const toggle = useCallback(() => {
    if (!started) return start();
    if (finished) {
      setT(0);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  }, [started, finished, start]);

  const seek = useCallback((ms: number) => {
    setStarted(true);
    setT(Math.max(0, Math.min(duration, ms)));
  }, [duration]);

  // Keyboard: space toggles, arrows seek. Ignored while typing or on buttons.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (!visible.current || e.metaKey || e.ctrlKey || e.altKey) return;
      if (el.closest("input, textarea, select, button, a, [contenteditable]")) return;
      if (e.key === " ") {
        e.preventDefault();
        toggle();
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        seek(t + (e.key === "ArrowRight" ? 2000 : -2000) * speed);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, seek, t, speed]);

  const final = useMemo(() => {
    const state = deriveRace(puzzle, race.models, race.events);
    return summarizeLanes(state, puzzle);
  }, [puzzle, race]);
  const winner = final[0];

  return (
    <section ref={sectionRef} aria-label="Race replay" className="space-y-5">
      {counting && (
        <Countdown onDone={onCountdownDone} />
      )}

      {!started && (
        <Prediction models={race.models} pick={pick} onPick={choose} onStart={start} />
      )}

      <div className="sticky top-14 z-30 -mx-4 border-y border-line bg-ink/90 px-4 py-2.5 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            className="sticker grid size-10 shrink-0 place-items-center bg-lime text-ink transition-transform hover:-translate-y-0.5 active:translate-y-0"
            aria-label={playing ? "Pause replay" : finished ? "Replay from start" : "Play replay"}
          >
            {playing ? <PauseIcon /> : finished ? <RestartIcon /> : <PlayIcon />}
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <input
              type="range"
              className="scrubber w-full"
              min={0}
              max={duration}
              step={50}
              value={t}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Replay position"
              aria-valuetext={`${fmtTime(t)} of ${fmtTime(duration)}`}
              style={{ ["--p" as string]: `${(t / duration) * 100}%` }}
            />
            <div className="flex justify-between font-mono text-[11px] tabular text-dim">
              <span>{fmtTime(t)}</span>
              <span className="hidden sm:inline">space to play · ← → to seek</span>
              <span>{fmtTime(duration)}</span>
            </div>
          </div>
          <div role="group" aria-label="Playback speed" className="flex shrink-0 rounded-full border border-line p-0.5">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                aria-pressed={speed === s}
                className={`rounded-full px-2 py-1 font-mono text-[11px] font-bold transition-colors ${speed === s ? "bg-white text-ink" : "text-dim hover:text-white"} ${s > 2 ? "hidden sm:block" : ""}`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      <RaceBoard puzzle={puzzle} models={race.models} events={race.events} now={t} pick={pick} />

      {finished && (
        <div className="animate-rise space-y-4">
          <Verdict
            pick={pick}
            winnerId={winner.id}
            winnerName={winner.name}
            crowd={crowd}
            models={race.models}
            share={shareText(puzzle, final, pick, race.source)}
          />
          <ResultsTable rows={final} />
        </div>
      )}
    </section>
  );
}

function shareText(puzzle: Puzzle, rows: LaneSummary[], pick: string | null, source: string) {
  const medals = ["🥇", "🥈", "🥉"];
  const lines = rows.slice(0, 3).map((r, i) => `${medals[i]} ${r.name} ${r.correct}/${r.total} · ${fmtTime(r.timeMs)}`);
  const called = pick ? (pick === rows[0].id ? "I called it 👑" : "I took an L 💀") : "";
  const url = typeof window === "undefined" ? "" : `${window.location.origin}/race/${puzzle.id}`;
  return [`RizzWord #${puzzle.issue} “${puzzle.title}”${source === "simulated" ? " (sim)" : ""}`, ...lines, called, url].filter(Boolean).join("\n");
}

function Verdict({
  pick,
  winnerId,
  winnerName,
  crowd,
  models,
  share,
}: {
  pick: string | null;
  winnerId: string;
  winnerName: string;
  crowd: Record<string, number> | null;
  models: { id: string; name: string }[];
  share: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(share);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  const total = crowd ? Object.values(crowd).reduce((a, b) => a + b, 0) : 0;
  const crowdRight = crowd && total ? Math.round(((crowd[winnerId] ?? 0) / total) * 100) : null;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-display text-xl font-bold">
        {pick ? (
          pick === winnerId ? (
            <>You called it. <span className="text-lime">+1000 aura.</span></>
          ) : (
            <>
              You picked {models.find((m) => m.id === pick)?.name}. <span className="text-hot">That&apos;s an L.</span>
            </>
          )
        ) : (
          <>
            <span className="text-lime">{winnerName}</span> takes the crown.
          </>
        )}
      </p>
      <div className="flex items-center gap-3">
        {crowdRight !== null && (
          <p className="text-sm text-muted">
            {crowdRight}% of {total} viewers called it.
          </p>
        )}
        <button type="button" onClick={copy} className="rounded-full border border-line px-4 py-1.5 text-sm hover:border-dim" aria-live="polite">
          {copied ? "Copied ✓" : "Share result"}
        </button>
      </div>
    </div>
  );
}

const PlayIcon = () => (
  <svg viewBox="0 0 20 20" className="ml-0.5 size-4" fill="currentColor" aria-hidden>
    <path d="M5 3.5v13l11-6.5z" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 20 20" className="size-4" fill="currentColor" aria-hidden>
    <path d="M5 3h3.5v14H5zM11.5 3H15v14h-3.5z" />
  </svg>
);
const RestartIcon = () => (
  <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
    <path d="M4 10a6 6 0 1 0 2-4.5M4 3v3.5h3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
