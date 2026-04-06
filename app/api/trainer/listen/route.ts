import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { LISTEN_SYSTEM, listenCheckPrompt } from "@/lib/prompts";

interface ListenResult {
  accuracy: number;
  feedback: string;
  missed_words: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { original, heard } = await req.json();
    if (!original || heard === undefined) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const result = await generateJSON<ListenResult>(
      LISTEN_SYSTEM,
      listenCheckPrompt(original, heard),
      256
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Listen AI error:", error);
    return NextResponse.json(
      { error: "Failed to check answer. Please try again." },
      { status: 500 }
    );
  }
}
