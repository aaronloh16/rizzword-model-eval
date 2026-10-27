import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { redisEnv } from "./race/guards";

let client: Redis | null | undefined;

/** Shared Upstash / Vercel KV client, or null when not configured. */
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const env = redisEnv();
  client = env ? new Redis({ url: env.url, token: env.token }) : null;
  return client;
}

const limiters = new Map<string, Ratelimit>();

export function limiter(name: string, tokens: number, window: `${number} ${"s" | "m" | "h" | "d"}`): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  const id = `${name}:${tokens}:${window}`;
  let l = limiters.get(id);
  if (!l) {
    l = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(tokens, window), prefix: `rizzword:${name}` });
    limiters.set(id, l);
  }
  return l;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
