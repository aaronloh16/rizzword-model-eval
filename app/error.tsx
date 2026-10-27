"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto grid max-w-xl place-items-center px-4 py-28 text-center">
      <p className="sticker -rotate-2 bg-sun px-4 py-1 font-display text-4xl font-extrabold text-ink">crash out</p>
      <h1 className="mt-6 font-display text-3xl font-bold">Something broke mid-race.</h1>
      <p className="mt-2 text-muted">Not your fault. Try again; replays don&apos;t depend on any API.</p>
      <button type="button" onClick={reset} className="sticker mt-8 bg-lime px-5 py-2.5 font-display font-extrabold text-ink">
        Try again
      </button>
    </div>
  );
}
