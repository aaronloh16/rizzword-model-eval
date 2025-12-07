// AI Model configurations for the race using Vercel AI Gateway

export interface ModelConfig {
  id: string;
  name: string;
  gatewayId: string; // Format: provider/model-name for AI Gateway
  color: string;
  avatar: string;
  defaultSelected?: boolean;
}

export const availableModels: ModelConfig[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    gatewayId: "openai/gpt-4o",
    color: "#10a37f",
    avatar: "🤖",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    gatewayId: "openai/gpt-4o-mini",
    color: "#74aa9c",
    avatar: "🤖",
    defaultSelected: true,
  },
  {
    id: "claude-sonnet",
    name: "Claude Sonnet 4",
    gatewayId: "anthropic/claude-sonnet-4-20250514",
    color: "#d4a27f",
    avatar: "🧠",
  },
  {
    id: "claude-haiku",
    name: "Claude Haiku 4.5",
    gatewayId: "anthropic/claude-haiku-4-5-20250514",
    color: "#e8c9a8",
    avatar: "🧠",
    defaultSelected: true,
  },
  {
    id: "gemini-flash",
    name: "Gemini 2.0 Flash",
    gatewayId: "google/gemini-2.0-flash",
    color: "#4285f4",
    avatar: "💎",
    defaultSelected: true,
  },
  {
    id: "grok-4",
    name: "Grok 4",
    gatewayId: "xai/grok-4",
    color: "#1da1f2",
    avatar: "🚀",
  },
  {
    id: "grok-4-fast",
    name: "Grok 4 Fast",
    gatewayId: "xai/grok-4-fast-non-reasoning",
    color: "#0ea5e9",
    avatar: "⚡",
    defaultSelected: true,
  },
];

export function getModelById(id: string): ModelConfig | undefined {
  return availableModels.find((m) => m.id === id);
}

export function getDefaultModels(): ModelConfig[] {
  return availableModels.filter((m) => m.defaultSelected);
}
