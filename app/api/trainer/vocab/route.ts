import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { VOCAB_SYSTEM, VOCAB_USER } from "@/lib/prompts";
import type { CoachingPhrase } from "@/types/trainer";

export async function POST() {
  try {
    const phrases = await generateJSON<CoachingPhrase[]>(VOCAB_SYSTEM, VOCAB_USER, 1500);
    return NextResponse.json({ phrases });
  } catch (error) {
    console.error("Vocab AI error:", error);
    return NextResponse.json(
      { error: "Failed to generate phrases. Please try again." },
      { status: 500 }
    );
  }
}
