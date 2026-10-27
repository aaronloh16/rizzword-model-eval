"use client";

import { memo } from "react";
import { MiniGrid } from "@/components/MiniGrid";
import { modelColor, getModel } from "@/lib/models";
import { fmtTime, fmtTokens, fmtUsd, ordinal } from "@/lib/format";
import type { Puzzle } from "@/lib/puzzle/types";
import type { LaneState } from "@/lib/race/state";

interface LaneCardProps {
  puzzle: Puzzle;
  lane: LaneState;
  rank: number;
  now: number;
  raceOver: boolean;
  /** Called-it marker from the viewer prediction. */
  picked?: boolean;
}

export const LaneCard = memo(function LaneCard({ puzzle, lane, rank, now, raceOver, picked }: LaneCardProps) {
  const color = modelColor(lane.model.id);
  const meta = getModel(lane.model.id);
  const total = puzzle.entries.length;
  const elapsed = lane.finishedAt ?? (lane.startedAt !== null ? Math.max(0, now - lane.startedAt) : null);
  const last = lane.lastEntry ? puzzle.entries.find((e) => e.id === lane.lastEntry) : null;
  const lastAnswer = last ? lane.answers.get(last.id) : null;
  const lastRight = last && lastAnswer === last.answer;
  const winner = raceOver && rank === 1;
  const tokens = lane.usage ? lane.usage.output : Math.round(lane.thinkingChars / 4);

  return (
    <article
      aria-label={`${lane.model.name}, ${ordinal(rank)} place, ${lane.correctEntries} of ${total} correct`}
      className={`relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-panel transition-[border-color,box-shadow] duration-500 ${
        winner ? "border-lime shadow-[0_0_0_1px_var(--color-lime),0_0_40px_-8px_var(--color-lime)]" : "border-line"
      }`}
    >
      <div className="h-1 w-full" style={{ background: color }} />
      <header className="flex items-start justify-between gap-3 px-4 pb-3 pt-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`sticker grid size-9 shrink-0 place-items-center font-display text-sm font-extrabold tabular ${
              winner ? "-rotate-6 bg-lime text-ink" : "bg-panel-2 text-white"
            } transition-transform`}
            title={`${ordinal(rank)} place`}
          >
            {winner ? "👑" : `#${rank}`}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-bold leading-tight">{lane.model.name}</h3>
            <p className="truncate text-xs text-dim">
              {meta?.lab ?? lane.model.gatewayId.split("/")[0]}
              {picked && <span className="ml-2 rounded-full bg-hot/15 px-1.5 py-px font-semibold text-hot">your pick</span>}
            </p>
          </div>
        </div>
        <StatusPill lane={lane} />
      </header>

      <div className="px-4">
        <MiniGrid puzzle={puzzle} cells={lane.cells} activeEntry={lane.status === "solving" ? lane.lastEntry : null} accent={color} reveal={raceOver} />
      </div>

      <div className="mt-3 flex h-7 items-center gap-2 px-4 text-xs">
        {last && lastAnswer ? (
          <span key={`${last.id}-${lastAnswer}`} className="flex animate-rise items-center gap-2 truncate">
            <span className="font-mono text-dim">{last.id}</span>
            <span className={`rounded px-1.5 py-0.5 font-display font-bold tracking-wide ${lastRight ? "bg-correct text-ink" : "bg-wrong text-ink"}`}>
              {lastAnswer}
            </span>
            <span className={lastRight ? "text-lime" : "text-hot"}>{lastRight ? "✓" : "✗"}</span>
          </span>
        ) : (
          <span className="text-dim">{lane.status === "waiting" ? "On the starting line" : "No answers yet…"}</span>
        )}
      </div>

      <ThinkingTail lane={lane} color={color} />

      <div className="px-4 pb-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-line" role="presentation">
          <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(lane.correctEntries / total) * 100}%`, background: color }} />
        </div>
      </div>

      <dl className="grid grid-cols-4 gap-px border-t border-line bg-line text-center">
        <Stat label="Time" value={fmtTime(elapsed)} />
        <Stat label="Solved" value={`${lane.correctEntries}/${total}`} />
        <Stat label="Cost" value={lane.costUsd !== null ? fmtUsd(lane.costUsd) : "…"} hint={lane.costSource === "estimate" ? "Estimated from list price" : lane.costSource === "gateway" ? "Reported by AI Gateway" : undefined} />
        <Stat label="Tokens" value={fmtTokens(tokens)} hint={lane.usage ? `${lane.usage.input} in · ${lane.usage.output} out (${lane.usage.reasoning} reasoning)` : "Live estimate"} />
      </dl>
    </article>
  );
});

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-panel px-1 py-2.5" title={hint}>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-dim">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm font-semibold tabular text-white">{value}</dd>
    </div>
  );
}

function StatusPill({ lane }: { lane: LaneState }) {
  const map = {
    waiting: { text: "Ready", cls: "bg-panel-2 text-dim" },
    thinking: { text: "Thinking", cls: "bg-sky/15 text-sky" },
    solving: { text: "Solving", cls: "bg-sun/15 text-sun" },
    done: { text: "Done", cls: "bg-lime/15 text-lime" },
    error: { text: "DNF", cls: "bg-hot/15 text-hot" },
  } as const;
  const s = map[lane.status];
  return (
    <span className={`shrink-0 rounded-full px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${s.cls}`} title={lane.error ?? undefined}>
      {s.text}
      {(lane.status === "thinking" || lane.status === "solving") && <span className="ml-0.5 inline-block animate-blink">_</span>}
    </span>
  );
}

function ThinkingTail({ lane, color }: { lane: LaneState; color: string }) {
  const text = lane.error ? `⚠ ${lane.error}` : lane.thinking;
  return (
    <div className="relative mx-4 mb-3 h-[52px] overflow-hidden rounded-lg border border-line bg-ink/60 px-2.5 py-1.5" aria-hidden>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-4 bg-gradient-to-b from-ink to-transparent" />
      <p className="absolute inset-x-2.5 bottom-1.5 break-words font-mono text-[10.5px] leading-[15px] text-muted">
        {text ? (
          <>
            {text}
            {(lane.status === "thinking" || lane.status === "solving") && <span className="animate-blink" style={{ color }}>▍</span>}
          </>
        ) : (
          <span className="text-dim">{lane.status === "waiting" ? "reasoning stream" : lane.status === "done" ? "no visible reasoning" : "…"}</span>
        )}
      </p>
    </div>
  );
}
