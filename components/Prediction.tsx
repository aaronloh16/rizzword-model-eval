"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { modelColor } from "@/lib/models";
import type { RaceModelRef } from "@/lib/race/types";

const key = (date: string) => `rizzword:pick:${date}`;

/**
 * "Call it" — viewers predict the winner before the replay starts.
 * Picks live in localStorage; if the deployment has Redis, they're also
 * tallied server-side so we can show what the crowd thought.
 */
const EVENT = "rizzword:pick";

// In-memory fallback for browsers where storage throws (private mode).
const memory = new Map<string, string>();

function readPick(date: string): string | null {
  try {
    return localStorage.getItem(key(date)) ?? memory.get(date) ?? null;
  } catch {
    return memory.get(date) ?? null;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

export function usePrediction(date: string, models: RaceModelRef[]) {
  const stored = useSyncExternalStore(subscribe, () => readPick(date), () => null);
  const pick = stored && models.some((m) => m.id === stored) ? stored : null;
  const [crowd, setCrowd] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/vote?date=${date}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && d?.tally && setCrowd(d.tally))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [date]);

  const choose = useCallback(
    (id: string) => {
      memory.set(date, id);
      try {
        localStorage.setItem(key(date), id);
      } catch {}
      window.dispatchEvent(new Event(EVENT));
      fetch("/api/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date, model: id }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d?.tally && setCrowd(d.tally))
        .catch(() => {});
    },
    [date],
  );

  return { pick, choose, crowd };
}

export function Prediction({
  models,
  pick,
  onPick,
  onStart,
}: {
  models: RaceModelRef[];
  pick: string | null;
  onPick: (id: string) => void;
  onStart: () => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Call it before the flag drops</h2>
          <p className="text-sm text-muted">Pick who you think wins, then hit start. No spoilers below until it finishes.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div role="group" aria-label="Your predicted winner" className="flex flex-wrap gap-2">
            {models.map((m) => {
              const on = pick === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onPick(m.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all ${
                    on ? "border-transparent bg-white font-semibold text-ink" : "border-line text-muted hover:border-dim hover:text-white"
                  }`}
                >
                  <span className="size-2 rounded-full" style={{ background: modelColor(m.id) }} />
                  {m.name}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onStart}
            className="sticker shrink-0 bg-lime px-5 py-2.5 font-display font-extrabold text-ink transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {pick ? "Start the race →" : "Just watch →"}
          </button>
        </div>
      </div>
    </div>
  );
}
