"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { CoachingPhrase, PhraseType } from "@/types/trainer";
import { SEED_PHRASES, PHRASE_TYPE_CONFIG } from "@/lib/phrases";
import { useSpeech } from "@/hooks/useSpeech";

// ── Helpers ──────────────────────────────────────────────────────────────────

function highlightKeywords(phrase: string, keywords: string[]): React.ReactNode[] {
  if (!keywords.length) return [phrase];

  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = phrase.split(pattern);

  return parts.map((part, i) => {
    const isKw = keywords.some((kw) => kw.toLowerCase() === part.toLowerCase());
    return isKw ? (
      <span key={i} className="text-accent font-bold underline decoration-accent/40">
        {part}
      </span>
    ) : (
      part
    );
  });
}

function fuzzyCheck(input: string, thai_meaning: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\u0E00-\u0E7Fa-z0-9\s]/g, " ")
      .trim();

  const inputWords = normalize(input).split(/\s+/).filter(Boolean);
  const targetWords = normalize(thai_meaning).split(/\s+/).filter(Boolean);
  if (targetWords.length === 0) return false;

  const matched = targetWords.filter((tw) =>
    inputWords.some(
      (iw) =>
        iw === tw ||
        (iw.length >= 2 && tw.includes(iw)) ||
        (tw.length >= 2 && iw.includes(tw))
    )
  );
  return matched.length >= Math.ceil(targetWords.length / 2);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface VocabFlashcardProps {
  onComplete: () => void;
}

