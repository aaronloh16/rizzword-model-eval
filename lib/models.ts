/**
 * The RizzWord roster.
 *
 * Gateway IDs and list prices are a snapshot of the public AI Gateway catalog
 * (https://ai-gateway.vercel.sh/v1/models) taken 2026-10-27. Prices are USD per
 * million tokens and are only used to *estimate* cost when the gateway doesn't
 * report one, and to pre-check the worst-case cost of a live race.
 *
 * To add a model: append it here with a unique `id`. That's it — the UI, the
 * live race allowlist and the recorder all read from this list.
 */
export type Tier = "heavyweight" | "speedrunner";

export interface ModelConfig {
  id: string;
  name: string;
  /** Short label for tight spaces (lanes on mobile, OG image). */
  short: string;
  lab: string;
  gatewayId: string;
  tier: Tier;
  /** Lane accent. Picked to stay distinct on the dark arena background. */
  color: string;
  pricing: { input: number; output: number };
}

export const MODELS: ModelConfig[] = [
  // --- Heavyweights: each lab's current flagship ---
  { id: "gpt-6.1-sol", name: "GPT-6.1 Sol", short: "GPT-6.1", lab: "OpenAI", gatewayId: "openai/gpt-6.1-sol", tier: "heavyweight", color: "#3ee6a8", pricing: { input: 2, output: 10 } },
  { id: "claude-opus-5.5", name: "Claude Opus 5.5", short: "Opus 5.5", lab: "Anthropic", gatewayId: "anthropic/claude-opus-5.5", tier: "heavyweight", color: "#ff9b5e", pricing: { input: 4, output: 20 } },
  { id: "gemini-4-argon", name: "Gemini 4 Argon", short: "Gemini 4", lab: "Google", gatewayId: "google/gemini-4-argon", tier: "heavyweight", color: "#6aa8ff", pricing: { input: 2, output: 10 } },
  { id: "grok-4.7", name: "Grok 4.7", short: "Grok 4.7", lab: "SpaceXAI", gatewayId: "spacexai/grok-4.7", tier: "heavyweight", color: "#e5e5f0", pricing: { input: 2, output: 6 } },
  { id: "kimi-k3.1-pro", name: "Kimi K3.1 Pro", short: "Kimi K3.1", lab: "Moonshot", gatewayId: "moonshotai/kimi-k3.1-pro", tier: "heavyweight", color: "#c084fc", pricing: { input: 2, output: 10 } },
  { id: "claude-sonnet-5.5", name: "Claude Sonnet 5.5", short: "Sonnet 5.5", lab: "Anthropic", gatewayId: "anthropic/claude-sonnet-5.5", tier: "heavyweight", color: "#f2c18d", pricing: { input: 2, output: 10 } },
  { id: "muse-spark-1.3", name: "Muse Spark 1.3", short: "Muse 1.3", lab: "Meta", gatewayId: "meta/muse-spark-1.3", tier: "heavyweight", color: "#5b8cff", pricing: { input: 1.25, output: 4.25 } },

  // --- Speedrunners: cheap and fast ---
  { id: "deepseek-v4.1-flash", name: "DeepSeek V4.1 Flash", short: "DS V4.1", lab: "DeepSeek", gatewayId: "deepseek/deepseek-v4.1-flash", tier: "speedrunner", color: "#4dd4ff", pricing: { input: 0.075, output: 0.3 } },
  { id: "gpt-6-luna", name: "GPT-6 Luna", short: "Luna", lab: "OpenAI", gatewayId: "openai/gpt-6-luna", tier: "speedrunner", color: "#9cf5d0", pricing: { input: 0.1, output: 0.5 } },
  { id: "claude-haiku-5.5", name: "Claude Haiku 5.5", short: "Haiku 5.5", lab: "Anthropic", gatewayId: "anthropic/claude-haiku-5.5", tier: "speedrunner", color: "#ffb3c7", pricing: { input: 0.1, output: 0.5 } },
  { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash", short: "Gem Flash", lab: "Google", gatewayId: "google/gemini-3.8-flash", tier: "speedrunner", color: "#9ec5ff", pricing: { input: 0.75, output: 3.75 } },
  { id: "glm-5.3-flash", name: "GLM 5.3 Flash", short: "GLM 5.3", lab: "Z.ai", gatewayId: "zai/glm-5.3-flash", tier: "speedrunner", color: "#ffe066", pricing: { input: 0.15, output: 0.5 } },
  { id: "qwen3.7-flash", name: "Qwen 3.7 Flash", short: "Qwen 3.7", lab: "Alibaba", gatewayId: "alibaba/qwen3.7-flash", tier: "speedrunner", color: "#ff7ad9", pricing: { input: 0.03, output: 0.13 } },
];

/** The fixed lineup for the recorded daily race, so history stays comparable. */
export const DAILY_LINEUP = [
  "gpt-6.1-sol",
  "claude-opus-5.5",
  "gemini-4-argon",
  "grok-4.7",
  "kimi-k3.1-pro",
  "deepseek-v4.1-flash",
] as const;

/** Default picks on the live race screen: cheap, fast, and from different labs. */
export const DEFAULT_LIVE_PICKS = ["gpt-6-luna", "claude-haiku-5.5", "deepseek-v4.1-flash", "qwen3.7-flash"];

export const MAX_LIVE_MODELS = 4;

const byId = new Map(MODELS.map((m) => [m.id, m]));

export function getModel(id: string): ModelConfig | undefined {
  return byId.get(id);
}

export function modelColor(id: string): string {
  return byId.get(id)?.color ?? "#d4d4d8";
}

export function estimateCost(model: Pick<ModelConfig, "pricing">, inputTokens: number, outputTokens: number): number {
  return (inputTokens * model.pricing.input + outputTokens * model.pricing.output) / 1_000_000;
}
