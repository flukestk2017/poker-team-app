"use client";

import { useState } from "react";
import CoachChat from "@/components/trainer/modules/CoachChat";

export default function CoachPage() {
  const [done, setDone] = useState(false);

  async function handleComplete() {
    if (done) return;
    setDone(true);
    await fetch("/api/trainer/session-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: "coach", durationMinutes: 10 }),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Coach Q&amp;A</h1>
        <p className="text-muted mt-1">Practice answering hand review questions in English</p>
      </div>
      {done && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl px-5 py-3 text-accent font-medium text-sm">
          ✓ Module complete for today!
        </div>
      )}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <CoachChat onComplete={handleComplete} />
      </div>
    </div>
  );
}
