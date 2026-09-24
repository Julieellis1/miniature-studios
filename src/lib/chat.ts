// src/lib/chat.ts
export function buildProviderBody(
  model: string,
  messages: { role: string; content: string }[],
  maxTokens?: number
) {
  return {
    model,
    messages,
    temperature: 0.8,
    ...(typeof maxTokens === "number" && maxTokens > 0 ? { max_tokens: Math.floor(maxTokens) } : {}),
  };
}
export function buildConsistencyBlock(chars: { name: string; role: string; bibleDetails: string }[]) {
  return chars.map((c) => `- ${c.name} (${c.role}): ${c.bibleDetails}`).join("\n");
}
