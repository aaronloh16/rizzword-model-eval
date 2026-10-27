import Link from "next/link";
import { ReplayPlayer } from "@/components/ReplayPlayer";
import { SimulatedNotice, SourceBadge } from "@/components/SourceNotice";
import { getRace, history, latestPuzzle, seasonTable } from "@/lib/data";
import { fmtDate, fmtPct, fmtTime, fmtUsd } from "@/lib/format";

export default function Home() {
  const puzzle = latestPuzzle();
  const race = getRace(puzzle.id);
  const season = seasonTable().slice(0, 6);
  const past = history().slice(1, 5);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <section className="grid gap-8 pb-8 pt-8 sm:pt-12 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <div>
          <p className="mb-4 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-widest text-dim">
            <span className="rounded-full border border-line px-2 py-0.5 text-white">Daily #{puzzle.issue}</span>
            <span>{fmtDate(puzzle.id, { weekday: "long", month: "long", day: "numeric" })}</span>
            {race && <SourceBadge source={race.source} />}
          </p>
          <h1 className="font-display text-[clamp(2.5rem,6.2vw,5rem)] font-extrabold leading-[0.92] tracking-tight">
            Which AI has
            <br />
            the most{" "}
            <span className="relative inline-block -rotate-2">
              <span className="sticker relative z-10 inline-block bg-lime px-3 text-ink">rizz?</span>
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
            Every day, frontier models race through the same crossword of internet slang. Watch them think out loud, fill the grid, and burn tokens,
            side by side. Today: <em className="font-display not-italic text-white">&ldquo;{puzzle.title}&rdquo;</em>.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          <Link href="/play" className="sticker bg-paper px-5 py-3 font-display font-extrabold text-ink transition-transform hover:-translate-y-0.5">
            Solve it yourself
          </Link>
          <Link href="/live" className="sticker bg-panel-2 px-5 py-3 font-display font-extrabold text-white transition-transform hover:-translate-y-0.5">
            Start a live race
          </Link>
        </div>
      </section>

      {race ? (
        <div className="space-y-5">
          {race.source === "simulated" && <SimulatedNotice />}
          <ReplayPlayer puzzle={puzzle} race={race} />
        </div>
      ) : (
        <p className="rounded-2xl border border-line bg-panel p-6 text-muted">No race recorded for today yet.</p>
      )}

      <section aria-labelledby="how" className="mt-20 grid gap-4 md:grid-cols-3">
        <h2 id="how" className="sr-only">How it works</h2>
        {[
          ["01", "Same puzzle, same prompt", "A fresh 14-clue brainrot crossword each day, generated and validated: every crossing checks, no accidental words, no clue leaks its answer."],
          ["02", "One stream per model", "Each model gets one streaming call through Vercel AI Gateway. Answers are parsed out of the stream as they land, and reasoning streams beside them."],
          ["03", "Replays cost nothing", "Races are saved as event logs and committed to the repo. Visitors replay them without a single API call. Live races sit behind keys and cost caps."],
        ].map(([n, title, body]) => (
          <div key={n} className="rounded-2xl border border-line bg-panel p-5">
            <span className="font-mono text-xs font-bold text-lime">{n}</span>
            <h3 className="mt-2 font-display text-lg font-bold">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="season" className="mt-16 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="season" className="font-display text-2xl font-bold">Season standings</h2>
            <Link href="/history" className="text-sm text-muted hover:text-white">All results →</Link>
          </div>
          <ol className="overflow-hidden rounded-2xl border border-line bg-panel">
            {season.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3 border-b border-line/60 px-4 py-3 last:border-0">
                <span className="w-5 font-mono text-sm text-dim">{i + 1}</span>
                <span className="size-2.5 rounded-full" style={{ background: r.color }} />
                <span className="flex-1 font-semibold">{r.name}</span>
                <span className="font-mono text-sm tabular text-muted">
                  <span className="text-white">{r.wins}</span> W · {fmtPct(r.accuracy)} · {fmtTime(r.avgTimeMs)}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="mb-3 font-display text-2xl font-bold">Earlier races</h2>
          <ul className="space-y-2">
            {past.map((s) => (
              <li key={s.date}>
                <Link href={`/race/${s.date}`} className="group flex items-center justify-between rounded-xl border border-line bg-panel px-4 py-3 transition-colors hover:border-dim">
                  <span>
                    <span className="block text-sm font-semibold group-hover:text-lime">{s.title}</span>
                    <span className="font-mono text-xs text-dim">#{s.issue} · {fmtDate(s.date)}</span>
                  </span>
                  <span className="text-right text-xs text-muted">
                    <span className="block font-semibold" style={{ color: s.winner.color }}>{s.winner.name}</span>
                    {s.winner.correct}/{s.winner.total} · {fmtUsd(s.lanes.reduce((a, l) => a + (l.costUsd ?? 0), 0))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
