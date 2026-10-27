import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReplayPlayer } from "@/components/ReplayPlayer";
import { SimulatedNotice, SourceBadge } from "@/components/SourceNotice";
import { allPuzzles, getPuzzle, getRace, summarizeRace } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export const dynamicParams = false;

export function generateStaticParams() {
  return allPuzzles().filter((p) => getRace(p.id)).map((p) => ({ date: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/race/[date]">): Promise<Metadata> {
  const { date } = await params;
  const puzzle = getPuzzle(date);
  const race = getRace(date);
  if (!puzzle || !race) return {};
  const s = summarizeRace(race);
  return {
    title: `#${puzzle.issue} ${puzzle.title}`,
    description:
      race.source === "live"
        ? `${fmtDate(date, { month: "long", day: "numeric", year: "numeric" })}: ${s?.winner.name} won with ${s?.winner.correct}/${s?.winner.total}. Replay the race.`
        : `Daily #${puzzle.issue}: replay ${race.models.length} AI models racing a brainrot crossword (simulated demo data).`,
  };
}

export default async function RacePage({ params }: PageProps<"/race/[date]">) {
  const { date } = await params;
  const puzzle = getPuzzle(date);
  const race = getRace(date);
  if (!puzzle || !race) notFound();
  const dates = allPuzzles().map((p) => p.id);
  const i = dates.indexOf(date);
  const prev = dates[i - 1];
  const next = dates[i + 1];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav aria-label="Race navigation" className="mb-6 flex items-center justify-between text-sm text-muted">
        {prev ? <Link className="hover:text-white" href={`/race/${prev}`}>← {fmtDate(prev)}</Link> : <span />}
        <Link className="hover:text-white" href="/history">All races</Link>
        {next ? <Link className="hover:text-white" href={`/race/${next}`}>{fmtDate(next)} →</Link> : <span />}
      </nav>
      <header className="mb-6">
        <p className="mb-2 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-widest text-dim">
          <span className="rounded-full border border-line px-2 py-0.5 text-white">Daily #{puzzle.issue}</span>
          {fmtDate(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          <SourceBadge source={race.source} />
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{puzzle.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {puzzle.entries.length} clues · {puzzle.rows}×{puzzle.cols} · {race.models.length} models · reasoning {race.settings.reasoning} · prompt {race.settings.promptVersion} ·{" "}
          <Link className="underline underline-offset-2 hover:text-white" href={`/play/${date}`}>solve it yourself</Link>
        </p>
      </header>
      <div className="space-y-5">
        {race.source === "simulated" && <SimulatedNotice />}
        <ReplayPlayer puzzle={puzzle} race={race} />
      </div>
    </div>
  );
}
