"use client";

import { useState } from "react";
import ListeningDrill from "@/components/trainer/modules/ListeningDrill";

export default function ListenPage() {
  const [done, setDone] = useState(false);

  async function handleComplete() {
    if (done) return;
    setDone(true);
    await fetch("/api/trainer/session-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: "listen", durationMinutes: 8 }),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Listening Drill</h1>
        <p className="text-muted mt-1">Listen to poker commentary and type what you hear</p>
      </div>
      {done && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl px-5 py-3 text-accent font-medium text-sm">
          ✓ Module complete for today!
        </div>
      )}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <ListeningDrill onComplete={handleComplete} />
      </div>
    </div>
  );
}
