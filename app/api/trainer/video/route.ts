import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { VIDEO_SYSTEM, videoAnalysisPrompt } from "@/lib/prompts";
import type { VideoAnalysisResult } from "@/types/trainer";

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    if (!transcript || transcript.trim().length < 50) {
      return NextResponse.json(
        { error: "Transcript is too short. Please paste more content." },
        { status: 400 }
      );
    }

    const result = await generateJSON<VideoAnalysisResult>(
      VIDEO_SYSTEM,
      videoAnalysisPrompt(transcript),
      1024
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Video AI error:", error);
    return NextResponse.json(
      { error: "Failed to analyze transcript. Please try again." },
      { status: 500 }
    );
  }
}
