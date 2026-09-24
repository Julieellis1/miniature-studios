// src/lib/chat.ts
export function buildProviderBody(model: string, messages: { role: string; content: string }[]) {
  return { model, messages, temperature: 0.8 };
}
export function buildConsistencyBlock(chars: { name: string; role: string; bibleDetails: string }[]) {
  return chars.map((c) => `- ${c.name} (${c.role}): ${c.bibleDetails}`).join("\n");
}
