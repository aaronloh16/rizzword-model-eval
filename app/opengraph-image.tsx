import { getRace, latestPuzzle, summarizeRace } from "@/lib/data";
import { OG_SIZE, raceCard } from "@/lib/og";

export const alt = "RizzWord: AI models race to solve a daily brainrot crossword";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const puzzle = latestPuzzle();
  const race = getRace(puzzle.id);
  return raceCard({ puzzle, summary: race ? summarizeRace(race) : null, headline: "Which AI has the most rizz?" });
}
