"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { CoachingPhrase, PhraseType } from "@/types/trainer";

// ── Seed data ────────────────────────────────────────────────────────────────

const SEED_PHRASES: CoachingPhrase[] = [
  {
    phrase: "What's your plan here?",
    thai_meaning: "แผนของคุณในจุดนี้คืออะไร?",
    phrase_type: "question",
    word_breakdown: [
      { word: "What's", thai: "อะไรคือ" },
      { word: "your", thai: "ของคุณ" },
      { word: "plan", thai: "แผน" },
      { word: "here", thai: "ในจุดนี้" },
    ],
    keywords: ["plan", "here"],
    situation: "โค้ชถามก่อนที่ผู้เล่นจะตัดสินใจ เพื่อให้คิดถึง intention ก่อนกดปุ่ม",
    similar_phrases: ["What are you thinking here?", "What's the idea behind this play?"],
  },
  {
    phrase: "Walk me through your thought process.",
    thai_meaning: "อธิบายกระบวนการคิดของคุณให้ฟังหน่อย",
    phrase_type: "statement",
    word_breakdown: [
      { word: "Walk", thai: "พา/นำ" },
      { word: "me", thai: "ฉัน" },
      { word: "through", thai: "ผ่าน/ตลอด" },
      { word: "your", thai: "ของคุณ" },
      { word: "thought", thai: "ความคิด" },
      { word: "process", thai: "กระบวนการ" },
    ],
    keywords: ["walk through", "thought process"],
    situation: "โค้ชขอให้ผู้เล่นอธิบายทีละขั้นว่าคิดอะไรอยู่ก่อนตัดสินใจ",
    similar_phrases: ["Take me through the hand step by step.", "Explain your reasoning here."],
  },
  {
    phrase: "What are you trying to accomplish here?",
    thai_meaning: "คุณพยายามจะทำอะไรให้สำเร็จในจุดนี้?",
    phrase_type: "question",
    word_breakdown: [
      { word: "What", thai: "อะไร" },
      { word: "are", thai: "(กริยาช่วย)" },
      { word: "you", thai: "คุณ" },
      { word: "trying", thai: "พยายาม" },
      { word: "to", thai: "ที่จะ" },
      { word: "accomplish", thai: "ทำให้สำเร็จ" },
      { word: "here", thai: "ในจุดนี้" },
    ],
    keywords: ["trying", "accomplish"],
    situation: "โค้ชถามเพื่อให้ผู้เล่นระบุเป้าหมายของ action ว่า value, bluff หรือ protection",
    similar_phrases: ["What's your goal with this bet?", "What are you trying to do here?"],
  },
  {
    phrase: "I would argue that...",
    thai_meaning: "ผมคิดว่า... (แบบมีเหตุผลสนับสนุน)",
    phrase_type: "transition",
    word_breakdown: [
      { word: "I", thai: "ผม" },
      { word: "would", thai: "จะ/อยาก" },
      { word: "argue", thai: "โต้แย้ง/เสนอว่า" },
      { word: "that", thai: "ว่า" },
    ],
    keywords: ["argue"],
    situation: "โค้ชใช้เมื่อต้องการเสนอความเห็นที่อาจต่างจากผู้เล่น โดยไม่ได้บอกว่าผิดตรงๆ",
    similar_phrases: ["I would say that...", "My view is that...", "I'd suggest that..."],
  },
  {
    phrase: "The reason why I like this bet is...",
    thai_meaning: "เหตุผลที่ผมชอบ bet นี้คือ...",
    phrase_type: "statement",
    word_breakdown: [
      { word: "The", thai: "(article)" },
      { word: "reason", thai: "เหตุผล" },
      { word: "why", thai: "ที่" },
      { word: "I", thai: "ผม" },
      { word: "like", thai: "ชอบ" },
      { word: "this", thai: "นี้" },
      { word: "bet", thai: "การ bet" },
      { word: "is", thai: "คือ" },
    ],
    keywords: ["reason", "like", "bet"],
    situation: "โค้ชอธิบายว่าทำไมถึงชอบ action นั้น โดยให้เหตุผลที่เป็นรูปธรรม",
    similar_phrases: ["The thing I like about this line is...", "What makes this bet good is..."],
  },
  {
    phrase: "Given that his range is capped...",
    thai_meaning: "เมื่อพิจารณาว่า range ของเขาถูก cap อยู่...",
    phrase_type: "transition",
    word_breakdown: [
      { word: "Given", thai: "เมื่อพิจารณาว่า" },
      { word: "that", thai: "ว่า" },
      { word: "his", thai: "ของเขา" },
      { word: "range", thai: "range (มือที่เป็นไปได้)" },
      { word: "is", thai: "ถูก" },
      { word: "capped", thai: "จำกัด/cap ไว้" },
    ],
    keywords: ["given", "range", "capped"],
    situation: "โค้ชใช้นำเข้าสู่การวิเคราะห์ โดยตั้งสมมติฐานเกี่ยวกับ range ของคู่ต่อสู้ก่อน",
    similar_phrases: ["Considering his range is limited here...", "Since he can't have the nuts here..."],
  },
  {
    phrase: "You're essentially saying that...",
    thai_meaning: "สิ่งที่คุณกำลังบอกอยู่จริงๆ คือ...",
    phrase_type: "statement",
    word_breakdown: [
      { word: "You're", thai: "คุณกำลัง" },
      { word: "essentially", thai: "โดยพื้นฐานแล้ว" },
      { word: "saying", thai: "บอก/สื่อ" },
      { word: "that", thai: "ว่า" },
    ],
    keywords: ["essentially", "saying"],
    situation: "โค้ชสรุปความหมายเบื้องหลังของ action ที่ผู้เล่นทำ เพื่อให้เห็นภาพชัดขึ้น",
    similar_phrases: ["What you're really doing is...", "In other words, you're saying..."],
  },
  {
    phrase: "Does that make sense to you?",
    thai_meaning: "เข้าใจไหม? / สมเหตุสมผลสำหรับคุณไหม?",
    phrase_type: "question",
    word_breakdown: [
      { word: "Does", thai: "(กริยาช่วย)" },
      { word: "that", thai: "นั่น" },
      { word: "make", thai: "ทำให้" },
      { word: "sense", thai: "สมเหตุสมผล" },
      { word: "to", thai: "สำหรับ" },
      { word: "you", thai: "คุณ" },
    ],
    keywords: ["make sense"],
    situation: "โค้ชถามหลังจากอธิบายจบ เพื่อเช็คว่าผู้เล่นเข้าใจสิ่งที่พูดถึง",
    similar_phrases: ["Is that clear?", "Do you follow me?", "Does that click for you?"],
  },
  {
    phrase: "I think you're underestimating his range here.",
    thai_meaning: "ผมคิดว่าคุณประเมิน range ของเขาต่ำเกินไปในจุดนี้",
    phrase_type: "challenge",
    word_breakdown: [
      { word: "I", thai: "ผม" },
      { word: "think", thai: "คิดว่า" },
      { word: "you're", thai: "คุณกำลัง" },
      { word: "underestimating", thai: "ประเมินต่ำเกินไป" },
      { word: "his", thai: "ของเขา" },
      { word: "range", thai: "range" },
      { word: "here", thai: "ในจุดนี้" },
    ],
    keywords: ["underestimating", "range"],
    situation: "โค้ช challenge ความคิดของผู้เล่นเมื่อเห็นว่าอ่าน range คู่ต่อสู้ผิดพลาด",
    similar_phrases: ["You might be discounting his strong hands here.", "His range is stronger than you think."],
  },
  {
    phrase: "This is a spot where you can over-bluff.",
    thai_meaning: "นี่คือจุดที่คุณสามารถ bluff ได้มากเกินไป",
    phrase_type: "challenge",
    word_breakdown: [
      { word: "This", thai: "นี่" },
      { word: "is", thai: "คือ" },
      { word: "a", thai: "(article)" },
      { word: "spot", thai: "จุด/สถานการณ์" },
      { word: "where", thai: "ที่ซึ่ง" },
      { word: "you", thai: "คุณ" },
      { word: "can", thai: "อาจ" },
      { word: "over-bluff", thai: "bluff มากเกินไป" },
    ],
    keywords: ["spot", "over-bluff"],
    situation: "โค้ชเตือนว่า spot นี้มีความเสี่ยงที่จะ bluff บ่อยเกิน จนโดน exploit ได้",
    similar_phrases: ["Be careful not to bluff too frequently here.", "Your bluff frequency is too high in this spot."],
  },
  {
    phrase: "Let's think about this from his perspective.",
    thai_meaning: "ลองคิดจากมุมมองของเขาดู",
    phrase_type: "transition",
    word_breakdown: [
      { word: "Let's", thai: "มา" },
      { word: "think", thai: "คิด" },
      { word: "about", thai: "เกี่ยวกับ" },
      { word: "this", thai: "สิ่งนี้" },
      { word: "from", thai: "จาก" },
      { word: "his", thai: "ของเขา" },
      { word: "perspective", thai: "มุมมอง" },
    ],
    keywords: ["perspective"],
    situation: "โค้ชให้ผู้เล่นเปลี่ยนมุมมองมาคิดแทนคู่ต่อสู้ เพื่อเข้าใจ range และ decision ของอีกฝ่าย",
    similar_phrases: ["Put yourself in his shoes.", "How does this look from his side?"],
  },
  {
    phrase: "What hands are you trying to get value from?",
    thai_meaning: "คุณพยายาม get value จากมือไหนบ้าง?",
    phrase_type: "question",
    word_breakdown: [
      { word: "What", thai: "มือไหน" },
      { word: "hands", thai: "มือ (ไพ่)" },
      { word: "are", thai: "(กริยาช่วย)" },
      { word: "you", thai: "คุณ" },
      { word: "trying", thai: "พยายาม" },
      { word: "to", thai: "ที่จะ" },
      { word: "get", thai: "ได้รับ" },
      { word: "value", thai: "value" },
      { word: "from", thai: "จาก" },
    ],
    keywords: ["hands", "get value"],
    situation: "โค้ชถามเพื่อให้ระบุว่ามือแบบไหนของคู่ต่อสู้ที่จะ call และทำให้ bet นั้น profitable",
    similar_phrases: ["Which hands are you targeting?", "Who's calling you here and why?"],
  },
  {
    phrase: "The issue I have with this line is...",
    thai_meaning: "ปัญหาที่ผมมีกับการเล่นแบบนี้คือ...",
    phrase_type: "challenge",
    word_breakdown: [
      { word: "The", thai: "(article)" },
      { word: "issue", thai: "ปัญหา" },
      { word: "I", thai: "ที่ผม" },
      { word: "have", thai: "มี" },
      { word: "with", thai: "กับ" },
      { word: "this", thai: "การเล่น" },
      { word: "line", thai: "แนวทางนี้" },
      { word: "is", thai: "คือ" },
    ],
    keywords: ["issue", "line"],
    situation: "โค้ชเริ่มวิจารณ์การเล่นอย่างสุภาพโดยระบุปัญหาเฉพาะจุด ไม่ใช่บอกว่าผิดทั้งหมด",
    similar_phrases: ["The problem with this play is...", "What concerns me about this is..."],
  },
  {
    phrase: "In theory, you should be mixing here.",
    thai_meaning: "ในทางทฤษฎี คุณควร mix action ในจุดนี้",
    phrase_type: "statement",
    word_breakdown: [
      { word: "In", thai: "ใน" },
      { word: "theory", thai: "ทางทฤษฎี" },
      { word: "you", thai: "คุณ" },
      { word: "should", thai: "ควร" },
      { word: "be", thai: "จะ" },
      { word: "mixing", thai: "mix action" },
      { word: "here", thai: "ที่นี่" },
    ],
    keywords: ["theory", "mixing"],
    situation: "โค้ชอ้างถึง GTO concept ว่าควรเล่น mixed strategy แทนที่จะทำ action เดิมทุกครั้ง",
    similar_phrases: ["GTO says you need a mixed strategy here.", "You should not always bet or always check in this spot."],
  },
  {
    phrase: "How does the turn card change things?",
    thai_meaning: "ไพ่ turn ที่ออกมาเปลี่ยนสถานการณ์อย่างไร?",
    phrase_type: "question",
    word_breakdown: [
      { word: "How", thai: "อย่างไร" },
      { word: "does", thai: "(กริยาช่วย)" },
      { word: "the", thai: "(article)" },
      { word: "turn", thai: "turn" },
      { word: "card", thai: "ไพ่" },
      { word: "change", thai: "เปลี่ยน" },
      { word: "things", thai: "สถานการณ์" },
    ],
    keywords: ["turn", "change", "things"],
    situation: "โค้ชถามให้ผู้เล่นวิเคราะห์ว่า turn card กระทบต่อ range advantage และ plan อย่างไร",
    similar_phrases: ["What impact does this card have on ranges?", "How does this runout affect your plan?"],
  },
  {
    phrase: "You have to balance your checking range here.",
    thai_meaning: "คุณต้อง balance checking range ของคุณในจุดนี้",
    phrase_type: "challenge",
    word_breakdown: [
      { word: "You", thai: "คุณ" },
      { word: "have", thai: "ต้อง" },
      { word: "to", thai: "ที่จะ" },
      { word: "balance", thai: "สมดุล" },
      { word: "your", thai: "ของคุณ" },
      { word: "checking", thai: "checking" },
      { word: "range", thai: "range" },
      { word: "here", thai: "ในจุดนี้" },
    ],
    keywords: ["balance", "checking range"],
    situation: "โค้ชแนะนำให้ผู้เล่นใส่มือดีบางส่วนใน checking range เพื่อไม่ให้ถูก exploit",
    similar_phrases: ["Don't check with only weak hands here.", "You need some strong hands in your check range."],
  },
  {
    phrase: "What's the worst thing that can happen?",
    thai_meaning: "อะไรคือสิ่งที่แย่ที่สุดที่จะเกิดขึ้น?",
    phrase_type: "question",
    word_breakdown: [
      { word: "What's", thai: "อะไรคือ" },
      { word: "the", thai: "(article)" },
      { word: "worst", thai: "แย่ที่สุด" },
      { word: "thing", thai: "สิ่งที่" },
      { word: "that", thai: "ที่" },
      { word: "can", thai: "อาจ" },
      { word: "happen", thai: "เกิดขึ้น" },
    ],
    keywords: ["worst", "happen"],
    situation: "โค้ชถามให้ผู้เล่นคิดถึง downside ของ action นั้น เพื่อประเมินความเสี่ยงอย่างครบถ้วน",
    similar_phrases: ["What's your downside here?", "Think about the worst case scenario."],
  },
  {
    phrase: "That's a valid point, but consider this...",
    thai_meaning: "นั่นเป็นประเด็นที่ถูกต้อง แต่ลองพิจารณาสิ่งนี้ด้วย...",
    phrase_type: "transition",
    word_breakdown: [
      { word: "That's", thai: "นั่น" },
      { word: "a", thai: "เป็น" },
      { word: "valid", thai: "ถูกต้อง" },
      { word: "point", thai: "ประเด็น" },
      { word: "but", thai: "แต่" },
      { word: "consider", thai: "ลองพิจารณา" },
      { word: "this", thai: "สิ่งนี้" },
    ],
    keywords: ["valid", "consider"],
    situation: "โค้ชยอมรับความคิดของผู้เล่นบางส่วน แต่เพิ่มมุมมองที่ผู้เล่นอาจมองข้ามไป",
    similar_phrases: ["Good point, however...", "You're right, but think about this..."],
  },
  {
    phrase: "You're putting him in a really tough spot.",
    thai_meaning: "คุณกำลังทำให้เขาอยู่ในสถานการณ์ที่ยากมาก",
    phrase_type: "statement",
    word_breakdown: [
      { word: "You're", thai: "คุณกำลัง" },
      { word: "putting", thai: "ทำให้" },
      { word: "him", thai: "เขา" },
      { word: "in", thai: "อยู่ใน" },
      { word: "a", thai: "(article)" },
      { word: "really", thai: "จริงๆ" },
      { word: "tough", thai: "ยาก" },
      { word: "spot", thai: "สถานการณ์" },
    ],
    keywords: ["tough", "spot"],
    situation: "โค้ชชมเมื่อผู้เล่นสร้าง pressure ที่ดีจนคู่ต่อสู้ต้องตัดสินใจในสถานการณ์ยาก",
    similar_phrases: ["You're making this really difficult for him.", "He has a tough decision here because of you."],
  },
  {
    phrase: "Let's run through the range breakdown together.",
    thai_meaning: "มา breakdown range กันทีละส่วน",
    phrase_type: "transition",
    word_breakdown: [
      { word: "Let's", thai: "มา" },
      { word: "run", thai: "วิ่งผ่าน/ไล่" },
      { word: "through", thai: "ผ่าน" },
      { word: "the", thai: "(article)" },
      { word: "range", thai: "range" },
      { word: "breakdown", thai: "การแบ่งส่วน" },
      { word: "together", thai: "ด้วยกัน" },
    ],
    keywords: ["run through", "range breakdown"],
    situation: "โค้ชเสนอให้วิเคราะห์ range ของคู่ต่อสู้อย่างเป็นระบบ ทีละหมวดหมู่ของมือ",
    similar_phrases: ["Let's categorize his range here.", "Let's map out what hands he can have."],
  },
];

// ── Config ───────────────────────────────────────────────────────────────────

const PHRASE_TYPE_CONFIG: Record<PhraseType, { icon: string; label: string; cls: string }> = {
  question:   { icon: "❓", label: "Question",   cls: "bg-blue-500/20 border-blue-400/30 text-blue-300" },
  statement:  { icon: "💬", label: "Statement",  cls: "bg-emerald-500/20 border-emerald-400/30 text-emerald-300" },
  transition: { icon: "🔄", label: "Transition", cls: "bg-purple-500/20 border-purple-400/30 text-purple-300" },
  challenge:  { icon: "⚡", label: "Challenge",  cls: "bg-orange-500/20 border-orange-400/30 text-orange-300" },
};

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

// ── Speech hook ───────────────────────────────────────────────────────────────

function useSpeech() {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const speak = useCallback((text: string) => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "en-US";
    utt.rate = 0.85;
    window.speechSynthesis.speak(utt);
  }, [supported]);

  return { supported, speak };
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
