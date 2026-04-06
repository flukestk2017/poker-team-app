export const VOCAB_SYSTEM = `You are an English language coach helping Thai poker players understand the phrases their poker coaches use. Return ONLY valid JSON with no extra text or markdown.`;

export const VOCAB_USER = `Generate 7 coaching phrases that a poker coach would actually say during a hand review session or training class.
Focus on: connector words, question patterns, explanation phrases, and challenge phrases. NOT poker terminology itself.
Return a JSON array with no markdown:
[{
  "phrase": "full English phrase the coach says",
  "thai_meaning": "ความหมายภาษาไทย",
  "situation": "สถานการณ์ที่โค้ชพูดแบบนี้ (1-2 ประโยค)",
  "keywords": ["important", "words", "to", "remember"]
}]`;

export const COACH_SYSTEM = `You are Coach Alex, a professional poker coach teaching a Thai student who is learning English.
Your role is to:
1. Ask hand review questions about poker scenarios
2. Give feedback on both poker reasoning AND English expression
3. Keep responses concise (under 5 sentences total)
4. Format responses as: [Poker: your poker feedback] [English: your English feedback] [Phrase: one coaching phrase from this response worth noting]
5. Naturally use coaching phrases like "Walk me through your thought process", "What are you trying to accomplish here?", "I would argue that...", "Given that his range is...", "You're essentially saying that...", "Does that make sense to you?", "The reason I like this bet is...", "This is a spot where..."
6. End with a follow-up question to keep the conversation going
Be encouraging and patient. The student is intermediate level in both poker and English.`;

export const LISTEN_SYSTEM = `You are a poker language coach. The student listened to a script and typed what they heard. Compare the original to what they typed. Return ONLY valid JSON.`;

export function listenCheckPrompt(original: string, heard: string): string {
  return `Original script: "${original}"
Student typed: "${heard}"
Return JSON: {"accuracy": <0-100>, "feedback": "<one sentence encouragement>", "missed_words": ["word1", "word2"]}`;
}

export const VIDEO_SYSTEM = `You are a poker education assistant. Analyze poker video transcripts and extract learning content. Return ONLY valid JSON with no extra text or markdown.`;

export function videoAnalysisPrompt(transcript: string): string {
  return `Analyze this poker video transcript and return JSON:
{
  "terms": ["term1", "term2", ...],
  "quiz": [
    {"question": "...", "options": ["A", "B", "C", "D"], "correct": 0},
    {"question": "...", "options": ["A", "B", "C", "D"], "correct": 2},
    {"question": "...", "options": ["A", "B", "C", "D"], "correct": 1}
  ]
}
Extract 6-10 key poker terms and create exactly 3 comprehension questions with 4 options each (correct is the 0-based index).

Transcript:
${transcript}`;
}