export default function VocabFlashcard({ onComplete }: VocabFlashcardProps) {
  const [phrases, setPhrases] = useState<CoachingPhrase[]>(SEED_PHRASES);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [done, setDone] = useState(false);

  // Feature 2 state
  const [userInput, setUserInput] = useState("");
  const [checkResult, setCheckResult] = useState<"correct" | "incorrect" | null>(null);
  const [checked, setChecked] = useState(false);

  const { supported: speechSupported, speak } = useSpeech();
  const inputRef = useRef<HTMLInputElement>(null);

  const current = phrases[index];

  // Focus input when card flips
  useEffect(() => {
    if (flipped) {
      setTimeout(() => inputRef.current?.focus(), 650);
    }
  }, [flipped]);

  // Reset per-card state when index changes
  function resetCardState() {
    setFlipped(false);
    setUserInput("");
    setCheckResult(null);
    setChecked(false);
  }

  function handleCheck() {
    if (!userInput.trim() || checked) return;
    setChecked(true);
    const passed = fuzzyCheck(userInput, current.thai_meaning);
    setCheckResult(passed ? "correct" : "incorrect");
  }

  const saveProgress = useCallback(async (phrase: string, correct: boolean) => {
    await fetch("/api/trainer/vocab-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phrase, correct }),
    });
  }, []);

  async function handleRating(rating: "again" | "hard" | "got_it") {
    const correct = rating === "got_it";
    if (correct) setKnownCount((n) => n + 1);
    await saveProgress(current.phrase, correct);

    if (index + 1 >= phrases.length) {
      setDone(true);
      onComplete();
    } else {
      resetCardState();
      setTimeout(() => setIndex((i) => i + 1), 100);
    }
  }

  async function loadAIPhrases() {
    setLoading(true);
    try {
      const res = await fetch("/api/trainer/vocab", { method: "POST" });
      const data = await res.json();
      if (data.phrases) {
        setPhrases(data.phrases);
        setIndex(0);
        resetCardState();
        setKnownCount(0);
        setDone(false);
      }
    } catch {
      alert("Failed to load AI phrases. Using default set.");
    } finally {
      setLoading(false);
    }
  }

  // ── Done screen ───────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-xl font-semibold mb-2">Session complete!</h3>
        <p className="text-muted mb-6">
          You knew{" "}
          <span className="text-accent font-semibold">{knownCount}</span> out of{" "}
          <span className="text-white font-semibold">{phrases.length}</span> phrases
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setIndex(0);
              resetCardState();
              setKnownCount(0);
              setDone(false);
            }}
            className="px-5 py-2.5 bg-surface-2 hover:bg-subtle border border-border rounded-lg text-sm font-medium transition-colors"
          >
            Review again
          </button>
          <button
            onClick={loadAIPhrases}
            disabled={loading}
            className="px-5 py-2.5 bg-accent hover:bg-accent-dark disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors"
          >
            {loading ? "Loading..." : "AI New Phrases"}
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const typeConfig = PHRASE_TYPE_CONFIG[current.phrase_type ?? "statement"];

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{index + 1} / {phrases.length}</span>
        <div className="w-40 h-1.5 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${(index / phrases.length) * 100}%` }}
          />
        </div>
        <button
          onClick={loadAIPhrases}
          disabled={loading}
          className="text-xs text-accent hover:underline disabled:opacity-50"
        >
          {loading ? "Loading..." : "+ AI Phrases"}
        </button>
      </div>

      {/* ── Flashcard ───────────────────────────────────────────────────────── */}
      <div
        className="flip-card w-full cursor-pointer"
        style={{ height: "360px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div className={`flip-card-inner w-full h-full ${flipped ? "flipped" : ""}`}>

          {/* ── FRONT ─────────────────────────────────────────────────────── */}
          <div className="flip-card-front w-full h-full bg-surface border border-border rounded-2xl flex flex-col p-6 select-none relative">
            {/* badge — top-left */}
            <div className="absolute top-4 left-4">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${typeConfig.cls}`}>
                {typeConfig.icon} {typeConfig.label}
              </span>
            </div>

            {/* 🔊 — top-right */}
            {speechSupported && (
              <button
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-2 transition-colors text-muted hover:text-white"
                onClick={(e) => { e.stopPropagation(); speak(current.phrase); }}
                title="Listen"
              >
                🔊
              </button>
            )}

            {/* Phrase with keyword highlights */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4 mt-4">
              <p className="text-xs text-muted uppercase tracking-wider">Coaching Phrase</p>
              <h2 className="text-2xl font-semibold text-white text-center leading-snug">
                &ldquo;{highlightKeywords(current.phrase, current.keywords)}&rdquo;
              </h2>

              {/* Thai pronunciation */}
              {current.phrase_pronunciation && (
                <p className="text-sm text-muted tracking-wide text-center">
                  {current.phrase_pronunciation}
                </p>
              )}

              {/* Keyword pills */}
              {current.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {current.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="text-xs px-2 py-0.5 bg-accent/10 border border-accent/25 text-accent rounded-full font-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <p className="text-center text-xs text-muted mt-2">Tap to see meaning</p>
          </div>

          {/* ── BACK ──────────────────────────────────────────────────────── */}
          <div className="flip-card-back w-full h-full bg-surface border border-accent/30 rounded-2xl flex flex-col p-6 select-none overflow-y-auto relative">
            {/* 🔊 — top-right */}
            {speechSupported && (
              <button
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-2 transition-colors text-muted hover:text-white"
                onClick={(e) => { e.stopPropagation(); speak(current.phrase); }}
                title="Listen"
              >
                🔊
              </button>
            )}

            {/* Thai meaning */}
            <p className="text-lg font-semibold text-accent text-center mb-4 pr-8">
              {current.thai_meaning}
            </p>

            <div className="w-full h-px bg-border mb-4" />

            {/* Word breakdown pills */}
            <div>
              <p className="text-xs text-muted uppercase tracking-wider mb-2">Word Breakdown</p>
              <div className="flex flex-wrap gap-2">
                {current.word_breakdown.map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center bg-surface-2 border border-border rounded-lg px-2.5 py-1.5 min-w-[44px]"
                  >
                    <span className="text-xs font-semibold text-white leading-tight">{item.word}</span>
                    <span className="text-xs text-accent leading-tight mt-0.5">{item.thai}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Similar phrases */}
            {current.similar_phrases.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted uppercase tracking-wider mb-1.5">Similar Phrases</p>
                <div className="space-y-1">
                  {current.similar_phrases.map((sp, i) => (
                    <p key={i} className="text-xs italic text-gray-500">&ldquo;{sp}&rdquo;</p>
                  ))}
                </div>
              </div>
            )}

            {/* Situation */}
            <div className="mt-4 border-t border-border pt-3">
              <p className="text-xs text-muted uppercase tracking-wider mb-1">สถานการณ์</p>
              <p className="text-sm text-gray-300 leading-relaxed">{current.situation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Below card: type-to-recall (shown after flip) ───────────────────── */}
      {flipped && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !checked && handleCheck()}
              placeholder="พิมพ์ความหมายภาษาไทยของประโยคนี้..."
              disabled={checked}
              className="flex-1 bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-muted focus:outline-none focus:border-accent transition-colors disabled:opacity-60"
            />
            <button
              onClick={handleCheck}
              disabled={!userInput.trim() || checked}
              className="px-4 py-2.5 bg-surface-2 hover:bg-subtle border border-border hover:border-accent/50 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              Check
            </button>
          </div>

          {/* Check result */}
          {checkResult === "correct" && (
            <p className="text-sm text-accent font-medium animate-fade-in">
              ✓ ถูกต้อง!
            </p>
          )}
          {checkResult === "incorrect" && (
            <p className="text-sm text-red-400 animate-fade-in">
              ✗ ความหมายที่ถูกต้อง:{" "}
              <span className="text-white">{current.thai_meaning}</span>
            </p>
          )}
        </div>
      )}

      {/* ── Rating buttons (shown only after check) ─────────────────────────── */}
      {checked && (
        <div className="flex gap-3 animate-fade-in">
          <button
            onClick={() => handleRating("again")}
            className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-semibold transition-colors"
          >
            Again
          </button>
          <button
            onClick={() => handleRating("hard")}
            className="flex-1 py-3 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-xl text-sm font-semibold transition-colors"
          >
            Hard
          </button>
          <button
            onClick={() => handleRating("got_it")}
            className="flex-1 py-3 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent rounded-xl text-sm font-semibold transition-colors"
          >
            Got it ✓
          </button>
        </div>
      )}

      {/* Hint when flipped but not yet checked */}
      {flipped && !checked && (
        <p className="text-center text-xs text-muted">
          พิมพ์ความหมายแล้วกด Check หรือ Enter เพื่อดูปุ่มประเมิน
        </p>
      )}
    </div>
  );
}
