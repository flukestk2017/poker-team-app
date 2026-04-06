import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }
  return client;
}

export async function generateText(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1024
): Promise<string> {
  const anthropic = getAnthropicClient();
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });
  const block = message.content[0];
  if (block.type === "text") return block.text;
  throw new Error("Unexpected response type from Claude");
}

export async function generateJSON<T>(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1024
): Promise<T> {
  const text = await generateText(systemPrompt, userMessage, maxTokens);
  const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (!match) throw new Error("No JSON found in response");
  return JSON.parse(match[1] || match[0]);
}
