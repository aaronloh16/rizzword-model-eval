import { z } from "zod";
import { getRace } from "@/lib/data";
import { clientIp, getRedis, limiter } from "@/lib/redis";

/**
 * Crowd predictions. Optional: without Redis this returns 204 and the client
 * keeps the pick locally. One vote per IP per race (last one wins).
 */
const Body = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), model: z.string().max(64) });

export async function GET(req: Request) {
  const redis = getRedis();
  const date = new URL(req.url).searchParams.get("date") ?? "";
  if (!redis || !getRace(date)) return new Response(null, { status: 204 });
  const tally = (await redis.hgetall<Record<string, number>>(`rizzword:votes:${date}`)) ?? {};
  return Response.json({ tally }, { headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=300" } });
}

export async function POST(req: Request) {
  const redis = getRedis();
  if (!redis) return new Response(null, { status: 204 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });
  const { date, model } = parsed.data;
  const race = getRace(date);
  if (!race || !race.models.some((m) => m.id === model)) return Response.json({ error: "Unknown race or model" }, { status: 400 });

  const rl = limiter("vote", 30, "1 h");
  const ip = clientIp(req);
  if (rl && !(await rl.limit(ip)).success) return Response.json({ error: "Slow down" }, { status: 429 });

  const voterKey = `rizzword:voter:${date}:${ip}`;
  const previous = await redis.get<string>(voterKey);
  const tallyKey = `rizzword:votes:${date}`;
  const tx = redis.multi();
  if (previous && previous !== model) tx.hincrby(tallyKey, previous, -1);
  if (previous !== model) tx.hincrby(tallyKey, model, 1);
  tx.set(voterKey, model, { ex: 60 * 60 * 24 * 30 });
  await tx.exec();
  const tally = (await redis.hgetall<Record<string, number>>(tallyKey)) ?? {};
  return Response.json({ tally });
}
