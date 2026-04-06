"use client";

import { useState } from "react";
import VideoAnalysis from "@/components/trainer/modules/VideoAnalysis";

export default function VideoPage() {
  const [done, setDone] = useState(false);

  async function handleComplete() {
    if (done) return;
    setDone(true);
    await fetch("/api/trainer/session-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: "video", durationMinutes: 5 }),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Video Analysis</h1>
        <p className="text-muted mt-1">Paste a video transcript to extract terms and quiz yourself</p>
      </div>
      {done && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl px-5 py-3 text-accent font-medium text-sm">
          ✓ Module complete for today!
        </div>
      )}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <VideoAnalysis onComplete={handleComplete} />
      </div>
    </div>
  );
}
