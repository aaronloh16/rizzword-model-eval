import { fmtPct, fmtTime, fmtTokens, fmtUsd } from "@/lib/format";
import type { LaneSummary } from "@/lib/race/summary";

/** Final per-model stats. Scrolls horizontally on small screens. */
export function ResultsTable({ rows, caption }: { rows: LaneSummary[]; caption?: string }) {
  const fastest = Math.min(...rows.map((r) => r.timeMs ?? Infinity));
  const cheapest = Math.min(...rows.map((r) => r.costUsd ?? Infinity));
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-panel">
      <table className="w-full min-w-[720px] text-left text-sm">
        {caption && <caption className="px-4 pt-4 text-left font-display text-lg font-bold">{caption}</caption>}
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-wider text-dim">
            <th scope="col" className="px-4 py-3 font-semibold">#</th>
            <th scope="col" className="px-2 py-3 font-semibold">Model</th>
            <th scope="col" className="px-2 py-3 text-right font-semibold">Solved</th>
            <th scope="col" className="px-2 py-3 text-right font-semibold">Letters</th>
            <th scope="col" className="px-2 py-3 text-right font-semibold">Time</th>
            <th scope="col" className="px-2 py-3 text-right font-semibold" title="Time to first answer">First</th>
            <th scope="col" className="px-2 py-3 text-right font-semibold">Cost</th>
            <th scope="col" className="px-2 py-3 text-right font-semibold" title="Input / output (of which reasoning)">Tokens in/out</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold" title="Answers rewritten after first attempt">Revs</th>
          </tr>
        </thead>
        <tbody className="font-mono tabular">
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line/60 last:border-0">
              <td className="px-4 py-3 font-display font-extrabold">{r.rank === 1 ? "👑" : r.rank}</td>
              <th scope="row" className="px-2 py-3 font-sans font-semibold">
                <span className="mr-2 inline-block size-2.5 rounded-full align-middle" style={{ background: r.color }} />
                {r.name}
                {r.error && <span className="ml-2 rounded bg-hot/15 px-1.5 py-0.5 text-[10px] text-hot" title={r.error}>DNF</span>}
              </th>
              <td className="px-2 py-3 text-right">
                <span className={r.correct === r.total ? "text-lime" : ""}>{r.correct}</span>
                <span className="text-dim">/{r.total}</span>
              </td>
              <td className="px-2 py-3 text-right">{fmtPct(r.letterAccuracy)}</td>
              <td className={`px-2 py-3 text-right ${r.timeMs === fastest ? "text-sky" : ""}`}>{fmtTime(r.timeMs)}</td>
              <td className="px-2 py-3 text-right text-muted">{fmtTime(r.firstAnswerMs)}</td>
              <td className={`px-2 py-3 text-right ${r.costUsd === cheapest ? "text-sun" : ""}`}>
                {fmtUsd(r.costUsd)}
                {r.costSource === "estimate" && <span className="text-dim" title="Estimated from list price">*</span>}
              </td>
              <td className="px-2 py-3 text-right text-muted">
                {fmtTokens(r.tokensIn)}/{fmtTokens(r.tokensOut)}
                {r.reasoningTokens > 0 && <span className="text-dim"> ({fmtTokens(r.reasoningTokens)})</span>}
              </td>
              <td className="px-4 py-3 text-right text-muted">{r.revisions}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line px-4 py-2.5 text-xs text-dim">
        Ranked by correct entries, then correct letters, then finish time. <span className="text-sky">Fastest</span> ·{" "}
        <span className="text-sun">cheapest</span> · * cost estimated from list price.
      </p>
    </div>
  );
}
