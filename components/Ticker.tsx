const WORDS = ["NO CAP", "LET HIM COOK", "+1000 AURA", "OHIO FINAL BOSS", "CERTIFIED CLANKER", "IT'S GIVING", "FANUM TAX", "SIGMA GRINDSET", "MID", "LOCK IN", "DELULU", "BUSSIN", "RATIO"];

/** Decorative slang marquee under the header. Hidden from assistive tech. */
export function Ticker() {
  const row = WORDS.map((w, i) => (
    <span key={i} className="flex items-center gap-6">
      <span>{w}</span>
      <span className="text-hot">✦</span>
    </span>
  ));
  return (
    <div aria-hidden className="overflow-hidden border-t border-line bg-lime text-ink">
      <div className="flex w-max animate-ticker gap-6 py-1 font-mono text-[11px] font-bold tracking-widest motion-reduce:animate-none">
        {row}
        {row}
      </div>
    </div>
  );
}
