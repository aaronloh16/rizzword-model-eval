import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-xl place-items-center px-4 py-28 text-center">
      <p className="sticker rotate-3 bg-hot px-4 py-1 font-display text-5xl font-extrabold text-ink">404</p>
      <h1 className="mt-6 font-display text-3xl font-bold">This page got ratioed out of existence.</h1>
      <p className="mt-2 text-muted">Certified Ohio moment. Head back to today&apos;s race.</p>
      <Link href="/" className="sticker mt-8 bg-lime px-5 py-2.5 font-display font-extrabold text-ink">Back to the race</Link>
    </div>
  );
}
