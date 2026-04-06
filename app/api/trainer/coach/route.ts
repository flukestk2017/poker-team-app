import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { COACH_SYSTEM } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  try {
    const { messages, newSession } = await req.json();

    const anthropic = getAnthropicClient();

    if (newSession || !messages || messages.length === 0) {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: COACH_SYSTEM,
        messages: [
          {
            role: "user",
            content:
              "Start a new hand review session. Present me with a hand scenario and ask me a question about it.",
          },
        ],
      });
      const block = response.content[0];
      const text = block.type === "text" ? block.text : "";
      return NextResponse.json({ message: text });
    }

    const formattedMessages = messages.map(
      (m: { role: string; content: string }) => ({
        role: m.role === "coach" ? "assistant" : "user",
        content: m.content,
      })
    );

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: COACH_SYSTEM,
      messages: formattedMessages,
    });

    const block = response.content[0];
    const text = block.type === "text" ? block.text : "";
    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("Coach AI error:", error);
    return NextResponse.json(
      { error: "Coach is unavailable. Please try again." },
      { status: 500 }
    );
  }
}
