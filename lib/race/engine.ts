import { gateway, streamText } from "ai";
import type { ModelConfig } from "../models";
import { estimateCost } from "../models";
import type { Puzzle } from "../puzzle/types";
import { AnswerStreamParser } from "./parse";
import { INSTRUCTIONS, PROMPT_VERSION, puzzlePrompt } from "./prompt";
import type { RaceEvent, RaceTranscript, TokenUsage } from "./types";

export interface RaceSettings {
  /** Top-level AI SDK reasoning effort. "low" keeps races fast and cheap. */
  reasoning: "none" | "minimal" | "low" | "medium" | "high";
  maxOutputTokens: number;
  /** Hard wall-clock limit per model. */
  timeoutMs: number;
  /** Cap on reasoning text forwarded per model (still billed, just not streamed). */
  maxThinkChars: number;
}

export const DEFAULT_SETTINGS: RaceSettings = {
  reasoning: "low",
  maxOutputTokens: 3000,
  timeoutMs: 75_000,
  maxThinkChars: 4000,
};

interface RunOptions {
  puzzle: Puzzle;
  models: ModelConfig[];
  settings?: Partial<RaceSettings>;
  signal?: AbortSignal;
  onEvent: (event: RaceEvent) => void;
}

/**
 * Race every model on the same puzzle, in parallel, through AI Gateway.
 * One streaming call per model: answers are parsed out of the text stream as
 * they land, reasoning deltas are forwarded (throttled) so viewers can watch
 * the model think. Never throws for a single model's failure — that becomes
 * an `error` event in its lane.
 */
export async function runRace({ puzzle, models, settings: overrides, signal, onEvent }: RunOptions) {
  const settings = { ...DEFAULT_SETTINGS, ...overrides };
  const prompt = puzzlePrompt(puzzle);
  const started = performance.now();
  const t = () => Math.round(performance.now() - started);

  await Promise.all(
    models.map((model) => runLane({ model, puzzle, prompt, settings, signal, t, onEvent })),
  );
}

async function runLane({
  model,
  puzzle,
  prompt,
  settings,
  signal,
  t,
  onEvent,
}: {
  model: ModelConfig;
  puzzle: Puzzle;
  prompt: string;
  settings: RaceSettings;
  signal?: AbortSignal;
  t: () => number;
  onEvent: (e: RaceEvent) => void;
}) {
  const parser = new AnswerStreamParser(puzzle.entries);
  const laneSignal = AbortSignal.any([
    AbortSignal.timeout(settings.timeoutMs),
    ...(signal ? [signal] : []),
  ]);

  let thinkBuf = "";
  let thinkSent = 0;
  let lastFlush = 0;
  const flushThink = (force = false) => {
    if (!thinkBuf) return;
    const now = t();
    if (!force && now - lastFlush < 120 && thinkBuf.length < 240) return;
    const room = settings.maxThinkChars - thinkSent;
    if (room > 0) {
      const text = thinkBuf.slice(0, room);
      thinkSent += text.length;
      onEvent({ t: now, model: model.id, type: "think", text });
    }
    thinkBuf = "";
    lastFlush = now;
  };

  onEvent({ t: t(), model: model.id, type: "start" });

  try {
    const result = streamText({
      model: gateway(model.gatewayId),
      instructions: INSTRUCTIONS,
      prompt,
      reasoning: settings.reasoning,
      maxOutputTokens: settings.maxOutputTokens,
      maxRetries: 1,
      abortSignal: laneSignal,
    });

    let usage: TokenUsage = { input: 0, output: 0, reasoning: 0 };
    let gatewayCost: number | null = null;
    let finishReason: string | undefined;

    for await (const part of result.stream) {
      switch (part.type) {
        case "reasoning-delta":
          thinkBuf += part.text;
          flushThink();
          break;
        case "text-delta":
          flushThink(true);
          for (const a of parser.push(part.text)) {
            onEvent({ t: t(), model: model.id, type: "fill", entry: a.entry, answer: a.answer });
          }
          break;
        case "finish-step": {
          const cost = Number((part.providerMetadata?.gateway as Record<string, unknown> | undefined)?.cost);
          if (Number.isFinite(cost)) gatewayCost = (gatewayCost ?? 0) + cost;
          break;
        }
        case "finish":
          finishReason = part.finishReason;
          usage = {
            input: part.totalUsage.inputTokens ?? 0,
            output: part.totalUsage.outputTokens ?? 0,
            reasoning: part.totalUsage.outputTokenDetails?.reasoningTokens ?? 0,
          };
          break;
        case "error":
          throw part.error;
      }
    }
    flushThink(true);
    for (const a of parser.end()) {
      onEvent({ t: t(), model: model.id, type: "fill", entry: a.entry, answer: a.answer });
    }
    onEvent({
      t: t(),
      model: model.id,
      type: "done",
      usage,
      costUsd: gatewayCost ?? estimateCost(model, usage.input, usage.output),
      costSource: gatewayCost !== null ? "gateway" : "estimate",
      finishReason,
    });
  } catch (error) {
    flushThink(true);
    onEvent({ t: t(), model: model.id, type: "error", message: describeError(error, laneSignal) });
  }
}

function describeError(error: unknown, signal: AbortSignal): string {
  if (signal.aborted) {
    const reason = signal.reason as { name?: string } | undefined;
    return reason?.name === "TimeoutError" ? "Timed out" : "Cancelled";
  }
  const message = error instanceof Error ? error.message : String(error);
  if (/api key|unauthori[sz]ed|authentication|oidc/i.test(message)) return "Gateway auth failed";
  if (/rate.?limit|429/i.test(message)) return "Rate limited by provider";
  if (/budget|insufficient|credits/i.test(message)) return "Gateway budget exhausted";
  return message.slice(0, 160);
}

export function transcriptHeader(puzzle: Puzzle, models: ModelConfig[], settings: RaceSettings): Omit<RaceTranscript, "events" | "source"> {
  return {
    version: 1,
    puzzleId: puzzle.id,
    recordedAt: new Date().toISOString(),
    models: models.map((m) => ({ id: m.id, name: m.name, gatewayId: m.gatewayId })),
    settings: { reasoning: settings.reasoning, maxOutputTokens: settings.maxOutputTokens, promptVersion: PROMPT_VERSION },
  };
}
