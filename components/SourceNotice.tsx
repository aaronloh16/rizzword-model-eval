import { REPO_URL } from "@/lib/site";

/** Honest labelling: simulated transcripts must never pass for real results. */
export function SourceBadge({ source }: { source: "live" | "simulated" }) {
  return source === "live" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-lime">
      <span className="size-1.5 rounded-full bg-lime" /> Recorded
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-sun/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-sun"
      title="Synthetic demo data, not real model output"
    >
      <span className="size-1.5 rounded-full bg-sun" /> Simulated
    </span>
  );
}

export function SimulatedNotice() {
  return (
    <p className="rounded-xl border border-sun/30 bg-sun/[0.06] px-4 py-3 text-sm text-muted">
      <strong className="font-semibold text-sun">Heads up: this replay is simulated.</strong> It&apos;s synthetic demo data so the site works with
      zero API spend. Every model gets the same odds, so the winner is a dice roll, not a verdict. Real races are recorded through AI Gateway with{" "}
      <code className="rounded bg-panel-2 px-1 py-0.5 font-mono text-xs text-white">pnpm race:record</code> (
      <a className="underline underline-offset-2 hover:text-white" href={`${REPO_URL}#recording-real-races`}>
        how
      </a>
      ).
    </p>
  );
}
