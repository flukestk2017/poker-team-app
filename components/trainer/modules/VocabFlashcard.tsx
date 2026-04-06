"use client";

import { useState, useCallback } from "react";
import type { CoachingPhrase } from "@/types/trainer";

const SEED_PHRASES: CoachingPhrase[] = [
  {
    phrase: "What's your plan here?",
    thai_meaning: "แผนของคุณในจุดนี้คืออะไร?",
    situation: "โค้ชถามก่อนที่ผู้เล่นจะตัดสินใจ เพื่อให้คิดถึง intention ก่อนกดปุ่ม",
    keywords: ["plan", "here"],
  },
  {
    phrase: "Walk me through your thought process.",
    thai_meaning: "อธิบายกระบวนการคิดของคุณให้ฟังหน่อย",
    situation: "โค้ชขอให้ผู้เล่นอธิบายทีละขั้นว่าคิดอะไรอยู่ก่อนตัดสินใจ",
    keywords: ["walk me through", "thought process"],
  },
  {
    phrase: "What are you trying to accomplish here?",
    thai_meaning: "คุณพยายามจะทำอะไรให้สำเร็จในจุดนี้?",
    situation: "โค้ชถามเพื่อให้ผู้เล่นระบุเป้าหมายของ action ว่า value, bluff หรือ protection",
    keywords: ["trying to accomplish"],
  },
  {
    phrase: "I would argue that...",
    thai_meaning: "ผมคิดว่า... (แบบมีเหตุผลสนับสนุน)",
    situation: "โค้ชใช้เมื่อต้องการเสนอความเห็นที่อาจต่างจากผู้เล่น โดยไม่ได้บอกว่าผิดตรงๆ",
    keywords: ["I would argue", "that"],
  },
  {
    phrase: "The reason why I like this bet is...",
    thai_meaning: "เหตุผลที่ผมชอบ bet นี้คือ...",
    situation: "โค้ชอธิบายว่าทำไมถึงชอบ action นั้น โดยให้เหตุผลที่เป็นรูปธรรม",
    keywords: ["the reason why", "I like"],
  },
  {
    phrase: "Given that his range is capped...",
    thai_meaning: "เมื่อพิจารณาว่า range ของเขาถูก cap อยู่...",
    situation: "โค้ชใช้นำเข้าสู่การวิเคราะห์ โดยตั้งสมมติฐานเกี่ยวกับ range ของคู่ต่อสู้ก่อน",
    keywords: ["given that", "capped"],
  },
  {
    phrase: "You're essentially saying that...",
    thai_meaning: "สิ่งที่คุณกำลังบอกอยู่จริงๆ คือ...",
    situation: "โค้ชสรุปความหมายเบื้องหลังของ action ที่ผู้เล่นทำ เพื่อให้เห็นภาพชัดขึ้น",
    keywords: ["essentially", "saying that"],
  },
  {
    phrase: "Does that make sense to you?",
    thai_meaning: "เข้าใจไหม? / สมเหตุสมผลสำหรับคุณไหม?",
    situation: "โค้ชถามหลังจากอธิบายจบ เพื่อเช็คว่าผู้เล่นเข้าใจสิ่งที่พูดถึง",
    keywords: ["make sense"],
  },
  {
    phrase: "I think you're underestimating his range here.",
    thai_meaning: "ผมคิดว่าคุณประเมิน range ของเขาต่ำเกินไปในจุดนี้",
    situation: "โค้ช challenge ความคิดของผู้เล่นเมื่อเห็นว่าอ่าน range คู่ต่อสู้ผิดพลาด",
    keywords: ["underestimating", "range"],
  },
  {
    phrase: "This is a spot where you can over-bluff.",
    thai_meaning: "นี่คือจุดที่คุณสามารถ bluff ได้มากเกินไป",
    situation: "โค้ชเตือนว่า spot นี้มีความเสี่ยงที่จะ bluff บ่อยเกิน จนโดน exploit ได้",
    keywords: ["spot", "over-bluff"],
  },
  {
    phrase: "Let's think about this from his perspective.",
    thai_meaning: "ลองคิดจากมุมมองของเขาดู",
    situation: "โค้ชให้ผู้เล่นเปลี่ยนมุมมองมาคิดแทนคู่ต่อสู้ เพื่อเข้าใจ range และ decision ของอีกฝ่าย",
    keywords: ["think about", "perspective"],
  },
  {
    phrase: "What hands are you trying to get value from?",
    thai_meaning: "คุณพยายาม get value จากมือไหนบ้าง?",
    situation: "โค้ชถามเพื่อให้ระบุว่ามือแบบไหนของคู่ต่อสู้ที่จะ call และทำให้ bet นั้น profitable",
    keywords: ["get value from"],
  },
  {
    phrase: "The issue I have with this line is...",
    thai_meaning: "ปัญหาที่ผมมีกับการเล่นแบบนี้คือ...",
    situation: "โค้ชเริ่มวิจารณ์การเล่นอย่างสุภาพโดยระบุปัญหาเฉพาะจุด ไม่ใช่บอกว่าผิดทั้งหมด",
    keywords: ["the issue", "with this line"],
  },
  {
    phrase: "In theory, you should be mixing here.",
    thai_meaning: "ในทางทฤษฎี คุณควร mix action ในจุดนี้",
    situation: "โค้ชอ้างถึง GTO concept ว่าควรเล่น mixed strategy แทนที่จะทำ action เดิมทุกครั้ง",
    keywords: ["in theory", "mixing"],
  },
  {
    phrase: "How does the turn card change things?",
    thai_meaning: "ไพ่ turn ที่ออกมาเปลี่ยนสถานการณ์อย่างไร?",
    situation: "โค้ชถามให้ผู้เล่นวิเคราะห์ว่า turn card กระทบต่อ range advantage และ plan อย่างไร",
    keywords: ["change things"],
  },
  {
    phrase: "You have to balance your checking range here.",
    thai_meaning: "คุณต้อง balance checking range ของคุณในจุดนี้",
    situation: "โค้ชแนะนำให้ผู้เล่นใส่มือดีบางส่วนใน checking range เพื่อไม่ให้ถูก exploit",
    keywords: ["balance", "checking range"],
  },
  {
    phrase: "What's the worst thing that can happen?",
    thai_meaning: "อะไรคือสิ่งที่แย่ที่สุดที่จะเกิดขึ้น?",
    situation: "โค้ชถามให้ผู้เล่นคิดถึง downside ของ action นั้น เพื่อประเมินความเสี่ยงอย่างครบถ้วน",
    keywords: ["worst thing", "can happen"],
  },
  {
    phrase: "That's a valid point, but consider this...",
    thai_meaning: "นั่นเป็นประเด็นที่ถูกต้อง แต่ลองพิจารณาสิ่งนี้ด้วย...",
    situation: "โค้ชยอมรับความคิดของผู้เล่นบางส่วน แต่เพิ่มมุมมองที่ผู้เล่นอาจมองข้ามไป",
    keywords: ["valid point", "consider"],
  },
  {
    phrase: "You're putting him in a really tough spot.",
    thai_meaning: "คุณกำลังทำให้เขาอยู่ในสถานการณ์ที่ยากมาก",
    situation: "โค้ชชมเมื่อผู้เล่นสร้าง pressure ที่ดีจนคู่ต่อสู้ต้องตัดสินใจในสถานการณ์ยาก",
    keywords: ["putting him in", "tough spot"],
  },
  {
    phrase: "Let's run through the range breakdown together.",
    thai_meaning: "มา breakdown range กันทีละส่วน",
    situation: "โค้ชเสนอให้วิเคราะห์ range ของคู่ต่อสู้อย่างเป็นระบบ ทีละหมวดหมู่ของมือ",
    keywords: ["run through", "range breakdown"],
  },
];

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

  const current = phrases[index];

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
      setFlipped(false);
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
        setFlipped(false);
        setDone(false);
        setKnownCount(0);
      }
    } catch {
      alert("Failed to load AI phrases. Using default set.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-xl font-semibold mb-2">Session complete!</h3>
        <p className="text-muted mb-6">
          You knew <span className="text-accent font-semibold">{knownCount}</span> out of{" "}
          <span className="text-white font-semibold">{phrases.length}</span> phrases
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setIndex(0); setFlipped(false); setDone(false); setKnownCount(0); }}
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

  return (
    <div className="space-y-6">
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

      <div
        className="flip-card w-full cursor-pointer"
        style={{ height: "300px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div className={`flip-card-inner w-full h-full ${flipped ? "flipped" : ""}`}>
          <div className="flip-card-front w-full h-full bg-surface border border-border rounded-2xl flex flex-col items-center justify-center p-8 select-none">
            <p className="text-xs text-muted uppercase tracking-wider mb-5">Coaching Phrase</p>
            <h2 className="text-2xl font-semibold text-white text-center leading-snug mb-5">
              &ldquo;{current.phrase}&rdquo;
            </h2>
            <p className="text-sm text-muted">Tap to see meaning</p>
          </div>

          <div className="flip-card-back w-full h-full bg-surface border border-accent/30 rounded-2xl flex flex-col justify-center p-7 select-none overflow-y-auto">
            <p className="text-lg font-semibold text-accent mb-3 text-center">
              {current.thai_meaning}
            </p>

            <div className="w-full h-px bg-border my-3" />

            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              <span className="text-muted text-xs uppercase tracking-wider block mb-1">สถานการณ์</span>
              {current.situation}
            </p>

            <div className="flex flex-wrap gap-2">
              {current.keywords.map((kw) => (
                <span
                  key={kw}
                  className="px-2.5 py-1 bg-accent/10 border border-accent/25 text-accent text-xs rounded-full font-medium"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {flipped && (
        <div className="flex gap-3 animate-slide-up">
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
            Got it
          </button>
        </div>
      )}

      {!flipped && (
        <p className="text-center text-sm text-muted">Tap the card to see the Thai meaning</p>
      )}
    </div>
  );
}
