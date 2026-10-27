import { z } from "zod";
import { getPuzzle } from "@/lib/data";
import { MAX_LIVE_MODELS, getModel, type ModelConfig } from "@/lib/models";
import { DEFAULT_SETTINGS, runRace } from "@/lib/race/engine";
import { liveConfig, safeEqual, worstCaseCost } from "@/lib/race/guards";
import type { LiveStreamMessage } from "@/lib/race/types";
import { clientIp, getRedis, limiter } from "@/lib/redis";

export const maxDuration = 120;

const Body = z.object({
  puzzleId: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  models: z.array(z.string().max(64)).min(1).max(MAX_LIVE_MODELS),
  code: z.string().max(200).optional(),
});

const fail = (status: number, error: string) => Response.json({ error }, { status });

/**
 * Live race: runs real models through AI Gateway and streams race events as
 * NDJSON. Guarded, in order: feature flag + credentials, same-origin, schema,
 * access code, model allowlist, per-race cost ceiling, per-IP rate limit,
 * global daily race cap, global daily spend budget. Client disconnect aborts
 * every in-flight model call so a closed tab stops spending.
 */
export async function POST(req: Request) {
  const cfg = liveConfig();
  if (!cfg.enabled) return fail(503, cfg.reason ?? "Live racing is disabled.");

  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return fail(403, "Cross-origin requests are not allowed.");

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid request.");
  const { puzzleId, code } = parsed.data;

  if (cfg.requiresCode && !(await safeEqual(code ?? "", process.env.LIVE_RACE_ACCESS_CODE!))) {
    return fail(401, "Wrong access code.");
  }

  const puzzle = getPuzzle(puzzleId);
  if (!puzzle) return fail(404, "Unknown puzzle.");
  const ids = [...new Set(parsed.data.models)];
  const models = ids.map(getModel);
  if (models.some((m) => !m)) return fail(400, "Unknown model.");
  const lineup = models as ModelConfig[];

  const ceiling = worstCaseCost(puzzle, lineup, DEFAULT_SETTINGS.maxOutputTokens);
  if (ceiling > cfg.maxRaceUsd) {
    return fail(400, `That lineup could cost up to $${ceiling.toFixed(2)}; the cap is $${cfg.maxRaceUsd.toFixed(2)}. Pick cheaper models.`);
  }

  const redis = getRedis();
  const day = new Date().toISOString().slice(0, 10);
  const spendKey = `rizzword:live:spend:${day}`;
  if (redis) {
    const ip = clientIp(req);
    const perIp = await limiter("live-ip", cfg.perIpPerHour, "1 h")!.limit(ip);
    if (!perIp.success) return fail(429, `Easy there. ${cfg.perIpPerHour} live races per hour per person.`);

    const racesKey = `rizzword:live:races:${day}`;
    const count = await redis.incr(racesKey);
    if (count === 1) await redis.expire(racesKey, 60 * 60 * 26);
    if (count > cfg.dailyRaces) return fail(429, "Today's live race quota is used up. Replays are still free.");

    // Reserve the worst case up front; settle to the real cost when done.
    const reserved = Number(await redis.incrbyfloat(spendKey, ceiling));
    await redis.expire(spendKey, 60 * 60 * 26);
    if (reserved > cfg.dailyBudgetUsd) {
      await redis.incrbyfloat(spendKey, -ceiling);
      return fail(429, "Today's live race budget is spent. Replays are still free.");
    }
  }

  const encoder = new TextEncoder();
  const abort = new AbortController();
  req.signal.addEventListener("abort", () => abort.abort());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (msg: LiveStreamMessage) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(msg) + "\n"));
        } catch {
          abort.abort();
        }
      };
      let spent = 0;
      send({
        kind: "hello",
        puzzleId,
        startedAt: new Date().toISOString(),
        models: lineup.map((m) => ({ id: m.id, name: m.name, gatewayId: m.gatewayId })),
      });
      try {
        await runRace({
          puzzle,
          models: lineup,
          signal: abort.signal,
          onEvent: (event) => {
            if (event.type === "done") spent += event.costUsd;
            send({ kind: "event", event });
          },
        });
        send({ kind: "end" });
      } catch (error) {
        console.error("live race failed", error);
        send({ kind: "fatal", message: "The race crashed. No answers were lost on our side, but you'll need to start again." });
      } finally {
        if (redis) await redis.incrbyfloat(spendKey, spent - ceiling).catch(() => {});
        try {
          controller.close();
        } catch {}
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
}

/** Lets the UI know whether live racing is available before showing controls. */
export function GET() {
  const cfg = liveConfig();
  return Response.json(
    { enabled: cfg.enabled, reason: cfg.reason, requiresCode: cfg.requiresCode, maxRaceUsd: cfg.maxRaceUsd },
    { headers: { "cache-control": "no-store" } },
  );
}
