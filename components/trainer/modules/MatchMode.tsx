"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { CoachingPhrase, PhraseType } from "@/types/trainer";
import { SEED_PHRASES, PHRASE_TYPE_CONFIG } from "@/lib/phrases";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MatchCard {
  id: string;
  match_term: string;
  match_thai: string;
  phrase_type: PhraseType;
  situation?: string;
}

type ItemState   = "idle" | "selected" | "correct" | "wrong";
type SWOptState  = "idle" | "selected-correct" | "selected-wrong" | "reveal-correct";
type RoundSize   = 10 | 20 | 50;
type Phase       = "setup" | "loading" | "playing" | "summary";
type GameMode    = "match" | "single";
type SetupStep   = "mode" | "size";

interface ColumnItem {
  id: string;
  text: string;
  state: ItemState;
  phraseType: PhraseType;
}

interface SWOption {
  id: string;        // card id the thai belongs to
  text: string;
  state: SWOptState;
}

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
    match_term:  p.match_term  ?? (p.phrase.length      > 42 ? p.phrase.slice(0, 40)      + "…" : p.phrase),
    match_thai:  p.match_thai  ?? (p.thai_meaning.length > 36 ? p.thai_meaning.slice(0, 34) + "…" : p.thai_meaning),
    phrase_type: p.phrase_type,
    situation:   p.situation,
  };
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** Generate 4 SW options: 1 correct + 3 random distractors from the full pool */
function generateSWOptions(current: MatchCard, pool: MatchCard[]): SWOption[] {
  const others = pool.filter((c) => c.id !== current.id);
  const distractors = shuffle(others)
    .slice(0, 3)
    .map((c): SWOption => ({ id: c.id, text: c.match_thai, state: "idle" }));
  const correct: SWOption = { id: current.id, text: current.match_thai, state: "idle" };
  return shuffle([correct, ...distractors]);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface MatchModeProps {
  onComplete?: () => void;
}

export default function MatchMode({ onComplete }: MatchModeProps) {

  // ── Setup / nav
  const [phase,     setPhase]     = useState<Phase>("setup");
  const [gameMode,  setGameMode]  = useState<GameMode>("match");
  const [setupStep, setSetupStep] = useState<SetupStep>("mode");
  const [roundSize, setRoundSize] = useState<RoundSize>(10);
  const [allCards,  setAllCards]  = useState<MatchCard[]>([]);
  const [roundIndex,setRoundIndex]= useState(0);
  const [loadError, setLoadError] = useState("");

  // ── Shared stats
  const [matchedCount, setMatchedCount] = useState(0);
  const [errors,       setErrors]       = useState(0);
  const [erroredIds,   setErroredIds]   = useState<Set<string>>(new Set());
  const [combo,        setCombo]        = useState(0);
  const [maxCombo,     setMaxCombo]     = useState(0);
  const [timer,        setTimer]        = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Match mode state
  const [leftItems,    setLeftItems]    = useState<ColumnItem[]>([]);
  const [rightItems,   setRightItems]   = useState<ColumnItem[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight,setSelectedRight]= useState<string | null>(null);

  // ── Single Word mode state
  const [swRoundCards,  setSwRoundCards]  = useState<MatchCard[]>([]);
  const [swCurrentIdx,  setSwCurrentIdx]  = useState(0);
  const [swOptions,     setSwOptions]     = useState<SWOption[]>([]);
  const [swAnswerState, setSwAnswerState] = useState<"idle" | "correct" | "wrong">("idle");
  const [swLocked,      setSwLocked]      = useState(false);

  // ── Derived
  const currentRound  = allCards.slice(roundIndex * roundSize, (roundIndex + 1) * roundSize);
  const totalRounds   = allCards.length > 0 ? Math.ceil(allCards.length / roundSize) : 1;
  const hasNextRound  = (roundIndex + 1) * roundSize < allCards.length;
  const activeRound   = gameMode === "single" ? swRoundCards : currentRound;
  const missedCards   = activeRound.filter((c) => erroredIds.has(c.id));

  // ── Timer
  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // ─── Shared reset ────────────────────────────────────────────────────────────
  function resetStats() {
    setMatchedCount(0);
    setErrors(0);
    setErroredIds(new Set());
    setCombo(0);
    setMaxCombo(0);
    setTimer(0);
  }

  // ─── Match mode builders ─────────────────────────────────────────────────────
  const buildColumns = useCallback((cards: MatchCard[]) => {
    const left: ColumnItem[]  = shuffle(cards).map((c) => ({ id: c.id, text: c.match_term,  state: "idle", phraseType: c.phrase_type }));
    const right: ColumnItem[] = shuffle(cards).map((c) => ({ id: c.id, text: c.match_thai, state: "idle", phraseType: c.phrase_type }));
    setLeftItems(left);
    setRightItems(right);
    setSelectedLeft(null);
    setSelectedRight(null);
    resetStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Single Word mode builders ───────────────────────────────────────────────
  function buildSWRound(cards: MatchCard[], pool: MatchCard[]) {
    const shuffled = shuffle(cards);
    setSwRoundCards(shuffled);
    setSwCurrentIdx(0);
    setSwOptions(shuffled.length > 0 ? generateSWOptions(shuffled[0], pool) : []);
    setSwAnswerState("idle");
    setSwLocked(false);
    resetStats();
  }

  const startRound = useCallback((cards: MatchCard[], ri: number, rs: RoundSize, mode: GameMode) => {
    const slice = cards.slice(ri * rs, (ri + 1) * rs);
    if (slice.length === 0) return;
    if (mode === "match") {
      buildColumns(slice);
    } else {
      buildSWRound(slice, cards);
    }
    setPhase("playing");
  }, [buildColumns]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Load & start ────────────────────────────────────────────────────────────
  async function handleStart(size: RoundSize) {
    setRoundSize(size);
    setRoundIndex(0);
    setLoadError("");

    if (size <= 20) {
      const cards = shuffle(SEED_PHRASES).slice(0, size).map(toMatchCard);
      setAllCards(cards);
      if (gameMode === "match") {
        buildColumns(cards);
      } else {
        buildSWRound(cards, cards);
      }
      setPhase("playing");
      return;
    }

    // 50 cards: fetch AI extras
    setPhase("loading");
    try {
      const seedCards  = SEED_PHRASES.map(toMatchCard);
      const callCount  = Math.ceil((size - seedCards.length) / 7) + 1;

      const results = await Promise.all(
        Array.from({ length: callCount }, () =>
          fetch("/api/trainer/vocab", { method: "POST" })
            .then((r) => r.json())
            .then((d) => (Array.isArray(d.phrases) ? (d.phrases as CoachingPhrase[]).map(toMatchCard) : []))
            .catch((): MatchCard[] => [])
        )
      );

      const seen   = new Set(seedCards.map((c) => c.id));
      const unique = results.flat().filter((c) => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });

      const combined = shuffle([...seedCards, ...unique]).slice(0, size);
      setAllCards(combined);
      if (gameMode === "match") {
        buildColumns(combined.slice(0, size));
      } else {
        buildSWRound(combined.slice(0, size), combined);
      }
      setPhase("playing");
    } catch {
      setLoadError("Failed to load phrases. Please try again.");
      setPhase("setup");
    }
  }

  // ─── Match mode handlers ─────────────────────────────────────────────────────
  function updateItemState(setFn: React.Dispatch<React.SetStateAction<ColumnItem[]>>, id: string, state: ItemState) {
    setFn((prev) => prev.map((item) => (item.id === id ? { ...item, state } : item)));
  }

  function handleLeftClick(id: string) {
    if (phase !== "playing") return;
    const item = leftItems.find((i) => i.id === id);
    if (!item || item.state === "correct" || item.state === "wrong") return;
    if (selectedLeft === id) { setSelectedLeft(null); updateItemState(setLeftItems, id, "idle"); return; }
    if (selectedLeft) updateItemState(setLeftItems, selectedLeft, "idle");
    setSelectedLeft(id);
    updateItemState(setLeftItems, id, "selected");
    if (selectedRight !== null) checkMatch(id, selectedRight);
  }

  function handleRightClick(id: string) {
    if (phase !== "playing") return;
    const item = rightItems.find((i) => i.id === id);
    if (!item || item.state === "correct" || item.state === "wrong") return;
    if (selectedRight === id) { setSelectedRight(null); updateItemState(setRightItems, id, "idle"); return; }
    if (selectedRight) updateItemState(setRightItems, selectedRight, "idle");
    setSelectedRight(id);
    updateItemState(setRightItems, id, "selected");
    if (selectedLeft !== null) checkMatch(selectedLeft, id);
  }

  function checkMatch(leftId: string, rightId: string) {
    setSelectedLeft(null);
    setSelectedRight(null);
    if (leftId === rightId) {
      updateItemState(setLeftItems,  leftId,  "correct");
      updateItemState(setRightItems, rightId, "correct");
      const newCombo   = combo + 1;
      const newMatched = matchedCount + 1;
      setCombo(newCombo);
      setMaxCombo((m) => Math.max(m, newCombo));
      setMatchedCount(newMatched);
      if (newMatched >= currentRound.length) {
        setTimeout(() => { setPhase("summary"); onComplete?.(); }, 400);
      }
    } else {
      updateItemState(setLeftItems,  leftId,  "wrong");
      updateItemState(setRightItems, rightId, "wrong");
      setErrors((e) => e + 1);
      setCombo(0);
      setErroredIds((prev) => new Set([...prev, leftId, rightId]));
      setTimeout(() => {
        updateItemState(setLeftItems,  leftId,  "idle");
        updateItemState(setRightItems, rightId, "idle");
      }, 400);
    }
  }

  function matchItemClass(state: ItemState, phraseType: PhraseType): string {
    const base = "w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all select-none cursor-pointer min-h-[52px] flex items-center leading-snug";
    if (state === "correct")  return `${base} bg-emerald-500/20 border-emerald-400/50 text-emerald-300 opacity-40`;
    if (state === "wrong")    return `${base} bg-red-500/20 border-red-400/50 text-red-300 animate-shake`;
    if (state === "selected") {
      const cfg = PHRASE_TYPE_CONFIG[phraseType];
      return `${base} ${cfg.cls} ring-2 ring-offset-1 ring-offset-transparent ring-current`;
    }
    return `${base} bg-surface-2 border-border text-gray-300 hover:border-accent/40 hover:text-white active:scale-[0.98]`;
  }

  // ─── Single Word mode handlers ───────────────────────────────────────────────
  function handleSWOption(optionId: string) {
    if (swLocked || swAnswerState !== "idle") return;
    const currentCard = swRoundCards[swCurrentIdx];
    if (!currentCard) return;

    const isCorrect = optionId === currentCard.id;
    setSwLocked(true);

    if (isCorrect) {
      setSwOptions((prev) =>
        prev.map((o) => o.id === optionId ? { ...o, state: "selected-correct" } : o)
      );
      setSwAnswerState("correct");
      const newCombo   = combo + 1;
      const newMatched = matchedCount + 1;
      setCombo(newCombo);
      setMaxCombo((m) => Math.max(m, newCombo));
      setMatchedCount(newMatched);
      setTimeout(() => advanceSW(currentCard.id, false), 800);
    } else {
      setSwOptions((prev) =>
        prev.map((o) => {
          if (o.id === optionId)      return { ...o, state: "selected-wrong"   };
          if (o.id === currentCard.id) return { ...o, state: "reveal-correct"  };
          return o;
        })
      );
      setSwAnswerState("wrong");
      setErrors((e) => e + 1);
      setCombo(0);
      setErroredIds((prev) => new Set([...prev, currentCard.id]));
      setTimeout(() => advanceSW(currentCard.id, true), 1200);
    }
  }

  function advanceSW(_cardId: string, _wasWrong: boolean) {
    const nextIdx = swCurrentIdx + 1;
    if (nextIdx >= swRoundCards.length) {
      setPhase("summary");
      onComplete?.();
      return;
    }
    const nextCard = swRoundCards[nextIdx];
    setSwCurrentIdx(nextIdx);
    setSwOptions(generateSWOptions(nextCard, allCards.length > 0 ? allCards : SEED_PHRASES.map(toMatchCard)));
    setSwAnswerState("idle");
    setSwLocked(false);
  }

  function swOptionClass(state: SWOptState): string {
    const base = "w-full text-left px-4 py-4 rounded-xl border text-sm font-medium transition-all select-none min-h-[56px] flex items-center leading-snug active:scale-[0.98]";
    switch (state) {
      case "selected-correct": return `${base} bg-emerald-500/25 border-emerald-400/60 text-emerald-300`;
      case "selected-wrong":   return `${base} bg-red-500/25 border-red-400/60 text-red-300 animate-shake`;
      case "reveal-correct":   return `${base} bg-emerald-500/15 border-emerald-400/40 text-emerald-400`;
      default:                 return `${base} bg-surface-2 border-border text-gray-300 hover:border-accent/40 hover:text-white cursor-pointer`;
    }
  }

  // ─── Accuracy ────────────────────────────────────────────────────────────────
  const matchAccuracy = matchedCount + errors > 0
    ? Math.round((matchedCount / (matchedCount + errors)) * 100)
    : 100;

  const swAccuracy = swRoundCards.length > 0
    ? Math.round((matchedCount / swRoundCards.length) * 100)
    : 100;

  const accuracy = gameMode === "single" ? swAccuracy : matchAccuracy;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER — SETUP
  // ─────────────────────────────────────────────────────────────────────────────
  if (phase === "setup") {

    // Step 1: pick game mode
    if (setupStep === "mode") {
      return (
        <div className="max-w-sm mx-auto py-8 space-y-8 animate-fade-in">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-1">เลือก Mode</h2>
            <p className="text-sm text-muted">ฝึกจำ poker phrases ด้วยวิธีที่ชอบ</p>
          </div>

          <div className="space-y-3">
            {/* Match mode */}
            <button
              onClick={() => { setGameMode("match"); setSetupStep("size"); }}
              className="w-full p-5 rounded-2xl border border-border bg-surface-2 hover:border-accent/50 hover:bg-accent/5 transition-all group text-left"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl mt-0.5">🎯</span>
                <div>
                  <p className="text-white font-bold text-base group-hover:text-accent transition-colors">
                    จับคู่
                  </p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    2 คอลัมน์ — กด EN ซ้าย จับคู่กับ ไทย ขวา<br/>
                    เห็นทุกคำพร้อมกัน เล่นได้เร็ว
                  </p>
                </div>
              </div>
            </button>

            {/* Single word mode */}
            <button
              onClick={() => { setGameMode("single"); setSetupStep("size"); }}
              className="w-full p-5 rounded-2xl border border-border bg-surface-2 hover:border-accent/50 hover:bg-accent/5 transition-all group text-left"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl mt-0.5">📝</span>
                <div>
                  <p className="text-white font-bold text-base group-hover:text-accent transition-colors">
                    ทีละคำ
                  </p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    ทีละ 1 phrase พร้อม 4 ตัวเลือก<br/>
                    เหมาะสำหรับฝึกจำแบบ focus ทีละคำ
                  </p>
                </div>
              </div>
            </button>
          </div>

          {loadError && <p className="text-sm text-red-400 text-center">{loadError}</p>}
        </div>
      );
    }

    // Step 2: pick round size
    return (
      <div className="max-w-sm mx-auto py-8 space-y-8 animate-fade-in">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSetupStep("mode")}
            className="text-muted hover:text-white transition-colors text-sm"
          >
            ← กลับ
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">
              {gameMode === "match" ? "🎯 จับคู่" : "📝 ทีละคำ"}
            </h2>
            <p className="text-sm text-muted">เลือกจำนวนคำต่อ round</p>
          </div>
        </div>

        <div className="space-y-3">
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
                    {size === 50 && "ท้าทาย — โหลด AI phrases เพิ่ม"}
                  </p>
                </div>
                <span className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity">
                  {size === 10 ? "⚡" : size === 20 ? "📚" : "🧠"}
                </span>
              </div>
            </button>
          ))}
        </div>

        {loadError && <p className="text-sm text-red-400 text-center">{loadError}</p>}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER — LOADING
  // ─────────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER — SUMMARY
  // ─────────────────────────────────────────────────────────────────────────────
  if (phase === "summary") {
    return (
      <div className="space-y-5 animate-fade-in py-2">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-4xl mb-2">{accuracy >= 80 ? "🎉" : accuracy >= 60 ? "💪" : "📖"}</div>
          <h2 className="text-xl font-bold text-white">Round {roundIndex + 1} complete!</h2>
          <p className="text-sm text-muted">
            {gameMode === "match" ? "🎯 จับคู่" : "📝 ทีละคำ"}
            {totalRounds > 1 && ` · Round ${roundIndex + 1} / ${totalRounds}`}
            {" · "}{activeRound.length} phrases
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
              คำที่ตอบผิด ({missedCards.length})
            </p>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {missedCards.map((c) => (
                <div
                  key={c.id}
                  className={`flex gap-3 items-start p-3 rounded-lg border ${PHRASE_TYPE_CONFIG[c.phrase_type].cls}`}
                >
                  <span className="text-sm mt-0.5 shrink-0">{PHRASE_TYPE_CONFIG[c.phrase_type].icon}</span>
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
        <div className="space-y-2">
          {/* ทบทวนคำที่ผิด — Single Word mode only, shown when there are misses */}
          {gameMode === "single" && missedCards.length > 0 && (
            <button
              onClick={() => {
                buildSWRound(missedCards, allCards.length > 0 ? allCards : SEED_PHRASES.map(toMatchCard));
                setPhase("playing");
              }}
              className="w-full py-3 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-xl text-sm font-semibold transition-colors"
            >
              📖 ทบทวนคำที่ผิด ({missedCards.length} คำ)
            </button>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (gameMode === "match") {
                  buildColumns(activeRound);
                } else {
                  buildSWRound(activeRound, allCards.length > 0 ? allCards : SEED_PHRASES.map(toMatchCard));
                }
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
                  startRound(allCards, ni, roundSize, gameMode);
                }}
                className="flex-1 py-3 bg-accent hover:bg-accent-dark rounded-xl text-sm font-semibold text-white transition-colors"
              >
                Next Round →
              </button>
            ) : (
              <button
                onClick={() => { setPhase("setup"); setSetupStep("mode"); }}
                className="flex-1 py-3 bg-accent hover:bg-accent-dark rounded-xl text-sm font-semibold text-white transition-colors"
              >
                New Game
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER — PLAYING (shared top bar + progress)
  // ─────────────────────────────────────────────────────────────────────────────

  const TopBar = () => (
    <>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className="text-muted">⏱ {formatTime(timer)}</span>
          <span className="text-muted">
            {gameMode === "match"
              ? `${matchedCount}/${currentRound.length}`
              : `${swCurrentIdx + 1}/${swRoundCards.length}`}
          </span>
        </div>
        {combo >= 2 && (
          <span className="text-sm font-bold text-orange-400 animate-slide-up">
            🔥 {combo} combo!
          </span>
        )}
        <button
          onClick={() => { setPhase("setup"); setSetupStep("mode"); }}
          className="text-xs text-muted hover:text-white transition-colors"
        >
          ✕ Quit
        </button>
      </div>
      <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{
            width: gameMode === "match"
              ? `${(matchedCount / currentRound.length) * 100}%`
              : `${(swCurrentIdx / swRoundCards.length) * 100}%`,
          }}
        />
      </div>
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER — PLAYING MATCH MODE
  // ─────────────────────────────────────────────────────────────────────────────
  if (gameMode === "match") {
    return (
      <div className="space-y-3 animate-fade-in">
        <TopBar />
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="space-y-2">
            <p className="text-xs text-muted uppercase tracking-wider text-center px-1">English</p>
            {leftItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleLeftClick(item.id)}
                className={matchItemClass(item.state, item.phraseType)}
                disabled={item.state === "correct"}
              >
                {item.text}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted uppercase tracking-wider text-center px-1">ภาษาไทย</p>
            {rightItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleRightClick(item.id)}
                className={matchItemClass(item.state, item.phraseType)}
                disabled={item.state === "correct"}
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>
        {matchedCount === 0 && (
          <p className="text-center text-xs text-muted pt-1">
            กดเลือก phrase ซ้าย แล้วกดเลือกความหมายขวาที่ตรงกัน
          </p>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER — PLAYING SINGLE WORD MODE
  // ─────────────────────────────────────────────────────────────────────────────
  const currentCard = swRoundCards[swCurrentIdx];
  if (!currentCard) return null;
  const typeCfg = PHRASE_TYPE_CONFIG[currentCard.phrase_type];

  return (
    <div className="space-y-4 animate-fade-in">
      <TopBar />

      {/* ── Main card ── */}
      <div className="bg-surface-2 border border-border rounded-2xl px-6 py-8 text-center space-y-4 animate-slide-up">
        {/* Type badge */}
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${typeCfg.cls}`}>
          {typeCfg.icon} {typeCfg.label}
        </span>

        {/* English phrase — big */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
          &ldquo;{currentCard.match_term}&rdquo;
        </h2>

        {/* Situation context */}
        {currentCard.situation && (
          <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto">
            {currentCard.situation}
          </p>
        )}
      </div>

      {/* ── 4 options grid ── */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {swOptions.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSWOption(opt.id)}
            disabled={swLocked}
            className={swOptionClass(opt.state)}
          >
            <span className="mr-2 text-xs opacity-50 shrink-0">{i + 1}</span>
            {opt.text}
          </button>
        ))}
      </div>

      {/* Feedback message */}
      {swAnswerState === "correct" && (
        <p className="text-center text-sm text-accent font-medium animate-fade-in">
          ✓ ถูกต้อง!
        </p>
      )}
      {swAnswerState === "wrong" && (
        <p className="text-center text-sm text-red-400 animate-fade-in">
          ✗ ดูคำตอบที่ถูกต้อง (สีเขียว)
        </p>
      )}
    </div>
  );
}
