"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage, CoachMode, CoachAPIResponse } from "@/types/trainer";
import { useSpeech } from "@/hooks/useSpeech";

// ─── Notable phrases to highlight in coach messages ────────────────────────
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

// ─── Pronunciation map for notable phrases (guided mode) ───────────────────
const NOTABLE_PHRASE_PRONUNCIATION: Record<string, string> = {
  "walk me through":      "วอค มี ทรู",
  "what's your plan":     "วอทส์ ยัวร์ แพลน",
  "i would argue":        "ไอ วูด อาร์กิว",
  "the reason why":       "เดอะ รีซัน วาย",
  "given that":           "กิฟเวน แดท",
  "you're essentially":   "ยัวร์ อิสเซ็นเชียลลี",
  "does that make sense": "ดัซ แดท เมค เซนส์",
  "trying to accomplish": "ไทรอิง ทู แอคคอมพลิช",
  "underestimating":      "อันเดอร์เอสติเมทิง",
  "over-bluff":           "โอเวอร์บลัฟ",
  "from his perspective": "ฟรอม ฮิส เพอร์สเปคทิฟ",
  "get value from":       "เก็ต แวลลิว ฟรอม",
  "the issue i have":     "เดอะ อิชชู ไอ แฮฟ",
  "in theory":            "อิน ธีโอรี",
  "change things":        "เชนจ์ ธิงส์",
  "balance":              "แบลลันซ์",
  "valid point":          "แวลลิด พอยท์",
  "tough spot":           "ทัฟ สปอต",
  "run through":          "รัน ทรู",
  "range breakdown":      "เรนจ์ เบรคดาวน์",
  "thought process":      "ธอท โพรเซส",
};

// ─── Sentence templates for guided mode ────────────────────────────────────
const SENTENCE_TEMPLATES = [
  "I think I should ___ because ___",
  "My range here includes ___ and ___",
  "The reason I ___ is that ___",
  "Given that his range is ___, I would ___",
];

