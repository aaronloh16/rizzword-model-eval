import type { Metadata } from "next";
import Link from "next/link";
import { SourceBadge } from "@/components/SourceNotice";
import { history, seasonTable } from "@/lib/data";
import { fmtDate, fmtPct, fmtTime, fmtUsd } from "@/lib/format";

export const metadata: Metadata = {
  title: "Results history",
  description: "Every daily RizzWord race: winners, accuracy, speed and cost per model.",
};

export default function HistoryPage() {
  const races = history();
  const season = seasonTable(races);
  const anySimulated = races.some((r) => r.source === "simulated");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">The record books</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Every daily race, every model. Also available as{" "}
            <Link href="/api/history" className="font-mono text-sm text-white underline underline-offset-2">/api/history</Link> for your own charts.
          </p>
        </div>
      </header>

      {anySimulated && (
        <p className="mb-6 rounded-xl border border-sun/30 bg-sun/[0.06] px-4 py-3 text-sm text-muted">
          Rows marked <SourceBadge source="simulated" /> are synthetic demo data with equal odds for every model. Don&apos;t read them as a ranking.
        </p>
      )}

      <section aria-labelledby="season-h" className="mb-12">
        <h2 id="season-h" className="mb-3 font-display text-2xl font-bold">Season table</h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-panel">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wider text-dim">
                <th scope="col" className="px-4 py-3">#</th>
                <th scope="col" className="px-2 py-3">Model</th>
                <th scope="col" className="px-2 py-3 text-right">Races</th>
                <th scope="col" className="px-2 py-3 text-right">Wins</th>
                <th scope="col" className="px-2 py-3 text-right">Podiums</th>
                <th scope="col" className="px-2 py-3 text-right">Accuracy</th>
                <th scope="col" className="px-2 py-3 text-right">Avg time</th>
                <th scope="col" className="px-4 py-3 text-right">Avg cost</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular">
              {season.map((r, i) => (
                <tr key={r.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3 text-dim">{i + 1}</td>
                  <th scope="row" className="px-2 py-3 font-sans font-semibold">
                    <span className="mr-2 inline-block size-2.5 rounded-full align-middle" style={{ background: r.color }} />
                    {r.name}
                  </th>
                  <td className="px-2 py-3 text-right text-muted">{r.races}</td>
                  <td className="px-2 py-3 text-right font-bold">{r.wins}</td>
                  <td className="px-2 py-3 text-right">{r.podiums}</td>
                  <td className="px-2 py-3 text-right">{fmtPct(r.accuracy)}</td>
                  <td className="px-2 py-3 text-right">{fmtTime(r.avgTimeMs)}</td>
                  <td className="px-4 py-3 text-right">{fmtUsd(r.avgCostUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="days-h">
        <h2 id="days-h" className="mb-3 font-display text-2xl font-bold">Daily races</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {races.map((s) => (
            <li key={s.date}>
              <Link href={`/race/${s.date}`} className="group block rounded-2xl border border-line bg-panel p-4 transition-colors hover:border-dim">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-dim">#{s.issue} · {fmtDate(s.date, { weekday: "short", month: "short", day: "numeric" })}</p>
                    <h3 className="font-display text-lg font-bold group-hover:text-lime">{s.title}</h3>
                  </div>
                  <SourceBadge source={s.source} />
                </div>
                <ol className="mt-3 space-y-1.5">
                  {s.lanes.map((l) => (
                    <li key={l.id} className="flex items-center gap-2 text-sm">
                      <span className="w-4 font-mono text-xs text-dim">{l.rank}</span>
                      <span className="size-2 rounded-full" style={{ background: l.color }} />
                      <span className={`flex-1 truncate ${l.rank === 1 ? "font-semibold" : "text-muted"}`}>{l.name}</span>
                      <span className="relative h-1.5 w-20 overflow-hidden rounded-full bg-line sm:w-28" aria-hidden>
                        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(l.correct / l.total) * 100}%`, background: l.color }} />
                      </span>
                      <span className="w-12 text-right font-mono text-xs tabular text-muted">{l.correct}/{l.total}</span>
                      <span className="hidden w-14 text-right font-mono text-xs tabular text-dim sm:inline">{fmtTime(l.timeMs)}</span>
                    </li>
                  ))}
                </ol>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
