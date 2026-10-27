import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { buildSolution } from "./puzzle/grid";
import type { Puzzle } from "./puzzle/types";
import type { RaceSummary } from "./data";
import { fmtDate, fmtTime } from "./format";

export const OG_SIZE = { width: 1200, height: 630 };

const fontDir = join(process.cwd(), "node_modules/@fontsource/bricolage-grotesque/files");

async function fonts() {
  const [bold, black] = await Promise.all([
    readFile(join(fontDir, "bricolage-grotesque-latin-700-normal.woff")),
    readFile(join(fontDir, "bricolage-grotesque-latin-800-normal.woff")),
  ]);
  return [
    { name: "Bricolage", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "Bricolage", data: black, weight: 800 as const, style: "normal" as const },
  ];
}

/** Shared OG card: headline left, the day's grid + standings right. */
export async function raceCard({ puzzle, summary, headline }: { puzzle: Puzzle; summary: RaceSummary | null; headline: string }) {
  const solution = buildSolution(puzzle);
  const cell = Math.floor(Math.min(300 / puzzle.cols, 300 / puzzle.rows));
  const winnerCells = new Set<string>();
  // Light up a deterministic sprinkle of letters so the grid reads as "in progress".
  solution.forEach((row, r) => row.forEach((v, c) => v && (r * 7 + c * 3) % 5 < 2 && winnerCells.add(`${r},${c}`)));

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0c0b10", color: "#f2f0f7", fontFamily: "Bricolage", padding: 56 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, paddingRight: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", width: 56, height: 56, background: "#c6ff3d", border: "3px solid #000", borderRadius: 12, boxShadow: "4px 4px 0 #000", alignItems: "center", justifyContent: "center", color: "#0c0b10", fontSize: 38, fontWeight: 800 }}>
              R
            </div>
            <div style={{ display: "flex", fontSize: 40, fontWeight: 800 }}>
              Rizz<span style={{ color: "#c6ff3d" }}>Word</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 24, color: "#9b96a8", marginBottom: 14 }}>
              Daily #{puzzle.issue} · {fmtDate(puzzle.id, { month: "long", day: "numeric", year: "numeric" })}
            </div>
            <div style={{ display: "flex", fontSize: 62, fontWeight: 800, lineHeight: 1, letterSpacing: -1.5 }}>{headline}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {summary?.source === "simulated" && (
              <div style={{ display: "flex", fontSize: 18, color: "#ffd23f", marginBottom: 2 }}>SIMULATED DEMO RACE</div>
            )}
            {(summary?.lanes ?? []).slice(0, 3).map((l) => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24 }}>
                <div style={{ display: "flex", width: 32, color: "#6b6578", fontWeight: 700 }}>{l.rank}</div>
                <div style={{ display: "flex", width: 240, fontWeight: 700 }}>{l.name}</div>
                <div style={{ display: "flex", width: 150, height: 12, background: "#2a2633", borderRadius: 6 }}>
                  <div style={{ display: "flex", width: `${(l.correct / l.total) * 100}%`, height: 12, background: l.color, borderRadius: 6 }} />
                </div>
                <div style={{ display: "flex", color: "#9b96a8", whiteSpace: "nowrap" }}>{`${l.correct}/${l.total} · ${fmtTime(l.timeMs)}`}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 380 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: 6, background: "#000", borderRadius: 14, transform: "rotate(3deg)", boxShadow: "10px 10px 0 #c6ff3d" }}>
            {solution.map((row, r) => (
              <div key={r} style={{ display: "flex", gap: 3 }}>
                {row.map((v, c) => (
                  <div
                    key={c}
                    style={{
                      display: "flex",
                      width: cell,
                      height: cell,
                      borderRadius: 3,
                      background: v === null ? "#000" : winnerCells.has(`${r},${c}`) ? "#d4ff7a" : "#f3eee2",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: cell * 0.62,
                      fontWeight: 800,
                      color: "#17151d",
                    }}
                  >
                    {v && winnerCells.has(`${r},${c}`) ? v : ""}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}
