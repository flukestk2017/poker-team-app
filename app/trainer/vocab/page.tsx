"use client";

import { useState } from "react";
import VocabFlashcard from "@/components/trainer/modules/VocabFlashcard";

export default function VocabPage() {
  const [done, setDone] = useState(false);

  async function handleComplete() {
    setDone(true);
    await fetch("/api/trainer/session-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: "vocab", durationMinutes: 7 }),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vocabulary</h1>
        <p className="text-muted mt-1">Flip cards to learn poker terms in English and Thai</p>
      </div>
      {done && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl px-5 py-3 text-accent font-medium text-sm">
          ✓ Module complete for today!
        </div>
      )}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <VocabFlashcard onComplete={handleComplete} />
      </div>
    </div>
  );
}
