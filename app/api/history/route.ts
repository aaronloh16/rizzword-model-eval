import { history, seasonTable } from "@/lib/data";

export const dynamic = "force-static";

/** Public, static results feed. Rebuilt on every deploy. */
export function GET() {
  const races = history();
  return Response.json(
    {
      generatedAt: new Date().toISOString(),
      note: "source=simulated rows are synthetic demo data, not real model output.",
      season: seasonTable(races),
      races,
    },
    { headers: { "access-control-allow-origin": "*" } },
  );
}
