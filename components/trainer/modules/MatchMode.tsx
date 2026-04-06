"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { CoachingPhrase, PhraseType } from "@/types/trainer";
import { SEED_PHRASES, PHRASE_TYPE_CONFIG } from "@/lib/phrases";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MatchCard {
  id: string;          // unique key (phrase text)
  match_term: string;  // English side
  match_thai: string;  // Thai side
  phrase_type: PhraseType;
}

type ItemState = "idle" | "selected" | "correct" | "wrong";

interface ColumnItem {
  id: string;
  text: string;
  state: ItemState;
  phraseType: PhraseType;
}

type RoundSize = 10 | 20 | 50;
type Phase = "setup" | "loading" | "playing" | "summary";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function toMatchCard(p: CoachingPhrase): MatchCard {
  return {
    id: p.phrase,
    match_term: p.match_term ?? (p.phrase.length > 42 ? p.phrase.slice(0, 40) + "…" : p.phrase),
    match_thai: p.match_thai ?? (p.thai_meaning.length > 36 ? p.thai_meaning.slice(0, 34) + "…" : p.thai_meaning),
    phrase_type: p.phrase_type,
  };
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface MatchModeProps {
  onComplete?: () => void;
}

export default function MatchMode({ onComplete }: MatchModeProps) {
  // ── Setup & loading
  const [phase, setPhase] = useState<Phase>("setup");
  const [roundSize, setRoundSize] = useState<RoundSize>(10);
  const [allCards, setAllCards] = useState<MatchCard[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [loadError, setLoadError] = useState("");

  // ── Game state
  const [leftItems, setLeftItems] = useState<ColumnItem[]>([]);
  const [rightItems, setRightItems] = useState<ColumnItem[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedCount, setMatchedCount] = useState(0);
  const [errors, setErrors] = useState(0);
  const [erroredIds, setErroredIds] = useState<Set<string>>(new Set());
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Derived
  const currentRound = allCards.slice(roundIndex * roundSize, (roundIndex + 1) * roundSize);
  const totalRounds = allCards.length > 0 ? Math.ceil(allCards.length / roundSize) : 1;
  const hasNextRound = (roundIndex + 1) * roundSize < allCards.length;

  // ── Timer
  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // ── Build column items from a set of cards
  const buildColumns = useCallback((cards: MatchCard[]) => {
    const left: ColumnItem[] = shuffle(cards).map((c) => ({
      id: c.id,
      text: c.match_term,
      state: "idle",
      phraseType: c.phrase_type,
    }));
    const right: ColumnItem[] = shuffle(cards).map((c) => ({
      id: c.id,
      text: c.match_thai,
      state: "idle",
      phraseType: c.phrase_type,
    }));
    setLeftItems(left);
    setRightItems(right);
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchedCount(0);
    setErrors(0);
    setErroredIds(new Set());
    setCombo(0);
    setMaxCombo(0);
    setTimer(0);
  }, []);

  // ── Start a round from current allCards + roundIndex
  const startRound = useCallback((cards: MatchCard[], ri: number, rs: RoundSize) => {
    const slice = cards.slice(ri * rs, (ri + 1) * rs);
    if (slice.length === 0) return;
    buildColumns(slice);
    setPhase("playing");
  }, [buildColumns]);

  // ── Handle setup confirmation
  async function handleStart(size: RoundSize) {
    setRoundSize(size);
    setRoundIndex(0);
    setLoadError("");

    if (size <= 20) {
      const cards = shuffle(SEED_PHRASES).slice(0, size).map(toMatchCard);
      setAllCards(cards);
      buildColumns(cards);
      setPhase("playing");
      return;
    }

    // 50 cards: need to fetch extras beyond the 20 seed cards
    setPhase("loading");
    try {
      const seedCards = SEED_PHRASES.map(toMatchCard);
      const needed = size - seedCards.length; // 30
      const callCount = Math.ceil(needed / 7) + 1; // overshoot slightly

      const results = await Promise.all(
        Array.from({ length: callCount }, () =>
          fetch("/api/trainer/vocab", { method: "POST" })
            .then((r) => r.json())
            .then((d) => (Array.isArray(d.phrases) ? (d.phrases as CoachingPhrase[]).map(toMatchCard) : []))
            .catch(() => [] as MatchCard[])
        )
      );

      const extra = results.flat();
      // Deduplicate by id
      const seen = new Set(seedCards.map((c) => c.id));
      const unique = extra.filter((c) => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });

      const combined = shuffle([...seedCards, ...unique]).slice(0, size);
      setAllCards(combined);
      buildColumns(combined);
      setPhase("playing");
    } catch {
      setLoadError("Failed to load phrases. Please try again.");
      setPhase("setup");
    }
  }

  // ── Match logic
  function updateItemState(
    setFn: React.Dispatch<React.SetStateAction<ColumnItem[]>>,
    id: string,
    state: ItemState
  ) {
    setFn((prev) => prev.map((item) => (item.id === id ? { ...item, state } : item)));
  }

  function handleLeftClick(id: string) {
    if (phase !== "playing") return;
    const item = leftItems.find((i) => i.id === id);
    if (!item || item.state === "correct" || item.state === "wrong") return;

    if (selectedLeft === id) {
      // Deselect
      setSelectedLeft(null);
      updateItemState(setLeftItems, id, "idle");
      return;
    }

    // Deselect previous
    if (selectedLeft) updateItemState(setLeftItems, selectedLeft, "idle");
    setSelectedLeft(id);
    updateItemState(setLeftItems, id, "selected");

    // If right already selected — check match immediately
    if (selectedRight !== null) {
      checkMatch(id, selectedRight);
    }
  }

  function handleRightClick(id: string) {
    if (phase !== "playing") return;
    const item = rightItems.find((i) => i.id === id);
    if (!item || item.state === "correct" || item.state === "wrong") return;

    if (selectedRight === id) {
      setSelectedRight(null);
      updateItemState(setRightItems, id, "idle");
      return;
    }

    if (selectedRight) updateItemState(setRightItems, selectedRight, "idle");
    setSelectedRight(id);
    updateItemState(setRightItems, id, "selected");

    if (selectedLeft !== null) {
      checkMatch(selectedLeft, id);
    }
  }

  function checkMatch(leftId: string, rightId: string) {
    setSelectedLeft(null);
    setSelectedRight(null);

    if (leftId === rightId) {
      // ✅ Correct
      updateItemState(setLeftItems, leftId, "correct");
      updateItemState(setRightItems, rightId, "correct");

      const newCombo = combo + 1;
      const newMatched = matchedCount + 1;
      setCombo(newCombo);
      setMaxCombo((m) => Math.max(m, newCombo));
      setMatchedCount(newMatched);

      if (newMatched >= currentRound.length) {
        // Round complete
        setTimeout(() => {
          setPhase("summary");
          onComplete?.();
        }, 400);
      }
    } else {
      // ❌ Wrong
      updateItemState(setLeftItems, leftId, "wrong");
      updateItemState(setRightItems, rightId, "wrong");
      setErrors((e) => e + 1);
      setCombo(0);
      setErroredIds((prev) => new Set([...prev, leftId, rightId]));

      setTimeout(() => {
        updateItemState(setLeftItems, leftId, "idle");
        updateItemState(setRightItems, rightId, "idle");
      }, 400);
    }
  }

  // ── Item style
  function itemClass(state: ItemState, phraseType: PhraseType, side: "left" | "right"): string {
    const base = "w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all select-none cursor-pointer min-h-[52px] flex items-center leading-snug";
    if (state === "correct") return `${base} bg-emerald-500/20 border-emerald-400/50 text-emerald-300 opacity-40`;
    if (state === "wrong")   return `${base} bg-red-500/20 border-red-400/50 text-red-300 animate-shake`;
    if (state === "selected") {
      const cfg = PHRASE_TYPE_CONFIG[phraseType];
      return `${base} ${cfg.cls} ring-2 ring-offset-1 ring-offset-transparent ring-current`;
    }
    return `${base} bg-surface-2 border-border text-gray-300 hover:border-accent/40 hover:text-white active:scale-[0.98]`;
  }

  // ── Accuracy
  const accuracy = matchedCount + errors > 0
    ? Math.round((matchedCount / (matchedCount + errors)) * 100)
    : 100;

  // ── Missed cards (cards with at least one error)
  const missedCards = currentRound.filter((c) => erroredIds.has(c.id));

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  // ── Setup screen
  if (phase === "setup") {
    return (
      <div className="max-w-sm mx-auto py-8 space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h2 className="text-xl font-bold text-white mb-1">Match Mode</h2>
          <p className="text-sm text-muted">จับคู่ phrase กับความหมายภาษาไทย</p>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-muted uppercase tracking-wider text-center">เลือกจำนวนคำต่อ round</p>
          {([10, 20, 50] as RoundSize[]).map((size) => (
            <button
              key={size}
              onClick={() => handleStart(size)}
              className="w-full py-4 rounded-xl border border-border bg-surface-2 hover:border-accent/50 hover:bg-accent/5 transition-all group"
            >
              <div className="flex items-center justify-between px-4">
                <div className="text-left">
                  <p className="text-white font-semibold text-base group-hover:text-accent transition-colors">
                    {size} คำ
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {size === 10 && "เริ่มต้น — เร็วและสนุก"}
                    {size === 20 && "ครบชุด seed phrases ทั้งหมด"}
                    {size === 50 && "ท้าทาย — ต้องโหลด AI phrases เพิ่ม"}
                  </p>
                </div>
                <span className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity">
                  {size === 10 ? "⚡" : size === 20 ? "📚" : "🧠"}
                </span>
              </div>
            </button>
          ))}
        </div>

        {loadError && (
          <p className="text-sm text-red-400 text-center">{loadError}</p>
        )}
      </div>
    );
  }

  // ── Loading screen
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
        <div className="flex gap-1 items-end h-8">
          <span className="w-2 bg-accent rounded-full animate-waveform-1" style={{ height: "8px" }} />
          <span className="w-2 bg-accent rounded-full animate-waveform-2" style={{ height: "8px" }} />
          <span className="w-2 bg-accent rounded-full animate-waveform-3" style={{ height: "8px" }} />
          <span className="w-2 bg-accent rounded-full animate-waveform-4" style={{ height: "8px" }} />
          <span className="w-2 bg-accent rounded-full animate-waveform-5" style={{ height: "8px" }} />
        </div>
        <p className="text-sm text-muted">กำลัง generate phrases เพิ่ม...</p>
      </div>
    );
  }

  // ── Summary screen
  if (phase === "summary") {
    return (
      <div className="space-y-6 animate-fade-in py-2">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-4xl mb-2">{accuracy >= 80 ? "🎉" : accuracy >= 60 ? "💪" : "📖"}</div>
          <h2 className="text-xl font-bold text-white">Round {roundIndex + 1} complete!</h2>
          <p className="text-sm text-muted">
            {totalRounds > 1 && `Round ${roundIndex + 1} / ${totalRounds} · `}
            {currentRound.length} phrases
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-2 border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{formatTime(timer)}</p>
            <p className="text-xs text-muted mt-1">เวลา</p>
          </div>
          <div className="bg-surface-2 border border-border rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${accuracy >= 80 ? "text-accent" : accuracy >= 60 ? "text-yellow-400" : "text-red-400"}`}>
              {accuracy}%
            </p>
            <p className="text-xs text-muted mt-1">แม่นยำ</p>
          </div>
          <div className="bg-surface-2 border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-purple-400">{maxCombo}x</p>
            <p className="text-xs text-muted mt-1">max combo</p>
          </div>
        </div>

        {/* Missed cards */}
        {missedCards.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted uppercase tracking-wider">
              ทบทวน — คำที่ตอบผิด ({missedCards.length})
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {missedCards.map((c) => (
                <div
                  key={c.id}
                  className={`flex gap-3 items-start p-3 rounded-lg border ${PHRASE_TYPE_CONFIG[c.phrase_type].cls}`}
                >
                  <span className="text-sm mt-0.5">{PHRASE_TYPE_CONFIG[c.phrase_type].icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white leading-snug">{c.match_term}</p>
                    <p className="text-xs mt-0.5 opacity-80">{c.match_thai}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setRoundIndex(roundIndex);
              buildColumns(currentRound);
              setPhase("playing");
            }}
            className="flex-1 py-3 bg-surface-2 hover:bg-subtle border border-border rounded-xl text-sm font-semibold transition-colors"
          >
            Play Again
          </button>
          {hasNextRound ? (
            <button
              onClick={() => {
                const ni = roundIndex + 1;
                setRoundIndex(ni);
                startRound(allCards, ni, roundSize);
              }}
              className="flex-1 py-3 bg-accent hover:bg-accent-dark rounded-xl text-sm font-semibold text-white transition-colors"
            >
              Next Round →
            </button>
          ) : (
            <button
              onClick={() => setPhase("setup")}
              className="flex-1 py-3 bg-accent hover:bg-accent-dark rounded-xl text-sm font-semibold text-white transition-colors"
            >
              New Game
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Playing screen
  const remaining = currentRound.length - matchedCount;

  return (
    <div className="space-y-3 animate-fade-in">

      {/* Top bar */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className="text-muted">⏱ {formatTime(timer)}</span>
          <span className="text-muted">
            {matchedCount}/{currentRound.length}
          </span>
        </div>

        {/* Combo badge */}
        {combo >= 2 && (
          <span className="text-sm font-bold text-orange-400 animate-slide-up">
            🔥 {combo} combo!
          </span>
        )}

        <button
          onClick={() => setPhase("setup")}
          className="text-xs text-muted hover:text-white transition-colors"
        >
          ✕ Quit
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${(matchedCount / currentRound.length) * 100}%` }}
        />
      </div>

      {/* Columns */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* Left — English */}
        <div className="space-y-2">
          <p className="text-xs text-muted uppercase tracking-wider text-center px-1">English</p>
          {leftItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleLeftClick(item.id)}
              className={itemClass(item.state, item.phraseType, "left")}
              disabled={item.state === "correct"}
            >
              {item.text}
            </button>
          ))}
        </div>

        {/* Right — Thai */}
        <div className="space-y-2">
          <p className="text-xs text-muted uppercase tracking-wider text-center px-1">ภาษาไทย</p>
          {rightItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleRightClick(item.id)}
              className={itemClass(item.state, item.phraseType, "right")}
              disabled={item.state === "correct"}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>

      {/* Hint */}
      {remaining > 0 && matchedCount === 0 && (
        <p className="text-center text-xs text-muted pt-1">
          กดเลือก phrase ซ้าย แล้วกดเลือกความหมายขวาที่ตรงกัน
        </p>
      )}
    </div>
  );
}
