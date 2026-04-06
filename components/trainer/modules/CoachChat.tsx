"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "@/types/trainer";

const NOTABLE_PHRASES = [
  "walk me through",
  "what's your plan",
  "i would argue",
  "the reason why",
  "given that",
  "you're essentially",
  "does that make sense",
  "trying to accomplish",
  "underestimating",
  "over-bluff",
  "from his perspective",
  "get value from",
  "the issue i have",
  "in theory",
  "change things",
  "balance",
  "valid point",
  "tough spot",
  "run through",
  "range breakdown",
  "thought process",
];

function extractPhraseTag(text: string): { body: string; phraseNote: string | null } {
  const match = text.match(/\[Phrase:\s*([^\]]+)\]/i);
  if (!match) return { body: text, phraseNote: null };
  return {
    body: text.replace(match[0], "").trim(),
    phraseNote: match[1].trim(),
  };
}

function highlightPhrases(text: string): React.ReactNode[] {
  const lower = text.toLowerCase();
  const segments: { start: number; end: number; phrase: string }[] = [];

  for (const phrase of NOTABLE_PHRASES) {
    let idx = lower.indexOf(phrase);
    while (idx !== -1) {
      segments.push({ start: idx, end: idx + phrase.length, phrase });
      idx = lower.indexOf(phrase, idx + 1);
    }
  }

  if (segments.length === 0) return [text];

  segments.sort((a, b) => a.start - b.start);
  const merged: typeof segments = [];
  for (const seg of segments) {
    const last = merged[merged.length - 1];
    if (last && seg.start < last.end) continue;
    merged.push(seg);
  }

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  for (const seg of merged) {
    if (cursor < seg.start) nodes.push(text.slice(cursor, seg.start));
    nodes.push(
      <mark
        key={seg.start}
        className="bg-accent/20 text-accent rounded px-0.5 not-italic font-medium"
        title="Coaching phrase"
      >
        {text.slice(seg.start, seg.end)}
      </mark>
    );
    cursor = seg.end;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

interface CoachChatProps {
  onComplete: () => void;
}

export default function CoachChat({ onComplete }: CoachChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const [phraseNotes, setPhraseNotes] = useState<Record<number, string>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startSession() {
    setLoading(true);
    setMessages([]);
    setMsgCount(0);
    setPhraseNotes({});
    setSessionStarted(false);

    try {
      const res = await fetch("/api/trainer/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newSession: true }),
      });
      const data = await res.json();
      if (data.message) {
        const { body, phraseNote } = extractPhraseTag(data.message);
        setMessages([{ role: "coach", content: body }]);
        if (phraseNote) setPhraseNotes({ 0: phraseNote });
        setSessionStarted(true);
      }
    } catch {
      setMessages([{ role: "coach", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/trainer/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (data.message) {
        const { body, phraseNote } = extractPhraseTag(data.message);
        const coachMsg: ChatMessage = { role: "coach", content: body };
        const coachMsgIndex = newMessages.length;

        setMessages((m) => [...m, coachMsg]);
        if (phraseNote) {
          setPhraseNotes((p) => ({ ...p, [coachMsgIndex]: phraseNote }));
        }

        const newCount = msgCount + 1;
        setMsgCount(newCount);
        await saveQA(messages[0]?.content ?? "", userMsg.content, body);
        if (newCount >= 3) onComplete();
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "coach", content: "Sorry, I couldn't process that. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function saveQA(scenario: string, answer: string, feedback: string) {
    await fetch("/api/trainer/qa-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handScenario: scenario, userAnswer: answer, aiFeedback: feedback }),
    });
  }

  return (
    <div className="flex flex-col h-[560px]">
      <div className="flex items-center gap-2 mb-3 text-xs text-muted">
        <span className="bg-accent/20 text-accent rounded px-1.5 py-0.5 font-medium">highlighted</span>
        <span>= coaching phrase worth remembering</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 animate-fade-in ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {msg.role === "coach" && (
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm flex-shrink-0">
                🎓
              </div>
            )}
            <div className="max-w-[80%] space-y-2">
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "coach"
                    ? "bg-surface-2 border border-border text-gray-200 rounded-tl-sm"
                    : "bg-accent text-white rounded-tr-sm"
                }`}
              >
                {msg.role === "coach" && (
                  <p className="text-xs text-muted mb-1 font-medium">Coach Alex</p>
                )}
                <p className="whitespace-pre-wrap">
                  {msg.role === "coach" ? highlightPhrases(msg.content) : msg.content}
                </p>
              </div>

              {msg.role === "coach" && phraseNotes[i] && (
                <div className="flex items-start gap-1.5 px-1 animate-slide-up">
                  <span className="text-accent text-xs mt-0.5">💡</span>
                  <p className="text-xs text-gray-400">
                    <span className="text-accent font-medium">Phrase to note: </span>
                    &ldquo;{phraseNotes[i]}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm flex-shrink-0">
              🎓
            </div>
            <div className="bg-surface-2 border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border pt-4 space-y-3">
        {msgCount >= 3 && (
          <p className="text-xs text-accent text-center">
            Session complete! Start a new session or keep going.
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={startSession}
            disabled={loading}
            className="px-3 py-2.5 bg-surface-2 hover:bg-subtle border border-border rounded-lg text-xs font-medium text-muted hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            New Session
          </button>
          <form onSubmit={sendMessage} className="flex flex-1 gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || !sessionStarted}
              placeholder="Type your answer in English..."
              className="flex-1 bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-muted focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || !sessionStarted}
              className="px-4 py-2.5 bg-accent hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
