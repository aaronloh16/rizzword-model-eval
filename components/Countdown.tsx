"use client";

import { useEffect, useState } from "react";

const STEPS = ["3", "2", "1", "GO"];

/** 3-2-1-GO overlay. Skipped instantly for reduced-motion users. */
export function Countdown({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDone();
      return;
    }
    const id = setTimeout(() => (i < STEPS.length - 1 ? setI(i + 1) : onDone()), i === STEPS.length - 1 ? 380 : 420);
    return () => clearTimeout(id);
  }, [i, onDone]);

  const go = STEPS[i] === "GO";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/80 backdrop-blur-sm" role="status" aria-live="assertive">
      <span
        key={i}
        className={`sticker animate-pop px-8 py-2 font-display text-[min(30vw,180px)] font-extrabold leading-none ${go ? "-rotate-3 bg-lime text-ink" : "rotate-2 bg-paper text-ink"}`}
      >
        {STEPS[i]}
      </span>
    </div>
  );
}
