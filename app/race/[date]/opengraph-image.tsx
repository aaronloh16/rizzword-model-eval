import { allPuzzles, getPuzzle, getRace, summarizeRace } from "@/lib/data";
import { OG_SIZE, raceCard } from "@/lib/og";

export const alt = "RizzWord race replay";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return allPuzzles().filter((p) => getRace(p.id)).map((p) => ({ date: p.id }));
}

export default async function Image({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const puzzle = getPuzzle(date)!;
  const race = getRace(date);
  const summary = race ? summarizeRace(race) : null;
  return raceCard({ puzzle, summary, headline: summary && summary.source === "live" ? `${summary.winner.name} takes “${puzzle.title}”` : `“${puzzle.title}”` });
}
