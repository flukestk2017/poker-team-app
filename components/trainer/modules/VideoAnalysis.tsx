"use client";

import { useState } from "react";
import type { VideoAnalysisResult } from "@/types/trainer";

const SAMPLE_TRANSCRIPT = `Okay so let's review this hand. You're in the big blind with king-queen offsuit and the cutoff open-raises to two-point-five big blinds. The button cold calls and you decide to squeeze to ten big blinds. Only the cutoff calls and you go heads up to the flop.

The flop comes jack-ten-four with two spades. You have a gutshot straight draw to the ace and you have backdoor spade draws. In this spot, your range has good equity but you don't have a clear nut advantage. The cutoff's calling range from middle position is quite strong and merged.

On this board texture, I recommend checking your entire range or using a small c-bet of around twenty-five percent pot with your strongest hands and draws. When you have king-queen here, you have enough equity to c-bet small and put pressure on his medium-strength hands. If he calls and the turn brings a nine or an ace, you can continue barreling with your straight draws.

The key concept here is board coverage. You want to balance your c-betting range so you have both value hands and bluffs at each frequency. If you only c-bet your strong made hands, your opponent can over-fold against your betting range and play perfectly against your checks.`;

interface VideoAnalysisProps {
  onComplete: () => void;
}

export default function VideoAnalysis({ onComplete }: VideoAnalysisProps) {
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VideoAnalysisResult | null>(null);
  const [termDefs, setTermDefs] = useState<Record<string, string>>({});
  const [activeTerm, setActiveTerm] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [completed, setCompleted] = useState(false);

  async function analyze() {
    if (!transcript.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setQuizAnswers({});

    try {
      const res = await fetch("/api/trainer/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      setResult(data);
    } catch {
      alert("Failed to analyze. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function lookupTerm(term: string) {
    if (termDefs[term]) {
      setActiveTerm(activeTerm === term ? null : term);
      return;
    }

    setActiveTerm(term);
    try {
      const res = await fetch("/api/trainer/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      const card = data.cards?.find(
        (c: { word: string }) => c.word.toLowerCase() === term.toLowerCase()
      );
      setTermDefs((d) => ({
        ...d,
        [term]: card
          ? `${card.thai_def} — "${card.english_example}"`
          : `"${term}" — a key poker concept used in hand analysis.`,
      }));
    } catch {
      setTermDefs((d) => ({
        ...d,
        [term]: `"${term}" — a poker term used in this video.`,
      }));
    }
  }

  function answerQuestion(qIndex: number, optionIndex: number) {
    if (quizAnswers[qIndex] !== undefined) return;
    const newAnswers = { ...quizAnswers, [qIndex]: optionIndex };
    setQuizAnswers(newAnswers);

    if (result && Object.keys(newAnswers).length === result.quiz.length && !completed) {
      const correct = result.quiz.filter((q, i) => newAnswers[i] === q.correct).length;
      if (correct >= 2) {
        setCompleted(true);
        onComplete();
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">
            Paste video transcript
          </label>
          <button
            onClick={() => setTranscript(SAMPLE_TRANSCRIPT)}
            className="text-xs text-accent hover:underline"
          >
            Load sample
          </button>
        </div>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={6}
          placeholder="Paste the transcript from your coach's video here..."
          className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-accent transition-colors resize-none"
        />
        <button
          onClick={analyze}
          disabled={!transcript.trim() || loading}
          className="mt-3 px-6 py-2.5 bg-accent hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors"
        >
          {loading ? "Analyzing..." : "Analyze Transcript"}
        </button>
      </div>

      {result && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h4 className="font-semibold mb-3">Key Poker Terms</h4>
            <div className="flex flex-wrap gap-2">
              {result.terms.map((term) => (
                <div key={term}>
                  <button
                    onClick={() => lookupTerm(term)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      activeTerm === term
                        ? "bg-accent/20 border-accent/40 text-accent"
                        : "bg-surface-2 border-border text-gray-300 hover:border-accent/30 hover:text-accent"
                    }`}
                  >
                    {term}
                  </button>
                  {activeTerm === term && termDefs[term] && (
                    <div className="mt-2 p-3 bg-surface border border-accent/20 rounded-lg text-xs text-gray-300 max-w-xs animate-fade-in">
                      {termDefs[term]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Comprehension Quiz</h4>
            <div className="space-y-5">
              {result.quiz.map((q, qi) => (
                <div key={qi} className="bg-surface-2 border border-border rounded-xl p-5">
                  <p className="font-medium text-sm mb-4">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const answered = quizAnswers[qi] !== undefined;
                      const selected = quizAnswers[qi] === oi;
                      const isCorrect = q.correct === oi;

                      let cls =
                        "w-full text-left px-4 py-2.5 rounded-lg text-sm border transition-colors ";
                      if (!answered) {
                        cls += "border-border bg-surface hover:border-accent/30 hover:text-accent";
                      } else if (isCorrect) {
                        cls += "border-accent/50 bg-accent/10 text-accent";
                      } else if (selected && !isCorrect) {
                        cls += "border-red-500/50 bg-red-500/10 text-red-400";
                      } else {
                        cls += "border-border bg-surface text-muted";
                      }

                      return (
                        <button
                          key={oi}
                          onClick={() => answerQuestion(qi, oi)}
                          disabled={answered}
                          className={cls}
                        >
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + oi)}.
                          </span>
                          {opt}
                          {answered && isCorrect && (
                            <span className="ml-2 text-accent">✓</span>
                          )}
                          {answered && selected && !isCorrect && (
                            <span className="ml-2 text-red-400">✗</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
