// AI Model configurations for the race using Vercel AI Gateway

export interface ModelConfig {
  id: string;
  name: string;
  gatewayId: string; // Format: provider/model-name for AI Gateway
  color: string;
  avatar: string;
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
  },
  {
    id: "claude-sonnet",
    name: "Claude Sonnet",
    gatewayId: "anthropic/claude-sonnet-4-20250514",
    color: "#d4a27f",
    avatar: "🧠",
  },
  {
    id: "claude-haiku",
    name: "Claude Haiku",
    gatewayId: "anthropic/claude-3-5-haiku-20241022",
    color: "#e8c9a8",
    avatar: "🧠",
  },
  {
    id: "gemini-flash",
    name: "Gemini Flash",
    gatewayId: "google/gemini-2.0-flash",
    color: "#4285f4",
    avatar: "💎",
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    gatewayId: "google/gemini-1.5-pro",
    color: "#1a73e8",
    avatar: "💎",
  },
];

export function getModelById(id: string): ModelConfig | undefined {
  return availableModels.find((m) => m.id === id);
}