// ─── Mode config ────────────────────────────────────────────────────────────
const MODE_CONFIG: Record<CoachMode, { label: string; desc: string; color: string }> = {
  guided:      { label: "Guided",      desc: "คำแปล + vocab hints + template",  color: "#22c55e" },
  semi:        { label: "Semi",        desc: "คำแปล + vocab hints",              color: "#f59e0b" },
  independent: { label: "Independent", desc: "ภาษาอังกฤษล้วน",                  color: "#6b7280" },
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function highlightPhrases(text: string, pronunciationMap?: Record<string, string>): React.ReactNode[] {
  const lower = text.toLowerCase();
  const segments: { start: number; end: number }[] = [];

  for (const phrase of NOTABLE_PHRASES) {
    let idx = lower.indexOf(phrase);
    while (idx !== -1) {
      segments.push({ start: idx, end: idx + phrase.length });
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
    const matchedText = text.slice(seg.start, seg.end);
    const pronKey = matchedText.toLowerCase();
    const pronunciation = pronunciationMap?.[pronKey];
    nodes.push(
      <span key={seg.start} className="inline-flex flex-col items-center mx-0.5 align-bottom">
        <mark className="bg-accent/20 text-accent rounded px-0.5 not-italic font-medium">
          {matchedText}
        </mark>
        {pronunciation && (
          <span className="text-[9px] text-muted leading-none mt-0.5">{pronunciation}</span>
        )}
      </span>
    );
    cursor = seg.end;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

// ─── Per-message metadata ───────────────────────────────────────────────────
interface CoachMeta {
  thaiTranslation: string;
  vocabHints: string[];
  phraseNote: string | null;
}

interface CoachChatProps {
  onComplete: () => void;
}

export default function CoachChat({ onComplete }: CoachChatProps) {
  const { supported: speechSupported, speak } = useSpeech();
  const [mode, setMode] = useState<CoachMode>("guided");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [coachMeta, setCoachMeta] = useState<Record<number, CoachMeta>>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get the latest coach message's vocab hints for the input area
  const latestCoachIdx = [...Array(messages.length).keys()]
    .reverse()
    .find((i) => messages[i].role === "coach");
  const latestVocabHints =
    latestCoachIdx !== undefined ? (coachMeta[latestCoachIdx]?.vocabHints ?? []) : [];

  async function startSession() {
    setLoading(true);
    setMessages([]);
    setCoachMeta({});
    setMsgCount(0);
    setSessionStarted(false);

    try {
      const res = await fetch("/api/trainer/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newSession: true }),
      });
      const data: CoachAPIResponse = await res.json();
      if (data.message) {
        setMessages([{ role: "coach", content: data.message }]);
        setCoachMeta({
          0: {
            thaiTranslation: data.thai_translation,
            vocabHints: data.vocab_hints,
            phraseNote: data.phrase_note,
          },
        });
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
      const data: CoachAPIResponse = await res.json();
      if (data.message) {
        const coachIdx = newMessages.length;
        setMessages((m) => [...m, { role: "coach", content: data.message }]);
        setCoachMeta((prev) => ({
          ...prev,
          [coachIdx]: {
            thaiTranslation: data.thai_translation,
            vocabHints: data.vocab_hints,
            phraseNote: data.phrase_note,
          },
        }));

        const newCount = msgCount + 1;
        setMsgCount(newCount);
        await saveQA(messages[0]?.content ?? "", userMsg.content, data.message);
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

  function applyTemplate(template: string) {
    setInput(template);
  }

  const showThai = mode === "guided" || mode === "semi";
  const showVocab = mode === "guided" || mode === "semi";
  const showTemplates = mode === "guided";

  return (
    <div className="flex flex-col h-[600px]">

      {/* ── Mode toggle ── */}
      <div className="flex items-center gap-1 mb-3 p-1 bg-surface rounded-lg border border-border">
        {(Object.keys(MODE_CONFIG) as CoachMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={
              mode === m
                ? { background: MODE_CONFIG[m].color, color: "#0d0f12" }
                : { color: "#6b7280" }
            }
          >
            {MODE_CONFIG[m].label}
          </button>
        ))}
      </div>

      {/* Mode description */}
      <p className="text-xs text-muted mb-3 px-1">
        {MODE_CONFIG[mode].desc}
        {mode !== "independent" && (
          <span className="ml-2 text-accent/70">
            • คำที่ highlight = coaching phrase
          </span>
        )}
      </p>

      {/* ── Chat messages ── */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-3 pr-1">
        {messages.map((msg, i) => {
          const meta = coachMeta[i];
          return (
            <div
              key={i}
              className={`flex gap-3 animate-fade-in ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.role === "coach" && (
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm flex-shrink-0">
                  🎓
                </div>
              )}
              <div className="max-w-[82%] space-y-1.5">
                {/* Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "coach"
                      ? "bg-surface-2 border border-border text-gray-200 rounded-tl-sm"
                      : "bg-accent text-white rounded-tr-sm"
                  }`}
                >
                  {msg.role === "coach" && (
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted font-medium">Coach Alex</p>
                      {speechSupported && (
                        <button
                          onClick={() => speak(msg.content)}
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface transition-colors text-muted hover:text-white text-xs"
                          title="Listen"
                        >
                          🔊
                        </button>
                      )}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">
                    {msg.role === "coach"
                      ? highlightPhrases(msg.content, showTemplates ? NOTABLE_PHRASE_PRONUNCIATION : undefined)
                      : msg.content}
                  </p>
                </div>

                {/* Thai translation — guided + semi */}
                {msg.role === "coach" && showThai && meta?.thaiTranslation && (
                  <div className="px-1 animate-slide-up">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      <span className="text-muted font-medium">🇹🇭 </span>
                      {meta.thaiTranslation}
                    </p>
                  </div>
                )}

                {/* Phrase note */}
                {msg.role === "coach" && meta?.phraseNote && (
                  <div className="flex items-start gap-1.5 px-1 animate-slide-up">
                    <span className="text-accent text-xs mt-0.5">💡</span>
                    <p className="text-xs text-gray-400">
                      <span className="text-accent font-medium">Phrase: </span>
                      &ldquo;{meta.phraseNote}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

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

      {/* ── Input area ── */}
      <div className="border-t border-border pt-3 space-y-2">

        {/* Vocab hints — guided + semi */}
        {showVocab && latestVocabHints.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap px-0.5">
            <span className="text-xs text-muted shrink-0">Vocab:</span>
            {latestVocabHints.map((hint, i) => (
              <span
                key={i}
                className="text-xs bg-surface-2 border border-border text-gray-300 rounded-full px-2.5 py-0.5"
              >
                {hint}
              </span>
            ))}
          </div>
        )}

        {/* Sentence templates — guided only */}
        {showTemplates && (
          <div className="flex gap-1.5 flex-wrap">
            {SENTENCE_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                onClick={() => applyTemplate(tpl)}
                className="text-xs bg-surface-2 hover:bg-subtle border border-border text-gray-400 hover:text-white rounded-lg px-2.5 py-1 transition-colors"
              >
                {tpl}
              </button>
            ))}
          </div>
        )}

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
              placeholder={
                mode === "independent"
                  ? "Type your answer in English..."
                  : "พิมพ์คำตอบภาษาอังกฤษ..."
              }
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
