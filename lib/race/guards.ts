import type { ModelConfig } from "../models";
import { estimateCost } from "../models";
import type { Puzzle } from "../puzzle/types";
import { INSTRUCTIONS, estimateTokens, puzzlePrompt } from "./prompt";

/**
 * Upper bound on what a race can cost: full prompt in, every model hitting
 * its output cap. Real races are usually 5-20x cheaper than this.
 */
export function worstCaseCost(puzzle: Puzzle, models: Pick<ModelConfig, "pricing">[], maxOutputTokens: number): number {
  const input = estimateTokens(INSTRUCTIONS + puzzlePrompt(puzzle)) + 64;
  return models.reduce((sum, m) => sum + estimateCost(m, input, maxOutputTokens), 0);
}

export interface LiveConfig {
  enabled: boolean;
  /** Why live racing is off, shown in the UI. */
  reason?: string;
  requiresCode: boolean;
  maxRaceUsd: number;
  perIpPerHour: number;
  dailyRaces: number;
  dailyBudgetUsd: number;
  hasRedis: boolean;
}

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function redisEnv(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

/**
 * Live racing fails closed. It needs ALL of:
 *  1. LIVE_RACES_ENABLED=true
 *  2. gateway credentials (AI_GATEWAY_API_KEY, or Vercel OIDC in deployments)
 *  3. in production, an abuse guard: Redis rate limiting and/or an access code
 */
export function liveConfig(): LiveConfig {
  const hasRedis = redisEnv() !== null;
  const requiresCode = Boolean(process.env.LIVE_RACE_ACCESS_CODE);
  const base = {
    requiresCode,
    hasRedis,
    maxRaceUsd: num(process.env.LIVE_RACE_MAX_USD, 0.25),
    perIpPerHour: num(process.env.LIVE_RACE_PER_IP_PER_HOUR, 3),
    dailyRaces: num(process.env.LIVE_RACE_DAILY_LIMIT, 40),
    dailyBudgetUsd: num(process.env.LIVE_RACE_DAILY_BUDGET_USD, 5),
  };
  if (process.env.LIVE_RACES_ENABLED !== "true") {
    return { ...base, enabled: false, reason: "Live racing is switched off on this deployment. Replays are free to watch." };
  }
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    return { ...base, enabled: false, reason: "No AI Gateway credentials configured." };
  }
  if (process.env.NODE_ENV === "production" && !hasRedis && !requiresCode) {
    return {
      ...base,
      enabled: false,
      reason: "Live racing needs Redis rate limiting or an access code in production.",
    };
  }
  return { ...base, enabled: true };
}

/** Constant-time string compare (both sides hashed so lengths match). */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
