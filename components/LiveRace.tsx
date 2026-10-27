"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RaceBoard } from "@/components/RaceBoard";
import { ResultsTable } from "@/components/ResultsTable";
import { fmtUsd } from "@/lib/format";
import type { Puzzle } from "@/lib/puzzle/types";
import { deriveRace } from "@/lib/race/state";
import { summarizeLanes } from "@/lib/race/summary";
import type { LiveStreamMessage, RaceEvent, RaceModelRef, RaceTranscript } from "@/lib/race/types";

interface RosterModel {
  id: string;
  name: string;
  lab: string;
  tier: "heavyweight" | "speedrunner";
  color: string;
  gatewayId: string;
  pricing: { input: number; output: number };
  ceiling: number;
}

interface Props {
  puzzle: Puzzle;
  roster: RosterModel[];
  defaults: string[];
  max: number;
  config: { enabled: boolean; reason?: string; requiresCode: boolean; maxRaceUsd: number };
  settings: { reasoning: string; maxOutputTokens: number };
}

type Phase = "pick" | "running" | "done";

export function LiveRace({ puzzle, roster, defaults, max, config, settings }: Props) {
  const [selected, setSelected] = useState<string[]>(defaults.filter((d) => roster.some((r) => r.id === d)).slice(0, max));
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<Phase>("pick");
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<RaceModelRef[]>([]);
  const [events, setEvents] = useState<RaceEvent[]>([]);
  const [now, setNow] = useState(0);
  const t0 = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const startedAt = useRef<string>("");

  const ceiling = useMemo(() => roster.filter((r) => selected.includes(r.id)).reduce((s, r) => s + r.ceiling, 0), [roster, selected]);
  const overCap = ceiling > config.maxRaceUsd;

  // Smooth clock while running; never behind the newest event.
  useEffect(() => {
    if (phase !== "running") return;
    let raf = 0;
    const tick = () => {
      setNow(performance.now() - t0.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= max ? s : [...s, id]));

  const start = useCallback(async () => {
    setError(null);
    setEvents([]);
    setNow(0);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/race", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ puzzleId: puzzle.id, models: selected, code: code || undefined }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setPhase("running");
      t0.current = performance.now();
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buf = "";
      const batch: RaceEvent[] = [];
      let flushQueued = false;
      const flush = () => {
        flushQueued = false;
        const items = batch.splice(0);
        if (items.length) setEvents((prev) => [...prev, ...items]);
      };
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const msg = JSON.parse(line) as LiveStreamMessage;
          if (msg.kind === "hello") {
            setModels(msg.models);
            startedAt.current = msg.startedAt;
          } else if (msg.kind === "event") {
            batch.push(msg.event);
            // Align our clock with the server's so lanes never "rewind".
            if (msg.event.t > performance.now() - t0.current) t0.current = performance.now() - msg.event.t;
          } else if (msg.kind === "fatal") {
            setError(msg.message);
          }
        }
        if (!flushQueued) {
          flushQueued = true;
          requestAnimationFrame(flush);
        }
      }
      flush();
      setPhase("done");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError((e as Error).message);
      setPhase((p) => (p === "running" ? "done" : "pick"));
    }
  }, [puzzle.id, selected, code]);

  const stop = () => {
    abortRef.current?.abort();
    setPhase("done");
  };

  const final = useMemo(
    () => (phase === "done" && models.length ? summarizeLanes(deriveRace(puzzle, models, events), puzzle) : null),
    [phase, models, events, puzzle],
  );

  const download = () => {
    const transcript: RaceTranscript = {
      version: 1,
      puzzleId: puzzle.id,
      recordedAt: startedAt.current || new Date().toISOString(),
      source: "live",
      models,
      settings: { reasoning: settings.reasoning, maxOutputTokens: settings.maxOutputTokens, promptVersion: "v1" },
      events,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(transcript, null, 1)], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `rizzword-${puzzle.id}-live.json` });
    a.click();
    URL.revokeObjectURL(url);
  };

  if (phase !== "pick") {
    const totalCost = events.reduce((s, e) => s + (e.type === "done" ? e.costUsd : 0), 0);
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-panel px-4 py-3">
          <p className="flex items-center gap-2 text-sm">
            {phase === "running" ? (
              <>
                <span className="size-2 animate-pulse rounded-full bg-hot" /> Live on <strong>{puzzle.title}</strong>
              </>
            ) : (
              <>Finished · spent <strong className="font-mono">{fmtUsd(totalCost)}</strong></>
            )}
          </p>
          <div className="flex gap-2">
            {phase === "running" ? (
              <button type="button" onClick={stop} className="rounded-full border border-line px-4 py-1.5 text-sm hover:border-hot hover:text-hot">
                Stop race
              </button>
            ) : (
              <>
                <button type="button" onClick={download} className="rounded-full border border-line px-4 py-1.5 text-sm hover:border-dim">
                  Save transcript
                </button>
                <button type="button" onClick={() => setPhase("pick")} className="sticker bg-lime px-4 py-1.5 text-sm font-bold text-ink">
                  New race
                </button>
              </>
            )}
          </div>
        </div>
        {error && <p role="alert" className="rounded-xl border border-hot/40 bg-hot/10 px-4 py-3 text-sm text-hot">{error}</p>}
        {models.length > 0 && <RaceBoard puzzle={puzzle} models={models} events={events} now={phase === "done" ? Infinity : now} />}
        {final && <ResultsTable rows={final} />}
      </div>
    );
  }

  const tiers = [
    { key: "heavyweight", label: "Heavyweights", blurb: "Flagships. Smarter, slower, pricier." },
    { key: "speedrunner", label: "Speedrunners", blurb: "Small and fast. Pennies per race." },
  ] as const;

  return (
    <div className="space-y-6">
      {!config.enabled && (
        <div className="rounded-2xl border border-line bg-panel p-5">
          <p className="font-display text-lg font-bold">Live racing is parked on this deployment</p>
          <p className="mt-1 text-sm text-muted">{config.reason}</p>
          <p className="mt-3 text-sm text-muted">
            Run it locally with your own AI Gateway key: <code className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-xs text-white">LIVE_RACES_ENABLED=true AI_GATEWAY_API_KEY=… pnpm dev</code>
          </p>
        </div>
      )}

      <fieldset disabled={!config.enabled} className="space-y-6 disabled:opacity-60">
        <legend className="sr-only">Choose up to {max} models</legend>
        {tiers.map((tier) => (
          <div key={tier.key}>
            <div className="mb-2 flex items-baseline gap-3">
              <h2 className="font-display text-xl font-bold">{tier.label}</h2>
              <p className="text-sm text-dim">{tier.blurb}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {roster
                .filter((r) => r.tier === tier.key)
                .map((r) => {
                  const on = selected.includes(r.id);
                  const full = !on && selected.length >= max;
                  return (
                    <label
                      key={r.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-lime ${
                        on ? "border-transparent bg-white text-ink" : "border-line bg-panel hover:border-dim"
                      } ${full ? "opacity-50" : ""}`}
                    >
                      <input type="checkbox" className="sr-only" checked={on} disabled={full} onChange={() => toggle(r.id)} />
                      <span className="mt-1 size-3 shrink-0 rounded-full" style={{ background: r.color, boxShadow: on ? "0 0 0 2px #000" : undefined }} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold leading-tight">{r.name}</span>
                        <span className={`block truncate font-mono text-[11px] ${on ? "text-ink/60" : "text-dim"}`}>{r.gatewayId}</span>
                        <span className={`mt-1 block font-mono text-[11px] ${on ? "text-ink/70" : "text-muted"}`}>
                          ${r.pricing.input}/${r.pricing.output} per M · ≤{fmtUsd(r.ceiling)}
                        </span>
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>
        ))}

        <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-line bg-panel-2/95 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p>
              <strong>{selected.length}</strong>/{max} picked · worst case{" "}
              <strong className={`font-mono ${overCap ? "text-hot" : "text-white"}`}>{fmtUsd(ceiling)}</strong>
              <span className="text-dim"> (cap {fmtUsd(config.maxRaceUsd)})</span>
            </p>
            <p className="text-xs text-dim">Worst case assumes every model maxes out {settings.maxOutputTokens.toLocaleString()} output tokens. Real races cost far less.</p>
          </div>
          <div className="flex gap-2">
            {config.requiresCode && (
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Access code"
                aria-label="Access code"
                autoComplete="off"
                className="w-36 rounded-full border border-line bg-ink px-4 py-2 text-sm placeholder:text-dim"
              />
            )}
            <button
              type="button"
              onClick={start}
              disabled={!config.enabled || selected.length === 0 || overCap || (config.requiresCode && !code)}
              className="sticker shrink-0 bg-lime px-5 py-2 font-display font-extrabold text-ink transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start live race
            </button>
          </div>
        </div>
      </fieldset>
      {error && <p role="alert" className="rounded-xl border border-hot/40 bg-hot/10 px-4 py-3 text-sm text-hot">{error}</p>}
    </div>
  );
}
