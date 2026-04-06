"use client";

import { useState } from "react";

export default function AdminInvite() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/trainer/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to send invite." });
      } else {
        setMessage({ type: "success", text: `Invite sent to ${email}` });
        setEmail("");
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`rounded-lg p-3 text-sm border ${
            message.type === "success"
              ? "bg-accent/10 border-accent/30 text-accent"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}
      <form onSubmit={handleInvite} className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="teammate@example.com"
          className="flex-1 bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-muted focus:outline-none focus:border-accent transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="px-5 py-2.5 bg-accent hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
        >
          {loading ? "Sending..." : "Send Invite"}
        </button>
      </form>
    </div>
  );
}
