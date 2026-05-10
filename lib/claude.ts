import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error(
    "ANTHROPIC_API_KEY não configurada. Obtenha em https://console.anthropic.com/"
  );
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// claude-haiku-4-5: mais rápido e econômico — ideal para o MVP
// Para mais qualidade: "claude-sonnet-4-6" ou "claude-opus-4-7"
export const CLAUDE_MODEL = "claude-haiku-4-5" as const;
