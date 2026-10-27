import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayBoard } from "@/components/PlayBoard";
import { allPuzzles, getPuzzle, getRace, summarizeRace } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export const dynamicParams = false;

export function generateStaticParams() {
  return allPuzzles().map((p) => ({ date: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/play/[date]">): Promise<Metadata> {
  const { date } = await params;
  const p = getPuzzle(date);
  return p ? { title: `Play #${p.issue} ${p.title}`, description: `Solve the ${fmtDate(date)} RizzWord and see where you'd place against the models.` } : {};
}

export default async function PlayPage({ params }: PageProps<"/play/[date]">) {
  const { date } = await params;
  const puzzle = getPuzzle(date);
  if (!puzzle) notFound();
  const race = getRace(date);
  const summary = race ? summarizeRace(race) : null;
  const benchmarks = summary?.lanes.map((l) => ({ name: l.name, color: l.color, timeMs: l.timeMs, correct: l.correct })) ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-dim">Daily #{puzzle.issue} · {fmtDate(date, { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{puzzle.title}</h1>
        </div>
        {race && (
          <Link href={`/race/${date}`} className="text-sm text-muted hover:text-white">
            Spoilers: watch the models race it →
          </Link>
        )}
      </header>
      <PlayBoard puzzle={puzzle} benchmarks={benchmarks} />
    </div>
  );
}
