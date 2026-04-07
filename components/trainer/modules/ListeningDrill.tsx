"use client";

import { useState, useEffect, useRef } from "react";

const SCRIPTS = [
  {
    title: "C-bet Frequency",
    text: "When you continuation bet too frequently on all board textures, your opponents can exploit you by floating and raising with a wide range. The key is to recognize which boards favor your range and c-bet more selectively. On dry boards like king-seven-two rainbow, your range has a clear advantage and you can bet with high frequency. However, on wet boards like nine-eight-six two-tone, your opponent can have many strong draws and you should check more often to protect your checking range.",
    pronunciation_hint: "continuation bet (คอนทินิวเอชัน เบท) · c-bet (ซี-เบท) · exploit (เอ็กซ์พลอยท์) · floating (ฟลอทอิง) · board texture (บอร์ด เท็กซ์เชอร์)",
  },
  {
    title: "Pot Odds and Equity",
    text: "Understanding pot odds is fundamental to making profitable decisions in poker. When your opponent bets, you need to calculate the price you are getting to call. If the pot is one hundred dollars and your opponent bets fifty dollars, you need to call fifty to win one hundred and fifty, giving you pot odds of exactly one in three, or thirty three percent. You should call if your equity against his range is greater than thirty three percent. This calculation becomes more complex when you factor in implied odds and reverse implied odds.",
    pronunciation_hint: "pot odds (พอท ออดส์) · equity (เอ็กวิตี) · implied odds (อิมพลายด์ ออดส์) · profitable (โพรฟิทะเบิล) · calculate (แคลคิวเลท)",
  },
  {
    title: "Range Polarization",
    text: "A polarized betting range consists of very strong hands and complete bluffs, with very few medium-strength hands. When you bet big on the river, your range should typically be polarized because you want to maximize value with your strong hands and apply maximum pressure with your bluffs. The optimal bluff-to-value ratio depends on your bet size. If you bet the full pot, you need to bluff with one hand for every two value hands to be unexploitable. Your opponent needs thirty three percent equity to call profitably against a pot-sized bet.",
    pronunciation_hint: "polarized (โพลาไรซ์ด) · bluff (บลัฟ) · unexploitable (อัน-เอ็กซ์พลอยทะเบิล) · bluff-to-value ratio (บลัฟ-ทู-แวลลิว เรโช) · pot-sized bet (พอท-ไซซ์ด เบท)",
  },
];

interface ListeningDrillProps {
  onComplete: () => void;
}

export default function ListeningDrill({ onComplete }: ListeningDrillProps) {
  const [scriptIndex, setScriptIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [typed, setTyped] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{
    accuracy: number;
    feedback: string;
    wordResults: { word: string; correct: boolean }[];
  } | null>(null);
  const [completed, setCompleted] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const current = SCRIPTS[scriptIndex];

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  function playAudio() {
    if (!("speechSynthesis" in window)) {
      alert("Your browser doesn't support text-to-speech.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(current.text);
    utterance.rate = 0.85;
    utterance.lang = "en-US";
    utterance.onend = () => setPlaying(false);
    utteranceRef.current = utterance;
    setPlaying(true);
    window.speechSynthesis.speak(utterance);
  }

  function stopAudio() {
    window.speechSynthesis?.cancel();
    setPlaying(false);
  }

  async function checkAnswer() {
    if (!typed.trim()) return;
    setChecking(true);
    setResult(null);

    try {
      const res = await fetch("/api/trainer/listen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original: current.text, heard: typed }),
      });
      const data = await res.json();

      const originalWords = current.text.toLowerCase().replace(/[.,!?]/g, "").split(/\s+/);
      const typedWords = typed.toLowerCase().replace(/[.,!?]/g, "").split(/\s+/);
      const typedSet = new Set(typedWords);

      const wordResults = originalWords.map((w) => ({
        word: w,
        correct: typedSet.has(w),
      }));

      setResult({
        accuracy: data.accuracy ?? 0,
        feedback: data.feedback ?? "",
        wordResults,
      });

      if ((data.accuracy ?? 0) >= 50 && !completed) {
        setCompleted(true);
        onComplete();
      }
    } catch {
      alert("Failed to check answer. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  function nextScript() {
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setTyped("");
    setResult(null);
    setScriptIndex((i) => (i + 1) % SCRIPTS.length);
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {SCRIPTS.map((s, i) => (
          <button
            key={i}
            onClick={() => {
              window.speechSynthesis?.cancel();
              setPlaying(false);
              setTyped("");
              setResult(null);
              setScriptIndex(i);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              i === scriptIndex
                ? "bg-accent/10 border border-accent/30 text-accent"
                : "bg-surface-2 border border-border text-muted hover:text-white"
            }`}
          >
            #{i + 1} {s.title}
          </button>
        ))}
      </div>

      <div className="bg-surface-2 border border-border rounded-xl p-6 text-center">
        <p className="text-sm text-muted mb-1">{current.title}</p>
        <p className="text-xs text-muted/70 mb-4 leading-relaxed max-w-md mx-auto">
          🔤 {current.pronunciation_hint}
        </p>

        <div className="flex items-end justify-center gap-1 h-10 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <div
              key={n}
              className={`w-1.5 rounded-full bg-accent transition-all ${
                playing
                  ? `animate-waveform-${Math.min(n, 5)}`
                  : "h-2 opacity-30"
              }`}
              style={
                playing
                  ? { animationDelay: `${(n % 5) * 0.15}s` }
                  : undefined
              }
            />
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          {!playing ? (
            <button
              onClick={playAudio}
              className="px-6 py-2.5 bg-accent hover:bg-accent-dark rounded-lg text-sm font-semibold transition-colors"
            >
              ▶ Play
            </button>
          ) : (
            <button
              onClick={stopAudio}
              className="px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-sm font-semibold transition-colors"
            >
              ■ Stop
            </button>
          )}
          <button
            onClick={nextScript}
            className="px-4 py-2.5 bg-surface border border-border hover:bg-subtle rounded-lg text-sm font-medium text-muted hover:text-white transition-colors"
          >
            Next exercise
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Type what you heard:
        </label>
        <textarea
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          rows={4}
          placeholder="Listen to the audio, then type what you heard here..."
          className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-accent transition-colors resize-none"
        />
        <button
          onClick={checkAnswer}
          disabled={!typed.trim() || checking}
          className="mt-2 px-6 py-2.5 bg-accent hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors"
        >
          {checking ? "Checking..." : "Check Answer"}
        </button>
      </div>

      {result && (
        <div className="bg-surface-2 border border-border rounded-xl p-5 animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Results</h4>
            <span
              className={`text-2xl font-bold ${
                result.accuracy >= 80
                  ? "text-accent"
                  : result.accuracy >= 50
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
            >
              {result.accuracy}%
            </span>
          </div>

          <p className="text-sm text-gray-300">{result.feedback}</p>

          <div>
            <p className="text-xs text-muted mb-2 uppercase tracking-wider">Original script:</p>
            <p className="text-sm leading-relaxed">
              {result.wordResults.map((w, i) => (
                <span
                  key={i}
                  className={`${
                    w.correct ? "text-accent" : "text-red-400 underline decoration-dotted"
                  } mr-1`}
                >
                  {w.word}
                </span>
              ))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
