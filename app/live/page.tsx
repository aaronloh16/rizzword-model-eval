import type { Metadata } from "next";
import { LiveRace } from "@/components/LiveRace";
import { latestPuzzle } from "@/lib/data";
import { DEFAULT_LIVE_PICKS, MAX_LIVE_MODELS, MODELS } from "@/lib/models";
import { DEFAULT_SETTINGS } from "@/lib/race/engine";
import { liveConfig, worstCaseCost } from "@/lib/race/guards";

export const metadata: Metadata = {
  title: "Live race",
  description: "Pick up to four models and race them live on today's puzzle through Vercel AI Gateway.",
};

// Reads env at request time so flipping LIVE_RACES_ENABLED needs no rebuild.
export const dynamic = "force-dynamic";

export default function LivePage() {
  const cfg = liveConfig();
  const puzzle = latestPuzzle();
  const roster = MODELS.map((m) => ({
    id: m.id,
    name: m.name,
    lab: m.lab,
    tier: m.tier,
    color: m.color,
    gatewayId: m.gatewayId,
    pricing: m.pricing,
    ceiling: worstCaseCost(puzzle, [m], DEFAULT_SETTINGS.maxOutputTokens),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-3xl">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-hot">● Live</p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Race them yourself</h1>
        <p className="mt-3 text-muted">
          Pick up to {MAX_LIVE_MODELS} models. Each gets one streaming call through Vercel AI Gateway on today&apos;s puzzle, &ldquo;{puzzle.title}&rdquo;.
          You&apos;ll see their reasoning stream, answers land, and the real bill.
        </p>
      </header>
      <LiveRace
        puzzle={puzzle}
        roster={roster}
        defaults={DEFAULT_LIVE_PICKS}
        max={MAX_LIVE_MODELS}
        config={{ enabled: cfg.enabled, reason: cfg.reason, requiresCode: cfg.requiresCode, maxRaceUsd: cfg.maxRaceUsd }}
        settings={{ reasoning: DEFAULT_SETTINGS.reasoning, maxOutputTokens: DEFAULT_SETTINGS.maxOutputTokens }}
      />
    </div>
  );
}
