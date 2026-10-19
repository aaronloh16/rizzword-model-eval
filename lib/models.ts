/**
 * AI Model Configurations
 * 
 * This file defines all available AI models for the crossword race.
 * Each model is configured with:
 * - A unique internal ID (used in frontend state)
 * - A display name (shown in UI)
 * - A gateway ID (the Vercel AI Gateway model identifier)
 * - UI customization (color, icon)
 * 
 * Vercel AI Gateway Model ID Format:
 *   "provider/model-name"
 *   Examples: "openai/gpt-4o", "anthropic/claude-sonnet-4.5", "spacexai/grok-4.7"
 * 
 * The gateway abstracts away individual provider API keys - you only need
 * the AI_GATEWAY_API_KEY environment variable.
 */

export interface ModelConfig {
  id: string;              // Internal identifier
  name: string;            // Display name in UI
  gatewayId: string;       // Vercel AI Gateway model identifier
  color: string;           // Accent color for UI elements
  icon: string;            // Icon file path in public folder
  defaultSelected?: boolean; // Pre-selected when page loads
}

export const availableModels: ModelConfig[] = [
  // OpenAI Models
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    gatewayId: "openai/gpt-5-mini",
    color: "#10a37f",       // OpenAI green
    icon: "/openai.webp",
    defaultSelected: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    gatewayId: "openai/gpt-4o-mini",
    color: "#74aa9c",
    icon: "/openai.webp",
  },

  // Anthropic Models
  {
    id: "claude-sonnet",
    name: "Claude Sonnet 4.5",
    gatewayId: "anthropic/claude-sonnet-4.5",
    color: "#d4a27f",       // Anthropic tan
    icon: "/anthropic.webp",
  },
  {
    id: "claude-haiku",
    name: "Claude Haiku 4.5",
    gatewayId: "anthropic/claude-haiku-4.5",
    color: "#e8c9a8",
    icon: "/anthropic.webp",
    defaultSelected: true,  // Fast Anthropic option
  },

  // Google Models
  {
    id: "gemini-flash",
    name: "Gemini 2.5 Flash",
    gatewayId: "google/gemini-2.5-flash",
    color: "#4285f4",       // Google blue
    icon: "/gemini.webp",
    defaultSelected: true,  // Fast Google option
  },

  {
    id: "gemini-3-pro",
    name: "Gemini 3.1 Pro",
    gatewayId: "google/gemini-3.1-pro-preview",
    color: "#4285f4",       // Google blue
    icon: "/gemini.webp",
  },

  // xAI Models
  {
    id: "grok-4",
    name: "Grok 4.7",
    gatewayId: "spacexai/grok-4.7",
    color: "#1da1f2",       // X/Twitter blue
    icon: "/grok.webp",
  },

  // DeepSeek Models
  {
    id: "deepseek-v3.2",
    name: "DeepSeek V3.2",
    gatewayId: "deepseek/deepseek-v3.2",
    color: "#1e40af",       // DeepSeek blue
    icon: "/deepseek.webp",
  },

  // Meta Models
  {
    id: "llama-3.3-70b",
    name: "Llama 3.3 70B",
    gatewayId: "meta/llama-3.3-70b",
    color: "#0668e1",       // Meta blue
    icon: "/meta.webp",
  }
];

/**
 * Look up a model by its internal ID
 * Used by the API route to get the gateway ID
 */
export function getModelById(id: string): ModelConfig | undefined {
  return availableModels.find((m) => m.id === id);
}

/**
 * Get models that should be pre-selected on page load
 * Returns the "fast" tier models for quick races
 */
export function getDefaultModels(): ModelConfig[] {
  return availableModels.filter((m) => m.defaultSelected);
}
